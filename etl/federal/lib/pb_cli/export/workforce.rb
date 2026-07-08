require 'json'

module PbCli
  module Export
    # Reads the committed reference/workforce.json produced by `pb workforce`
    # (TBS federal public service population). The exporter merges each year's
    # headcount + raw department breakdown with the standard-object Personnel
    # figure to emit data/federal/{year}/workforce.json.
    class Workforce
      def initialize(path)
        @data = File.exist?(path) ? JSON.parse(File.read(path)) : { 'years' => {} }
        @years = @data['years'] || {}
      end

      def source
        @data['source']
      end

      def year?(year)
        @years.key?(year.to_s)
      end

      def available_years
        @years.keys.map(&:to_i).sort
      end

      # The reference entry for a year, or nil.
      def entry(year)
        @years[year.to_s]
      end

      def headcount(year)
        entry(year)&.dig('headcount')
      end

      # Raw TBS { department label => count } (unresolved), or {}.
      def departments(year)
        entry(year)&.dig('headcountByDepartment') || {}
      end
    end
  end
end
