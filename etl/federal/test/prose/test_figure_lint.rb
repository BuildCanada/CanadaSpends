require 'test_helper'
require 'pb_cli/prose/figure_lint'

class TestProseFigureLint < Minitest::Test
  FL = PbCli::Prose::FigureLint

  def test_dollar_figure_matching_a_reference_is_clean
    body = 'The department spent $16.8 billion this year.'
    assert_empty FL.check_body(body, dollar_refs: [16.80193], percent_refs: [], lang: 'en')
  end

  def test_dollar_figure_matching_no_reference_is_flagged
    body = 'Total federal spending was $513.9 billion.'
    violations = FL.check_body(body, dollar_refs: [521.425], percent_refs: [], lang: 'en')
    assert_equal 1, violations.size
    assert_includes violations.first, '$513.9 billion'
  end

  def test_percentage_matching_no_reference_is_flagged
    body = '55.2% of spending went to salaries.'
    violations = FL.check_body(body, dollar_refs: [], percent_refs: [35.086], lang: 'en')
    assert_equal 1, violations.size
    assert_includes violations.first, '55.2%'
  end

  def test_percentage_matching_a_reference_is_clean
    body = '35.1% of spending went to salaries.'
    assert_empty FL.check_body(body, dollar_refs: [], percent_refs: [35.086], lang: 'en')
  end

  def test_rounding_tolerance_admits_a_rounded_figure
    # "$0.8 billion" must match a reference anywhere in [0.75, 0.85).
    assert_empty FL.check_body('CATSA spent $0.8 billion.', dollar_refs: [0.804], percent_refs: [], lang: 'en')
  end

  def test_french_de_dollars_figure_is_extracted
    body = 'Le ministère a dépensé 513,9 milliards de dollars.'
    violations = FL.check_body(body, dollar_refs: [521.425], percent_refs: [], lang: 'fr')
    assert_equal 1, violations.size
  end

  def test_french_non_dollar_count_is_ignored
    # "2 milliards d'arbres" (2 billion trees) is not a dollar figure.
    body = "Le programme vise 2 milliards d'arbres."
    assert_empty FL.check_body(body, dollar_refs: [], percent_refs: [], lang: 'fr')
  end

  def test_french_millions_scaled_to_billions
    body = 'Un poste de 500 millions de dollars.'
    assert_empty FL.check_body(body, dollar_refs: [0.5], percent_refs: [], lang: 'fr')
  end

  def test_allowlisted_figure_is_exempt
    body = 'CRA oversees tax revenues totaling $379 billion annually.'
    allow = [{ 'type' => '$', 'value' => 379 }]
    assert_empty FL.check_body(body, dollar_refs: [16.8], percent_refs: [], lang: 'en', allow: allow)
  end

  def test_audit_comment_and_placeholders_are_stripped
    text = <<~PROSE
      ---
      reviewed: true
      ---

      The department spent {{totalSpending}}, or {{percentageOfFederal}} of federal spending.

      <!--
      Old literal $999.9 billion retained here in the comment only.
      -->
    PROSE
    body = FL.strip_body(text)
    refute_includes body, '999.9'
    refute_includes body, 'totalSpending'
    assert_empty FL.check_body(body, dollar_refs: [], percent_refs: [], lang: 'en')
  end

  def test_reviewed_detects_true_even_with_unquoted_date_source
    text = "---\nreviewed: true\nsource: 2026-07-06\n---\n\nBody."
    assert FL.reviewed?(text)
  end

  def test_reviewed_false_when_key_absent
    text = "---\nsource: hand-written\n---\n\nBody."
    refute FL.reviewed?(text)
  end
end
