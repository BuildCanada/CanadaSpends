require 'test_helper'
require 'pb_cli/commands/export'
require 'json'
require 'fileutils'

class TestExport < Minitest::Test
  def setup
    @out = File.join(Dir.pwd, 'tmp', 'test', 'export_out')
    FileUtils.rm_rf(@out)
    @errors_path = File.join(Dir.pwd, 'tmp', 'test', 'export_errors.md')
    @command = PbCli::Commands::Export.new(
      out_dir: @out, errors_path: @errors_path, timestamp: '2026-01-01T00:00:00Z'
    )
  end

  def teardown
    FileUtils.rm_rf(File.join(Dir.pwd, 'tmp', 'test'))
  end

  def test_export_single_year_writes_contract_files
    assert_equal 0, @command.call(['--year', '2024'])

    %w[summary.json sankey.json sankey.full.json reconciliation.json i18n/fr.json].each do |f|
      assert File.exist?(File.join(@out, '2024', f)), "expected #{f}"
    end
    assert File.exist?(File.join(@out, 'index.json'))
    assert File.exist?(File.join(@out, '2024', 'departments', 'national-defence.json'))
  end

  def test_summary_headline_matches_published_vol1_totals
    @command.call(['--year', '2024'])
    summary = JSON.parse(File.read(File.join(@out, '2024', 'summary.json')))

    assert_in_delta 513.94, summary['totalSpending'], 0.5
    assert_in_delta 459.53, summary['totalRevenue'], 0.5
    assert_equal 'vol1_consolidated', summary['basis']
    assert_equal 2025, summary['inflation']['baseYear']
  end

  def test_sankey_amounts_are_leaf_only_and_sum_to_declared_totals
    @command.call(['--year', '2024'])
    data = JSON.parse(File.read(File.join(@out, '2024', 'sankey.full.json')))

    assert_equal 'spending', data['spending_data']['id']
    assert_equal 'revenue', data['revenue_data']['id']
    # D3 hierarchy().sum() adds a parent's own amount to its descendants', so
    # emitted parents must carry no amount and leaf sums must equal the
    # declared totals (the provincial sankey.json contract).
    assert_no_parent_amounts(data['spending_data'])
    assert_no_parent_amounts(data['revenue_data'])
    assert_in_delta data['spending'], leaf_sum(data['spending_data']), 0.001
    assert_in_delta data['revenue'], leaf_sum(data['revenue_data']), 0.001
  end

  def test_department_shapes_and_units
    @command.call(['--year', '2024'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'national-defence.json')))

    assert_equal 'vol2_appropriations', dept['basis']
    assert_equal 'dollars_cad', dept['lineItemsUnits']
    assert dept['votes'].first['used'].is_a?(Integer), 'votes in whole dollars'
    assert dept['transferPayments'].all? { |tp| tp['id'] }, 'transfer payments carry ids'
    # Vote label/description split survives the non-breaking-space separator.
    assert dept['votes'].any? { |v| v['vote'] =~ /\AVote \d+\z/ && !v['description'].empty? },
           'at least one vote has a clean "Vote N" label + non-empty description'
    # historicalShare is expressed in percent, not fraction
    assert(dept['historicalShare'].all? { |p| p['percentage'] > 0.1 })
  end

  def test_output_is_deterministic
    @command.call(['--year', '2024'])
    first = File.read(File.join(@out, '2024', 'sankey.json'))
    second_out = File.join(Dir.pwd, 'tmp', 'test', 'export_out2')
    PbCli::Commands::Export.new(out_dir: second_out, errors_path: @errors_path,
                                timestamp: '2026-01-01T00:00:00Z').call(['--year', '2024'])
    assert_equal first, File.read(File.join(second_out, '2024', 'sankey.json'))
  end

  # Wave 2.5 statutory-breakout parity anchors (FY2024, $B). These pin the
  # vol1-offset mechanism: statutory items lumped inside Vol II "Statutory
  # amounts" rows are re-sourced from Vol I and offset against the catch-alls.
  def test_statutory_breakout_matches_vol1_statement
    @command.call(['--year', '2024'])
    tree = JSON.parse(File.read(File.join(@out, '2024', 'sankey.full.json')))['spending_data']

    assert_in_delta 76.036, leaf_sum(node(tree, 'retirement-benefits')), 0.01, 'OAS/GIS from Vol I'
    assert_in_delta 47.273, leaf_sum(node(tree, 'net-interest-on-debt')), 0.01, 'public debt charges from Vol I'

    cht = node(tree, 'health-transfer')
    assert_in_delta 49.431, leaf_sum(cht), 0.01, 'CHT scaled to the statement line'
    assert_operator cht['children'].length, :>=, 10, 'province children emitted'

    residual = leaf_sum(node(tree, 'other-major-transfers'))
    assert_operator residual, :>, 0, 'Finance catch-all must stay positive after offsets'
    assert_operator residual, :<, 20, 'Finance catch-all is a residual, not the full lump'

    actuarial = leaf_sum(node(tree, 'net-actuarial-losses'))
    assert_in_delta(-7.489, actuarial, 0.01, 'actuarial sign follows the statement (gain year)')
  end

  def test_offsets_keep_social_security_at_published_scale
    @command.call(['--year', '2024'])
    tree = JSON.parse(File.read(File.join(@out, '2024', 'sankey.full.json')))['spending_data']

    assert_in_delta 120.24, leaf_sum(node(tree, 'social-security')), 0.5
    assert_in_delta 47.27, leaf_sum(node(tree, 'obligations')), 0.1
  end

  def test_excluded_year_reported_and_others_ship
    assert_equal 0, @command.call(['--all-years'])
    index = JSON.parse(File.read(File.join(@out, 'index.json')))
    assert_includes index['years'], 2024
    assert_includes index['years'], 2025
    refute_includes index['years'], 2013 # no Vol I edition available
    assert File.exist?(@errors_path)
  end

  private

  def node(tree, id)
    return tree if tree['id'] == id

    (tree['children'] || []).each do |c|
      found = node(c, id)
      return found if found
    end
    nil
  end

  # Subtotal as the D3 renderer computes it: sum of leaf amounts.
  def leaf_sum(node)
    children = node['children']
    return node['amount'] || 0 if children.nil? || children.empty?

    children.sum { |c| leaf_sum(c) }
  end

  def assert_no_parent_amounts(node)
    children = node['children']
    return if children.nil? || children.empty?

    refute node.key?('amount'), "parent #{node['id']} must not carry an amount"
    children.each { |c| assert_no_parent_amounts(c) }
  end
end
