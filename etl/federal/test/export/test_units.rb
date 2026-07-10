require 'test_helper'
require 'pb_cli/export/units'

class TestExportUnits < Minitest::Test
  Units = PbCli::Export::Units

  def test_dollars_to_billions_converts_and_rounds
    assert_equal 33.805584, Units.dollars_to_billions(33_805_584_000)
  end

  def test_csv_amount_to_billions_handles_millions_units
    # Vol I CSVs carry x1000000 (millions): 513_936 M -> 513.936 B
    assert_equal 513.936, Units.csv_amount_to_billions(513_936, 'x1000000')
  end

  def test_csv_amount_to_dollars_respects_units_multiplier
    assert_equal 513_936_000_000.0, Units.csv_amount_to_dollars(513_936, 'x1000000')
    assert_equal 5_000.0, Units.csv_amount_to_dollars(5, 'x1000')
  end

  def test_csv_unit_multiplier_rejects_unknown_units
    assert_raises(ArgumentError) { Units.csv_unit_multiplier('percent') }
  end

  def test_millions_to_billions
    assert_equal 9.858, Units.millions_to_billions(9858)
  end

  def test_round_dollars_returns_integer
    assert_equal 511_111_111, Units.round_dollars(511_111_110.7)
  end

  def test_negative_amounts_preserved
    assert_equal(-4.838, Units.csv_amount_to_billions(-4838, 'x1000000'))
  end
end
