require 'yaml'

module PbCli
  module Export
    # Loads ministry_slugs.yaml + thematic_tree.yaml and resolves Vol II rows to
    # (a) a portfolio slug and (b) a thematic-tree node id. Matching precedence
    # (spec §6): line > organization > ministry_name > ministry. Two matches at
    # the SAME precedence level are a conflict (raised at load time). This is the
    # canonical version of mappings/check_coverage.rb, reused by the exporter.
    class Mapping
      DASH_RE = /[‑–]/ # non-breaking hyphen, en dash -> "-"
      NOISE_NAME = 'Public Accounts of Canada'.freeze

      LineRule = Struct.new(:regexp, :ministry, :organization, :node_id)

      attr_reader :portfolios, :themes, :vol1_nodes, :vol1_rules, :segment_rules

      def initialize(slugs_path, tree_path)
        @slugs = YAML.load_file(slugs_path)
        @tree = YAML.load_file(tree_path)
        build_slug_lookup
        build_rules
        detect_conflicts
      end

      # --- slug resolution -------------------------------------------------

      # Precedence: organization override > ministry name > ministry-code
      # override. Organization overrides let a portfolio (e.g. the merged
      # regional-development grouping) follow an agency across whichever host
      # ministry reports it in a given year.
      def resolve_slug(row)
        org = normalize_dashes(row['organization'])
        unless org.empty?
          slug = @org_to_slug[org]
          return slug if slug
        end
        name = row['ministry_name_normalized']
        name = nil if name == NOISE_NAME
        if name
          slug = @name_to_slug[normalize_dashes(name)]
          return slug if slug
        end
        override = @override_lookup[row['ministry_code']]
        if override && (override['years'].nil? || override['years'].include?(row['year']))
          return override['slug']
        end

        nil
      end

      # --- standard-object (meso dataset) resolution ----------------------

      # The dmac-meso dataset carries raw Public Accounts portfolio labels
      # (e.g. "Innovation,Science and Economic Development", "Foreign
      # Affairs,Trade and Development") that differ from the modernized
      # `ministry_name_normalized` values the allotment extraction produced,
      # and it leaves footnote/whitespace artifacts. These two helpers resolve
      # a meso row the same way the allotment side resolves, tolerating those
      # differences: matching is done on a space-insensitive normalized key
      # (dashes unified, <sup> stripped, whitespace and case removed) so
      # "Innovation,Science…" and "Innovation, Science…" collide, and a small
      # crosswalk (meso_portfolio_aliases) covers genuinely renamed portfolios.
      #
      # Organization overrides (the RDA merge) apply directly — meso rows DO
      # carry an organization column — but the caller guards them by year (an
      # override only wins when its target slug has allotment data that year),
      # mirroring transfer_reattribution_slug so meso and allotment stay
      # consistent in the 2016–2018 window where RDAs have no separate page.

      # Slug for a meso organization via organization_overrides, or nil.
      def organization_override_slug(organization)
        @org_to_slug_ci[normalize_ci(organization)]
      end

      # Slug for a meso portfolio label (ministries list + meso aliases), or nil.
      def meso_portfolio_slug(portfolio)
        key = normalize_ci(portfolio)
        @meso_alias_ci[key] || @name_to_slug_ci[key]
      end

      # Slug for a Vol I Table 3.6 (cest-eest) portfolio label, or nil. Segment
      # aliases win, then the meso lookup (ministries list + meso aliases).
      def segment_portfolio_slug(portfolio)
        @segment_alias_ci[normalize_ci(portfolio)] || meso_portfolio_slug(portfolio)
      end

      # Host slug that absorbs `slug` in the 3.6 accrual allocation when `slug`
      # has no 3.6 portfolio of its own that year, or nil (its own group).
      def segment_host_slug(slug)
        @segment_hosts[slug]
      end

      # Transfer rows carry no organization column, so organization_overrides
      # cannot follow an agency's transfer payments into its host ministry.
      # transfer_reattributions moves rows by (host ministry + description
      # pattern) instead. Returns the target slug, or nil when no rule matches
      # (callers fall back to resolve_slug). The caller must guard by year:
      # only reattribute when the target slug actually exists in that year's
      # allotment data, otherwise rows would vanish from both pages.
      def transfer_reattribution_slug(row)
        ministry = normalize_dashes(row['ministry_name_normalized'])
        desc = row['description'].to_s
        @transfer_reattributions.each do |rule|
          next unless rule[:ministries].include?(ministry)
          return rule[:slug] if rule[:patterns].any? { |re| re.match?(desc) }
        end

        nil
      end

      # --- thematic node resolution ---------------------------------------

      # Returns the node id an allotment row maps to, honoring precedence.
      def match_node(row, slug)
        desc = row['description'].to_s
        @line_rules.each do |lr|
          next if lr.ministry && lr.ministry != slug
          next if lr.organization && lr.organization != row['organization']
          return lr.node_id if lr.regexp.match?(desc)
        end
        org = row['organization']
        return @org_rules[org].first if org && @org_rules[org]
        raw = row['ministry_name_normalized']
        return @ministry_name_rules[raw].first if raw && @ministry_name_rules[raw]
        return @ministry_rules[slug].first if @ministry_rules[slug]

        nil
      end

      # Portfolio metadata for a slug (name_en/name_fr/existing_page).
      def portfolio(slug)
        @portfolio_by_slug[slug]
      end

      def vol1_rules_for(node_id)
        @vol1_rules.select { |r| r['node_id'] == node_id }
      end

      def segment_rules_for(node_id)
        @segment_rules.select { |r| r['node_id'] == node_id }
      end

      def normalize_dashes(str)
        str.to_s.gsub(DASH_RE, '-')
      end

      # Space-insensitive key for meso label matching (see the meso helpers).
      def normalize_ci(str)
        str.to_s.gsub(%r{<sup>.*?</sup>}, '').gsub(DASH_RE, '-').downcase.gsub(/\s+/, '')
      end

      private

      def build_slug_lookup
        @name_to_slug = {}
        @portfolio_by_slug = {}
        @portfolios = @slugs['portfolios']
        @portfolios.each do |p|
          @portfolio_by_slug[p['slug']] = p
          p['ministries'].each { |m| @name_to_slug[normalize_dashes(m)] = p['slug'] }
        end
        @override_lookup = {}
        (@slugs['overrides'] || []).each { |o| @override_lookup[o['code']] = o }
        @org_to_slug = {}
        @org_to_slug_ci = {}
        (@slugs['organization_overrides'] || []).each do |o|
          @org_to_slug[normalize_dashes(o['organization'])] = o['slug']
          @org_to_slug_ci[normalize_ci(o['organization'])] = o['slug']
        end
        # Space-insensitive portfolio + meso-alias lookups for the standard
        # object (meso) dataset, whose labels carry PA-era wording and
        # footnote/whitespace artifacts (see the meso resolution helpers).
        @name_to_slug_ci = {}
        @portfolios.each do |p|
          p['ministries'].each { |m| @name_to_slug_ci[normalize_ci(m)] = p['slug'] }
        end
        @meso_alias_ci = {}
        (@slugs['meso_portfolio_aliases'] || []).each do |a|
          @meso_alias_ci[normalize_ci(a['portfolio'])] = a['slug']
        end
        @segment_alias_ci = {}
        (@slugs['segment_portfolio_aliases'] || []).each do |a|
          @segment_alias_ci[normalize_ci(a['portfolio'])] = a['slug']
        end
        @segment_hosts = {}
        (@slugs['segment_hosts'] || []).each { |h| @segment_hosts[h['slug']] = h['host'] }
        @transfer_reattributions = (@slugs['transfer_reattributions'] || []).map do |r|
          {
            slug: r['slug'],
            ministries: r['host_ministries'].map { |m| normalize_dashes(m) },
            patterns: r['description_patterns'].map { |p| Regexp.new(p, Regexp::IGNORECASE) }
          }
        end
      end

      def build_rules
        @ministry_rules = {}
        @ministry_name_rules = {}
        @org_rules = {}
        @line_rules = []
        @vol1_nodes = []
        @vol1_rules = []
        @segment_rules = []
        @themes = @tree['themes']
        @themes.each { |t| walk_node(t) }
      end

      def walk_node(node)
        (node['rules'] || []).each do |r|
          if r['source'] == 'vol1'
            @vol1_nodes << { 'id' => node['id'], 'hint' => r['vol1_hint'] }
            @vol1_rules << r.merge('node_id' => node['id'])
          elsif r['source'] == 'segment'
            @segment_rules << r.merge('node_id' => node['id'])
          elsif r['line']
            @line_rules << LineRule.new(Regexp.new(r['line']), r['ministry'], r['organization'], node['id'])
          elsif r['organization']
            (@org_rules[r['organization']] ||= []) << node['id']
          elsif r['ministry_name']
            (@ministry_name_rules[r['ministry_name']] ||= []) << node['id']
          elsif r['ministry']
            (@ministry_rules[r['ministry']] ||= []) << node['id']
          end
        end
        (node['children'] || []).each { |c| walk_node(c) }
      end

      def detect_conflicts
        dups = {}
        @ministry_rules.each { |k, v| dups["ministry:#{k}"] = v if v.uniq.size > 1 }
        @org_rules.each { |k, v| dups["organization:#{k}"] = v if v.uniq.size > 1 }
        @ministry_name_rules.each { |k, v| dups["ministry_name:#{k}"] = v if v.uniq.size > 1 }
        return if dups.empty?

        raise "thematic_tree.yaml rule conflicts (same-level duplicate targets): #{dups.inspect}"
      end
    end
  end
end
