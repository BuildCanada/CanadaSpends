require 'test_helper'
require 'pb_cli/commands/extract'
require 'json'

class TestExtract < Minitest::Test
  include TestPaths

  def setup
    @test_paths = setup_test_paths('extract')
    @command = PbCli::Commands::Extract.new(@test_paths)
    @data_dir = @test_paths[:data_dir]
    @metadata_dir = @test_paths[:metadata_dir]
  end

  def teardown
    cleanup_test_paths(@test_paths)
  end

  def test_extract_with_no_args_runs_all_extractors
    result = @command.call([])
    assert_equal 0, result
  end

  def test_extract_with_specific_extractor
    result = @command.call(['major_transfers_by_provinces_and_territories'])
    assert_equal 0, result
  end

  def test_extract_with_unknown_extractor_returns_error
    result = @command.call(['nonexistent_extractor'])
    assert_equal 1, result
  end

  def test_extract_creates_json_file
    @command.call(['major_transfers_by_provinces_and_territories'])

    json_file = File.join(@data_dir, 'major_transfers_by_provinces_and_territories.json')
    assert File.exist?(json_file), "JSON file should be created"
  end

  def test_extract_creates_metadata_file
    @command.call(['major_transfers_by_provinces_and_territories'])

    yaml_file = File.join(@metadata_dir, 'major_transfers_by_provinces_and_territories.yaml')
    assert File.exist?(yaml_file), "YAML metadata file should be created"
  end

  def test_extract_json_is_valid
    @command.call(['major_transfers_by_provinces_and_territories'])

    json_file = File.join(@data_dir, 'major_transfers_by_provinces_and_territories.json')
    json_content = File.read(json_file)

    # Should be valid JSON
    data = JSON.parse(json_content)
    assert data.is_a?(Array), "JSON should contain an array"
  end

  def test_extract_records_have_required_fields
    @command.call(['major_transfers_by_provinces_and_territories'])

    json_file = File.join(@data_dir, 'major_transfers_by_provinces_and_territories.json')
    data = JSON.parse(File.read(json_file))

    # Skip if no data
    return if data.empty?

    first_record = data.first
    assert first_record.key?('source_year'), "Record should have source_year"
    assert first_record.key?('year'), "Record should have year"
    assert first_record.key?('province_territory'), "Record should have province_territory"
  end

  def test_extract_metadata_contains_datasette_structure
    @command.call(['major_transfers_by_provinces_and_territories'])

    yaml_file = File.join(@metadata_dir, 'major_transfers_by_provinces_and_territories.yaml')
    yaml_content = File.read(yaml_file)

    # Basic checks for Datasette structure
    assert yaml_content.include?('databases:'), "Metadata should have databases key"
    assert yaml_content.include?('tables:'), "Metadata should have tables key"
    assert yaml_content.include?('title:'), "Metadata should have title"
    assert yaml_content.include?('columns:'), "Metadata should have columns"
  end
end
