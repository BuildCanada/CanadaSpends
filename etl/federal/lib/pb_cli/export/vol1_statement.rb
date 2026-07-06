require 'csv'

module PbCli
  module Export
    # Reads the Vol I "Ten Year Comparative Financial Information" open CSVs
    # (cdeif-tycfi-*.csv, Consolidated Statement of Operations) which carry, per
    # fiscal year: revenue lines, expense lines, net actuarial losses and the
    # annual operating deficit. Units are the CSV's Amt-units column (x1000000).
    #
    # Headline totals (spec §5 anchor):
    #   totalRevenue  = sum of lvl1 "Revenues" rows
    #   totalSpending = sum of lvl1 "Expenses" rows  (excludes net actuarial;
    #                   FY2024 = 513,936M = $513.94B, the published figure)
    #   deficit       = totalRevenue - totalSpending
    class Vol1Statement
      EDITIONS = {
        2023 => 'cdeif-tycfi-2023-eng.csv',
        2024 => 'cdeif-tycfi-2024.csv',
        2025 => 'cdeif-tycfi-2025.csv'
      }.freeze

      LVL_COLS = %w[
        Section-lvl1_niv1_eng Section-lvl2_niv2_eng Section-lvl3_niv3_eng
        Section-lvl4_niv4_eng Type-detail_eng
      ].freeze

      # The CSVs carry seven consolidated statements; only the Statement of
      # Operations rows are relevant here (guards line_amount against
      # same-label rows in e.g. the Statement of Cash Flow).
      STATEMENT = /Statement of Operations/

      def initialize(data_dir)
        @data_dir = data_dir
        @editions = {}
        EDITIONS.each do |ed, filename|
          path = File.join(data_dir, filename)
          next unless File.exist?(path)

          rows = CSV.read(path, headers: true)
          @editions[ed] = CSV::Table.new(rows.select { |r| r['Fin-stmt_Etat-consolide_eng'].to_s.match?(STATEMENT) })
        end
      end

      # Fiscal years (ending) for which any edition carries a column.
      def available_years
        years = []
        @editions.each_value do |table|
          year_columns(table).each { |yc| years << ending_year(yc) }
        end
        years.uniq.sort
      end

      def year?(year)
        !edition_for(year).nil?
      end

      # Total spending in billions (Vol I consolidated expenses, excl net actuarial).
      def total_spending(year)
        billions(sum_for_level(year, 'Expenses'))
      end

      def total_revenue(year)
        billions(sum_for_level(year, 'Revenues'))
      end

      def deficit(year)
        Units.round_billions(total_revenue(year) - total_spending(year))
      end

      # Amount in DOLLARS for a statement expense line, matched at the row's
      # deepest non-empty label (Type-detail > lvl4 > … > lvl1). Editions
      # drift in capitalization and wording ("Canada-Wide" vs "Canada-wide"),
      # so matching is case/whitespace-insensitive and a label may be given
      # as an array of aliases. Revenue rows never match. Signs are kept
      # exactly as presented (net actuarial losses are negative in gain
      # years, matching the site). Missing lines sum to 0.0 (e.g. ELCC
      # before FY2022).
      def line_amount(year, label)
        targets = Array(label).map { |l| normalize_label(l) }
        rows_for(year).sum do |row|
          next 0.0 if row['Section-lvl1_niv1_eng'].to_s.strip == 'Revenues'
          next 0.0 unless targets.include?(normalize_label(deepest_label(row)))

          cell(row, year) || 0.0
        end
      end

      def line_amount_billions(year, label)
        billions(line_amount(year, label))
      end

      # Revenue statement lines: [{ path: [labels...], amount_billions }].
      def revenue_lines(year)
        rows_for(year).filter_map do |row|
          next unless row['Section-lvl1_niv1_eng'].to_s.strip == 'Revenues'

          amount = cell(row, year)
          next if amount.nil?

          { path: label_path(row).drop(1), amount: billions(amount) }
        end
      end

      private

      def edition_for(year)
        yc = year_column(year)
        candidates = @editions.select { |_, t| year_columns(t).include?(yc) }.keys.sort
        return nil if candidates.empty?
        return year if candidates.include?(year)

        candidates.min
      end

      def rows_for(year)
        ed = edition_for(year)
        raise KeyError, "no Vol I data for fiscal year #{year}" unless ed

        @editions[ed]
      end

      def sum_for_level(year, lvl1)
        rows_for(year).sum do |row|
          next 0.0 unless row['Section-lvl1_niv1_eng'].to_s.strip == lvl1

          cell(row, year) || 0.0
        end
      end

      def normalize_label(label)
        label.to_s.downcase.gsub(/\s+/, ' ').strip
      end

      def deepest_label(row)
        LVL_COLS.reverse_each do |c|
          v = row[c].to_s.strip
          return v unless v.empty?
        end
        row['Section-lvl1_niv1_eng'].to_s.strip
      end

      def cell(row, year)
        v = row[year_column(year)]
        return nil if v.nil? || v.to_s.strip.empty?

        Units.csv_amount_to_dollars(v.to_s.delete(','), row['Amt-units_Mnt-unite'])
      end

      def billions(dollars)
        Units.round_billions(dollars / Units::BILLION)
      end

      def label_path(row)
        LVL_COLS.map { |c| row[c].to_s.strip }.reject(&:empty?)
      end

      def year_column(year)
        "#{year - 1}/#{year}"
      end

      def ending_year(year_column)
        year_column.split('/')[1].to_i
      end

      def year_columns(table)
        table.headers.select { |h| h =~ %r{\A\d{4}/\d{4}\z} }
      end
    end
  end
end
