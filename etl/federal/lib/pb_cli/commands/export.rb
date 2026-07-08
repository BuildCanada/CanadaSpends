require 'cli/ui'
require 'fileutils'
require 'json'
require 'set'
require 'time'
require_relative '../export/cpi'
require_relative '../export/major_transfers'
require_relative '../export/mapping'
require_relative '../export/segment_expenses'
require_relative '../export/standard_objects'
require_relative '../export/truncation'
require_relative '../export/units'
require_relative '../export/vol1_statement'

module PbCli
  module Commands
    # `pb export [--year N | --all-years] [--out DIR]`
    #
    # Generates the /data/federal JSON contracts (spec §7) from the extracted
    # Vol II datasets + Vol I consolidated statement CSVs + the curated mapping.
    # Output is deterministic (fixed field order, rounded floats). Validation
    # (spec §5) is enforced; on failure a report is written to export_errors.md
    # and the run exits non-zero, but years that pass are still shipped.
    class Export
      SOURCE = 'Public Accounts of Canada'.freeze
      SOURCE_URL = 'https://www.tpsgc-pwgsc.gc.ca/recgen/cpc-pac/index-eng.html'.freeze
      DEFAULT_YEAR = 2025
      BASE_YEAR = 2025
      MINI_SANKEY_TOP_N = 12
      HEADLINE_TOLERANCE = 0.005 # 0.5%
      # Restatement-scaling guard (main-page-accrual-basis follow-up): a year's
      # Table 3.6 portfolio totals are scaled to tie to the restated statement
      # total, but only when the scale factor is within 1% of 1.0 — measured on
      # the RESTATEMENT component. Editions predating the net-actuarial-losses
      # split (≤2019) additionally carve the statement's actuarial amount out of
      # the portfolios, so the actuarial share of total expenses is added to the
      # allowance (the carve-out is a known presentation change, fully
      # explained, not an unexplained restatement). Beyond the guard the year is
      # export-blocked with the delta reported.
      SCALE_GUARD = 0.01
      # Per-department miniSankey reconciliation floor (spec §B): the larger of
      # 2% or $50M. Compared against Vol II allotment expenditures, which equal
      # the standard-object GROSS total (Σ objects) for the same ministerial
      # scope — verified exact for e.g. National Defence / Justice / Treasury
      # Board. Systematic exceedances (net-voted common services, pre-2018
      # presentation, scope) are documented, not blocking (see NOTES.md).
      MESO_RECON_TOLERANCE_B = 0.05

      # Known published consolidated totals ($B) for headline validation.
      # 2024 is the site's anchor: total expenses INCLUDING net actuarial losses
      # (521.425) and total revenues (459.549), per the published Consolidated
      # Statement of Operations. The retired 513.94 anchor excluded net actuarial
      # losses (source-correction, see docs/specs/federal-parity-report-2024.md).
      PUBLISHED_TOTALS = {
        2024 => { spending: 521.425, revenue: 459.549 }
      }.freeze

      # Per-year restatement scale info ({ factor:, deviation:, carve:, ok: });
      # exposed for the pinned scale-factor tests and populated during export.
      attr_reader :segment_scales

      def initialize(paths = {})
        root = paths[:root] || Dir.pwd
        @allotment_path = paths[:allotment_path] || File.join(root, 'extracted/data/budgetary_details_by_allotment.json')
        @transfers_path = paths[:transfers_path] || File.join(root, 'extracted/data/transfer_payments_by_ministry.json')
        @major_transfers_path = paths[:major_transfers_path] || File.join(root, 'extracted/data/major_transfers_by_provinces_and_territories.json')
        @slugs_path = paths[:slugs_path] || File.join(root, 'mappings/ministry_slugs.yaml')
        @tree_path = paths[:tree_path] || File.join(root, 'mappings/thematic_tree.yaml')
        @open_tables_dir = paths[:open_tables_dir] || File.join(root, 'open_tables/data')
        @cpi_path = paths[:cpi_path] || File.join(root, 'reference/cpi_fiscal_year.json')
        @out_dir = paths[:out_dir] || File.expand_path(File.join(root, '../../data/federal'))
        @errors_path = paths[:errors_path] || File.join(root, 'export_errors.md')
        @timestamp = paths[:timestamp] || ENV['PB_EXPORT_TIMESTAMP'] || Time.now.utc.iso8601
      end

      def call(args)
        opts = parse_args(args)
        return opts[:exit] if opts[:exit]

        load_inputs
        candidate_years = opts[:all] ? all_data_years : [opts[:year]]

        @errors = []
        @excluded = {}
        @recon_warnings = []
        @transfer_split_skips = []
        precompute_year_totals(candidate_years)
        precompute_meso(candidate_years)

        exported = []
        ::CLI::UI::Frame.open("Exporting federal JSON to #{@out_dir}") do
          candidate_years.each do |year|
            reason = year_blocker(year)
            if reason
              @excluded[year] = reason
              puts ::CLI::UI.fmt("{{x}} #{year}: excluded — #{reason}")
              next
            end
            export_year(year)
            exported << year
            puts ::CLI::UI.fmt("{{v}} #{year}: summary + sankey + reconciliation + #{@slug_year_totals.count { |_, yh| yh[year] }} departments")
          end
          write_index(exported) unless exported.empty?
        end

        finalize(exported)
      end

      private

      # --- argument parsing -----------------------------------------------

      def parse_args(args)
        opts = { all: false, year: nil }
        i = 0
        while i < args.length
          case args[i]
          when '--all-years' then opts[:all] = true
          when '--year' then opts[:year] = args[i += 1].to_i
          when '--out' then @out_dir = File.expand_path(args[i += 1])
          when '--help', '-h'
            print_help
            return { exit: 0 }
          else
            puts "Unknown argument: #{args[i]}"
            print_help
            return { exit: 1 }
          end
          i += 1
        end
        if !opts[:all] && opts[:year].nil?
          puts 'Error: specify --year N or --all-years'
          print_help
          return { exit: 1 }
        end
        opts
      end

      def print_help
        puts 'Usage:'
        puts '  pb export --year 2024 [--out DIR]'
        puts '  pb export --all-years [--out DIR]'
        puts ''
        puts "Default --out: ../../data/federal (the repo's /data/federal)"
      end

      # --- inputs ----------------------------------------------------------

      def load_inputs
        @allotments = JSON.parse(File.read(@allotment_path))
        @transfers = JSON.parse(File.read(@transfers_path))
        @mapping = PbCli::Export::Mapping.new(@slugs_path, @tree_path)
        @vol1 = PbCli::Export::Vol1Statement.new(@open_tables_dir)
        @major_transfers = PbCli::Export::MajorTransfers.new(@major_transfers_path)
        @standard_objects = PbCli::Export::StandardObjects.new(@open_tables_dir)
        @segments = PbCli::Export::SegmentExpenses.new(@open_tables_dir)
        @cpi = PbCli::Export::Cpi.new(@cpi_path, base_year: BASE_YEAR)
        @accrual_years = {}
      end

      def all_data_years
        @allotments.map { |r| r['year'] }.uniq.sort
      end

      # --- cross-year precomputation --------------------------------------

      # Builds per-slug per-year Vol II totals (billions) so historicalShare and
      # reconciliation can be computed across all exported years, and detects
      # slug/node coverage failures once.
      def precompute_year_totals(years)
        @slug_year_totals = Hash.new { |h, k| h[k] = {} }
        @node_year_totals = Hash.new { |h, k| h[k] = Hash.new(0.0) }
        # Per-slug per-node Vol II dollars, so a slug's accrual allocation can be
        # spread across its thematic nodes pro-rata to its Vol II theme mix.
        @slug_node_vol2 = Hash.new { |h, k| h[k] = Hash.new { |i, j| i[j] = Hash.new(0.0) } }
        # Per-slug accrual allocation (billions) for accrual years (summary list).
        @slug_accrual = {}
        @vol1_spending = {}
        @vol1_revenue = {}

        years.each do |year|
          @vol1_spending[year] = @vol1.year?(year) ? @vol1.total_spending(year) : nil
          @vol1_revenue[year] = @vol1.year?(year) ? @vol1.total_revenue(year) : nil
          assert_vol1_consistency(year) if @vol1.year?(year)
          slug_dollars = Hash.new(0.0)
          allotments_for(year).each do |row|
            next if row['is_total_or_subtotal']

            slug = @mapping.resolve_slug(row)
            if slug.nil?
              record_error(year, "allotment row without slug: code=#{row['ministry_code'].inspect} name=#{row['ministry_name_normalized'].inspect}")
              next
            end
            node = @mapping.match_node(row, slug)
            if node.nil?
              record_error(year, "allotment row unmapped by thematic_tree: slug=#{slug} org=#{row['organization'].inspect} desc=#{row['description'].inspect}")
              next
            end
            amount = row['expenditures'].to_f
            slug_dollars[slug] += amount
            @node_year_totals[year][node] += amount
            @slug_node_vol2[year][slug][node] += amount
          end
          slug_dollars.each { |slug, d| @slug_year_totals[slug][year] = PbCli::Export::Units.dollars_to_billions(d) }

          # On the Vol I accrual basis (main-page-accrual-basis spec) the
          # thematic tree and ministry list are re-based off Table 3.6 segment
          # expenses: replace the Vol II node totals with each slug's accrual
          # allocation, spread across its Vol II theme mix. Fallback years keep
          # the Vol II node totals and their reconciling adjustments leaf.
          rebase_nodes_to_accrual(year, slug_dollars) if accrual_year?(year)
          apply_vol1_offsets(year) if @vol1.year?(year)

          # transfer-payment slug coverage (dept pages only; never feed the tree)
          transfers_for(year).each do |row|
            next if row['is_total_or_subtotal']

            slug = @mapping.resolve_slug(row)
            record_error(year, "transfer-payment row without slug: code=#{row['ministry_code'].inspect} name=#{row['ministry_name_normalized'].inspect}") if slug.nil?
          end
        end
      end

      # True when Vol I Table 3.6 segment data exists for the year and the
      # restatement scale factor is within the guard. All 12 exported years
      # currently qualify; a year beyond the guard is export-blocked (the error
      # is recorded by segment_scale) and the adjustments-leaf machinery remains
      # as a defensive fallback should a residual ever appear.
      def accrual_year?(year)
        return @accrual_years[year] if @accrual_years.key?(year)

        @accrual_years[year] =
          @segments.year?(year) && @vol1.year?(year) && segment_scale(year)[:ok]
      end

      # Restatement scaling (main-page-accrual-basis follow-up): the year's own
      # Table 3.6 edition carries vintage figures, while Vol1Statement reads the
      # RESTATED ten-year comparative. All portfolio totals (and the standalone
      # provision / Crown-corporations segments) are scaled proportionally so
      # the full set ties to the restated statement total exactly. Net actuarial
      # losses always come from the statement line; editions predating the
      # net-actuarial split (≤2019, actuarial segment absent) have the statement
      # amount carved out of the portfolios by the same proportional scaling
      # (target = total_spending − actuarial), with the carve share added to the
      # 1% guard allowance since it is a fully-explained presentation change.
      #
      #   factor = (total_spending − actuarial_stmt) / (3.6 total − actuarial_seg)
      #
      # Returns { factor:, deviation:, carve:, allowed:, ok: }, memoized.
      def segment_scale(year)
        @segment_scales ||= {}
        @segment_scales[year] ||= compute_segment_scale(year)
      end

      def compute_segment_scale(year)
        total = @vol1.total_spending(year)
        act_stmt = @vol1.net_actuarial_losses(year)
        act_seg = PbCli::Export::Units.dollars_to_billions(
          @segments.segment_dollars(year, 'net-actuarial-losses')
        )
        base = @segments.total(year) - act_seg
        factor = (total - act_stmt) / base
        carve = act_seg.abs < 0.0005 && act_stmt.abs >= 0.0005 ? (act_stmt / total).abs : 0.0
        deviation = (factor - 1).abs
        ok = deviation <= SCALE_GUARD + carve
        unless ok
          record_error(year, format(
            '3.6 restatement scale factor %.5f beyond guard: restatement deviation %.4f%% > %.2f%% ' \
            '(actuarial carve-out allowance %.4f%%; 3.6 total %.3fB vs statement %.3fB)',
            factor, (deviation - carve) * 100, SCALE_GUARD * 100, carve * 100,
            @segments.total(year), total
          ))
        end
        { factor: factor, deviation: deviation, carve: carve, allowed: SCALE_GUARD + carve, ok: ok }
      end

      # Replaces @node_year_totals[year] (Vol II) with each slug's accrual
      # allocation spread across its Vol II theme mix. Records @slug_accrual for
      # the ministry list. Export-blocking on unresolved 3.6 portfolios, on a
      # portfolio resolving to a slug absent from Vol II, or on an orphan slug
      # (present in Vol II, no 3.6 portfolio) with no configured host.
      def rebase_nodes_to_accrual(year, slug_dollars)
        accrual = compute_accrual_allocations(year, slug_dollars)
        @slug_accrual[year] = accrual.transform_values { |d| PbCli::Export::Units.dollars_to_billions(d) }

        @node_year_totals[year] = Hash.new(0.0)
        accrual.each do |slug, dollars|
          vol2_total = slug_dollars[slug]
          next if vol2_total.nil? || vol2_total.zero?

          @slug_node_vol2[year][slug].each do |node, vol2|
            @node_year_totals[year][node] += dollars * vol2 / vol2_total
          end
        end
      end

      # Allocates the Table 3.6 "Ministries" segment total (restatement-scaled)
      # to portfolio slugs (dollars). Portfolios that resolve to the same slug
      # are summed (merge); a slug present in Vol II but with no 3.6 portfolio
      # of its own is absorbed into a configured host portfolio's group and the
      # group total is split across its members in proportion to their Vol II
      # expenditure shares (spec §2); a portfolio whose slug is ABSENT from
      # Vol II that year merges into its host's group (2016 Infrastructure).
      # Σ(allocations) == factor × the 3.6 Ministries total.
      def compute_accrual_allocations(year, slug_dollars)
        factor = segment_scale(year)[:factor]
        present = slug_dollars.keys
        primary = Hash.new(0.0)
        @segments.portfolios(year).each_value do |portfolio|
          slug = @mapping.segment_portfolio_slug(portfolio.label)
          if slug.nil?
            record_error(year, "3.6 portfolio without slug: #{portfolio.label.inspect}")
            next
          end
          slug = @mapping.segment_host_slug(slug) unless present.include?(slug)
          unless slug && present.include?(slug)
            record_error(year, "3.6 portfolio #{portfolio.label.inspect} resolves to a slug with no Vol II data this year and no host")
            next
          end
          primary[slug] += portfolio.total * factor
        end

        group_of = {}
        present.each do |slug|
          host = @mapping.segment_host_slug(slug)
          if !primary[slug].zero? || host.nil?
            group_of[slug] = slug
          elsif present.include?(host)
            group_of[slug] = host
          else
            record_error(year, "orphan slug #{slug} (no 3.6 portfolio) has no host present in Vol II this year")
            group_of[slug] = slug
          end
        end

        allocation = Hash.new(0.0)
        present.group_by { |slug| group_of[slug] }.each do |group, members|
          denom = members.sum { |slug| slug_dollars[slug] }
          members.each do |slug|
            allocation[slug] = denom.zero? ? 0.0 : primary[group] * slug_dollars[slug] / denom
          end
        end
        allocation
      end

      # Standard-object (dmac-meso) rows, resolved to portfolio slugs and
      # aggregated per (year, slug, organization). This is now the SOLE source
      # of every user-facing department figure (drop-authorities spec §1):
      # totalSpending / entities / historicalShare / percentageOfFederal are
      # the net (Σ objects − external − internal revenues) figures aggregated
      # here, matching the miniSankey exactly. Runs after precompute_year_totals
      # so the RDA org-override guard can consult which slugs actually have
      # allotment data in a given year.
      def precompute_meso(years)
        @meso_by_slug = Hash.new { |h, k| h[k] = {} }
        @meso_gross = Hash.new { |h, k| h[k] = Hash.new(0.0) }
        @meso_net = Hash.new { |h, k| h[k] = Hash.new(0.0) }
        # Raw Public Accounts portfolio label(s) a slug resolved from that year,
        # for `reportedAs` (only from portfolio-resolved rows, never from an
        # organization-override reattribution whose label belongs to the host).
        @meso_portfolios = Hash.new { |h, k| h[k] = Hash.new { |i, j| i[j] = [] } }
        @meso_orphans = Hash.new(0.0)

        years.each do |year|
          next unless @standard_objects.year?(year)

          valid = @slug_year_totals.keys.select { |s| @slug_year_totals[s].key?(year) }.to_set
          @standard_objects.rows(year).each do |row|
            override = @mapping.organization_override_slug(row.organization)
            via_override = override && valid.include?(override)
            slug = via_override ? override : @mapping.meso_portfolio_slug(row.portfolio)
            if slug.nil? || !valid.include?(slug)
              @meso_orphans[year] += row.gross
              next
            end
            org = ((@meso_by_slug[year][slug] ||= {})[row.organization] ||=
              { objects: Hash.new(0.0), external: 0.0, internal: 0.0 })
            row.objects.each { |name, dollars| org[:objects][name] += dollars }
            org[:external] += row.external
            org[:internal] += row.internal
            @meso_gross[year][slug] += row.gross
            @meso_net[year][slug] += row.net
            @meso_portfolios[year][slug] << row.portfolio unless via_override
          end
        end
      end

      # Hard export validation (consolidated-statement-alignment spec): for every
      # year the published total_spending - total_revenue must equal the published
      # "Annual operating deficit" line to within $1M, else the year is blocked.
      def assert_vol1_consistency(year)
        delta = @vol1.consistency_delta(year)
        return if delta <= 0.001

        record_error(year, format(
          'Vol I identity fails: spending %.3f - revenue %.3f = %.3f != published deficit %.3f (Δ %.4fB > $1M)',
          @vol1.total_spending(year), @vol1.total_revenue(year),
          @vol1.total_spending(year) - @vol1.total_revenue(year),
          @vol1.published_deficit(year), delta
        ))
      end

      # A year cannot be exported if it has mapping errors or lacks Vol I data.
      def year_blocker(year)
        return "coverage errors (#{@errors.count { |e| e[:year] == year }})" if @errors.any? { |e| e[:year] == year }
        return 'no Vol I consolidated statement data (edition unavailable)' unless @vol1.year?(year)

        headline_blocker(year)
      end

      def headline_blocker(year)
        published = PUBLISHED_TOTALS[year]
        return nil unless published

        spend = @vol1.total_spending(year)
        rev = @vol1.total_revenue(year)
        s_dev = ((spend - published[:spending]) / published[:spending]).abs
        r_dev = ((rev - published[:revenue]) / published[:revenue]).abs
        return nil if s_dev <= HEADLINE_TOLERANCE && r_dev <= HEADLINE_TOLERANCE

        format('Vol I headline off published totals (spending %.2f vs %.2f, revenue %.2f vs %.2f)',
               spend, published[:spending], rev, published[:revenue])
      end

      # --- per-year export -------------------------------------------------

      def export_year(year)
        dir = File.join(@out_dir, year.to_s)
        FileUtils.mkdir_p(File.join(dir, 'departments'))
        FileUtils.mkdir_p(File.join(dir, 'i18n'))
        # French label map is owned by the translation pipeline (spec §8);
        # seed an empty one only when absent so re-exports never clobber
        # existing translations. The loader falls back to English per id.
        fr_path = File.join(dir, 'i18n', 'fr.json')
        write_json(fr_path, {}) unless File.exist?(fr_path)

        spending_root, revenue_root = build_sankey_trees(year)
        assert_tree_balanced(year, spending_root)
        assert_tree_balanced(year, revenue_root)

        write_json(File.join(dir, 'sankey.full.json'), sankey_payload(spending_root, revenue_root))
        t_spend = PbCli::Export::Truncation.truncate(spending_root, top_n: MINI_SANKEY_TOP_N)
        t_rev = PbCli::Export::Truncation.truncate(revenue_root, top_n: MINI_SANKEY_TOP_N)
        write_json(File.join(dir, 'sankey.json'), sankey_payload(t_spend, t_rev))

        write_json(File.join(dir, 'summary.json'), summary_payload(year))
        write_json(File.join(dir, 'reconciliation.json'), reconciliation_payload(year))

        slugs_for(year).each do |slug|
          write_json(File.join(dir, 'departments', "#{slug}.json"), department_payload(year, slug))
        end
        validate_meso_reconciliation(year)
      end

      # Per-department miniSankey ↔ allotment check (spec §B). Compares the
      # standard-object GROSS total against Vol II allotment expenditures (the
      # like-for-like quantity). Out-of-tolerance department-years are recorded
      # as non-blocking, documented report lines — the systematic causes
      # (net-voted common services, pre-2018 presentation basis, portfolio
      # scope) are
      # written up in the export report and NOTES.md rather than dropping years.
      def validate_meso_reconciliation(year)
        return unless @standard_objects.year?(year)

        slugs_for(year).each do |slug|
          allot = @slug_year_totals[slug][year]
          gross = PbCli::Export::Units.dollars_to_billions(@meso_gross[year][slug])
          delta = PbCli::Export::Units.round_billions(gross - allot)
          tolerance = [0.02 * allot.abs, MESO_RECON_TOLERANCE_B].max
          next if delta.abs <= tolerance

          @recon_warnings << {
            year: year, slug: slug, allotment: allot, gross: gross,
            delta: delta, tolerance: PbCli::Export::Units.round_billions(tolerance)
          }
        end
      end

      # --- sankey ----------------------------------------------------------

      def build_sankey_trees(year)
        themes = @mapping.themes.map { |t| build_node(year, t) }
        total = @vol1.total_spending(year)
        add_accounting_adjustments_leaf(year, themes, total)
        spending = {
          'id' => 'spending', 'name' => 'Spending',
          # Declared total is the published headline (== summary.totalSpending);
          # the adjustments leaf makes the children sum to it exactly.
          'amount' => total, 'children' => themes
        }
        revenue = build_revenue_tree(year)
        [spending, revenue]
      end

      # Guarded fallback (main-page-accrual-basis spec §2): in accrual years the
      # tree is re-based off Table 3.6 and already sums to the published headline
      # (residual ≈ 0), so NO leaf is emitted. In fallback years (whose 3.6 total
      # does not reconcile) the tree mixes Vol II gross + Vol I leaves and this
      # single top-level leaf reconciles the leaf sum to the headline; the
      # residual equals reconciliation.json's unattributed remainder item. Emit
      # nothing when |residual| < $1M.
      def add_accounting_adjustments_leaf(year, themes, total)
        residual = PbCli::Export::Units.round_billions(total - sum_amounts(themes))
        return if residual.abs < 0.001

        themes << {
          'id' => 'accounting-basis-adjustments',
          'name' => 'Accounting and consolidation adjustments',
          'amount' => residual
        }
      end

      def build_node(year, node)
        result = { 'id' => node['id'], 'name' => node['name_en'] }
        result['link'] = node['link'] if node['link']
        children = node['children']
        geo_kids = dataset_children(year, node)
        if children && !children.empty?
          built = children.map { |c| build_node(year, c) }
          result['children'] = built
          result['amount'] = sum_amounts(built)
        elsif geo_kids && !geo_kids.empty?
          result['children'] = geo_kids
          result['amount'] = sum_amounts(geo_kids)
        else
          result['amount'] = leaf_amount(year, node)
        end
        result
      end

      # Vol II-mapped dollars (post-offset; accrual allocations in accrual years)
      # plus any Vol I-sourced amounts plus any Vol I Table 3.6 segment amounts.
      def leaf_amount(year, node)
        vol2 = @node_year_totals[year][node['id']]
        vol1 = @mapping.vol1_rules_for(node['id']).sum { |r| vol1_rule_dollars(year, r) }
        segment = @mapping.segment_rules_for(node['id']).sum { |r| segment_rule_dollars(year, r) }
        PbCli::Export::Units.round_billions((vol2 + vol1 + segment) / PbCli::Export::Units::BILLION)
      end

      # A `source: segment` node is filled from a Vol I Table 3.6 standalone
      # segment (Provision for valuation; the 2014–2016 Crown-corporations
      # lump), restatement-scaled — but only in accrual years, where the tree is
      # re-based off 3.6 and sums to the headline without an adjustments leaf.
      # In a (defensive) fallback year it contributes 0.
      def segment_rule_dollars(year, rule)
        return 0.0 unless accrual_year?(year)

        @segments.segment_dollars(year, rule['segment_id']) * segment_scale(year)[:factor]
      end

      # Province/territory children for a node fed by a single Vol I Table 3.7
      # dataset column (health-transfer, social-transfer, equalization).
      def dataset_children(year, node)
        rules = node['rules'] || []
        return nil unless rules.size == 1 && rules.first['vol1_dataset_column']

        rule = rules.first
        rows = @major_transfers.geo_rows(year, rule['vol1_dataset_column'], rule['dataset_scope'] || 'all')
        factor = scale_factor(year, rule, rows)
        rows.map do |r|
          {
            'id' => "#{node['id']}-#{slugify(r['name'])}",
            'name' => r['name'],
            'amount' => PbCli::Export::Units.dollars_to_billions(r['dollars'] * factor)
          }
        end
      end

      # Pro-rates cash province rows onto the accrual statement line total.
      def scale_factor(year, rule, rows)
        line = rule['scale_to_line']
        return 1.0 unless line

        cash_sum = rows.sum { |r| r['dollars'] }
        return 1.0 if cash_sum.zero?

        statement = @vol1.line_amount(year, line)
        statement.zero? ? 1.0 : statement / cash_sum
      end

      # A rule may set `negate: true` to sign-normalize a statement line that is
      # stored inverted (net actuarial losses: a loss is negative in the CSV, so
      # negate turns it into a positive expense).
      def vol1_rule_dollars(year, rule)
        dollars = raw_vol1_rule_dollars(year, rule)
        rule['negate'] ? -dollars : dollars
      end

      def raw_vol1_rule_dollars(year, rule)
        if rule['vol1_line']
          @vol1.line_amount(year, rule['vol1_line'])
        elsif rule['vol1_dataset_column']
          if rule['scale_to_line'] && !@vol1.line_amount(year, rule['scale_to_line']).zero?
            @vol1.line_amount(year, rule['scale_to_line'])
          else
            @major_transfers.column_total(year, rule['vol1_dataset_column'], rule['dataset_scope'] || 'all')
          end
        elsif rule['vol1_special'] == 'fiscal_arrangements_residual'
          @vol1.line_amount(year, 'Fiscal arrangements') -
            @major_transfers.column_total(year, 'fiscal_arrangements', 'all')
        else
          raise KeyError, "vol1 rule on #{rule['node_id']} has no vol1_line/vol1_dataset_column/vol1_special"
        end
      end

      # Vol I amounts contained inside a ministry's lump statutory Vol II rows
      # are subtracted from the named catch-all node so the tree does not
      # double-count. Checked afterwards: a materially negative catch-all means
      # the offsets exceed what the ministry actually spent (a data error).
      def apply_vol1_offsets(year)
        accrual = accrual_year?(year)
        touched = []
        @mapping.vol1_rules.each do |rule|
          # `offset_node` always applies (the Vol I item sits inside a Vol II
          # lump). `accrual_offset_node` applies only on the accrual basis,
          # where the item is inside the owning slug's Table 3.6 portfolio total
          # but outside Vol II appropriations.
          target = rule['offset_node'] || (accrual ? rule['accrual_offset_node'] : nil)
          next unless target

          @node_year_totals[year][target] -= vol1_rule_dollars(year, rule)
          touched << target
        end
        touched.uniq.each do |node_id|
          remaining = @node_year_totals[year][node_id]
          next unless remaining < -1_000_000

          record_error(year, format('vol1 offsets drive node %s negative (%.3fB)', node_id, remaining / 1e9))
        end
      end

      def build_revenue_tree(year)
        root = { 'id' => 'revenue', 'name' => 'Revenue', 'children' => [] }
        index = { [] => root }
        @vol1.revenue_lines(year).each do |line|
          parent = root
          prefix = []
          line[:path].each_with_index do |label, depth|
            prefix = prefix + [label]
            leaf = depth == line[:path].length - 1
            node = index[prefix]
            unless node
              node = { 'id' => "revenue-#{slugify(prefix.join('-'))}", 'name' => label }
              index[prefix] = node
              (parent['children'] ||= []) << node
            end
            if leaf
              node['amount'] = PbCli::Export::Units.round_billions((node['amount'] || 0) + line[:amount])
            end
            parent = node
          end
        end
        assign_parent_amounts(root)
        root
      end

      # Bottom-up: any node with children gets amount = sum of children.
      def assign_parent_amounts(node)
        children = node['children']
        return node['amount'] || 0.0 unless children && !children.empty?

        node['amount'] = PbCli::Export::Units.round_billions(children.sum { |c| assign_parent_amounts(c) })
      end

      def sankey_payload(spending, revenue)
        {
          'total' => spending['amount'],
          'spending' => spending['amount'],
          'revenue' => revenue['amount'],
          'spending_data' => strip_parent_amounts(spending),
          'revenue_data' => strip_parent_amounts(revenue)
        }
      end

      # The site sums trees with D3 hierarchy().sum(), which adds a node's own
      # amount PLUS its descendants' — serialized parent subtotals would be
      # double-counted at every level (~3.7x at the root). Emit amounts on
      # leaves only, matching the provincial sankey.json contract. Internal
      # trees keep parent subtotals for validation and truncation; this strips
      # copies at serialization time without mutating the originals.
      def strip_parent_amounts(node)
        copy = node.dup
        children = node['children']
        if children && !children.empty?
          copy.delete('amount')
          copy['children'] = children.map { |c| strip_parent_amounts(c) }
        end
        copy
      end

      # --- summary ---------------------------------------------------------

      def summary_payload(year)
        total = @vol1.total_spending(year)
        accrual = accrual_year?(year)
        ministries = slugs_for(year).map do |slug|
          spend = accrual ? @slug_accrual[year][slug] : @slug_year_totals[slug][year]
          {
            'name' => portfolio_name(slug),
            'slug' => slug,
            'totalSpending' => spend,
            'percentage' => pct(spend, total),
            'basis' => accrual ? 'vol1_segment_accrual' : 'vol2_appropriations'
          }
        end.sort_by { |m| [-m['totalSpending'], m['slug']] }

        # On the accrual basis, append the Table 3.6 standalone (non-ministerial)
        # segments — Net actuarial losses, Provision for valuation and other
        # items — as non-link rows (no slug/href) so the ministry list sums to
        # the published headline exactly. Their stable id keys the French label.
        ministries += statement_rows(year, total) if accrual

        {
          'name' => 'Government of Canada',
          'financialYear' => fiscal_year_label(year),
          'financialYearEnding' => year,
          'source' => "#{SOURCE} #{year}",
          'source_url' => SOURCE_URL,
          'units' => 'billions_cad',
          'inflation' => { 'baseYear' => BASE_YEAR, 'multiplierToBase' => @cpi.multiplier_to_base(year) },
          'totalSpending' => total,
          'totalRevenue' => @vol1.total_revenue(year),
          'deficit' => @vol1.deficit(year),
          'basis' => 'vol1_consolidated',
          'ministries' => ministries
        }
      end

      # Non-link ministry-list rows for the Vol I statement lumps outside the
      # ministerial portfolios. No slug/href — the site renders them un-linked;
      # the `id` matches the corresponding Sankey node so both share one French
      # key. Net actuarial losses ALWAYS come from the statement line (the
      # ≤2019 editions predate the segment); the provision and the 2014–2016
      # Crown-corporations lump are the 3.6 segments, restatement-scaled. With
      # these rows the list sums to the published headline exactly.
      def statement_rows(year, total)
        factor = segment_scale(year)[:factor]
        rows = [{
          'name' => 'Net actuarial losses',
          'id' => 'net-actuarial-losses',
          'amount' => @vol1.net_actuarial_losses(year)
        }]
        @segments.segments(year).each do |seg|
          next if seg.id == 'net-actuarial-losses'

          rows << {
            'name' => seg.label, 'id' => seg.id,
            'amount' => PbCli::Export::Units.dollars_to_billions(seg.dollars * factor)
          }
        end
        rows.reject { |r| r['amount'].abs < 0.0005 }
            .sort_by { |r| [-r['amount'], r['id']] }
            .map do |r|
          {
            'name' => r['name'],
            'id' => r['id'],
            'totalSpending' => PbCli::Export::Units.round_billions(r['amount']),
            'percentage' => pct(r['amount'], total),
            'basis' => 'vol1_segment'
          }
        end
      end

      # --- reconciliation --------------------------------------------------

      def reconciliation_payload(year)
        vol1_total = @vol1.total_spending(year)
        vol2_sum = PbCli::Export::Units.round_billions(slugs_for(year).sum { |s| @slug_year_totals[s][year] })
        difference = PbCli::Export::Units.round_billions(vol1_total - vol2_sum)

        items = vol1_only_items(year)
        named_sum = PbCli::Export::Units.round_billions(items.sum { |i| i['amount'] })
        items << {
          'id' => "recon-#{year}-remainder",
          'name' => 'Consolidation, accrual and gross/net adjustments',
          'amount' => PbCli::Export::Units.round_billions(difference - named_sum),
          'note' => 'Unattributed remainder: consolidated Crown corporations, accrual items, and gross (Vol II) vs net (Vol I) presentation differences. Equals the spending Sankey\'s "Accounting and consolidation adjustments" leaf.'
        }

        {
          'financialYearEnding' => year,
          'units' => 'billions_cad',
          'vol1Total' => vol1_total,
          'vol2MinistrySum' => vol2_sum,
          'difference' => difference,
          'items' => items
        }
      end

      # Vol I-sourced nodes WITHOUT an offset are genuinely outside Vol II
      # appropriations (tax-system / specified-purpose-account items, plus net
      # actuarial losses) — they are the named part of the Vol I ↔ Vol II
      # difference. Net actuarial losses are now inside the Vol I headline total,
      # so they are a named item here (sign-normalized to a positive expense to
      # match the Sankey leaf). This set equals the non-offset Vol I leaves in
      # the spending tree, so difference - Σ(items) equals the tree's
      # accounting-basis-adjustments leaf.
      def vol1_only_items(year)
        @mapping.vol1_rules
                .reject { |r| r['offset_node'] }
                .map do |rule|
          amount = @vol1.line_amount_billions(year, rule['vol1_line'])
          amount = PbCli::Export::Units.round_billions(-amount) if rule['negate']
          {
            'id' => "recon-#{year}-#{rule['node_id']}",
            'name' => Array(rule['vol1_line']).first,
            'amount' => amount,
            'note' => 'Vol I consolidated expense line, not present in Vol II appropriations.'
          }
        end
      end

      # --- department pages ------------------------------------------------

      def department_payload(year, slug)
        entities = entities(slug, year)
        total = PbCli::Export::Units.round_billions(entities.sum { |e| e['value'] })
        vol1_total = @vol1.total_spending(year)

        {
          'name' => portfolio_name(slug),
          'slug' => slug,
          'financialYearEnding' => year,
          'reportedAs' => reported_as(slug, year),
          'basis' => 'vol2_standard_object_net',
          'totalSpending' => total,
          'percentageOfFederal' => pct(total, vol1_total),
          'historicalShare' => historical_share(slug),
          'miniSankey' => {
            'breakdown' => 'standard_object',
            'spending_data' => strip_parent_amounts(mini_sankey(year, slug))
          },
          'entities' => entities,
          'transferPayments' => transfer_payments(slug, year),
          'lineItemsUnits' => 'dollars_cad'
        }
      end

      # Public Accounts portfolio label(s) the slug is reported under that year,
      # when they differ from the portfolio's current display name — now sourced
      # from the standard-object (meso) portfolio labels (spec §1) rather than
      # the retired allotment ministry names. Aggregate portfolios (synthetic
      # groupings) have no single reported name; their prose names the
      # constituent agencies instead.
      def reported_as(slug, year)
        return nil if @mapping.portfolio(slug)&.dig('aggregate')

        display = portfolio_name(slug)
        raw = (@meso_portfolios[year][slug] || []).map(&:strip).reject(&:empty?).uniq.sort
        return nil if raw.empty? || raw == [display]

        raw.join('; ')
      end

      # Share of the Vol I published federal total, per year, from the same
      # net standard-object basis as totalSpending (spec §1) — computed across
      # every meso year exported in this run.
      def historical_share(slug)
        @meso_net.keys.sort.filter_map do |year|
          next unless @meso_net[year].key?(slug)

          total = @vol1_spending[year]
          next if total.nil? || total.zero?

          share = PbCli::Export::Units.dollars_to_billions(@meso_net[year][slug])
          { 'year' => year, 'percentage' => pct(share, total) }
        end
      end

      # Spending by entity = each organization's NET standard-object total
      # (Σ objects − external − internal revenues), the same figure the
      # miniSankey draws, so the stat card, chart, and entity list are one
      # number (spec §1).
      def entities(slug, year)
        (@meso_by_slug[year][slug] || {}).map do |org_name, agg|
          net = agg[:objects].values.sum - agg[:external] - agg[:internal]
          {
            'id' => "#{slug}-#{year}-entity-#{slugify(org_name)}",
            'name' => org_name,
            'value' => PbCli::Export::Units.dollars_to_billions(net)
          }
        end.reject { |e| e['value'].zero? }
          .sort_by { |e| [-e['value'], e['name']] }
      end

      # Effective portfolio for a transfer row: description-based reattribution
      # (agency programs reported under a host ministry) wins when the target
      # slug exists in that year's allotment data; otherwise the ministry-level
      # resolution stands, so no row ever vanishes from both pages.
      def transfer_slug(row, year)
        target = @mapping.transfer_reattribution_slug(row)
        return target if target && @slug_year_totals.dig(target, year)

        @mapping.resolve_slug(row)
      end

      def transfer_payments(slug, year)
        rows = transfers_for(year).reject { |r| r['is_total_or_subtotal'] }
                                  .select { |r| r['category'] && !r['category'].to_s.empty? }
                                  .select { |r| transfer_slug(r, year) == slug }
        rows.sort_by { |r| [r['category'].to_s, r['description'].to_s, r['position'].to_i] }
            .each_with_index.map do |r, i|
          {
            'id' => "#{slug}-#{year}-tp-#{format('%04d', i)}",
            'category' => r['category'],
            'description' => r['description'],
            'used' => PbCli::Export::Units.round_dollars(r['used_in_current_year'].to_f)
          }
        end
      end

      # Tree: department → organization → standard-object leaves (spec §B).
      # Object leaves are the twelve GC standard objects (positive gross
      # amounts); external and internal revenues are emitted as NEGATIVE leaves,
      # so each organization sums to its net expenditure and the chart matches
      # the old production breakdown. Zero leaves are dropped (keeping sums
      # exact); ids are stable/deterministic ({slug}-{year}-{org}-obj-{n}),
      # independent of label translation. Truncation + leaf-only amounts
      # (strip_parent_amounts) apply as for every other Sankey.
      def mini_sankey(year, slug)
        orgs = @meso_by_slug[year][slug] || {}
        attach_org = transfer_attach_org(year, slug, orgs)

        root = { 'id' => slug, 'name' => portfolio_name(slug), 'children' => [] }
        orgs.each do |org_name, agg|
          org_id = "#{slug}-#{year}-#{slugify(org_name)}"
          leaves = org_leaves(org_id, agg)
          next if leaves.empty?

          root['children'] << { 'id' => org_id, 'name' => org_name, 'children' => leaves }
        end
        # Org children of the root are truncated to top-N (departments can hold
        # 20+ agencies); each org already holds ≤ top-N leaves so this recursion
        # is a no-op at the leaf level.
        truncated = PbCli::Export::Truncation.truncate(assign_parent_amounts_ref(root), top_n: MINI_SANKEY_TOP_N)
        # Fan the surviving Transfer payments leaf out into named programs AFTER
        # truncation, so the generic Truncation never re-truncates the program
        # children (spec §2). Attaches to the dominant transfer organization.
        attach_transfer_programs(truncated, slug, year, attach_org) if attach_org
        truncated
      end

      # Replaces the attach organization's surviving "Transfer payments" object
      # leaf with its named-program children (spec §2). No-op when that org or
      # its transfer leaf was rolled into an aggregate by truncation.
      def attach_transfer_programs(tree, slug, year, attach_org)
        org_id = "#{slug}-#{year}-#{slugify(attach_org)}"
        org = tree['children'].find { |o| o['id'] == org_id }
        return unless org

        leaf = (org['children'] || []).find { |l| l['name'] == 'Transfer payments' }
        return unless leaf

        children = transfer_program_children(org_id, leaf['amount'], transfer_program_rows(slug, year))
        leaf['children'] = children if children
      end

      # The organization whose "Transfer payments" object leaf fans out into
      # named programs (drop-authorities spec §2). The transfers dataset is
      # ministry-keyed (no organization column), so program children attach to
      # the organization holding the LARGEST transfer-payments object, and only
      # when it holds ≥90% of the portfolio's total transfer-object amount (the
      # department org pays the transfers). Otherwise the object leaves stay
      # unsplit and the skip is logged. Returns the org name, or nil.
      def transfer_attach_org(year, slug, orgs)
        amounts = orgs.transform_values { |agg| agg[:objects]['Transfer payments'].to_f }
        total = amounts.values.sum
        return nil if PbCli::Export::Units.round_dollars(total).zero?

        org, amt = amounts.max_by { |_, v| v }
        share = amt / total
        return org if amt.positive? && share >= 0.90

        @transfer_split_skips << { year: year, slug: slug, share: (share * 100).round(1) }
        nil
      end

      # Transfer-payment program rows for the fanout, reusing the department
      # page's transferPayments ids/labels so existing French resolves.
      def transfer_program_rows(slug, year)
        transfer_payments(slug, year).map do |t|
          { id: t['id'], name: t['description'], dollars: t['used'].to_f }
        end
      end

      # An organization's leaves: standard-object leaves truncated to fit within
      # top-N, PLUS the external/internal revenue leaves, which always survive
      # (the net presentation — and matching the old chart — needs them, so they
      # are never rolled into "Other"). Total leaf count stays within top-N.
      def org_leaves(org_id, agg)
        objects = object_leaves(org_id, agg[:objects])
        revenues = revenue_leaves(org_id, agg)
        slots = MINI_SANKEY_TOP_N - revenues.size
        return objects + revenues if objects.size <= slots

        kept = PbCli::Export::Truncation.truncate({ 'id' => org_id, 'children' => objects }, top_n: slots - 1)
        kept['children'] + revenues
      end

      # Positive standard-object leaves in the canonical 1..12 order; the object
      # number is kept in the id so leaves are stable across editions/languages.
      def object_leaves(org_id, objects)
        PbCli::Export::StandardObjects::OBJECTS.each_with_index.filter_map do |name, i|
          dollars = objects[name]
          next if PbCli::Export::Units.round_dollars(dollars).zero?

          {
            'id' => "#{org_id}-obj-#{i + 1}",
            'name' => name,
            'amount' => PbCli::Export::Units.dollars_to_billions(dollars)
          }
        end
      end

      # Named transfer-program children of the Transfer payments object leaf,
      # scaled pro-rata (scale-to-line) so they sum EXACTLY to the object's net
      # amount (billions). Zero rows are dropped; the top programs survive and
      # the rest roll into "Other transfer programs" so the child count stays
      # within top-N. Returns nil when no positive program remains.
      def transfer_program_children(org_id, object_billions, programs)
        positive = programs.select { |p| p[:dollars].positive? }
        raw_sum = positive.sum { |p| p[:dollars] }
        return nil if positive.empty? || raw_sum <= 0

        factor = object_billions * PbCli::Export::Units::BILLION / raw_sum
        leaves = positive.map do |p|
          { 'id' => p[:id], 'name' => p[:name],
            'amount' => PbCli::Export::Units.dollars_to_billions(p[:dollars] * factor) }
        end.reject { |l| l['amount'].zero? }
        return nil if leaves.empty?

        leaves = leaves.sort_by { |l| [-l['amount'], l['name'].to_s] }
        leaves = collapse_transfer_tail(org_id, leaves) if leaves.size > MINI_SANKEY_TOP_N
        enforce_exact_transfer_sum(leaves, object_billions)
        leaves
      end

      # Rolls the tail beyond top-N-1 into a single "Other transfer programs"
      # aggregate so the fanout holds ≤ top-N children.
      def collapse_transfer_tail(org_id, leaves)
        kept = leaves.first(MINI_SANKEY_TOP_N - 1)
        rest = leaves.drop(MINI_SANKEY_TOP_N - 1)
        kept + [{
          'id' => "#{org_id}-tp-other",
          'name' => 'Other transfer programs',
          'amount' => PbCli::Export::Units.round_billions(rest.sum { |l| l['amount'] }),
          'isAggregate' => true,
          'count' => rest.size
        }]
      end

      # Absorbs the pro-rata rounding residual into the aggregate (or, absent
      # one, the largest leaf) so Σ children == the object's net amount exactly.
      def enforce_exact_transfer_sum(leaves, object_billions)
        diff = PbCli::Export::Units.round_billions(object_billions - leaves.sum { |l| l['amount'] })
        return if diff.zero?

        target = leaves.find { |l| l['isAggregate'] } || leaves.first
        target['amount'] = PbCli::Export::Units.round_billions(target['amount'] + diff)
      end

      # External/internal revenues as NEGATIVE leaves (net presentation).
      def revenue_leaves(org_id, agg)
        [
          [agg[:external], 'external-revenues', PbCli::Export::StandardObjects::EXTERNAL_REVENUE_LABEL],
          [agg[:internal], 'internal-revenues', PbCli::Export::StandardObjects::INTERNAL_REVENUE_LABEL]
        ].filter_map do |dollars, id_suffix, name|
          next if PbCli::Export::Units.round_dollars(dollars).zero?

          {
            'id' => "#{org_id}-#{id_suffix}",
            'name' => name,
            'amount' => -PbCli::Export::Units.dollars_to_billions(dollars)
          }
        end
      end

      def assign_parent_amounts_ref(root)
        assign_parent_amounts(root)
        root
      end

      # --- index -----------------------------------------------------------

      def write_index(years)
        departments_by_year = {}
        years.sort.each { |y| departments_by_year[y.to_s] = slugs_for(y) }
        all_slugs = years.flat_map { |y| slugs_for(y) }.uniq.sort
        ministries = all_slugs.map { |s| { 'slug' => s, 'name' => portfolio_name(s) } }

        write_json(File.join(@out_dir, 'index.json'), {
          'years' => years.sort,
          'latestYear' => years.max,
          'defaultYear' => years.include?(DEFAULT_YEAR) ? DEFAULT_YEAR : years.max,
          'generatedAt' => @timestamp,
          'updatedAt' => @timestamp,
          'source' => SOURCE,
          'source_url' => SOURCE_URL,
          'ministries' => ministries,
          'departmentsByYear' => departments_by_year
        })
      end

      # --- validation & reporting -----------------------------------------

      def assert_tree_balanced(year, node)
        children = node['children']
        return unless children && !children.empty?

        child_sum = children.sum { |c| c['amount'] || 0 }
        delta = (child_sum - (node['amount'] || 0)).abs
        if delta > 0.001 # >$1M in billions
          record_error(year, "sankey node #{node['id']} children sum #{child_sum} deviates from node total #{node['amount']} by #{delta}B (>$1M)")
        end
        children.each { |c| assert_tree_balanced(year, c) }
      end

      def record_error(year, message)
        @errors << { year: year, message: message }
      end

      def finalize(exported)
        write_errors_report(exported)
        unless @recon_warnings.empty?
          puts ::CLI::UI.fmt("{{i}} #{@recon_warnings.size} miniSankey reconciliation note(s) (non-blocking). See #{@errors_path}")
        end
        if @errors.empty? && @excluded.empty?
          puts ::CLI::UI.fmt("{{v}} Exported #{exported.size} year(s): #{exported.sort.join(', ')}")
          return 0
        end

        puts ::CLI::UI.fmt("{{x}} #{@errors.size} error(s); #{@excluded.size} year(s) excluded. See #{@errors_path}")
        puts ::CLI::UI.fmt("{{v}} Shipped #{exported.size} year(s): #{exported.sort.join(', ')}") unless exported.empty?
        @errors.empty? ? 0 : 1
      end

      def report_empty?
        @errors.empty? && @excluded.empty? && @recon_warnings.empty? &&
          (@transfer_split_skips || []).empty? && (@segment_scales || {}).empty?
      end

      def write_errors_report(exported)
        return File.delete(@errors_path) if report_empty? && File.exist?(@errors_path)
        return if report_empty?

        lines = ["# Federal export report", '', "Generated: #{@timestamp}", '',
                 "Shipped years: #{exported.sort.join(', ')}", '']
        unless @excluded.empty?
          lines << '## Excluded years' << ''
          @excluded.sort.each { |y, reason| lines << "- **#{y}**: #{reason}" }
          lines << ''
        end
        append_scale_section(lines, exported)
        append_transfer_skip_section(lines) unless @transfer_split_skips.empty?
        append_recon_section(lines) unless @recon_warnings.empty?
        unless @errors.empty?
          lines << '## Validation errors' << ''
          @errors.group_by { |e| e[:year] }.sort.each do |year, errs|
            lines << "### #{year} (#{errs.size})" << ''
            errs.first(50).each { |e| lines << "- #{e[:message]}" }
            lines << "- …and #{errs.size - 50} more" if errs.size > 50
            lines << ''
          end
        end
        File.write(@errors_path, lines.join("\n"))
      end

      # Informational (always reported): per-year Vol I Table 3.6 restatement
      # scale factors. factor = (statement total − actuarial) / (3.6 total −
      # actuarial segment); ≤2019 editions predate the net-actuarial split, so
      # the statement's actuarial amount is carved out of the portfolios by the
      # same proportional scaling (the "carve" share of the deviation).
      def append_scale_section(lines, exported)
        scaled = (@segment_scales || {}).select { |y, _| exported.include?(y) }.sort
        return if scaled.empty?

        lines << '## Vol I Table 3.6 restatement scaling (informational)' << ''
        lines << 'Portfolio totals are scaled to tie to the restated Consolidated Statement of ' \
                 'Operations total (guard: restatement deviation ≤ 1% after the actuarial ' \
                 'carve-out allowance for editions predating the net-actuarial-losses split).'
        lines << ''
        scaled.each do |year, s|
          lines << format('- **%d**: factor %.5f (deviation %.4f%%, actuarial carve-out %.4f%%, restatement %.4f%%)',
                          year, s[:factor], s[:deviation] * 100, s[:carve] * 100,
                          (s[:deviation] - s[:carve]) * 100)
        end
        lines << ''
      end

      # Non-blocking miniSankey ↔ allotment reconciliation notes. The
      # standard-object GROSS total should track Vol II allotment expenditures
      # within max(2%, $50M); documented systematic causes exceed that floor
      # without invalidating the breakdown (see NOTES.md "Standard-object
      # reconciliation").
      def append_recon_section(lines)
        lines << '## miniSankey standard-object reconciliation (non-blocking)' << ''
        lines << 'Standard-object GROSS total vs Vol II allotment expenditures, $B. ' \
                 'Out-of-tolerance department-years below have documented systematic causes ' \
                 '(net-voted common services, pre-2018 presentation basis, ' \
                 'and portfolio scope — see NOTES.md).'
        lines << ''
        @recon_warnings.group_by { |w| w[:year] }.sort.each do |year, ws|
          lines << "### #{year} (#{ws.size})" << ''
          ws.sort_by { |w| w[:slug] }.each do |w|
            lines << format('- **%s**: allotment %.3f, standard-object gross %.3f, Δ %+.3f (tol ±%.3f)',
                            w[:slug], w[:allotment], w[:gross], w[:delta], w[:tolerance])
          end
          lines << ''
        end
      end

      # --- helpers ---------------------------------------------------------

      def slugs_for(year)
        @slug_year_totals.keys.select { |s| @slug_year_totals[s].key?(year) }.sort
      end

      def allotments_for(year)
        (@allotments_by_year ||= @allotments.group_by { |r| r['year'] })[year] || []
      end

      def transfers_for(year)
        (@transfers_by_year ||= @transfers.group_by { |r| r['year'] })[year] || []
      end

      def portfolio_name(slug)
        @mapping.portfolio(slug)&.dig('name_en') || slug
      end

      def sum_amounts(nodes)
        PbCli::Export::Units.round_billions(nodes.sum { |n| n['amount'] || 0 })
      end

      def pct(part, whole)
        return 0.0 if whole.nil? || whole.zero?

        ((part / whole) * 100).round(4)
      end

      def fiscal_year_label(year)
        "#{year - 1}-#{year.to_s[-2, 2]}"
      end


      def slugify(str)
        str.to_s.downcase.gsub(/[^a-z0-9]+/, '-').gsub(/\A-|-\z/, '')
      end

      # --- transfer-fanout reporting ---------------------------------------

      # Portfolios/years where the transfer object stays unsplit because no
      # single organization holds ≥90% of the portfolio's transfer-object
      # amount (drop-authorities spec §2). Non-blocking, documented.
      def append_transfer_skip_section(lines)
        lines << '## Transfer-program fanout skips (non-blocking)' << ''
        lines << 'Transfer objects left unsplit because no organization holds ≥90% of the ' \
                 "portfolio's transfer-payments object that year (program children can only " \
                 'attach to a single dominant organization — the transfers dataset is ' \
                 'ministry-keyed).'
        lines << ''
        @transfer_split_skips.group_by { |s| s[:year] }.sort.each do |year, skips|
          lines << "### #{year} (#{skips.size})" << ''
          skips.sort_by { |s| s[:slug] }.each do |s|
            lines << format('- **%s**: largest organization holds %.1f%% of the transfer object (<90%%)', s[:slug], s[:share])
          end
          lines << ''
        end
      end

      def write_json(path, data)
        File.write(path, JSON.pretty_generate(data) + "\n")
      end
    end
  end
end
