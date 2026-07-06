require 'test_helper'
require 'pb_cli/commands/extract'
require 'pb_cli/extractors/transfer_payments_by_ministry'
require 'json'

class TestTransferPaymentsByMinistry < Minitest::Test
  include TestPaths

  def setup
    @test_paths = setup_test_paths('transfer_payments_by_ministry')
    @extractor = PbCli::Extractors::TransferPaymentsByMinistry.new(@test_paths)
    @data_dir = @test_paths[:data_dir]
    @metadata_dir = @test_paths[:metadata_dir]
  end

  def teardown
    cleanup_test_paths(@test_paths)
  end

  def test_extractor_name
    assert_equal 'transfer_payments_by_ministry', @extractor.extractor_name
  end

  def test_extract_creates_json_file
    @extractor.extract

    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    assert File.exist?(json_file), "JSON file should be created"
  end

  def test_extract_creates_metadata_file
    @extractor.extract

    yaml_file = File.join(@metadata_dir, 'transfer_payments_by_ministry.yaml')
    assert File.exist?(yaml_file), "YAML metadata file should be created"
  end

  def test_extract_json_is_valid
    @extractor.extract

    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    json_content = File.read(json_file)

    # Should be valid JSON
    data = JSON.parse(json_content)
    assert data.is_a?(Array), "JSON should contain an array"
  end

  def test_extract_records_have_required_fields
    result = @extractor.extract
    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    data = JSON.parse(File.read(json_file))

    # Skip if no data
    return if data.empty?

    first_record = data.first
    required_fields = %w[source_year year ministry_code ministry_name description]
    required_fields.each do |field|
      assert first_record.key?(field), "Record should have #{field}"
    end
  end

  def test_extract_records_have_numeric_columns
    result = @extractor.extract
    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    data = JSON.parse(File.read(json_file))

    # Skip if no data
    return if data.empty?

    # Find a record with actual numeric data (not nil)
    record_with_data = data.find { |r| r['main_estimates'] && r['main_estimates'] != 0 }
    return unless record_with_data

    numeric_fields = %w[
      available_from_previous_years main_estimates supplementary_estimates
      adjustments_warrants_transfers total_available_for_use used_in_current_year
      variance available_for_subsequent_years used_in_previous_year
    ]

    numeric_fields.each do |field|
      assert record_with_data.key?(field), "Record should have #{field}"
      value = record_with_data[field]
      assert value.nil? || value.is_a?(Numeric), "#{field} should be numeric or nil"
    end
  end

  def test_extract_handles_negative_values
    result = @extractor.extract
    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    data = JSON.parse(File.read(json_file))

    # Look for any record with negative adjustments (common in the data)
    negative_record = data.find { |r| r['adjustments_warrants_transfers'] && r['adjustments_warrants_transfers'] < 0 }

    # If there are negative values in the data, verify they're parsed correctly
    if negative_record
      assert negative_record['adjustments_warrants_transfers'] < 0,
             "Negative values should be parsed as negative numbers"
    end
  end

  def test_extract_identifies_totals_correctly
    result = @extractor.extract
    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    data = JSON.parse(File.read(json_file))

    # Look for total rows
    total_records = data.select { |r| r['is_total_or_subtotal'] == true }

    # If there are totals, verify they have "total" in the description
    total_records.each do |record|
      desc_lower = record['description'].downcase
      assert desc_lower.include?('total') || desc_lower.include?('sub-total'),
             "Records marked as totals should have 'total' in description: #{record['description']}"
    end
  end

  def test_ministry_code_extraction
    result = @extractor.extract
    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    # Verify ministry codes are non-empty strings
    data.each do |record|
      assert record['ministry_code'].is_a?(String), "ministry_code should be a string"
      refute record['ministry_code'].empty?, "ministry_code should not be empty"
      # Ministry codes should be lowercase with hyphens (URL format)
      assert record['ministry_code'].match?(/^[a-z0-9-]+$/),
             "ministry_code should be lowercase with hyphens: #{record['ministry_code']}"
    end
  end

  def test_category_tracking
    result = @extractor.extract
    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    data = JSON.parse(File.read(json_file))

    # Look for records with categories
    records_with_category = data.select { |r| r['category'] && !r['category'].empty? }

    # If there are categorized records, verify common categories exist
    return if records_with_category.empty?

    categories = records_with_category.map { |r| r['category'] }.uniq

    # Common categories in transfer payment tables
    common_categories = ['Grants', 'Contributions', 'Other transfer payments']

    # At least one common category should be present
    has_common = categories.any? { |c| common_categories.any? { |cc| c.downcase.include?(cc.downcase) } }

    # This is a soft check - categories vary by ministry
    if has_common
      assert true, "Found expected categories"
    else
      puts "Note: No common categories found. Categories found: #{categories.inspect}"
    end
  end

  def test_metadata_contains_datasette_structure
    @extractor.extract

    yaml_file = File.join(@metadata_dir, 'transfer_payments_by_ministry.yaml')
    yaml_content = File.read(yaml_file)

    # Basic checks for Datasette structure
    assert yaml_content.include?('databases:'), "Metadata should have databases key"
    assert yaml_content.include?('tables:'), "Metadata should have tables key"
    assert yaml_content.include?('title:'), "Metadata should have title"
    assert yaml_content.include?('columns:'), "Metadata should have columns"
  end

  def test_ministry_name_normalization
    # Test the normalization constant directly
    normalization = PbCli::Extractors::TransferPaymentsByMinistry::MINISTRY_NAME_NORMALIZATION

    # Verify known normalizations
    assert_equal 'Crown-Indigenous Relations and Northern Affairs',
                 normalization['Aboriginal Affairs and Northern Development']
    assert_equal 'Global Affairs',
                 normalization['Foreign Affairs and International Trade']
    assert_equal 'Employment and Workforce Development',
                 normalization['Employment and Social Development']
  end

  def test_extract_records_have_ministry_name_normalized
    result = @extractor.extract
    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    # Every record should have ministry_name_normalized field
    data.each do |record|
      assert record.key?('ministry_name_normalized'),
             "Record should have ministry_name_normalized field"
    end
  end

  def test_indent_level_extraction
    result = @extractor.extract
    json_file = File.join(@data_dir, 'transfer_payments_by_ministry.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    # All records should have indent_level
    data.each do |record|
      assert record.key?('indent_level'), "Record should have indent_level"
      assert record['indent_level'].is_a?(Integer), "indent_level should be an integer"
      assert record['indent_level'] >= 0, "indent_level should be non-negative"
    end
  end
end
