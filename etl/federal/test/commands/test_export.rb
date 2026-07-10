require 'test_helper'
require 'pb_cli/commands/export'
require 'csv'
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

  # FY2024 is a Vol I accrual year (main-page-accrual-basis spec): the thematic
  # tree is re-based off Table 3.6 segment expenses and sums to the published
  # headline EXACTLY with NO "Accounting and consolidation adjustments" leaf.
  def test_accrual_year_spending_tree_sums_to_headline_without_adjustments_leaf
    @command.call(['--year', '2024'])
    summary = JSON.parse(File.read(File.join(@out, '2024', 'summary.json')))
    sankey = JSON.parse(File.read(File.join(@out, '2024', 'sankey.full.json')))
    tree = sankey['spending_data']

    assert_in_delta summary['totalSpending'], sankey['spending'], 0.001
    assert_in_delta summary['totalSpending'], leaf_sum(tree), 0.001
    assert_nil node(tree, 'accounting-basis-adjustments'),
               'no reconciling leaf in a Vol I accrual year'
  end

  # Every exported year is on the Vol I accrual basis (restatement-scaled
  # Table 3.6): the ministry list sums to the published headline and the
  # spending tree carries NO adjustments leaf, in ALL 12 years.
  def test_all_years_are_accrual_and_sum_to_headline
    assert_equal 0, @command.call(['--all-years'])
    index = JSON.parse(File.read(File.join(@out, 'index.json')))
    assert_equal (2014..2025).to_a, index['years'].sort

    index['years'].each do |year|
      summary = JSON.parse(File.read(File.join(@out, year.to_s, 'summary.json')))
      tree = JSON.parse(File.read(File.join(@out, year.to_s, 'sankey.full.json')))['spending_data']

      assert_in_delta summary['totalSpending'],
                      summary['ministries'].sum { |m| m['totalSpending'] }, 0.001,
                      "#{year} ministry list sums to headline"
      assert_in_delta summary['totalSpending'], leaf_sum(tree), 0.001,
                      "#{year} tree sums to headline"
      assert_nil node(tree, 'accounting-basis-adjustments'), "#{year} has no adjustments leaf"
      assert(summary['ministries'].any? { |m| m['basis'] == 'vol1_segment_accrual' },
             "#{year} ministry rows are accrual")
      assert(summary['ministries'].any? { |m| m['id'] == 'net-actuarial-losses' },
             "#{year} carries the actuarial statement row")
    end
  end

  # Restatement scale-factor pins. FY2024's own-vintage 3.6 edition ties to the
  # statement exactly (521,425M both sides), so the factor is 1.0. FY2016's
  # edition is pre-restatement AND predates the net-actuarial-losses split:
  # 3.6 total 296,440M vs restated statement 295,469M incl. 10,064M actuarial,
  # giving factor (295.469 − 10.064) / 296.440 = 0.96277 (carve-out 3.41% +
  # restatement 0.32%, within the 1% + carve guard).
  def test_restatement_scale_factors_pinned
    @command.call(['--year', '2024'])
    assert_in_delta 1.0, @command.segment_scales[2024][:factor], 1e-6

    @command.call(['--year', '2016'])
    scale = @command.segment_scales[2016]
    assert_in_delta 0.96277, scale[:factor], 0.0005
    assert_in_delta 0.0341, scale[:carve], 0.001, 'carve = actuarial share of total expenses'
    assert scale[:ok], 'FY2016 within the guard'
  end

  # The 1% restatement guard is export-blocking: a (doctored) 3.6 edition whose
  # totals deviate ~5% from the statement blocks the year with the delta
  # reported, rather than shipping mis-scaled figures.
  def test_scale_factor_guard_blocks_large_restatement_deltas
    fixture_dir = File.join(Dir.pwd, 'tmp', 'test', 'doctored_tables')
    FileUtils.mkdir_p(fixture_dir)
    FileUtils.cp(File.join(Dir.pwd, 'open_tables/data/cdeif-tycfi-2024.csv'), fixture_dir)
    doctor_cest(File.join(Dir.pwd, 'open_tables/data/cest-eest-2024.csv'),
                File.join(fixture_dir, 'cest-eest-2024.csv'), 1.05)

    command = PbCli::Commands::Export.new(
      out_dir: @out, errors_path: @errors_path, timestamp: '2026-01-01T00:00:00Z',
      open_tables_dir: fixture_dir
    )
    command.call(['--year', '2024'])

    refute File.exist?(File.join(@out, '2024', 'summary.json')), '2024 not shipped'
    refute command.segment_scales[2024][:ok]
    report = File.read(@errors_path)
    assert_match(/restatement scale factor .* beyond guard/, report)
  end

  # Ministry list on the accrual basis (spec §3): each ministry row is the
  # slug's Vol I accrual allocation, plus two appended non-link statement rows
  # (Net actuarial losses, Provision for valuation) so the whole list sums to
  # the published headline exactly. ISC-slug accrual ≈ 44.75 (not the Vol II
  # 63.0 the department page shows).
  def test_accrual_ministry_list_sums_to_headline_with_statement_rows
    @command.call(['--year', '2024'])
    summary = JSON.parse(File.read(File.join(@out, '2024', 'summary.json')))
    ministries = summary['ministries']

    assert_in_delta summary['totalSpending'],
                    ministries.sum { |m| m['totalSpending'] }, 0.001

    isc = ministries.find { |m| m['slug'] == 'indigenous-services-and-northern-affairs' }
    assert_in_delta 44.749, isc['totalSpending'], 0.01,
                    'ISC+CIRNAC combined accrual (23.885 + 20.864)'
    assert_equal 'vol1_segment_accrual', isc['basis']

    # The two statement rows are non-link (no slug) with stable ids that match
    # their Sankey nodes so both share one French label.
    statement = ministries.reject { |m| m['slug'] }
    ids = statement.map { |m| m['id'] }.sort
    assert_equal %w[net-actuarial-losses provision-for-valuation], ids
    assert(statement.all? { |m| m['basis'] == 'vol1_segment' })
    actuarial = statement.find { |m| m['id'] == 'net-actuarial-losses' }
    assert_in_delta 7.489, actuarial['totalSpending'], 0.01
  end

  # N:M portfolio→slug allocation (spec §2). FY2024: three separate RDA 3.6
  # portfolios merge into the regional-economic-development slug, while the ISC
  # slug sums two 3.6 portfolios (Indigenous Services + Crown-Indigenous
  # Relations). FY2025: the regional slug has no 3.6 portfolio and is split out
  # of its Innovation host in proportion to Vol II shares (a genuine 1→many).
  def test_accrual_nm_portfolio_slug_allocation
    @command.call(['--year', '2024'])
    s2024 = JSON.parse(File.read(File.join(@out, '2024', 'summary.json')))
    rda = s2024['ministries'].find { |m| m['slug'] == 'regional-economic-development' }
    # Atlantic (0.392) + Prairies (0.376) + Quebec (0.395) ≈ 1.163B merged.
    assert_in_delta 1.163, rda['totalSpending'], 0.05, 'RDA merges its 3.6 portfolios'

    @command.call(['--year', '2025'])
    s2025 = JSON.parse(File.read(File.join(@out, '2025', 'summary.json')))
    rda25 = s2025['ministries'].find { |m| m['slug'] == 'regional-economic-development' }
    isi25 = s2025['ministries'].find { |m| m['slug'] == 'innovation-science-and-industry' }
    # Split out of the Innovation host: both present and positive, and together
    # they don't exceed the host's 3.6 portfolio total (11.876B).
    assert_operator rda25['totalSpending'], :>, 0, 'regional split out of host'
    assert_in_delta 11.876, rda25['totalSpending'] + isi25['totalSpending'], 0.01,
                    'host 3.6 total split across host + absorbed slug'
  end

  # Department figures are now on the net standard-object basis (drop-authorities
  # spec §1): no votes[] anywhere, basis vol2_standard_object_net, and the stat
  # card == the entity-list sum == the miniSankey leaf sum are ONE number.
  def test_department_shapes_and_units
    @command.call(['--year', '2024'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'national-defence.json')))

    assert_equal 'vol2_standard_object_net', dept['basis']
    assert_equal 'dollars_cad', dept['lineItemsUnits']
    refute dept.key?('votes'), 'votes[] removed from the department contract'
    assert dept['transferPayments'].all? { |tp| tp['id'] }, 'transfer payments carry ids'

    # DND net total ≈ 34.49B (gross 34.85 less internal/external revenues).
    assert_in_delta 34.494, dept['totalSpending'], 0.01
    assert_in_delta dept['totalSpending'], dept['entities'].sum { |e| e['value'] }, 0.001,
                    'stat card == entity list sum'
    assert_in_delta dept['totalSpending'], leaf_sum(dept['miniSankey']['spending_data']), 0.001,
                    'stat card == miniSankey leaf sum'
    # historicalShare is expressed in percent, not fraction
    assert(dept['historicalShare'].all? { |p| p['percentage'] > 0.1 })
  end

  # PSPC is the spec's headline example: its stat card was $10.68B on the old
  # authorities basis and is $8.29B on the net standard-object basis, tying the
  # card to the chart (drop-authorities spec §1 / acceptance #1).
  def test_pspc_card_ties_to_the_net_standard_object_chart
    @command.call(['--year', '2024'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'public-services-and-procurement-canada.json')))

    assert_equal 'vol2_standard_object_net', dept['basis']
    assert_in_delta 8.285, dept['totalSpending'], 0.01
    assert_in_delta dept['totalSpending'], leaf_sum(dept['miniSankey']['spending_data']), 0.001
    assert_in_delta dept['totalSpending'], dept['entities'].sum { |e| e['value'] }, 0.001
  end

  # Bulk identity (drop-authorities acceptance #1): for EVERY department-year
  # the stat card == entity-list sum == miniSankey leaf sum.
  def test_every_department_year_card_equals_chart_equals_entities
    assert_equal 0, @command.call(['--all-years'])
    index = JSON.parse(File.read(File.join(@out, 'index.json')))

    checked = 0
    index['years'].each do |year|
      Dir.glob(File.join(@out, year.to_s, 'departments', '*.json')).each do |path|
        next if File.basename(path).include?('.prose.')

        dept = JSON.parse(File.read(path))
        card = dept['totalSpending']
        entities = dept['entities'].sum { |e| e['value'] }
        chart = leaf_sum(dept['miniSankey']['spending_data'])
        assert_in_delta card, entities, 0.001, "#{year}/#{dept['slug']} card==entities"
        assert_in_delta card, chart, 0.001, "#{year}/#{dept['slug']} card==chart"
        assert_equal 'vol2_standard_object_net', dept['basis'], "#{year}/#{dept['slug']} basis"
        refute dept.key?('votes'), "#{year}/#{dept['slug']} has no votes[]"
        checked += 1
      end
    end
    assert_operator checked, :>, 250, 'exercised every dept-year across all 12 years'
  end

  # historicalShare is computed from the net standard-object (meso) basis across
  # every exported meso year (drop-authorities spec §1), not the retired
  # allotment totals.
  def test_historical_share_from_meso_all_years
    assert_equal 0, @command.call(['--all-years'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'national-defence.json')))
    years = dept['historicalShare'].map { |h| h['year'] }

    assert_equal (2014..2025).to_a, years, 'a point for every meso year'
    # 2024 point == that year's net card ÷ Vol I total.
    summary = JSON.parse(File.read(File.join(@out, '2024', 'summary.json')))
    point = dept['historicalShare'].find { |h| h['year'] == 2024 }
    assert_in_delta (dept['totalSpending'] / summary['totalSpending'] * 100),
                    point['percentage'], 0.01
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

  # Transfer-program fanout (drop-authorities spec §2, acceptance #2): the DND
  # FY2024 Transfer payments object (~$1.1B) splits into its named contribution
  # programs (NATO programs, etc.) + "Other transfer programs", summing EXACTLY
  # to the object's net amount.
  def test_mini_sankey_fans_transfer_object_into_named_programs
    @command.call(['--year', '2024'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'national-defence.json')))
    dnd = mini_org(dept, 'Department of National Defence')
    transfer = dnd['children'].find { |l| l['name'] == 'Transfer payments' }

    assert transfer['children'], 'transfer object fans out into program children'
    programs = transfer['children']
    names = programs.map { |p| p['name'] }
    assert(names.any? { |n| n =~ /NATO/ }, 'named NATO contribution programs visible')
    assert(names.include?('Other transfer programs'), 'truncated tail rolls into Other transfer programs')

    # Program ids reuse the transferPayments ids so existing French resolves.
    reused = programs.map { |p| p['id'] }.grep(/-tp-\d{4}\z/)
    tp_ids = dept['transferPayments'].map { |t| t['id'] }
    assert(reused.all? { |id| tp_ids.include?(id) }, 'program leaf ids are transferPayments ids')

    # Exact sum: Σ program children == the object's net amount (~$1.125B).
    parent_amount = 1.125459
    assert_in_delta parent_amount, programs.sum { |p| p['amount'] }, 1e-6,
                    'program children sum exactly to the transfer object amount'
    refute transfer.key?('amount'), 'the fanned-out transfer node carries no amount (leaves only)'
    assert(programs.none? { |p| p['amount'].zero? }, 'zero programs dropped')
  end

  # The ≥90% attachment rule (drop-authorities spec §2): when no single
  # organization holds ≥90% of a portfolio's transfer-payments object, the
  # object stays unsplit and the skip is logged. FY2024 Health Canada is a
  # genuine split — its transfer payments spread across the Department, PHAC,
  # CIHR and CFIA (top org only ~73%) — so no organization's transfer object
  # fans out into programs.
  def test_transfer_fanout_skips_split_portfolios_and_logs_them
    assert_equal 0, @command.call(['--all-years'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'health-canada.json')))

    dept['miniSankey']['spending_data']['children'].each do |org|
      transfer = (org['children'] || []).find { |l| l['name'] == 'Transfer payments' }
      next unless transfer

      refute transfer.key?('children'),
             "#{org['name']} transfer object must stay unsplit (portfolio below 90% dominance)"
    end

    report = File.read(@errors_path)
    assert_match(/## Transfer-program fanout skips/, report)
    assert_match(/\*\*health-canada\*\*: largest organization holds 73\.\d% of the transfer object \(<90%\)/, report)
  end

  # Parents carry no amount (D3 double-counting contract); leaves only.
  def test_mini_sankey_parents_carry_no_amount
    @command.call(['--year', '2024'])
    dept = JSON.parse(File.read(File.join(@out, '2024', 'departments', 'national-defence.json')))
    tree = dept['miniSankey']['spending_data']

    assert_equal 'national-defence', tree['id']
    assert_no_parent_amounts(tree)
    dnd = mini_org(dept, 'Department of National Defence')
    # Every child is either a leaf carrying an amount, or the fanned-out
    # Transfer payments node (a parent whose program children carry amounts).
    assert(dnd['children'].all? { |c| c.key?('amount') ^ c.key?('children') },
           'object/revenue leaves carry amounts; the transfer node carries children')
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
    # Obligations (accrual basis) = net interest on debt (47.273) + net
    # actuarial losses (7.489) + provision for valuation (-1.736) = 53.026.
    assert_in_delta 53.026, leaf_sum(node(tree, 'obligations')), 0.1
    # The provision-for-valuation leaf is the Vol I Table 3.6 standalone segment
    # (FY2024 = -1.736B), sitting alongside actuarial under Obligations.
    assert_in_delta(-1.736, leaf_sum(node(tree, 'provision-for-valuation')), 0.01)
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

  # Copies a cest-eest edition, multiplying every amount in its fiscal-year
  # columns by `factor` (the doctored fixture for the scale-guard test).
  def doctor_cest(src, dest, factor)
    table = CSV.read(src, headers: true, encoding: 'bom|utf-8')
    year_cols = table.headers.select { |h| h =~ %r{\d{4}/\d{4}} }
    table.each do |row|
      year_cols.each do |col|
        v = row[col].to_s.delete(',')
        row[col] = (v.to_f * factor).round unless v.strip.empty?
      end
    end
    File.write(dest, table.to_csv)
  end

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
