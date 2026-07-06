require 'test_helper'
require 'fileutils'
require 'json'
require 'pb_cli/commands/prose'
require 'tmpdir'

class FakeProseCommandClient
  def initialize(prose: '{{name}} spent {{totalSpending}}.', verification: 'No unsupported claims found.')
    @prose = prose
    @verification = verification
  end

  def configured?
    true
  end

  def complete(system:, user:, max_tokens: 8000)
    system.include?('fact-check') ? @verification : @prose
  end
end

class TestProseCommand < Minitest::Test
  def setup
    @root = Dir.mktmpdir
    @data_dir = File.join(@root, 'data', 'federal')
    FileUtils.mkdir_p(File.join(@data_dir, '2025', 'departments'))
    File.write(File.join(@data_dir, 'index.json'), JSON.generate(years: [2025]))
    File.write(File.join(@data_dir, '2025', 'summary.json'), JSON.generate(financialYear: '2024-25', totalSpending: 543.28))
    File.write(File.join(@data_dir, '2025', 'departments', 'transport-canada.json'), JSON.generate(
                                                                                        name: 'Transport', slug: 'transport-canada',
                                                                                        financialYearEnding: 2025, totalSpending: 6.02,
                                                                                        percentageOfFederal: 1.11, entities: [], votes: [],
                                                                                        transferPayments: []
                                                                                      ))

    slugs_path = File.join(@root, 'ministry_slugs.yaml')
    File.write(slugs_path, <<~YAML)
      portfolios:
        - slug: transport-canada
          existing_page: true
    YAML

    File.write(File.join(@root, 'prose.md'), '{{CONTEXT}}')
    File.write(File.join(@root, 'prose_verify.md'), "{{CONTEXT}}\n{{PROSE}}")

    @paths = {
      root: @root,
      data_dir: @data_dir,
      slugs_path: slugs_path,
      prose_prompt_path: File.join(@root, 'prose.md'),
      verify_prompt_path: File.join(@root, 'prose_verify.md'),
      client: FakeProseCommandClient.new
    }
  end

  def teardown
    FileUtils.rm_rf(@root)
  end

  def test_generates_prose_for_a_department_year
    command = PbCli::Commands::Prose.new(@paths)
    assert_equal 0, command.call(['--year', '2025', '--department', 'transport-canada'])

    out_path = File.join(@data_dir, '2025', 'departments', 'transport-canada.prose.en.md')
    assert File.exist?(out_path)
    assert_includes File.read(out_path), 'reviewed: false'
  end

  def test_skips_legacy_departments_for_fy2024
    File.write(File.join(@data_dir, 'index.json'), JSON.generate(years: [2024, 2025]))
    FileUtils.mkdir_p(File.join(@data_dir, '2024', 'departments'))
    File.write(File.join(@data_dir, '2024', 'departments', 'transport-canada.json'), JSON.generate(
                                                                                        name: 'Transport', slug: 'transport-canada',
                                                                                        financialYearEnding: 2024, totalSpending: 5.0,
                                                                                        percentageOfFederal: 1.0, entities: [], votes: [],
                                                                                        transferPayments: []
                                                                                      ))

    command = PbCli::Commands::Prose.new(@paths)
    command.call(['--year', '2024', '--department', 'transport-canada'])

    refute File.exist?(File.join(@data_dir, '2024', 'departments', 'transport-canada.prose.en.md'))
  end

  def test_lint_violation_prevents_the_file_from_being_written
    paths = @paths.merge(client: FakeProseCommandClient.new(prose: 'This department spent $6 million.'))
    command = PbCli::Commands::Prose.new(paths)

    assert_equal 1, command.call(['--year', '2025', '--department', 'transport-canada'])
    refute File.exist?(File.join(@data_dir, '2025', 'departments', 'transport-canada.prose.en.md'))
  end

  def test_missing_api_key_is_an_error
    unconfigured_client = Class.new do
      def configured?
        false
      end
    end.new
    command = PbCli::Commands::Prose.new(@paths.merge(client: unconfigured_client))
    assert_equal 1, command.call(['--year', '2025'])
  end
end
