require 'test_helper'
require 'pb_cli/prose/lint'

class TestProseLint < Minitest::Test
  def test_clean_prose_with_supported_placeholders_passes
    text = '{{name}} spent {{totalSpending}}, or {{percentageOfFederal}} of federal spending.'
    assert_empty PbCli::Prose::Lint.check(text)
    assert PbCli::Prose::Lint.clean?(text)
  end

  def test_rejects_a_literal_dollar_figure
    violations = PbCli::Prose::Lint.check('The department spent $4.2 million on X.')
    assert(violations.any? { |v| v.include?('dollar figure') })
  end

  def test_rejects_a_literal_percentage
    violations = PbCli::Prose::Lint.check('This represents 12% of the total.')
    assert(violations.any? { |v| v.include?('percentage') })
  end

  def test_dollar_sign_not_followed_by_a_digit_is_allowed
    # The rule specifically targets "$" immediately followed by a digit, not
    # any mention of the word "dollar" or a stray "$" symbol.
    assert_empty PbCli::Prose::Lint.check('Program code $A covers general operations.')
  end

  def test_rejects_unsupported_placeholder_tokens
    violations = PbCli::Prose::Lint.check('The top program is {{topProgram.name}}.')
    assert(violations.any? { |v| v.include?('unsupported placeholder') })
  end

  def test_figures_inside_supported_placeholders_are_not_flagged
    # A percentage-looking substring INSIDE a placeholder token must not trip
    # the percent/dollar regexes once placeholders are scrubbed.
    text = 'Spending reached {{totalSpending}} ({{percentageOfFederal}}).'
    assert_empty PbCli::Prose::Lint.check(text)
  end

  def test_multiple_violations_are_all_reported
    violations = PbCli::Prose::Lint.check('It cost $5 million, about 3% of the budget, via {{bogus}}.')
    assert_equal 3, violations.size
  end

  def test_supported_section_tokens_pass
    text = <<~PROSE
      {{name}} is a department.

      {{section:stats}}

      It spent {{totalSpending}}.

      {{section:miniSankey}}

      {{section:entities}}

      {{section:historicalShare}}

      {{section:lineItems}}
    PROSE
    assert_empty PbCli::Prose::Lint.check(text)
    assert PbCli::Prose::Lint.clean?(text)
  end

  def test_rejects_unknown_section_token
    violations = PbCli::Prose::Lint.check("Intro.\n\n{{section:bogusChart}}\n\nMore.")
    assert(violations.any? { |v| v.include?('unknown section token') && v.include?('bogusChart') })
  end

  def test_section_token_is_not_flagged_as_unsupported_placeholder
    # A section token must be validated by the section rule, never mistaken for
    # a figure placeholder like {{topProgram.name}}.
    violations = PbCli::Prose::Lint.check('Intro.

{{section:miniSankey}}')
    refute(violations.any? { |v| v.include?('unsupported placeholder') })
  end

  def test_section_token_does_not_trip_figure_checks
    assert_empty PbCli::Prose::Lint.check("Intro paragraph.\n\n{{section:stats}}\n\n{{section:lineItems}}")
  end
end
