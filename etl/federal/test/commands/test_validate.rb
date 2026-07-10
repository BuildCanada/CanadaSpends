require 'test_helper'
require 'pb_cli/commands/validate'
require 'json'

class TestValidate < Minitest::Test
  include TestPaths

  def setup
    @test_paths = setup_test_paths('validate')
    @db_path = @test_paths[:db_path]
    @command = PbCli::Commands::Validate.new(@test_paths)
  end

  def teardown
    cleanup_test_paths(@test_paths)
  end

  def test_validate_returns_error_when_database_missing
    output, = capture_io do
      result = @command.call([])
      assert_equal 1, result
    end
    assert_match(/Database not found/, output)
  end

  def test_validate_with_unknown_table_returns_error
    skip "sqlite3 not installed" unless sqlite3_installed?

    create_test_database
    output, = capture_io do
      result = @command.call(['nonexistent_table'])
      assert_equal 1, result
    end
    assert_match(/Unknown table/, output)
  end

  def test_validate_runs_specific_validator_with_valid_data
    skip "sqlite3 not installed" unless sqlite3_installed?

    create_test_database_with_valid_data
    output, = capture_io do
      result = @command.call(['major_transfers_by_provinces_and_territories'])
      assert_equal 0, result
    end
    assert_match(/All.*validations passed/, output)
    assert_match(/Validations executed/, output)
  end

  def test_validate_runs_all_validators
    skip "sqlite3 not installed" unless sqlite3_installed?

    create_test_database_with_valid_data
    output, = capture_io do
      result = @command.call([])
      assert_equal 0, result
    end
    assert_match(/Running all validators/, output)
    assert_match(/Summary/, output)
  end

  def test_validate_detects_invalid_source_year
    skip "sqlite3 not installed" unless sqlite3_installed?

    create_test_database_with_invalid_source_year
    output, = capture_io do
      result = @command.call(['major_transfers_by_provinces_and_territories'])
      assert_equal 1, result
    end
    assert_match(/failure.*in.*validations/, output)
    assert_match(/source_year must be between/, output)
  end

  def test_validate_detects_invalid_fiscal_year
    skip "sqlite3 not installed" unless sqlite3_installed?

    create_test_database_with_invalid_fiscal_year
    output, = capture_io do
      result = @command.call(['major_transfers_by_provinces_and_territories'])
      assert_equal 1, result
    end
    assert_match(/failure.*in.*validations/, output)
    assert_match(/year.*should be source_year/, output)
  end

  def test_validate_detects_invalid_position
    skip "sqlite3 not installed" unless sqlite3_installed?

    create_test_database_with_invalid_position
    output, = capture_io do
      result = @command.call(['major_transfers_by_provinces_and_territories'])
      assert_equal 1, result
    end
    assert_match(/failure.*in.*validations/, output)
    assert_match(/position must be > 0/, output)
  end

  private

  def sqlite3_installed?
    system('which sqlite3 > /dev/null 2>&1')
  end

  def create_test_database
    FileUtils.mkdir_p(File.dirname(@db_path))
    `sqlite3 #{@db_path} "CREATE TABLE test (id INTEGER)"`
  end

  def create_test_database_with_valid_data
    FileUtils.mkdir_p(File.dirname(@db_path))

    `sqlite3 #{@db_path} "CREATE TABLE major_transfers_by_provinces_and_territories (
      source_year INTEGER,
      year INTEGER,
      province_territory TEXT,
      position INTEGER,
      is_total_or_subtotal INTEGER,
      old_age_security_benefits REAL,
      total REAL
    )"`

    # Insert valid test data - year is source_year or source_year - 1
    `sqlite3 #{@db_path} "INSERT INTO major_transfers_by_provinces_and_territories VALUES (2024, 2024, 'Ontario', 1, 0, 1234.5, 5000.0)"`
    `sqlite3 #{@db_path} "INSERT INTO major_transfers_by_provinces_and_territories VALUES (2024, 2023, 'Ontario', 2, 0, 1100.0, 4500.0)"`
    `sqlite3 #{@db_path} "INSERT INTO major_transfers_by_provinces_and_territories VALUES (2024, 2024, 'Total', 3, 1, 2334.5, 9500.0)"`
  end

  def create_test_database_with_invalid_source_year
    FileUtils.mkdir_p(File.dirname(@db_path))

    `sqlite3 #{@db_path} "CREATE TABLE major_transfers_by_provinces_and_territories (
      source_year INTEGER,
      year INTEGER,
      province_territory TEXT,
      position INTEGER,
      is_total_or_subtotal INTEGER,
      total REAL
    )"`

    # Insert data with source_year out of valid range (before 2013)
    `sqlite3 #{@db_path} "INSERT INTO major_transfers_by_provinces_and_territories VALUES (2000, 2000, 'Ontario', 1, 0, 1234.5)"`
  end

  def create_test_database_with_invalid_fiscal_year
    FileUtils.mkdir_p(File.dirname(@db_path))

    `sqlite3 #{@db_path} "CREATE TABLE major_transfers_by_provinces_and_territories (
      source_year INTEGER,
      year INTEGER,
      province_territory TEXT,
      position INTEGER,
      is_total_or_subtotal INTEGER,
      total REAL
    )"`

    # Insert data with fiscal year that doesn't match source_year or source_year-1
    `sqlite3 #{@db_path} "INSERT INTO major_transfers_by_provinces_and_territories VALUES (2024, 2020, 'Ontario', 1, 0, 1234.5)"`
  end

  def create_test_database_with_invalid_position
    FileUtils.mkdir_p(File.dirname(@db_path))

    `sqlite3 #{@db_path} "CREATE TABLE major_transfers_by_provinces_and_territories (
      source_year INTEGER,
      year INTEGER,
      province_territory TEXT,
      position INTEGER,
      is_total_or_subtotal INTEGER,
      total REAL
    )"`

    # Insert data with position of 0 (should be > 0)
    `sqlite3 #{@db_path} "INSERT INTO major_transfers_by_provinces_and_territories VALUES (2024, 2024, 'Ontario', 0, 0, 1234.5)"`
  end
end
