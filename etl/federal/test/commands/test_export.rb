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

    # Published FY2024 Consolidated Statement of Operations (cdeif-tycfi CSVs):
    # total expenses INCLUDING net actuarial losses = 513,936 + 7,489 =
    # 521,425M; total revenues = 459,549M. (The retired 513.94/459.53 anchor
    # excluded net actuarial losses — source-correction, see the parity report.)
    assert_in_delta 521.425, summary['totalSpending'], 0.5
    assert_in_delta 459.549, summary['totalRevenue'], 0.5
    assert_equal 'vol1_consolidated', summary['basis']
    assert_equal 2025, summary['inflation']['baseYear']
  end

  # The deficit field is the published "Annual operating deficit" line, sign
  # convention positive = deficit / negative = surplus, and identically equals
  # totalSpending - totalRevenue.
  def test_summary_deficit_is_published_operating_deficit
    @command.call(['--year', '2024'])
    summary = JSON.parse(File.read(File.join(@out, '2024', 'summary.json')))

    # Published FY2024 Annual operating deficit = 61,876M ($61.876B), a deficit.
    assert_in_delta 61.876, summary['deficit'], 0.001
    assert_in_delta summary['totalSpending'] - summary['totalRevenue'],
                    summary['deficit'], 0.001
    assert_operator summary['deficit'], :>, 0, 'FY2024 is a deficit (positive)'
  end

  # Sign convention exercised at the low end of the series. FY2015 is the
  # SMALLEST deficit in 2014–2025 but is still a deficit ($0.55B) on the
  # published operating basis: revenues 279,905M vs expenses-incl-net-actuarial
  # 280,455M (Annual operating deficit line = -550M). On the OLD basis that
  # excluded net actuarial losses FY2015 read as a $7.0B surplus; including the
  # $7.6B actuarial loss (the point of this change) flips it to a small deficit.
  # No fiscal year 2014–2025 is a surplus on the published operating basis, so
  # the "Surplus" StatCard branch (deficit < 0) is not triggered by this data.
  def test_fy2015_deficit_sign_smallest_deficit_not_surplus
    @command.call(['--year', '2015'])
    summary = JSON.parse(File.read(File.join(@out, '2015', 'summary.json')))

    assert_in_delta 0.550, summary['deficit'], 0.001
    assert_operator summary['deficit'], :>, 0,
                    'FY2015 is a small deficit on the published operating basis, not a surplus'
    assert_in_delta summary['totalSpending'] - summary['totalRevenue'],
                    summary['deficit'], 0.001
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

  # The spending Sankey's declared total AND its leaf sum must equal
  # summary.totalSpending exactly — enforced by the top-level
  # accounting-basis-adjustments reconciling leaf (spec §5). For FY2024 the
  # leaf ≈ -25.85B (the thematic tree, mixing Vol II gross + Vol I items, sums
  # to ~547.3B; the leaf brings it down to the published 521.425B). This leaf
  # also equals reconciliation.json's unattributed remainder item.
  def test_spending_tree_sums_to_headline_via_adjustments_leaf
    @command.call(['--year', '2024'])
    summary = JSON.parse(File.read(File.join(@out, '2024', 'summary.json')))
    sankey = JSON.parse(File.read(File.join(@out, '2024', 'sankey.full.json')))
    recon = JSON.parse(File.read(File.join(@out, '2024', 'reconciliation.json')))
    tree = sankey['spending_data']

    assert_in_delta summary['totalSpending'], sankey['spending'], 0.001
    assert_in_delta summary['totalSpending'], leaf_sum(tree), 0.001

    leaf = node(tree, 'accounting-basis-adjustments')
    refute_nil leaf, 'reconciling leaf present'
    assert_equal 'Accounting and consolidation adjustments', leaf['name']
    assert_in_delta(-25.854, leaf['amount'], 0.01)

    remainder = recon['items'].find { |i| i['id'] == 'recon-2024-remainder' }
    assert_in_delta leaf['amount'], remainder['amount'], 0.001,
                    'adjustments leaf == reconciliation remainder (spec §5 link)'
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

  # miniSankey is the standard-object breakdown (spec §B, acceptance #1):
  # department → organization → standard-object leaves, with negative external
  # + internal revenue leaves, matching the old production chart's shape.
  def test_mini_sankey_is_standard_object_breakdown
    @command.call(['--year', '2024'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'national-defence.json')))

    assert_equal 'standard_object', dept['miniSankey']['breakdown']
    dnd = mini_org(dept, 'Department of National Defence')
    leaves = dnd['children']
    by_name = leaves.to_h { |l| [l['name'], l['amount']] }

    # The old chart's headline objects (verified against the meso 2024 edition).
    assert_in_delta 15.741, by_name['Personnel'], 0.01
    assert_in_delta 5.602, by_name['Professional and special services'], 0.01
    assert_in_delta 5.072, by_name['Acquisition of machinery and equipment'], 0.01

    # External AND internal revenues survive as NEGATIVE leaves (never rolled
    # into "Other" by truncation).
    assert_operator by_name['External revenues'], :<, 0, 'external revenues are a negative leaf'
    assert_operator by_name['Internal revenues'], :<, 0, 'internal revenues are a negative leaf'

    # Ids are stable/deterministic and label-independent.
    personnel = leaves.find { |l| l['name'] == 'Personnel' }
    assert_equal 'national-defence-2024-department-of-national-defence-obj-1', personnel['id']
    refute(leaves.any? { |l| l['name'] =~ /\AVote \d+\z/ }, 'no vote-named leaves remain')
  end

  # Parents carry no amount (D3 double-counting contract); leaves only.
  def test_mini_sankey_parents_carry_no_amount
    @command.call(['--year', '2024'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'national-defence.json')))
    tree = dept['miniSankey']['spending_data']

    assert_equal 'national-defence', tree['id']
    assert_no_parent_amounts(tree)
    dnd = mini_org(dept, 'Department of National Defence')
    assert(dnd['children'].all? { |leaf| leaf.key?('amount') }, 'object/revenue leaves carry amounts')
  end

  # RDA reattribution (spec §B): PacifiCan / FedDev / CanNor / etc. land in the
  # regional-economic-development portfolio, not their host portfolio, via the
  # organization-override path extended to the meso dataset.
  def test_mini_sankey_reattributes_regional_agencies
    @command.call(['--year', '2024'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'regional-economic-development.json')))
    orgs = dept['miniSankey']['spending_data']['children'].map { |o| o['name'] }

    assert_includes orgs, 'Pacific Economic Development Agency of Canada'
    assert_includes orgs, 'Canadian Northern Economic Development Agency'
    assert_includes orgs, 'Economic Development Agency of Canada for the Regions of Quebec'
  end

  # Reconciliation: within-tolerance department-years produce no note; the
  # standard-object gross tracks Vol II allotment expenditures. National
  # Defence FY2024 reconciles essentially exactly (allotment == gross).
  def test_mini_sankey_reconciles_to_allotment_within_tolerance
    @command.call(['--year', '2024'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'national-defence.json')))
    tree = dept['miniSankey']['spending_data']

    # Sum of positive object leaves = gross; add back the negative revenue
    # leaves to compare against the reported (allotment) department total.
    gross = leaf_sum_positive(tree)
    assert_in_delta dept['totalSpending'], gross, 0.02 * dept['totalSpending'],
                    'standard-object gross reconciles to allotment total within 2%'
  end

  # 2020-2021 editions mislabel Shared Services Canada under a gn-dg noise
  # code; it must land in the PSPC portfolio, leaving the Governor General
  # page at its true ~$25M scale (confirmed by Vol II Table 3).
  def test_shared_services_gn_dg_noise_routes_to_pspc
    @command.call(['--year', '2021'])
    gg = JSON.parse(File.read(File.join(@out, '2021', 'departments', 'governor-general.json')))
    pspc = JSON.parse(File.read(File.join(@out, '2021', 'departments', 'public-services-and-procurement-canada.json')))

    assert_operator gg['totalSpending'], :<, 0.05, 'GG stays at office scale, not $3B'
    refute(gg['entities'].any? { |e| e['name'] =~ /Shared Services/ })
    assert(pspc['entities'].any? { |e| e['name'] =~ /Shared Services/ }, 'SSC lands in PSPC')
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

    # Net actuarial losses now sit under the Obligations theme, sign-normalized
    # to a POSITIVE expense. Published FY2024 statement stores the line as
    # -7,489M (a $7.489B loss); the exporter negates it to +7.489B so it reads
    # as a cost alongside net interest on debt.
    actuarial = leaf_sum(node(tree, 'net-actuarial-losses'))
    assert_in_delta(7.489, actuarial, 0.01, 'net actuarial losses normalized to a positive expense')
  end

  def test_offsets_keep_social_security_at_published_scale
    @command.call(['--year', '2024'])
    tree = JSON.parse(File.read(File.join(@out, '2024', 'sankey.full.json')))['spending_data']

    assert_in_delta 120.24, leaf_sum(node(tree, 'social-security')), 0.5
    # Obligations now = net interest on debt (47.273) + net actuarial losses
    # (7.489) = 54.762 (published FY2024 debt charges + actuarial loss).
    assert_in_delta 54.762, leaf_sum(node(tree, 'obligations')), 0.1
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

  # The miniSankey organization node with the given display name.
  def mini_org(dept, org_name)
    dept['miniSankey']['spending_data']['children'].find { |o| o['name'] == org_name }
  end

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

  # Sum of positive leaf amounts only (the standard-object gross, ignoring the
  # negative revenue leaves).
  def leaf_sum_positive(node)
    children = node['children']
    return [node['amount'] || 0, 0].max if children.nil? || children.empty?

    children.sum { |c| leaf_sum_positive(c) }
  end

  def assert_no_parent_amounts(node)
    children = node['children']
    return if children.nil? || children.empty?

    refute node.key?('amount'), "parent #{node['id']} must not carry an amount"
    children.each { |c| assert_no_parent_amounts(c) }
  end
end
