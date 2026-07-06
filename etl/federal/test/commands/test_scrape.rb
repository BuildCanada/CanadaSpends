require_relative '../test_helper'
require 'pb_cli/commands/scrape'

module PbCli
  module Commands
    class TestScrape < Minitest::Test
      def setup
        @scraper = Scrape.new
      end

      def test_parse_single_year
        years = @scraper.send(:parse_years, '2025')
        assert_equal [2025], years
      end

      def test_parse_year_range
        years = @scraper.send(:parse_years, '2021-2025')
        assert_equal [2021, 2022, 2023, 2024, 2025], years
      end

      def test_parse_mixed_years_and_ranges
        years = @scraper.send(:parse_years, '2015,2017,2019-2025')
        assert_equal [2015, 2017, 2019, 2020, 2021, 2022, 2023, 2024, 2025], years
      end

      def test_parse_multiple_single_years
        years = @scraper.send(:parse_years, '2015,2017,2020')
        assert_equal [2015, 2017, 2020], years
      end

      def test_parse_multiple_ranges
        years = @scraper.send(:parse_years, '2015-2017,2020-2022')
        assert_equal [2015, 2016, 2017, 2020, 2021, 2022], years
      end

      def test_parse_years_with_spaces
        years = @scraper.send(:parse_years, '2015, 2017, 2019-2021')
        assert_equal [2015, 2017, 2019, 2020, 2021], years
      end

      def test_parse_removes_duplicates
        years = @scraper.send(:parse_years, '2020,2020-2022,2021')
        assert_equal [2020, 2021, 2022], years
      end

      def test_parse_sorts_years
        years = @scraper.send(:parse_years, '2025,2020,2022-2023')
        assert_equal [2020, 2022, 2023, 2025], years
      end

      def test_parse_reverse_range
        years = @scraper.send(:parse_years, '2025-2021')
        # Should still work, creating a range from start to end
        assert_equal [], years
      end

      def test_parse_single_year_range
        years = @scraper.send(:parse_years, '2020-2020')
        assert_equal [2020], years
      end
    end
  end
end
