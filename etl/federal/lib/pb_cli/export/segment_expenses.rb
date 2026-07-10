require 'csv'

module PbCli
  module Export
    # Reads the Vol I Table 3.6 "External expenses by segment and by type" open
    # CSVs (cest-eest-*.csv), one edition per Public Accounts year (2014–2025).
    # Each row is (segment × ministerial portfolio × expense type) carrying the
    # fiscal-year amount in the row's Amt-units column (x1000000 = millions).
    #
    # Segments:
    #   * "Ministries" — the ~30 ministerial portfolios, each broken into four
    #     expense types (major transfer payments, other transfer payments,
    #     public debt charges, other [program] expenses). These portfolio totals
    #     INCLUDE the tax-system / statutory transfers (ESDC contains OAS+EI;
    #     National Revenue contains the children's benefits + carbon rebate), so
    #     the vol1-node offset mechanism applies on this accrual basis too.
    #   * Standalone lump segments carrying no portfolio breakdown:
    #     "Net actuarial losses", "Provision for valuation and other items", and
    #     (2014–2016 editions only) "Crown corporations and other entities".
    #
    # The full set of segments sums to the published total expenses INCLUDING
    # net actuarial losses (FY2024 = $521.425B), i.e. Vol1Statement#total_spending
    # — a hard export validation (see Export#accrual_year?). Editions whose 3.6
    # total does NOT reconcile to that headline (older restated years) keep the
    # mixed Vol II basis with an adjustments leaf, documented, not faked.
    #
    # English-only reader: portfolio labels feed slug resolution; the segment
    # (statement-row) labels are translated by their stable node/row id through
    # the French pipeline (see mappings + i18n), not from this reader.
    class SegmentExpenses
      MINISTERIAL_SEGMENT = 'Ministries'.freeze

      # Stable ids for the standalone (non-ministerial) segments — matched to
      # the thematic-tree/sankey node ids so the ministry-list statement rows
      # and the Sankey leaves share one French translation key.
      SEGMENT_IDS = {
        'Net actuarial losses' => 'net-actuarial-losses',
        'Provision for valuation and other items' => 'provision-for-valuation',
        'Crown corporations and other entities' => 'crown-corporations-and-other-entities'
      }.freeze

      # Expense-type label → bucket. "Other program expenses" (2014–2016) and
      # "Other expenses" (2017+) are the same bucket.
      TYPE_BUCKETS = {
        'Major transfer payments' => :major_transfers,
        'Other transfer payments' => :other_transfers,
        'Public debt charges' => :debt_charges,
        'Other expenses' => :other_expenses,
        'Other program expenses' => :other_expenses
      }.freeze

      # A ministerial portfolio's four expense-type buckets (dollars).
      Portfolio = Struct.new(:label, :major_transfers, :other_transfers, :debt_charges, :other_expenses, keyword_init: true) do
        def total
          major_transfers + other_transfers + debt_charges + other_expenses
        end
      end

      # A standalone segment lump (dollars) with its stable translation id.
      Segment = Struct.new(:id, :label, :dollars, keyword_init: true)

      def initialize(data_dir)
        @data_dir = data_dir
        @by_year = {}
        (2014..2025).each do |year|
          path = edition_path(year)
          next unless path

          @by_year[year] = parse(path, year)
        end
      end

      def year?(year)
        @by_year.key?(year)
      end

      def available_years
        @by_year.keys.sort
      end

      # Total external expenses for the year in billions (all segments). Equals
      # the published total expenses incl. net actuarial losses when the edition
      # is the year's own vintage.
      def total(year)
        Units.dollars_to_billions(all_dollars(year))
      end

      # Σ of the ministerial-portfolio totals, in dollars.
      def ministerial_total_dollars(year)
        portfolios(year).values.sum(&:total)
      end

      # Ministerial portfolios for a year: { label => Portfolio }.
      def portfolios(year)
        @by_year[year]&.fetch(:portfolios, {}) || {}
      end

      # Standalone (non-ministerial) segments for a year, as [Segment], sorted
      # by descending dollars then label for determinism.
      def segments(year)
        (@by_year[year]&.fetch(:segments, []) || [])
          .sort_by { |s| [-s.dollars, s.label] }
      end

      # Dollars for one standalone segment id, or 0.0 when absent that year.
      def segment_dollars(year, id)
        segments(year).find { |s| s.id == id }&.dollars || 0.0
      end

      private

      def all_dollars(year)
        ministerial_total_dollars(year) + segments(year).sum(&:dollars)
      end

      # 2024/2025 ship a single bilingual file; ≤2023 ship an -eng.csv.
      def edition_path(year)
        single = File.join(@data_dir, "cest-eest-#{year}.csv")
        return single if File.exist?(single)

        eng = File.join(@data_dir, "cest-eest-#{year}-eng.csv")
        return eng if File.exist?(eng)

        nil
      end

      def parse(path, year)
        table = CSV.read(path, headers: true, encoding: 'bom|utf-8')
        col = "#{year - 1}/#{year}"
        seg_col = 'Segment_Secteur_eng'
        port_col = 'Min-portfolio_Portefeuille-min_eng'
        type_col = 'Type-detail_eng'

        portfolios = {}
        segments = Hash.new(0.0)
        table.each do |r|
          amount = dollars(r[col], r['Amt-units_Mnt-unite'])
          segment = clean(r[seg_col])
          portfolio = clean(r[port_col])
          if segment == MINISTERIAL_SEGMENT && !portfolio.empty? && !SEGMENT_IDS.key?(portfolio)
            p = (portfolios[portfolio] ||= Portfolio.new(
              label: portfolio, major_transfers: 0.0, other_transfers: 0.0,
              debt_charges: 0.0, other_expenses: 0.0
            ))
            bucket = TYPE_BUCKETS[clean(r[type_col])]
            p[bucket] += amount if bucket
          else
            # Standalone statement lumps. The 2014/2015 editions print the
            # "Provision for valuation and other items" as a PORTFOLIO row
            # inside the Ministries segment (later editions make it its own
            # segment) — route any SEGMENT_IDS label to the segments bucket
            # regardless of which column carries it.
            segments[SEGMENT_IDS.key?(portfolio) ? portfolio : segment] += amount
          end
        end

        {
          portfolios: portfolios,
          segments: segments.map { |label, dollars| Segment.new(id: segment_id(label), label: label, dollars: dollars) }
        }
      end

      def segment_id(label)
        SEGMENT_IDS[label] || "segment-#{label.downcase.gsub(/[^a-z0-9]+/, '-').gsub(/\A-|-\z/, '')}"
      end

      def dollars(value, units)
        return 0.0 if value.nil? || value.to_s.strip.empty?

        Units.csv_amount_to_dollars(value.to_s.delete(','), units)
      end

      def clean(str)
        str.to_s.gsub(%r{<sup>.*?</sup>}, '').gsub(/[‑–]/, '-').gsub(/\s+/, ' ').strip
      end
    end
  end
end
