require 'test_helper'
require 'pb_cli/prose/generator'

class FakeProseClient
  def initialize(prose:, verification: 'No unsupported claims found.')
    @prose = prose
    @verification = verification
    @prose_calls = []
    @verify_calls = []
  end

  attr_reader :prose_calls, :verify_calls

  def complete(system:, user:, max_tokens: 8000)
    if system.include?('fact-check')
      @verify_calls << { system: system, user: user }
      @verification
    else
      @prose_calls << { system: system, user: user }
      @prose
    end
  end
end

class TestProseGenerator < Minitest::Test
  def department
    {
      'name' => 'Transport',
      'slug' => 'transport-canada',
      'financialYearEnding' => 2025,
      'totalSpending' => 6.02,
      'percentageOfFederal' => 1.11,
      'entities' => [{ 'id' => 'e1', 'name' => 'Department of Transport', 'value' => 3.7 }],
      'votes' => [{ 'id' => 'v1', 'vote' => 'Vote 1', 'description' => 'Operating expenditures', 'used' => 1_000 }],
      'transferPayments' => [
        { 'id' => 't1', 'category' => 'Grant', 'description' => 'Airport program', 'used' => 500 }
      ]
    }
  end

  def summary
    { 'financialYear' => '2024-25', 'totalSpending' => 543.28 }
  end

  def templates
    { prose: '{{CONTEXT}}', verify: "{{CONTEXT}}\n{{PROSE}}" }
  end

  def test_generate_builds_markdown_with_unreviewed_frontmatter_and_verification_block
    client = FakeProseClient.new(prose: '{{name}} spent {{totalSpending}}, or {{percentageOfFederal}} of federal spending.')
    generator = PbCli::Prose::Generator.new(client: client, prose_template: templates[:prose], verify_template: templates[:verify])

    markdown = generator.generate(department: department, summary: summary)

    assert_match(/\A---\nreviewed: false\n---\n/, markdown)
    assert_includes markdown, '{{totalSpending}}'
    assert_includes markdown, 'VERIFICATION'
    assert_includes markdown, 'No unsupported claims found.'
  end

  def test_generate_raises_lint_failure_on_a_literal_dollar_figure
    client = FakeProseClient.new(prose: 'The department spent $6.0 million this year.')
    generator = PbCli::Prose::Generator.new(client: client, prose_template: templates[:prose], verify_template: templates[:verify])

    error = assert_raises(PbCli::Prose::Generator::LintFailure) do
      generator.generate(department: department, summary: summary)
    end
    assert_includes error.message, 'transport-canada'
  end

  def test_lint_failure_skips_the_verification_call_entirely
    client = FakeProseClient.new(prose: 'This mentions 12% with no placeholders at all.')
    generator = PbCli::Prose::Generator.new(client: client, prose_template: templates[:prose], verify_template: templates[:verify])

    assert_raises(PbCli::Prose::Generator::LintFailure) { generator.generate(department: department, summary: summary) }
    assert_empty client.verify_calls
  end

  def test_prompt_assembly_injects_only_that_departments_json_context
    client = FakeProseClient.new(prose: '{{name}} is described here.')
    generator = PbCli::Prose::Generator.new(client: client, prose_template: templates[:prose], verify_template: templates[:verify])

    generator.generate(department: department, summary: summary)

    prompt = client.prose_calls.first[:user]
    assert_includes prompt, 'Department of Transport'
    assert_includes prompt, 'Airport program'
    assert_includes prompt, '"financialYear": "2024-25"'
    refute_includes prompt, 'CONTEXT}}' # the template placeholder itself must be substituted
  end

  def test_verification_prompt_receives_both_context_and_the_generated_prose
    client = FakeProseClient.new(prose: '{{name}} is described here.', verification: 'Flagged: "described here" is vague.')
    generator = PbCli::Prose::Generator.new(client: client, prose_template: templates[:prose], verify_template: templates[:verify])

    markdown = generator.generate(department: department, summary: summary)

    verify_prompt = client.verify_calls.first[:user]
    assert_includes verify_prompt, 'Department of Transport'
    assert_includes verify_prompt, '{{name}} is described here.'
    assert_includes markdown, 'Flagged: "described here" is vague.'
  end
end
