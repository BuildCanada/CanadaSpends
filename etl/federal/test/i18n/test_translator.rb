require 'test_helper'
require 'fileutils'
require 'json'
require 'pb_cli/i18n/glossary'
require 'pb_cli/i18n/translator'
require 'tmpdir'

# Injectable stand-in for PbCli::ClaudeClient (spec: "stubbed API client...
# tests never hit the network"). Records every prompt it was called with and
# returns a canned JSON translation map.
class FakeClaudeClient
  attr_reader :calls, :last_usage

  def initialize(&responder)
    @calls = []
    @responder = responder || ->(_system, _user) { '{}' }
    @last_usage = { 'input_tokens' => 10, 'output_tokens' => 5 }
  end

  def complete(system:, user:, max_tokens: 8000)
    @calls << { system: system, user: user, max_tokens: max_tokens }
    @responder.call(system, user)
  end
end

class TestI18nTranslator < Minitest::Test
  def setup
    @dir = Dir.mktmpdir
    FileUtils.mkdir_p(File.join(@dir, 'departments'))
    @template = "GLOSSARY:\n{{GLOSSARY}}\n\nITEMS:\n{{ITEMS}}"
  end

  def teardown
    FileUtils.rm_rf(@dir)
  end

  def write_sankey(nodes)
    # No revenue_data node -- keeps each test's item set limited to exactly
    # what `nodes` declares, so LLM-call assertions aren't perturbed by an
    # incidental second translatable item.
    File.write(File.join(@dir, 'sankey.json'), JSON.generate(spending_data: nodes, revenue_data: nil))
  end

  def test_glossary_hits_never_call_the_llm
    write_sankey(id: 'spending', name: 'Spending', children: [{ id: 'grants-node', name: 'Grant' }])
    glossary = PbCli::I18n::Glossary.new('Grant' => 'Subvention', 'Spending' => 'Dépenses')
    client = FakeClaudeClient.new { raise 'should not be called' }

    translator = PbCli::I18n::Translator.new(year_dir: @dir, glossary: glossary, client: client, prompt_template: @template)
    result = translator.run

    assert_equal 2, result.glossary_count # "Spending" (root node) + "Grant"
    assert_equal 0, result.llm_count
    assert_empty client.calls

    fr = JSON.parse(File.read(File.join(@dir, 'i18n', 'fr.json')))
    assert_equal 'Subvention', fr['grants-node']
  end

  def test_remaining_items_are_batched_to_the_llm_and_parsed
    write_sankey(id: 'spending', name: 'Spending', children: [{ id: 'leaf', name: 'Employment + Training' }])
    glossary = PbCli::I18n::Glossary.new({})
    client = FakeClaudeClient.new { |_s, _u| JSON.generate('leaf' => 'Emploi et formation') }

    translator = PbCli::I18n::Translator.new(year_dir: @dir, glossary: glossary, client: client, prompt_template: @template)
    result = translator.run

    assert_equal 1, result.llm_count
    assert_equal 1, client.calls.size
    assert_includes client.calls.first[:user], 'Employment + Training'

    fr = JSON.parse(File.read(File.join(@dir, 'i18n', 'fr.json')))
    assert_equal 'Emploi et formation', fr['leaf']
  end

  def test_llm_response_wrapped_in_a_markdown_fence_is_still_parsed
    write_sankey(id: 'spending', name: 'Spending', children: [{ id: 'leaf', name: 'Housing' }])
    client = FakeClaudeClient.new { |_s, _u| "```json\n#{JSON.generate('leaf' => 'Logement')}\n```" }

    translator = PbCli::I18n::Translator.new(year_dir: @dir, glossary: PbCli::I18n::Glossary.new({}), client: client, prompt_template: @template)
    result = translator.run

    assert_equal 1, result.llm_count
    fr = JSON.parse(File.read(File.join(@dir, 'i18n', 'fr.json')))
    assert_equal 'Logement', fr['leaf']
  end

  def test_incremental_unchanged_source_text_is_not_retranslated
    write_sankey(id: 'spending', name: 'Spending', children: [{ id: 'leaf', name: 'Housing' }])
    calls = 0
    client = FakeClaudeClient.new do |_s, _u|
      calls += 1
      JSON.generate('leaf' => 'Logement')
    end
    glossary = PbCli::I18n::Glossary.new('Spending' => 'Dépenses')

    PbCli::I18n::Translator.new(year_dir: @dir, glossary: glossary, client: client, prompt_template: @template).run
    assert_equal 1, calls

    # Re-run against the same unchanged source text: no new LLM call.
    result = PbCli::I18n::Translator.new(year_dir: @dir, glossary: glossary, client: client, prompt_template: @template).run
    assert_equal 1, calls
    assert_equal 2, result.cache_hit_count # "spending" (glossary-resolved) + "leaf" (LLM-resolved), both unchanged
    assert_equal 0, result.llm_count
  end

  def test_incremental_changed_source_text_is_retranslated
    write_sankey(id: 'spending', name: 'Spending', children: [{ id: 'leaf', name: 'Housing' }])
    responses = ['Logement', 'Logement et infrastructure']
    client = FakeClaudeClient.new { |_s, _u| JSON.generate('leaf' => responses.shift) }
    glossary = PbCli::I18n::Glossary.new({})

    PbCli::I18n::Translator.new(year_dir: @dir, glossary: glossary, client: client, prompt_template: @template).run

    # Change the English source text for the same id.
    write_sankey(id: 'spending', name: 'Spending', children: [{ id: 'leaf', name: 'Housing Assistance' }])
    result = PbCli::I18n::Translator.new(year_dir: @dir, glossary: glossary, client: client, prompt_template: @template).run

    assert_equal 1, result.llm_count
    fr = JSON.parse(File.read(File.join(@dir, 'i18n', 'fr.json')))
    assert_equal 'Logement et infrastructure', fr['leaf']
  end

  def test_output_is_sorted_by_key_for_deterministic_diffs
    write_sankey(id: 'spending', name: 'Spending', children: [
                   { id: 'zzz', name: 'Zed' },
                   { id: 'aaa', name: 'Ay' }
                 ])
    glossary = PbCli::I18n::Glossary.new('Zed' => 'Zède', 'Ay' => 'Ay-fr')

    PbCli::I18n::Translator.new(year_dir: @dir, glossary: glossary, client: FakeClaudeClient.new, prompt_template: @template).run

    raw = File.read(File.join(@dir, 'i18n', 'fr.json'))
    assert raw.index('"aaa"') < raw.index('"zzz"')
  end

  def test_a_failed_llm_batch_does_not_raise_and_leaves_the_id_untranslated
    write_sankey(id: 'spending', name: 'Spending', children: [{ id: 'leaf', name: 'Housing' }])
    client = FakeClaudeClient.new { |_s, _u| raise 'boom' }
    glossary = PbCli::I18n::Glossary.new('Spending' => 'Dépenses')

    result = PbCli::I18n::Translator.new(year_dir: @dir, glossary: glossary, client: client, prompt_template: @template).run

    assert_equal 1, result.untranslated_count
    fr = JSON.parse(File.read(File.join(@dir, 'i18n', 'fr.json')))
    refute fr.key?('leaf')
  end
end
