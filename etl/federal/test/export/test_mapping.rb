require 'test_helper'
require 'pb_cli/export/mapping'
require 'fileutils'

class TestExportMapping < Minitest::Test
  def setup
    @dir = File.join(Dir.pwd, 'tmp', 'test', 'mapping')
    FileUtils.mkdir_p(@dir)
    @slugs_path = File.join(@dir, 'slugs.yaml')
    @tree_path = File.join(@dir, 'tree.yaml')

    File.write(@slugs_path, <<~YAML)
      portfolios:
        - slug: finance
          name_en: Finance
          ministries: [Finance]
          codes: [fin]
        - slug: defence
          name_en: National Defence
          ministries: [National Defence]
          codes: [mdn-dnd]
      organization_overrides:
        - organization: Roaming Agency
          slug: defence
      transfer_reattributions:
        - slug: defence
          host_ministries:
            - Finance
          description_patterns:
            - Roaming (Program|Initiative)
      overrides:
        - code: mdn-dnd
          slug: defence
        - code: ic
          years: [2016]
          slug: finance
    YAML

    File.write(@tree_path, <<~YAML)
      unassigned_policy: fail
      themes:
        - id: root
          name_en: Root
          children:
            - id: finance-catchall
              name_en: Finance Catchall
              rules:
                - ministry: finance
            - id: interest
              name_en: Interest
              rules:
                - ministry: finance
                  line: "(?i)interest on unmatured debt"
            - id: special-org
              name_en: Special Org
              rules:
                - organization: Special Agency
            - id: defence-catchall
              name_en: Defence
              rules:
                - ministry: defence
            - id: vol1-node
              name_en: Vol1 Node
              rules:
                - source: vol1
                  vol1_hint: something
    YAML

    @mapping = PbCli::Export::Mapping.new(@slugs_path, @tree_path)
  end

  def teardown
    FileUtils.rm_rf(@dir)
  end

  def row(overrides = {})
    { 'ministry_name_normalized' => 'Finance', 'ministry_code' => 'fin',
      'organization' => 'Department of Finance', 'description' => 'Operating budget',
      'year' => 2024 }.merge(overrides)
  end

  def test_resolves_slug_by_name
    assert_equal 'finance', @mapping.resolve_slug(row)
  end

  def test_resolves_slug_by_override_code_when_name_is_noise
    r = row('ministry_name_normalized' => 'Public Accounts of Canada', 'ministry_code' => 'mdn-dnd')
    assert_equal 'defence', @mapping.resolve_slug(r)
  end

  def test_override_respects_year_scope
    matched = row('ministry_name_normalized' => nil, 'ministry_code' => 'ic', 'year' => 2016)
    assert_equal 'finance', @mapping.resolve_slug(matched)
    other = row('ministry_name_normalized' => nil, 'ministry_code' => 'ic', 'year' => 2017)
    assert_nil @mapping.resolve_slug(other)
  end

  def test_line_rule_takes_precedence_over_ministry_catchall
    r = row('description' => 'Interest on unmatured debt')
    assert_equal 'interest', @mapping.match_node(r, 'finance')
  end

  def test_organization_rule_beats_ministry_catchall
    r = row('organization' => 'Special Agency')
    assert_equal 'special-org', @mapping.match_node(r, 'finance')
  end

  def test_ministry_catchall_when_no_line_or_org_match
    assert_equal 'finance-catchall', @mapping.match_node(row, 'finance')
  end

  def test_vol1_rules_do_not_match_vol2_rows
    # vol1-node has only a source:vol1 rule; it must never be returned for a row.
    refute_equal 'vol1-node', @mapping.match_node(row('organization' => 'Nothing'), 'defence')
    assert_equal 'defence-catchall', @mapping.match_node(row('organization' => 'Nothing'), 'defence')
  end

  def test_vol1_nodes_are_collected
    assert_includes @mapping.vol1_nodes.map { |n| n['id'] }, 'vol1-node'
  end

  def test_organization_override_beats_ministry_name
    # The roaming agency sits inside the Finance ministry this year, but the
    # organization override follows it to its own portfolio.
    r = row('organization' => 'Roaming Agency')
    assert_equal 'defence', @mapping.resolve_slug(r)
  end

  def test_organization_override_ignores_blank_organizations
    assert_equal 'finance', @mapping.resolve_slug(row('organization' => ''))
    assert_equal 'finance', @mapping.resolve_slug(row('organization' => nil))
  end

  def test_transfer_reattribution_matches_host_ministry_and_pattern
    r = row('description' => 'Contributions under the Roaming Program')
    assert_equal 'defence', @mapping.transfer_reattribution_slug(r)
  end

  def test_transfer_reattribution_is_case_insensitive
    r = row('description' => 'Grants for the roaming initiative')
    assert_equal 'defence', @mapping.transfer_reattribution_slug(r)
  end

  def test_transfer_reattribution_requires_the_host_ministry
    r = row('ministry_name_normalized' => 'National Defence',
            'description' => 'Contributions under the Roaming Program')
    assert_nil @mapping.transfer_reattribution_slug(r)
  end

  def test_transfer_reattribution_returns_nil_without_a_pattern_match
    assert_nil @mapping.transfer_reattribution_slug(row('description' => 'Operating budget'))
  end
end
