require 'json'

module PbCli
  module Export
    # Fiscal-year CPI multipliers to a base year (spec §7 inflation block).
    # reference/cpi_fiscal_year.json carries, per fiscal year, an index_YYYY
    # column that multiplies that year's dollars up to YYYY dollars. The
    # base-year multiplier for a given fiscal year is simply that year's
    # index_<baseYear> value.
    class Cpi
      DEFAULT_BASE_YEAR = 2025

      def initialize(reference_path, base_year: DEFAULT_BASE_YEAR)
        @base_year = base_year
        raw = JSON.parse(File.read(reference_path))
        @by_year = {}
        raw.fetch('cpi_inflation_indexes').fetch('rows').each do |row|
          @by_year[row['fiscal_year']] = row
        end
      end

      attr_reader :base_year

      # Multiplier converting `fiscal_year` dollars into base-year dollars.
      def multiplier_to_base(fiscal_year)
        row = @by_year[fiscal_year]
        raise KeyError, "no CPI row for fiscal year #{fiscal_year}" unless row

        value = row["index_#{@base_year}"]
        raise KeyError, "no index_#{@base_year} column in CPI reference" unless value

        value.to_f.round(4)
      end

      def year?(fiscal_year)
        @by_year.key?(fiscal_year)
      end
    end
  end
end
