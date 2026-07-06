require 'cli/ui'
require 'fileutils'
require 'json'
require 'set'
require 'time'
require_relative '../export/cpi'
require_relative '../export/major_transfers'
require_relative '../export/mapping'
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
      # Per-department miniSankey reconciliation floor (spec §B): the larger of
      # 2% or $50M. Compared against Vol II allotment expenditures, which equal
      # the standard-object GROSS total (Σ objects) for the same ministerial
      # scope — verified exact for e.g. National Defence / Justice / Treasury
      # Board. Systematic exceedances (net-voted common services, pre-2018
      # presentation, scope) are documented, not blocking (see NOTES.md).
      MESO_RECON_TOLERANCE_B = 0.05

      # Known published consolidated totals ($B) for headline validation.
      # 2024 is the site's current anchor; others documented in export_errors.md.
      PUBLISHED_TOTALS = {
        2024 => { spending: 513.94, revenue: 459.53 }
      }.freeze

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
        @cpi = PbCli::Export::Cpi.new(@cpi_path, base_year: BASE_YEAR)
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
        @vol1_spending = {}
        @vol1_revenue = {}

        years.each do |year|
          @vol1_spending[year] = @vol1.year?(year) ? @vol1.total_spending(year) : nil
          @vol1_revenue[year] = @vol1.year?(year) ? @vol1.total_revenue(year) : nil
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
          end
          slug_dollars.each { |slug, d| @slug_year_totals[slug][year] = PbCli::Export::Units.dollars_to_billions(d) }
          apply_vol1_offsets(year) if @vol1.year?(year)

          # transfer-payment slug coverage (dept pages only; never feed the tree)
          transfers_for(year).each do |row|
            next if row['is_total_or_subtotal']

            slug = @mapping.resolve_slug(row)
            record_error(year, "transfer-payment row without slug: code=#{row['ministry_code'].inspect} name=#{row['ministry_name_normalized'].inspect}") if slug.nil?
          end
        end
      end

      # Standard-object (dmac-meso) rows, resolved to portfolio slugs and
      # aggregated per (year, slug, organization). Feeds the department
      # miniSankey and the per-department reconciliation. Runs after
      # precompute_year_totals so the RDA org-override guard can consult which
      # slugs actually have allotment data in a given year.
      def precompute_meso(years)
        @meso_by_slug = Hash.new { |h, k| h[k] = {} }
        @meso_gross = Hash.new { |h, k| h[k] = Hash.new(0.0) }
        @meso_orphans = Hash.new(0.0)

        years.each do |year|
          next unless @standard_objects.year?(year)

          valid = @slug_year_totals.keys.select { |s| @slug_year_totals[s].key?(year) }.to_set
          @standard_objects.rows(year).each do |row|
            slug = meso_slug(row, valid)
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
          end
        end
      end

      # Portfolio slug for a meso row. Organization overrides (the RDA merge)
      # win, but only when the target slug has allotment data that year — in
      # 2016–2018 RDAs have no separate page, so those rows fall back to the
      # host portfolio, exactly as the allotment side keeps them (NOTES.md).
      def meso_slug(row, valid_slugs)
        override = @mapping.organization_override_slug(row.organization)
        return override if override && valid_slugs.include?(override)

        @mapping.meso_portfolio_slug(row.portfolio)
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
      # scope, the FY2020–21 governor-general allotment code-noise artifact) are
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
        spending = {
          'id' => 'spending', 'name' => 'Spending',
          'amount' => sum_amounts(themes), 'children' => themes
        }
        revenue = build_revenue_tree(year)
        [spending, revenue]
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

      # Vol II-mapped dollars (post-offset) plus any Vol I-sourced amounts.
      def leaf_amount(year, node)
        vol2 = @node_year_totals[year][node['id']]
        vol1 = @mapping.vol1_rules_for(node['id']).sum { |r| vol1_rule_dollars(year, r) }
        PbCli::Export::Units.round_billions((vol2 + vol1) / PbCli::Export::Units::BILLION)
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

      def vol1_rule_dollars(year, rule)
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
        touched = []
        @mapping.vol1_rules.each do |rule|
          target = rule['offset_node']
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
        ministries = slugs_for(year).map do |slug|
          spend = @slug_year_totals[slug][year]
          {
            'name' => portfolio_name(slug),
            'slug' => slug,
            'totalSpending' => spend,
            'percentage' => pct(spend, total),
            'basis' => 'vol2_appropriations'
          }
        end.sort_by { |m| [-m['totalSpending'], m['slug']] }

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
          'note' => 'Unattributed remainder: consolidated Crown corporations, accrual items, and gross (Vol II) vs net (Vol I) presentation differences.'
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
      # appropriations (tax-system / specified-purpose-account items) — they
      # are the named part of the Vol I ↔ Vol II difference. Net actuarial
      # losses are excluded from the Vol I headline total, so not an item.
      def vol1_only_items(year)
        @mapping.vol1_rules
                .reject { |r| r['offset_node'] || r['node_id'] == 'net-actuarial-losses' }
                .map do |rule|
          {
            'id' => "recon-#{year}-#{rule['node_id']}",
            'name' => Array(rule['vol1_line']).first,
            'amount' => @vol1.line_amount_billions(year, rule['vol1_line']),
            'note' => 'Vol I consolidated expense line, not present in Vol II appropriations.'
          }
        end
      end

      # --- department pages ------------------------------------------------

      def department_payload(year, slug)
        rows = allotments_for(year).reject { |r| r['is_total_or_subtotal'] }
                                   .select { |r| @mapping.resolve_slug(r) == slug }
        total = @slug_year_totals[slug][year]
        vol1_total = @vol1.total_spending(year)

        {
          'name' => portfolio_name(slug),
          'slug' => slug,
          'financialYearEnding' => year,
          'reportedAs' => reported_as(slug, rows),
          'basis' => 'vol2_appropriations',
          'totalSpending' => total,
          'percentageOfFederal' => pct(total, vol1_total),
          'historicalShare' => historical_share(slug),
          'miniSankey' => {
            'breakdown' => 'standard_object',
            'spending_data' => strip_parent_amounts(mini_sankey(year, slug))
          },
          'entities' => entities(slug, year, rows),
          'votes' => votes(slug, year, rows),
          'transferPayments' => transfer_payments(slug, year),
          'lineItemsUnits' => 'dollars_cad'
        }
      end

      # Grouping/display label for a row's organization. Years without an
      # organization breakdown (blank) or with the generic "Department"
      # placeholder fall back to the raw ministry name, so rows from different
      # ministries merged into one portfolio never collapse into a single
      # blank entity.
      def org_label(row)
        org = row['organization'].to_s.strip
        return row['ministry_name'].to_s if org.empty? || org == 'Department'

        org
      end

      # Historical ministry name(s) as printed in that year's Public Accounts,
      # when they differ from the portfolio's current display name (spec §4.3).
      # Aggregate portfolios (synthetic groupings) have no single historical
      # name; their prose names the constituent agencies instead.
      def reported_as(slug, rows)
        return nil if @mapping.portfolio(slug)&.dig('aggregate')

        display = portfolio_name(slug)
        raw = rows.map { |r| r['ministry_name'].to_s.strip }.reject(&:empty?).uniq.sort
        return nil if raw.empty? || raw == [display]

        raw.join('; ')
      end

      def historical_share(slug)
        @slug_year_totals[slug].keys.sort.filter_map do |year|
          total = @vol1_spending[year]
          next if total.nil? || total.zero?

          { 'year' => year, 'percentage' => pct(@slug_year_totals[slug][year], total) }
        end
      end

      def entities(slug, year, rows)
        by_org = Hash.new(0.0)
        rows.each { |r| by_org[org_label(r)] += r['expenditures'].to_f }
        by_org.map do |org, dollars|
          {
            'id' => "#{slug}-#{year}-entity-#{slugify(org)}",
            'name' => org,
            'value' => PbCli::Export::Units.dollars_to_billions(dollars)
          }
        end.sort_by { |e| [-e['value'], e['name']] }
      end

      def votes(slug, year, rows)
        grouped = Hash.new { |h, k| h[k] = { available: 0.0, used: 0.0, org: nil, vote: nil, num: nil } }
        rows.each do |r|
          key = [org_label(r), r['vote_number'], r['vote'].to_s]
          g = grouped[key]
          g[:org] = org_label(r)
          g[:vote] = r['vote'].to_s
          g[:num] = r['vote_number']
          g[:available] += r['allotments'].to_f
          g[:used] += r['expenditures'].to_f
        end
        grouped.map do |key, g|
          available = PbCli::Export::Units.round_dollars(g[:available])
          used = PbCli::Export::Units.round_dollars(g[:used])
          label, desc = split_vote(g[:vote])
          {
            'id' => "#{slug}-#{year}-#{slugify(g[:org])}-vote#{g[:num]}",
            'vote' => label,
            'description' => desc,
            'totalAvailable' => available,
            'used' => used,
            'lapsed' => available - used
          }
        end.sort_by { |v| [v['id']] }
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
        root = { 'id' => slug, 'name' => portfolio_name(slug), 'children' => [] }
        (@meso_by_slug[year][slug] || {}).each do |org_name, agg|
          org_id = "#{slug}-#{year}-#{slugify(org_name)}"
          leaves = org_leaves(org_id, agg)
          next if leaves.empty?

          root['children'] << { 'id' => org_id, 'name' => org_name, 'children' => leaves }
        end
        # Org children of the root are truncated to top-N (departments can hold
        # 20+ agencies); each org already holds ≤ top-N leaves so this recursion
        # is a no-op at the leaf level.
        PbCli::Export::Truncation.truncate(assign_parent_amounts_ref(root), top_n: MINI_SANKEY_TOP_N)
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
        @errors.empty? && @excluded.empty? && @recon_warnings.empty?
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

      # Non-blocking miniSankey ↔ allotment reconciliation notes. The
      # standard-object GROSS total should track Vol II allotment expenditures
      # within max(2%, $50M); documented systematic causes exceed that floor
      # without invalidating the breakdown (see NOTES.md "Standard-object
      # reconciliation").
      def append_recon_section(lines)
        lines << '## miniSankey standard-object reconciliation (non-blocking)' << ''
        lines << 'Standard-object GROSS total vs Vol II allotment expenditures, $B. ' \
                 'Out-of-tolerance department-years below have documented systematic causes ' \
                 '(net-voted common services, pre-2018 presentation basis, portfolio scope, ' \
                 'and the FY2020–21 governor-general allotment code-noise artifact — see NOTES.md).'
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

      def split_vote(vote)
        # Source strings separate the vote number from its description with a
        # non-breaking space (U+00A0) + em/en dash, e.g. "Vote 1 —Operating
        # expenditures". Normalize NBSP so \s matches, then split on the dash.
        cleaned = vote.to_s.gsub(/\u00A0/, ' ').strip.gsub(/[—–-]+\s*\z/, '').strip
        m = cleaned.match(/\A(Vote\s+\d+[a-z]?)\s*[—–-]\s*(.*)\z/)
        return [m[1].strip, m[2].strip] if m
        # Statutory rows carry a bare "Statutory amounts" label (also used as
        # the miniSankey leaf name — keep it verbatim); older editions
        # (2016-2018) publish no vote text at all. Always fill the description
        # column so line-item tables never show blank rows.
        return [cleaned, cleaned] if cleaned.match?(/statutory/i)
        return ['All votes', 'Total appropriations (vote-level detail not published for this edition)'] if cleaned.empty?

        ['', cleaned]
      end

      def slugify(str)
        str.to_s.downcase.gsub(/[^a-z0-9]+/, '-').gsub(/\A-|-\z/, '')
      end

      def write_json(path, data)
        File.write(path, JSON.pretty_generate(data) + "\n")
      end
    end
  end
end
