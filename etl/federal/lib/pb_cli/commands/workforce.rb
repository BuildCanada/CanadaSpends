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
    #
    # Demographics dimensions from the same TBS family, same HTML-primary /
    # CSV-backfill pattern:
    #   * age bands  — "by age band" page (2015 → latest, with a government-wide
    #     "Federal public service" section) + pag-ega-eng.csv (2010–2019, for
    #     2014). Bands include the published Unknown residual, so Σ == headcount.
    #   * tenure     — "by tenure" page + snet-adef-eng.csv, same shape.
    #   * salary bands — the diversity-and-inclusion "distribution … by
    #     designated group and salary range" pages (EN + FR), one table per year
    #     2017 →; the "All employees / Number" column. That series covers the
    #     employment-equity population (a subset of the full federal public
    #     service), so its sum runs ~20–25% below the headcount — a scope
    #     difference, reported, not an extraction error. No CSV exists; years
    #     before 2017 are omitted (never faked).
    #
    # French band labels come from the FR editions: salary bands are parsed
    # from the FR page (paired by year + row position); age/tenure labels are
    # the fixed sets below, transcribed from the FR pages (age bands are
    # numeric and identical in French).
    #
    # The parse methods take raw strings so they can be exercised against small
    # committed fixtures.
    class Workforce
      DEPT_HTML_URL = 'https://www.canada.ca/en/treasury-board-secretariat/services/innovation/human-resources-statistics/population-federal-public-service-department.html'.freeze
      DEPT_CSV_URL = 'https://www.canada.ca/content/dam/tbs-sct/documents/innovation/human-resources-statistics/ssa-pop-eng.csv'.freeze
      AGE_HTML_URL = 'https://www.canada.ca/en/treasury-board-secretariat/services/innovation/human-resources-statistics/population-federal-public-service-age-group.html'.freeze
      AGE_CSV_URL = 'https://www.canada.ca/content/dam/tbs-sct/documents/innovation/human-resources-statistics/pag-ega-eng.csv'.freeze
      TENURE_HTML_URL = 'https://www.canada.ca/en/treasury-board-secretariat/services/innovation/human-resources-statistics/population-federal-public-service-tenure.html'.freeze
      TENURE_CSV_URL = 'https://www.canada.ca/content/dam/tbs-sct/documents/innovation/human-resources-statistics/snet-adef-eng.csv'.freeze
      SALARY_HTML_URL = 'https://www.canada.ca/en/treasury-board-secretariat/services/innovation/human-resources-statistics/diversity-inclusion-statistics/distribution-public-service-canada-employees-designated-group-salary-range.html'.freeze
      SALARY_HTML_URL_FR = 'https://www.canada.ca/fr/secretariat-conseil-tresor/services/innovation/statistiques-ressources-humaines/statistiques-diversite-inclusion/repartition-employes-fonction-publique-canada-groupe-designe-echelle-salariale.html'.freeze
      SOURCE = 'Treasury Board of Canada Secretariat — Population of the Federal Public Service'.freeze

      # Government-wide section of the age/tenure tables (vs the Core public
      # administration / Separate agencies subsections).
      FPS_SECTION = 'Federal public service'.freeze

      # Official French tenure labels (effectif-fonction-publique-federale-
      # periode-emploi.html). Age bands are numeric and identical in French;
      # both dimensions publish an Unknown residual band ("Non disponible").
      TENURE_FR = {
        'Casual' => 'Employé occasionnel',
        'Indeterminate' => 'Durée indéterminée',
        'Student' => 'Étudiant',
        'Term' => 'Durée déterminée',
        'Unknown' => 'Non disponible'
      }.freeze
      AGE_FR = { 'Unknown' => 'Non disponible' }.freeze

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
          dimensions = fetch_dimensions
          merged = merge(html_years, csv_years, dimensions)
          report(merged, html_years, csv_years)
          write(merged)
        end

        0
      end

      # Downloads and parses the demographics dimensions. Any dimension whose
      # download fails is skipped with a warning (the run still ships headcount).
      def fetch_dimensions
        dims = {}
        age_html = fetch(AGE_HTML_URL)
        age_csv = fetch(AGE_CSV_URL)
        if age_html && age_csv
          dims[:age] = backfill_bands(parse_bands_html(age_html), parse_bands_csv(age_csv, 'Ageband'), AGE_FR)
        else
          puts ::CLI::UI.fmt('{{x}} age-band download failed; dimension skipped')
        end

        tenure_html = fetch(TENURE_HTML_URL)
        tenure_csv = fetch(TENURE_CSV_URL)
        if tenure_html && tenure_csv
          dims[:tenure] = backfill_bands(parse_bands_html(tenure_html), parse_bands_csv(tenure_csv, 'Tenure'), TENURE_FR)
        else
          puts ::CLI::UI.fmt('{{x}} tenure download failed; dimension skipped')
        end

        salary_en = fetch(SALARY_HTML_URL)
        salary_fr = fetch(SALARY_HTML_URL_FR)
        if salary_en
          dims[:salary] = parse_salary_html(salary_en, salary_fr)
        else
          puts ::CLI::UI.fmt('{{x}} salary-range download failed; dimension skipped')
        end
        dims
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

      # Parses an age-band/tenure dimension table (HTML) into
      #   { year => [[label, count], ...] }
      # reading the government-wide "Federal public service" section only, in
      # published (ordinal) band order, excluding the Total row and keeping the
      # published Unknown residual (so bands sum exactly to the headcount).
      def parse_bands_html(html)
        doc = Nokogiri::HTML(html)
        table = doc.at_css('table')
        raise 'workforce dimension HTML: no <table> found' unless table

        year_columns = nil
        section = nil
        result = Hash.new { |h, k| h[k] = [] }

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
          if cells.count { |c| !c.empty? } == 1
            section = label
            next
          end
          next unless section == FPS_SECTION
          next if label.empty? || label == TOTAL_ROW

          values = cells.drop(1)
          year_columns.each_with_index do |year, i|
            count = clean_int(values[i])
            result[year] << [label, count] unless count.nil?
          end
        end

        result
      end

      # Parses a dimension backfill CSV (Year, CPASA, <band column>, Employees)
      # into { year => [[label, count], ...] }, summed across the CPA and SA
      # universes, preserving the file's band order.
      def parse_bands_csv(text, band_column)
        sums = Hash.new { |h, k| h[k] = Hash.new(0) }
        CSV.parse(text, headers: true) do |row|
          year = row['Year'].to_s.strip[/\A\d{4}\z/, 0]&.to_i
          label = clean_text(row[band_column].to_s)
          count = clean_int(row['Employees'])
          next if year.nil? || label.empty? || count.nil?

          sums[year][label] += count
        end
        sums.transform_values(&:to_a)
      end

      # Parses the EN (and, when available, FR) salary-range pages into
      #   { year => [{ 'key', 'label_en', 'label_fr', 'count' }, ...] }
      # Each year is one table preceded by an "(as of March 31, YYYY)" heading;
      # the first data column is the "All employees" count. French labels pair
      # by year + row position (band schemes changed in 2019 and 2023, but each
      # edition's EN and FR tables mirror each other); when the FR page is
      # unavailable or misaligned the English label is kept.
      def parse_salary_html(en_html, fr_html = nil)
        en = salary_tables(en_html, /March\s+31,\s+(\d{4})/)
        fr = fr_html ? salary_tables(fr_html, /31\s+mars\s+(\d{4})/) : {}
        en.each_with_object({}) do |(year, bands), result|
          fr_bands = fr[year] if fr[year]&.size == bands.size
          result[year] = bands.each_with_index.map do |(label, count), i|
            {
              'key' => band_key(label),
              'label_en' => label,
              'label_fr' => fr_bands ? fr_bands[i][0] : label,
              'count' => count
            }
          end
        end
      end

      # HTML wins per year where present; CSV backfills the remaining published
      # years (currently only 2014). Returns { year => entry-hash } for the
      # YEARS we publish that resolved to a positive headcount. `dimensions` is
      # { age:, tenure:, salary: } of per-year band data (see the parsers);
      # a year simply omits any dimension its sources do not publish.
      def merge(html_years, csv_years, dimensions = {})
        merged = {}
        YEARS.each do |year|
          if html_years.key?(year) && positive_total?(html_years[year])
            merged[year] = entry(year, html_years[year], DEPT_HTML_URL, dimensions)
          elsif csv_years.key?(year) && positive_total?(csv_years[year])
            merged[year] = entry(year, csv_years[year], DEPT_CSV_URL, dimensions)
          end
        end
        merged
      end

      # Combines an HTML-window dimension parse with its CSV backfill (HTML wins
      # per year) and attaches French labels, producing
      # { year => [{ 'key', 'label_en', 'label_fr', 'count' }, ...] }.
      def backfill_bands(html_bands, csv_bands, fr_map)
        years = (html_bands.keys + csv_bands.keys).uniq
        years.each_with_object({}) do |year, result|
          bands = html_bands[year] && !html_bands[year].empty? ? html_bands[year] : csv_bands[year]
          next if bands.nil? || bands.empty?

          result[year] = bands.map do |label, count|
            {
              'key' => band_key(label),
              'label_en' => label,
              'label_fr' => fr_map.fetch(label, label),
              'count' => count
            }
          end
        end
      end

      # Stable band key from the English label: "<20" -> "under-20",
      # "65+" -> "65-plus", "50,000 to 54,999" -> "50000-to-54999".
      def band_key(label)
        label.to_s.downcase
             .sub(/\A</, 'under-')
             .sub(/\+\z/, '-plus')
             .delete(',')
             .gsub(/[^a-z0-9]+/, '-')
             .gsub(/\A-+|-+\z/, '')
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

      def entry(year, year_data, url, dimensions = {})
        result = {
          'headcount' => year_data[:total],
          'headcountAsOf' => "#{year}-03-31",
          'source' => SOURCE,
          'source_url' => url,
          'retrieved' => @retrieved
        }
        result['ageBands'] = dimensions[:age][year] if dimensions[:age]&.key?(year)
        result['tenure'] = dimensions[:tenure][year] if dimensions[:tenure]&.key?(year)
        result['salaryBands'] = dimensions[:salary][year] if dimensions[:salary]&.key?(year)
        # Raw TBS labels, alphabetized; slug resolution happens at export time.
        result['headcountByDepartment'] = year_data[:departments].sort.to_h
        result
      end

      # Salary page: { year => [[label, count], ...] }. Headings and tables are
      # paired in document order — each "(as of March 31, YYYY)" h2 is followed
      # by that year's table. Band rows are the ones whose first data cell is a
      # count; the Total row is excluded (it is the EE-population total, not a
      # band).
      def salary_tables(html, year_pattern)
        doc = Nokogiri::HTML(html)
        result = {}
        year = nil
        doc.css('h2, table').each do |node|
          if node.name == 'h2'
            match = clean_text(node.text).match(year_pattern)
            year = match ? match[1].to_i : year
          elsif year
            bands = salary_band_rows(node)
            result[year] = bands unless bands.empty?
            year = nil
          end
        end
        result
      end

      def salary_band_rows(table)
        table.css('tr').filter_map do |tr|
          cells = tr.css('th, td').map { |c| clean_text(c.text) }
          next if cells.size < 3

          label = strip_footnotes(cells.first)
          count = clean_int(cells[1])
          next if label.empty? || count.nil?
          next if label.match?(/\Atotal/i)

          [label, count]
        end
      end

      # Drops trailing "Footnote N" / "Note de bas de page N" markers some
      # cells carry.
      def strip_footnotes(text)
        text.gsub(/\s*(Footnote|Note de bas de page)\s*\d+\z/i, '').strip
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
          'source_urls' => {
            'html' => DEPT_HTML_URL,
            'csv' => DEPT_CSV_URL,
            'age_html' => AGE_HTML_URL,
            'age_csv' => AGE_CSV_URL,
            'tenure_html' => TENURE_HTML_URL,
            'tenure_csv' => TENURE_CSV_URL,
            'salary_html' => SALARY_HTML_URL,
            'salary_html_fr' => SALARY_HTML_URL_FR
          },
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
        report_dimensions(merged)
      end

      # Per-dimension coverage and sum-vs-headcount checks. Age/tenure carry
      # the published Unknown residual, so their sums equal the headcount
      # exactly; the salary series covers the smaller employment-equity
      # population, so its (expected) deviation is reported, not hidden.
      def report_dimensions(merged)
        { 'ageBands' => 'age bands', 'tenure' => 'tenure', 'salaryBands' => 'salary bands' }.each do |key, label|
          covered = merged.keys.select { |y| merged[y][key] }.sort
          puts ::CLI::UI.fmt("{{i}} #{label}: #{covered.empty? ? 'no years' : covered.join(', ')}")
          covered.each do |year|
            sum = merged[year][key].sum { |b| b['count'] }
            headcount = merged[year]['headcount']
            deviation = (sum - headcount).abs / headcount.to_f
            next if deviation <= 0.01

            puts ::CLI::UI.fmt(format('{{i}} %d %s: Σ %d vs headcount %d (%+.1f%%)',
                                      year, label, sum, headcount, (sum - headcount) * 100.0 / headcount))
          end
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
