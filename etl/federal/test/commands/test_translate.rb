require 'test_helper'
require 'fileutils'
require 'json'
require 'pb_cli/commands/translate'
require 'tmpdir'

class FakeTranslateClient
  attr_reader :last_usage

  def initialize
    @last_usage = { 'input_tokens' => 1, 'output_tokens' => 1 }
  end

  def configured?
    true
  end

  def complete(system:, user:, max_tokens: 8000)
    ids = user.scan(/"id":\s*"([^"]+)"/)
    JSON.generate(ids.to_h { |(id)| [id, "fr-#{id}"] })
  end
end

class TestTranslateCommand < Minitest::Test
  def setup
    @root = Dir.mktmpdir
    @data_dir = File.join(@root, 'data', 'federal')
    FileUtils.mkdir_p(File.join(@data_dir, '2025', 'departments'))
    File.write(File.join(@data_dir, 'index.json'), JSON.generate(years: [2025]))
    File.write(File.join(@data_dir, '2025', 'sankey.json'), JSON.generate(
                                                               spending_data: { id: 'spending', name: 'Spending' },
                                                               revenue_data: { id: 'revenue', name: 'Revenue' }
                                                             ))

    glossary_path = File.join(@root, 'glossary_fr.yaml')
    File.write(glossary_path, "Spending: Dépenses\n")

    prompt_path = File.join(@root, 'translation.md')
    File.write(prompt_path, "{{GLOSSARY}}\n{{ITEMS}}")

    @paths = {
      root: @root,
      data_dir: @data_dir,
      glossary_path: glossary_path,
      prompt_path: prompt_path,
      client: FakeTranslateClient.new
    }
  end

  def teardown
    FileUtils.rm_rf(@root)
  end

  def test_translates_a_single_year_end_to_end
    command = PbCli::Commands::Translate.new(@paths)
    assert_equal 0, command.call(['--year', '2025'])

    fr = JSON.parse(File.read(File.join(@data_dir, '2025', 'i18n', 'fr.json')))
    assert_equal 'Dépenses', fr['spending'] # glossary hit
    assert_equal 'fr-revenue', fr['revenue'] # LLM fallback
  end

  def test_all_years_reads_from_index_json
    command = PbCli::Commands::Translate.new(@paths)
    assert_equal 0, command.call(['--all-years'])
    assert File.exist?(File.join(@data_dir, '2025', 'i18n', 'fr.json'))
  end

  def test_missing_year_directory_is_an_error
    command = PbCli::Commands::Translate.new(@paths)
    assert_equal 1, command.call(['--year', '1999'])
  end

  def test_requires_year_or_all_years
    command = PbCli::Commands::Translate.new(@paths)
    assert_equal 1, command.call([])
  end
end
