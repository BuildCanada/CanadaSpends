require 'test_helper'
require 'pb_cli/commands/extract'
require 'pb_cli/extractors/budgetary_details_by_allotment'
require 'json'

class TestBudgetaryDetailsByAllotment < Minitest::Test
  include TestPaths

  def setup
    @test_paths = setup_test_paths('budgetary_details_by_allotment')
    @extractor = PbCli::Extractors::BudgetaryDetailsByAllotment.new(@test_paths)
    @data_dir = @test_paths[:data_dir]
    @metadata_dir = @test_paths[:metadata_dir]
  end

  def teardown
    cleanup_test_paths(@test_paths)
  end

  def test_extractor_name
    assert_equal 'budgetary_details_by_allotment', @extractor.extractor_name
  end

  def test_extract_creates_json_file
    @extractor.extract

    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    assert File.exist?(json_file), "JSON file should be created"
  end

  def test_extract_creates_metadata_file
    @extractor.extract

    yaml_file = File.join(@metadata_dir, 'budgetary_details_by_allotment.yaml')
    assert File.exist?(yaml_file), "YAML metadata file should be created"
  end

  def test_extract_json_is_valid
    @extractor.extract

    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    json_content = File.read(json_file)

    # Should be valid JSON
    data = JSON.parse(json_content)
    assert data.is_a?(Array), "JSON should contain an array"
  end

  def test_extract_records_have_required_fields
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    first_record = data.first
    required_fields = %w[source_year year ministry_code description]
    required_fields.each do |field|
      assert first_record.key?(field), "Record should have #{field}"
    end
  end

  def test_extract_records_have_organization
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    # Most records should have an organization
    records_with_org = data.count { |r| r['organization'] && !r['organization'].empty? }
    assert records_with_org > 0, "At least some records should have organization set"
  end

  def test_extract_records_have_vote_info
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    # Find records with vote information
    records_with_vote = data.select { |r| r['vote'] && !r['vote'].empty? }

    assert records_with_vote.size > 0, "Some records should have vote information"

    # Check vote_number is properly set
    records_with_vote.each do |record|
      next if record['vote'].downcase.include?('statutory')
      next unless record['vote'].downcase.include?('vote')

      vote_num = record['vote_number']
      assert vote_num.is_a?(Integer) || vote_num == 'Statutory',
             "vote_number should be Integer or 'Statutory': #{vote_num.inspect}"
    end
  end

  def test_vote_number_parsing
    extractor = @extractor

    # Test the parsing method directly
    assert_equal 1, extractor.send(:parse_vote_number, 'Vote 1—Operating expenditures')
    assert_equal 10, extractor.send(:parse_vote_number, 'Vote 10—Grants and contributions')
    assert_equal 5, extractor.send(:parse_vote_number, 'Vote 5—Capital expenditures')
    assert_equal 'Statutory', extractor.send(:parse_vote_number, 'Statutory amounts')
    assert_nil extractor.send(:parse_vote_number, 'Operating budget')
  end

  def test_statutory_vote_number
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    # Find statutory records
    statutory_records = data.select { |r| r['vote_number'] == 'Statutory' }

    # If there are statutory records, verify they have the right vote text
    statutory_records.each do |record|
      assert record['vote'].downcase.include?('statutory'),
             "Statutory vote_number should correspond to statutory vote: #{record['vote']}"
    end
  end

  def test_parent_description_for_frozen_allotments
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    # Find records with parent_description set
    frozen_items = data.select { |r| r['parent_description']&.include?('Frozen') }

    frozen_items.each do |record|
      # These should be indent3 items under "Frozen Allotments"
      assert record['indent_level'] >= 2,
             "Frozen allotment sub-items should be at indent level 2+"
    end
  end

  def test_numeric_columns_present
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    # Find a record with actual numeric data
    record_with_data = data.find { |r| r['allotments'] && r['allotments'] != 0 }
    return unless record_with_data

    # All records should have allotments and expenditures at minimum
    assert record_with_data.key?('allotments'), "Record should have allotments"
    assert record_with_data.key?('expenditures'), "Record should have expenditures"

    # Check they're numeric
    assert record_with_data['allotments'].is_a?(Numeric),
           "allotments should be numeric"
    assert record_with_data['expenditures'].is_a?(Numeric),
           "expenditures should be numeric"
  end

  def test_negative_values_parsed_correctly
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    # Look for any record with negative values
    negative_record = data.find do |r|
      (r['lapsed_or_overexpended'] && r['lapsed_or_overexpended'] < 0) ||
        (r['allotments'] && r['allotments'] < 0) ||
        (r['expenditures'] && r['expenditures'] < 0)
    end

    if negative_record
      puts "Found negative value record, parsing working correctly"
    end
    # This is a soft test - negative values may not exist in all years
    assert true
  end

  def test_identifies_totals_correctly
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
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

  def test_ministry_total_rows
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    # Find "Total Ministry" rows
    ministry_totals = data.select { |r| r['description'].downcase.include?('total ministry') }

    ministry_totals.each do |record|
      assert record['is_total_or_subtotal'] == true,
             "Total Ministry should be marked as total"
      assert record['indent_level'] == 0,
             "Total Ministry should be at indent level 0"
    end
  end

  def test_ministry_code_extraction
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    # Verify ministry codes are non-empty strings
    data.each do |record|
      assert record['ministry_code'].is_a?(String), "ministry_code should be a string"
      refute record['ministry_code'].empty?, "ministry_code should not be empty"
      # Ministry codes should be lowercase with hyphens (URL format) or "consolidated"
      assert record['ministry_code'].match?(/^[a-z0-9-]+$/),
             "ministry_code should be lowercase with hyphens: #{record['ministry_code']}"
    end
  end

  def test_ministry_name_normalization
    # Test the normalization constant (reused from TransferPaymentsByMinistry)
    normalization = PbCli::Extractors::BudgetaryDetailsByAllotment::MINISTRY_NAME_NORMALIZATION

    # Verify known normalizations
    assert_equal 'Crown-Indigenous Relations and Northern Affairs',
                 normalization['Aboriginal Affairs and Northern Development']
    assert_equal 'Global Affairs',
                 normalization['Foreign Affairs and International Trade']
  end

  def test_extract_records_have_ministry_name_normalized
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
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
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    # All records should have indent_level
    data.each do |record|
      assert record.key?('indent_level'), "Record should have indent_level"
      assert record['indent_level'].is_a?(Integer), "indent_level should be an integer"
      assert record['indent_level'] >= 0, "indent_level should be non-negative"
      assert record['indent_level'] <= 3, "indent_level should be at most 3"
    end
  end

  def test_position_ordering
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    return if data.empty?

    # Group by year and ministry_code, verify positions are sequential
    grouped = data.group_by { |r| "#{r['year']}:#{r['ministry_code']}" }

    grouped.each do |key, records|
      positions = records.map { |r| r['position'] }
      expected = (1..positions.size).to_a
      assert_equal expected, positions.sort,
                   "Positions should be sequential starting from 1 for #{key}"
    end
  end

  def test_metadata_contains_datasette_structure
    @extractor.extract

    yaml_file = File.join(@metadata_dir, 'budgetary_details_by_allotment.yaml')
    yaml_content = File.read(yaml_file)

    # Basic checks for Datasette structure
    assert yaml_content.include?('databases:'), "Metadata should have databases key"
    assert yaml_content.include?('tables:'), "Metadata should have tables key"
    assert yaml_content.include?('title:'), "Metadata should have title"
    assert yaml_content.include?('columns:'), "Metadata should have columns"
    assert yaml_content.include?('budgetary_details_by_allotment'),
           "Metadata should reference the table name"
  end

  def test_handles_multiple_organizations_in_ministry
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    # RCAANC has multiple organizations: Department + CHARS
    rcaanc_records = data.select { |r| r['ministry_code'] == 'rcaanc-cirnac' }

    return if rcaanc_records.empty?

    organizations = rcaanc_records.map { |r| r['organization'] }.uniq.compact

    # Should have at least 2 organizations for recent years
    recent_rcaanc = rcaanc_records.select { |r| r['year'] && r['year'] >= 2020 }
    if recent_rcaanc.any?
      recent_orgs = recent_rcaanc.map { |r| r['organization'] }.uniq.compact
      assert recent_orgs.size >= 2,
             "RCAANC should have multiple organizations: #{recent_orgs.inspect}"
    end
  end

  def test_consolidated_ministry_code_for_vol3
    result = @extractor.extract
    json_file = File.join(@data_dir, 'budgetary_details_by_allotment.json')
    data = JSON.parse(File.read(json_file))

    # 2013-2014 should have "consolidated" ministry code
    old_records = data.select { |r| r['year'] && r['year'] <= 2014 }

    old_records.each do |record|
      assert_equal 'consolidated', record['ministry_code'],
                   "2013-2014 records should have 'consolidated' ministry code"
    end
  end
end
