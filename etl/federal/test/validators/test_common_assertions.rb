require 'test_helper'
require 'pb_cli/validators/common_assertions'

class TestCommonAssertions < Minitest::Test
  class TestValidator
    include PbCli::Validators::CommonAssertions

    def initialize
      initialize_assertions
    end
  end

  def setup
    @validator = TestValidator.new
  end

  # assert_not_blank tests

  def test_assert_not_blank_fails_on_nil
    @validator.assert_not_blank(nil, 'test_column')
    refute_empty @validator.failures
    assert_match(/test_column is blank/, @validator.failures.first)
  end

  def test_assert_not_blank_fails_on_empty_string
    @validator.assert_not_blank('', 'test_column')
    refute_empty @validator.failures
  end

  def test_assert_not_blank_fails_on_whitespace_only
    @validator.assert_not_blank('   ', 'test_column')
    refute_empty @validator.failures
  end

  def test_assert_not_blank_passes_on_value
    @validator.assert_not_blank('value', 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_not_blank_passes_on_zero
    @validator.assert_not_blank(0, 'test_column')
    assert_empty @validator.failures
  end

  # assert_greater_than_zero tests

  def test_assert_greater_than_zero_fails_on_zero
    @validator.assert_greater_than_zero(0, 'test_column')
    refute_empty @validator.failures
    assert_match(/must be > 0/, @validator.failures.first)
  end

  def test_assert_greater_than_zero_fails_on_negative
    @validator.assert_greater_than_zero(-1, 'test_column')
    refute_empty @validator.failures
  end

  def test_assert_greater_than_zero_passes_on_positive
    @validator.assert_greater_than_zero(1, 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_greater_than_zero_allows_nil
    @validator.assert_greater_than_zero(nil, 'test_column')
    assert_empty @validator.failures
  end

  # assert_non_negative tests

  def test_assert_non_negative_fails_on_negative
    @validator.assert_non_negative(-1, 'test_column')
    refute_empty @validator.failures
    assert_match(/must be >= 0/, @validator.failures.first)
  end

  def test_assert_non_negative_passes_on_zero
    @validator.assert_non_negative(0, 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_non_negative_passes_on_positive
    @validator.assert_non_negative(1, 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_non_negative_allows_nil
    @validator.assert_non_negative(nil, 'test_column')
    assert_empty @validator.failures
  end

  # assert_in_range tests

  def test_assert_in_range_fails_below_min
    @validator.assert_in_range(5, 10, 20, 'test_column')
    refute_empty @validator.failures
    assert_match(/must be between 10 and 20/, @validator.failures.first)
  end

  def test_assert_in_range_fails_above_max
    @validator.assert_in_range(25, 10, 20, 'test_column')
    refute_empty @validator.failures
  end

  def test_assert_in_range_passes_at_min
    @validator.assert_in_range(10, 10, 20, 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_in_range_passes_at_max
    @validator.assert_in_range(20, 10, 20, 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_in_range_passes_in_range
    @validator.assert_in_range(15, 10, 20, 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_in_range_allows_nil
    @validator.assert_in_range(nil, 10, 20, 'test_column')
    assert_empty @validator.failures
  end

  # assert_one_of tests

  def test_assert_one_of_fails_on_invalid
    @validator.assert_one_of('invalid', ['a', 'b', 'c'], 'test_column')
    refute_empty @validator.failures
    assert_match(/must be one of/, @validator.failures.first)
  end

  def test_assert_one_of_passes_on_valid
    @validator.assert_one_of('b', ['a', 'b', 'c'], 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_one_of_works_with_integers
    @validator.assert_one_of(1, [0, 1], 'test_column')
    assert_empty @validator.failures
  end

  # assert_numeric tests

  def test_assert_numeric_fails_on_string
    @validator.assert_numeric('not a number', 'test_column')
    refute_empty @validator.failures
    assert_match(/must be numeric/, @validator.failures.first)
  end

  def test_assert_numeric_passes_on_integer
    @validator.assert_numeric(42, 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_numeric_passes_on_float
    @validator.assert_numeric(3.14, 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_numeric_passes_on_negative
    @validator.assert_numeric(-100.5, 'test_column')
    assert_empty @validator.failures
  end

  def test_assert_numeric_allows_nil
    @validator.assert_numeric(nil, 'test_column')
    assert_empty @validator.failures
  end

  # Context formatting tests

  def test_context_is_included_in_failure_message
    @validator.assert_not_blank(nil, 'test_column', { source_year: 2024, province: 'Ontario' })
    assert_match(/source_year=2024/, @validator.failures.first)
    assert_match(/province=Ontario/, @validator.failures.first)
  end

  def test_empty_context_produces_no_brackets
    @validator.assert_not_blank(nil, 'test_column', {})
    refute_match(/\[/, @validator.failures.first)
  end
end
