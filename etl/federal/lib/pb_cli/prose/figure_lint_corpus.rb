require 'json'
require 'yaml'
require 'pb_cli/prose/figure_lint'

module PbCli
  module Prose
    # Walks data/federal, builds the reference figure sets for every reviewed
    # department-year prose file, and runs FigureLint over each. Used by both
    # the `pb prose-figures` command and the rake guardrail.
    class FigureLintCorpus
      def initialize(data_dir:, allowlist_path: nil)
        @data_dir = data_dir
        @allowlist = load_allowlist(allowlist_path)
        @summaries = load_summaries
      end

      # Returns [{ file:, rel:, violations: [..] }, ...] for reviewed files only.
      def run
        prose_files.filter_map do |path|
          text = File.read(path)
          next unless FigureLint.reviewed?(text)

          rel = path.sub(%r{\A#{Regexp.escape(@data_dir)}/?}, '')
          year, slug, lang = parse_path(path)
          dept = load_dept(year, slug)
          body = FigureLint.strip_body(text)
          violations = FigureLint.check_body(
            body,
            dollar_refs: dollar_refs(year, dept),
            percent_refs: percent_refs(dept),
            lang: lang,
            allow: @allowlist[rel] || []
          )
          { file: path, rel: rel, violations: violations }
        end
      end

      private

      def prose_files
        Dir.glob(File.join(@data_dir, '*', 'departments', '*.prose.*.md')).sort
      end

      def parse_path(path)
        year = File.basename(File.dirname(File.dirname(path))).to_i
        base = File.basename(path) # slug.prose.en.md
        slug = base.split('.prose.').first
        lang = base[/\.prose\.(\w+)\.md\z/, 1]
        [year, slug, lang]
      end

      def load_summaries
        summaries = {}
        Dir.glob(File.join(@data_dir, '*', 'summary.json')).each do |f|
          data = JSON.parse(File.read(f)) rescue next
          year = File.basename(File.dirname(f)).to_i
          summaries[year] = data
        end
        summaries
      end

      def load_dept(year, slug)
        path = File.join(@data_dir, year.to_s, 'departments', "#{slug}.json")
        return nil unless File.exist?(path)

        JSON.parse(File.read(path))
      rescue JSON::ParserError
        nil
      end

      def load_workforce(year)
        path = File.join(@data_dir, year.to_s, 'workforce.json')
        return nil unless File.exist?(path)

        JSON.parse(File.read(path))
      rescue JSON::ParserError
        nil
      end

      # Dollar references, all in $ billions. Every year's federal total (for
      # cross-year claims like the COVID paragraph), plus this department's own
      # total, entity values, mini-Sankey leaf amounts, transfer-payment
      # amounts, and the federal personnel-spending total.
      def dollar_refs(year, dept)
        refs = @summaries.values.map { |s| round6(s['totalSpending']) }
        if dept
          refs << round6(dept['totalSpending'])
          (dept['entities'] || []).each { |e| refs << round6(e['value'].abs) }
          walk_leaves(dept.dig('miniSankey', 'spending_data')) { |amt| refs << round6(amt.abs) }
          (dept['transferPayments'] || []).each do |tp|
            used = tp['used']
            refs << round6(used.abs / 1e9) if used
          end
        end
        wf = load_workforce(year)
        refs << round6(wf['personnelSpending']) if wf && wf['personnelSpending']
        refs.uniq
      end

      # Percentage references: this department's federal share, its historical
      # share series, and every leaf/entity/transfer amount expressed as a % of
      # the department total.
      def percent_refs(dept)
        return [] unless dept

        refs = [round4(dept['percentageOfFederal'])]
        (dept['historicalShare'] || []).each { |h| refs << round4(h['percentage']) }
        tot = dept['totalSpending'].to_f
        if tot.positive?
          walk_leaves(dept.dig('miniSankey', 'spending_data')) { |amt| refs << round4(amt.abs / tot * 100) }
          (dept['entities'] || []).each { |e| refs << round4(e['value'].abs / tot * 100) }
          (dept['transferPayments'] || []).each do |tp|
            used = tp['used']
            refs << round4(used.abs / 1e9 / tot * 100) if used
          end
        end
        refs.uniq
      end

      def walk_leaves(node, &block)
        return unless node

        amt = node['amount']
        block.call(amt) unless amt.nil?
        (node['children'] || []).each { |c| walk_leaves(c, &block) }
      end

      def round6(x) = x.to_f.round(6)
      def round4(x) = x.to_f.round(4)

      def load_allowlist(path)
        return {} unless path && File.exist?(path)

        (YAML.safe_load(File.read(path)) || {})['files'] || {}
      end
    end
  end
end
