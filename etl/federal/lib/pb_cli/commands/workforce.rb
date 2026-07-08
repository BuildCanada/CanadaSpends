require 'cli/ui'
require 'csv'
require 'date'
require 'fileutils'
require 'json'
require 'nokogiri'
require 'tempfile'

module PbCli
  module Commands
    # `pb workforce` — scrapes the Treasury Board of Canada Secretariat
    # "Population of the Federal Public Service" series (headcount as of
    # March 31, mapping to our fiscal-year-ending convention) into the committed
    # reference file `reference/workforce.json`.
    #
    # Two TBS sources, both the by-department series:
    #   * the HTML "by department or agency" page carries the current window
    #     (2015 → latest) with a per-year Total row that equals the government
    #     -wide "Population of the Federal Public Service" figure, plus a row
    #     per department;
    #   * the open.canada.ca structured CSV (ssa-pop-eng.csv) is the long
    #     history (2010–2019) and is the only source for 2014, which predates
    #     the HTML window.
    #
    # For each fiscal year we publish (2014–2025) the HTML value wins where
    # present and the CSV backfills the rest, so every year carries a
    # government-wide headcount plus a raw (unresolved) department breakdown.
    # The parse methods take raw strings so they can be exercised against small
    # committed fixtures.
    class Workforce
      DEPT_HTML_URL = 'https://www.canada.ca/en/treasury-board-secretariat/services/innovation/human-resources-statistics/population-federal-public-service-department.html'.freeze
      DEPT_CSV_URL = 'https://www.canada.ca/content/dam/tbs-sct/documents/innovation/human-resources-statistics/ssa-pop-eng.csv'.freeze
      SOURCE = 'Treasury Board of Canada Secretariat — Population of the Federal Public Service'.freeze

      # Fiscal years (ending) we publish; matches data/federal coverage.
      YEARS = (2014..2025).to_a.freeze

      # Section-header / non-department rows in the HTML table.
      NON_DEPARTMENT_ROWS = ['Department or agency', 'Core public administration',
                             'Separate agencies', 'Year'].freeze
      TOTAL_ROW = 'Total'.freeze

      def initialize(paths = {})
        root = paths[:root] || Dir.pwd
        @out_path = paths[:out_path] || File.join(root, 'reference', 'workforce.json')
        @retrieved = paths[:retrieved] || ENV['PB_WORKFORCE_RETRIEVED'] || Date.today.iso8601
      end

      def call(args)
        opts = parse_args(args)
        return opts[:exit] if opts[:exit]

        ::CLI::UI::Frame.open('Scraping TBS federal public service population') do
          html = fetch(DEPT_HTML_URL)
          csv = fetch(DEPT_CSV_URL)
          unless html && csv
            puts ::CLI::UI.fmt('{{x}} Download failed; leaving reference/workforce.json untouched')
            return 1
          end

          html_years = parse_html(html)
          csv_years = parse_csv(csv)
          merged = merge(html_years, csv_years)
          report(merged, html_years, csv_years)
          write(merged)
        end

        0
      end

      # --- parsing (public for tests) -------------------------------------

      # Parses the by-department HTML table into
      #   { year(Integer) => { total: Integer, departments: { name => count } } }
      # The government-wide total is read from the table's `Total` row (it equals
      # the "Population of the Federal Public Service" figure), not summed from
      # departments, so it survives departments being footnoted out of a column.
      def parse_html(html)
        doc = Nokogiri::HTML(html)
        table = doc.at_css('table')
        raise 'workforce HTML: no <table> found' unless table

        year_columns = nil
        result = Hash.new { |h, k| h[k] = { total: nil, departments: {} } }

        table.css('tr').each do |tr|
          cells = tr.css('th, td').map { |c| clean_text(c.text) }
          next if cells.empty?

          maybe_years = cells.reject(&:empty?).map { |c| c[/\A(\d{4})\z/, 1]&.to_i }
          if year_columns.nil? && maybe_years.length > 1 && maybe_years.all?
            year_columns = maybe_years
            next
          end
          next if year_columns.nil?

          label = cells.first
          next if label.empty? || NON_DEPARTMENT_ROWS.include?(label)

          values = cells.drop(1)
          if label == TOTAL_ROW
            year_columns.each_with_index { |y, i| result[y][:total] = clean_int(values[i]) }
            next
          end

          year_columns.each_with_index do |y, i|
            count = clean_int(values[i])
            result[y][:departments][label] = count unless count.nil?
          end
        end

        result
      end

      # Parses the ssa-pop CSV (Year, Universe, "Departments and Agencies",
      # Employees) into the same shape; the total is summed across departments.
      def parse_csv(text)
        result = Hash.new { |h, k| h[k] = { total: 0, departments: Hash.new(0) } }
        CSV.parse(text, headers: true) do |row|
          year = row['Year'].to_s.strip[/\A\d{4}\z/, 0]&.to_i
          name = clean_text(row['Departments and Agencies'].to_s)
          count = clean_int(row['Employees'])
          next if year.nil? || name.empty? || count.nil?

          result[year][:departments][name] += count
          result[year][:total] += count
        end
        result
      end

      # HTML wins per year where present; CSV backfills the remaining published
      # years (currently only 2014). Returns { year => entry-hash } for the
      # YEARS we publish that resolved to a positive headcount.
      def merge(html_years, csv_years)
        merged = {}
        YEARS.each do |year|
          if html_years.key?(year) && positive_total?(html_years[year])
            merged[year] = entry(year, html_years[year], DEPT_HTML_URL)
          elsif csv_years.key?(year) && positive_total?(csv_years[year])
            merged[year] = entry(year, csv_years[year], DEPT_CSV_URL)
          end
        end
        merged
      end

      private

      def parse_args(args)
        i = 0
        while i < args.length
          case args[i]
          when '--out' then @out_path = File.expand_path(args[i += 1])
          when '--help', '-h'
            print_help
            return { exit: 0 }
          else
            puts "Unknown argument: #{args[i]}"
            print_help
            return { exit: 1 }
          end
          i += 1
        end
        {}
      end

      def print_help
        puts 'Usage:'
        puts '  pb workforce [--out PATH]'
        puts ''
        puts "Default --out: reference/workforce.json"
      end

      def positive_total?(year_data)
        t = year_data[:total]
        !t.nil? && t.positive?
      end

      def entry(year, year_data, url)
        {
          'headcount' => year_data[:total],
          'headcountAsOf' => "#{year}-03-31",
          'source' => SOURCE,
          'source_url' => url,
          'retrieved' => @retrieved,
          # Raw TBS labels, alphabetized; slug resolution happens at export time.
          'headcountByDepartment' => year_data[:departments].sort.to_h
        }
      end

      def fetch(url)
        file = Tempfile.new(['workforce', File.extname(url).empty? ? '.html' : File.extname(url)])
        # -k: TBS certificate chain occasionally trips curl; -f: fail on 4xx/5xx.
        ok = system("curl -k -s -f '#{url}' -o '#{file.path}'")
        return nil unless ok

        File.read(file.path)
      ensure
        file&.close
        file&.unlink
      end

      # Alphabetized years, alphabetized departments — deterministic JSON.
      def write(merged)
        years = merged.keys.sort.each_with_object({}) do |year, acc|
          acc[year.to_s] = merged[year]
        end
        payload = {
          'source' => SOURCE,
          'source_urls' => { 'html' => DEPT_HTML_URL, 'csv' => DEPT_CSV_URL },
          'retrieved' => @retrieved,
          'years' => years
        }
        FileUtils.mkdir_p(File.dirname(@out_path))
        File.write(@out_path, JSON.pretty_generate(payload) + "\n")
        puts ::CLI::UI.fmt("{{v}} Wrote #{merged.size} year(s) to #{@out_path}")
      end

      def report(merged, html_years, csv_years)
        missing = YEARS.reject { |y| merged.key?(y) }
        puts ::CLI::UI.fmt("{{i}} Years covered: #{merged.keys.sort.join(', ')}")
        puts ::CLI::UI.fmt("{{x}} Years with no TBS data: #{missing.join(', ')}") unless missing.empty?
        # Cross-check HTML vs CSV totals on their overlap (2015–2019); warn only.
        (html_years.keys & csv_years.keys).sort.each do |year|
          h = html_years[year][:total]
          c = csv_years[year][:total]
          next if h.nil? || c.nil? || (h - c).abs <= 50

          puts ::CLI::UI.fmt("{{i}} #{year}: HTML total #{h} vs CSV total #{c} (Δ #{h - c})")
        end
      end

      def clean_text(str)
        str.to_s
           .gsub(/ /, ' ')
           .gsub(/[[:space:]]+/, ' ')
           .strip
      end

      # Table cell → Integer, or nil for blanks and dashes. Handles comma and
      # non-breaking-space thousands separators (see extractors/base.rb).
      def clean_int(text)
        return nil if text.nil?

        cleaned = text.to_s.gsub(/ /, '').gsub(/[[:space:]]/, '').delete(',')
        return nil if cleaned.empty? || cleaned.match?(/\A[—–\-]\z/)
        return nil unless cleaned.match?(/\A-?\d+\z/)

        cleaned.to_i
      end
    end
  end
end
