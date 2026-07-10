require 'test_helper'
require 'pb_cli/export/major_transfers'
require 'fileutils'
require 'json'

class TestExportMajorTransfers < Minitest::Test
  def setup
    @dir = File.join(Dir.pwd, 'tmp', 'test', 'major_transfers')
    FileUtils.mkdir_p(@dir)
    @path = File.join(@dir, 'rows.json')
    rows = [
      # 2024 appears in two editions; the year's own (2024) must win.
      geo(2024, 2024, 'Ontario', 6, 'canada_health_transfer' => 20_058.0),
      geo(2024, 2025, 'Ontario', 6, 'canada_health_transfer' => 99_999.0),
      geo(2024, 2024, 'Quebec', 5, 'fiscal_arrangements' => 14_043.0),
      geo(2024, 2024, 'Yukon', 14, 'fiscal_arrangements' => 1_252.0),
      geo(2024, 2024, 'Alberta', 9, 'canada_health_transfer' => 0.0),
      { 'source_year' => 2024, 'year' => 2024, 'province_territory' => 'Subtotal',
        'position' => 18, 'is_total_or_subtotal' => true, 'canada_health_transfer' => 49_431.0 },
      # 2025 exists only in its own edition
      geo(2025, 2025, 'Ontario', 6, 'canada_health_transfer' => 21_000.0)
    ]
    File.write(@path, JSON.generate(rows))
    @mt = PbCli::Export::MajorTransfers.new(@path)
  end

  def teardown
    FileUtils.rm_rf(@dir)
  end

  def geo(year, source_year, name, position, cols)
    { 'source_year' => source_year, 'year' => year, 'province_territory' => name,
      'position' => position, 'is_total_or_subtotal' => false }.merge(cols)
  end

  def test_prefers_the_years_own_edition_over_the_following_years
    rows = @mt.geo_rows(2024, 'canada_health_transfer')
    assert_equal [20_058.0 * 1_000_000], rows.map { |r| r['dollars'] }
  end

  def test_amounts_are_converted_from_millions_to_dollars
    assert_in_delta 20_058.0 * 1_000_000, @mt.column_total(2024, 'canada_health_transfer'), 1
  end

  def test_scope_separates_provinces_from_territories
    assert_equal ['Quebec'], @mt.geo_rows(2024, 'fiscal_arrangements', 'provinces').map { |r| r['name'] }
    assert_equal ['Yukon'], @mt.geo_rows(2024, 'fiscal_arrangements', 'territories').map { |r| r['name'] }
    assert_equal %w[Quebec Yukon], @mt.geo_rows(2024, 'fiscal_arrangements', 'all').map { |r| r['name'] }.sort
  end

  def test_totals_and_zero_rows_are_excluded
    names = @mt.geo_rows(2024, 'canada_health_transfer', 'all').map { |r| r['name'] }
    refute_includes names, 'Subtotal', 'total rows must never be geographic rows'
    refute_includes names, 'Alberta', 'zero rows are dropped'
  end

  def test_year_presence
    assert @mt.year?(2025)
    refute @mt.year?(1999)
  end
end
