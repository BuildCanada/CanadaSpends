require 'test_helper'
require 'pb_cli/i18n/glossary'
require 'tmpdir'

class TestI18nGlossary < Minitest::Test
  def setup
    @glossary = PbCli::I18n::Glossary.new(
      'Grant' => 'Subvention',
      'Statutory amounts' => 'Montants législatifs',
      'Transport' => 'Transports',
      'Vote' => 'Crédit'
    )
  end

  def test_exact_match_resolves
    assert_equal 'Subvention', @glossary.translate('Grant')
  end

  def test_case_normalized_match_resolves_when_casing_differs
    assert_equal 'Subvention', @glossary.translate('grant')
    assert_equal 'Subvention', @glossary.translate('GRANT')
  end

  def test_surrounding_whitespace_is_stripped_before_matching
    assert_equal 'Montants législatifs', @glossary.translate('  Statutory amounts  ')
  end

  def test_unknown_text_returns_nil_so_the_caller_falls_back_to_the_llm_pass
    assert_nil @glossary.translate('Something not in the glossary')
  end

  def test_nil_and_blank_input_return_nil
    assert_nil @glossary.translate(nil)
    assert_nil @glossary.translate('   ')
  end

  def test_vote_n_expands_via_the_base_vote_term
    assert_equal 'Crédit 1', @glossary.translate('Vote 1')
    assert_equal 'Crédit 10', @glossary.translate('Vote 10')
  end

  def test_vote_n_has_no_translation_when_the_glossary_lacks_a_base_vote_term
    glossary = PbCli::I18n::Glossary.new('Grant' => 'Subvention')
    assert_nil glossary.translate('Vote 1')
  end

  def test_size_reports_the_number_of_loaded_terms
    assert_equal 4, @glossary.size
  end

  def test_load_returns_an_empty_glossary_when_the_file_is_absent
    glossary = PbCli::I18n::Glossary.load('/no/such/file.yaml')
    assert_equal 0, glossary.size
    assert_nil glossary.translate('Grant')
  end

  def test_load_reads_terms_from_an_existing_yaml_file
    Dir.mktmpdir do |dir|
      path = File.join(dir, 'glossary.yaml')
      File.write(path, { 'Grant' => 'Subvention' }.to_yaml)

      glossary = PbCli::I18n::Glossary.load(path)
      assert_equal 'Subvention', glossary.translate('Grant')
    end
  end
end
