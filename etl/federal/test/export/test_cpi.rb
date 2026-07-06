require 'test_helper'
require 'pb_cli/export/cpi'

class TestExportCpi < Minitest::Test
  def setup
    @cpi = PbCli::Export::Cpi.new(File.join(Dir.pwd, 'reference/cpi_fiscal_year.json'), base_year: 2025)
  end

  def test_base_year_multiplier_is_one
    assert_equal 1.0, @cpi.multiplier_to_base(2025)
  end

  def test_multiplier_for_recent_year
    # FY2024 dollars -> 2025 dollars
    assert_equal 1.0224, @cpi.multiplier_to_base(2024)
  end

  def test_older_years_have_larger_multipliers
    assert_operator @cpi.multiplier_to_base(2014), :>, @cpi.multiplier_to_base(2024)
  end

  def test_year_presence
    assert @cpi.year?(2013)
    refute @cpi.year?(1800)
  end

  def test_missing_year_raises
    assert_raises(KeyError) { @cpi.multiplier_to_base(1800) }
  end
end
