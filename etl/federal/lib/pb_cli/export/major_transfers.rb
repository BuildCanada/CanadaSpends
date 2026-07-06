require 'json'

module PbCli
  module Export
    # Reads the extracted Vol I Table 3.7 dataset
    # (major_transfers_by_provinces_and_territories.json). Amounts are in
    # MILLIONS of dollars. Each fiscal year appears in two editions (its own
    # and the following year's table shows the prior year); the year's own
    # edition is preferred, so figures match the statements as first published.
    class MajorTransfers
      MILLION = 1_000_000.0

      PROVINCES = [
        'Newfoundland and Labrador', 'Prince Edward Island', 'Nova Scotia',
        'New Brunswick', 'Quebec', 'Ontario', 'Manitoba', 'Saskatchewan',
        'Alberta', 'British Columbia'
      ].freeze
      TERRITORIES = ['Yukon', 'Northwest Territories', 'Nunavut'].freeze

      def initialize(path)
        rows = JSON.parse(File.read(path))
        @by_year = {}
        rows.group_by { |r| [r['year'], r['province_territory'], r['position']] }
            .each_value do |dupes|
          row = dupes.min_by { |r| (r['source_year'] == r['year'] ? 0 : 1000) + r['source_year'].to_i }
          (@by_year[row['year']] ||= []) << row
        end
      end

      def year?(year)
        @by_year.key?(year)
      end

      # Geographic rows (never totals/adjustments) for a column, in dollars.
      # scope: 'provinces' | 'territories' | 'all'. Zero/absent rows dropped.
      def geo_rows(year, column, scope = 'all')
        names = case scope
                when 'provinces' then PROVINCES
                when 'territories' then TERRITORIES
                else PROVINCES + TERRITORIES + ['International']
                end
        (@by_year[year] || []).filter_map do |r|
          next if r['is_total_or_subtotal']
          next unless names.include?(r['province_territory'])

          amount = r[column]
          next if amount.nil? || amount.to_f.zero?

          { 'name' => r['province_territory'], 'dollars' => amount.to_f * MILLION }
        end.sort_by { |r| -r['dollars'] }
      end

      def column_total(year, column, scope = 'all')
        geo_rows(year, column, scope).sum { |r| r['dollars'] }
      end
    end
  end
end
