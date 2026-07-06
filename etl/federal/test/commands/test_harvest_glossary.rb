require 'test_helper'
require 'fileutils'
require 'pb_cli/commands/harvest_glossary'
require 'tmpdir'
require 'yaml'

class TestHarvestGlossary < Minitest::Test
  def setup
    @dir = Dir.mktmpdir
    @source_dir = File.join(@dir, 'open_tables')
    @out_path = File.join(@dir, 'glossary_fr.yaml')
    FileUtils.mkdir_p(@source_dir)
  end

  def teardown
    FileUtils.rm_rf(@dir)
  end

  def write_csv(name, header, *rows)
    File.write(File.join(@source_dir, name), ([header] + rows).map { |r| r.join(',') }.join("\n"))
  end

  def command
    PbCli::Commands::HarvestGlossary.new(open_tables_dir: @source_dir, out_path: @out_path)
  end

  def test_harvests_paired_eng_fra_columns_across_multiple_files
    write_csv(
      'a.csv',
      %w[Min-portfolio_Portefeuille-min_eng Min-portfolio_Portefeuille-min_fra Other],
      ['"Transport"', '"Transports"', 'x']
    )
    write_csv(
      'b.csv',
      %w[Pymt-desc_Desc-paimt_eng Pymt-desc_Desc-paimt_fra],
      ['"Grant"', '"Subvention"'],
      ['"Grant"', '"Subvention"']
    )

    assert_equal 0, command.call([])

    terms = YAML.load_file(@out_path)
    assert_equal 'Transports', terms['Transport']
    assert_equal 'Subvention', terms['Grant']
  end

  def test_conflicting_translations_resolve_by_frequency_then_alphabetically
    write_csv(
      'a.csv',
      %w[X_eng X_fra],
      ['"Term"', '"Zeta"'],
      ['"Term"', '"Alpha"'],
      ['"Term"', '"Alpha"']
    )

    command.call([])

    terms = YAML.load_file(@out_path)
    assert_equal 'Alpha', terms['Term'] # 2 votes for Alpha vs 1 for Zeta
  end

  def test_curated_terms_are_present_even_without_matching_csv_data
    write_csv('a.csv', %w[X_eng X_fra], ['"Grant"', '"Subvention"'])

    command.call([])

    terms = YAML.load_file(@out_path)
    assert_equal 'Crédit', terms['Vote']
  end

  def test_blank_or_mismatched_pairs_are_skipped
    write_csv(
      'a.csv',
      %w[X_eng X_fra],
      ['""', '"Something"'],
      ['"Something"', '""']
    )

    command.call([])

    terms = YAML.load_file(@out_path)
    assert_empty(terms.reject { |k, _| k == 'Vote' })
  end

  def test_files_with_no_eng_fra_pairs_are_skipped_without_error
    write_csv('a.csv', %w[Foo Bar], %w[1 2])

    assert_equal 0, command.call([])
  end

  def test_missing_source_directory_returns_error
    command = PbCli::Commands::HarvestGlossary.new(open_tables_dir: File.join(@dir, 'nope'), out_path: @out_path)
    assert_equal 1, command.call([])
  end

  def test_source_flag_overrides_the_default_directory
    other_dir = File.join(@dir, 'other')
    FileUtils.mkdir_p(other_dir)
    File.write(File.join(other_dir, 'a.csv'), "X_eng,X_fra\n\"Grant\",\"Subvention\"")

    command = PbCli::Commands::HarvestGlossary.new(open_tables_dir: @source_dir, out_path: @out_path)
    assert_equal 0, command.call(['--source', other_dir])

    terms = YAML.load_file(@out_path)
    assert_equal 'Subvention', terms['Grant']
  end
end
