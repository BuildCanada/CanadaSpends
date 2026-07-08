require 'json'

module PbCli
  module I18n
    # Walks one year's exported JSON (sankey.json, departments/*.json,
    # reconciliation.json) and collects every translatable (id, EN text)
    # pair -- spec §8: "Export emits every EN label with its stable id."
    #
    # Ids are collected exactly as the site loader (src/lib/federal.ts) keys
    # its French lookups: sankey (and mini-sankey) node names by node `id`
    # (including the transfer-program leaves, whose ids reuse the
    # transfer-payment ids); department display names by the department `slug`;
    # entity names and transfer-payment descriptions by their own ids;
    # reconciliation item names by their ids.
    class Collector
      def initialize(year_dir)
        @year_dir = year_dir
      end

      # Returns a Hash of id (String) => English source text (String),
      # skipping ids with no id, no text, or blank text.
      def collect
        items = {}
        add_sankey(items)
        add_departments(items)
        add_reconciliation(items)
        items
      end

      private

      def add_item(items, id, text)
        return if id.nil?

        id = id.to_s
        return if id.strip.empty?
        return if text.nil?

        text = text.to_s.strip
        return if text.empty?

        # Ids are stable and should be unique across a year's export; keep
        # the first text seen so a duplicate id can't silently overwrite it.
        items[id] ||= text
      end

      def walk_sankey_node(items, node)
        return unless node

        add_item(items, node['id'], node['name'] || node['displayName'])
        (node['children'] || []).each { |child| walk_sankey_node(items, child) }
      end

      def add_sankey(items)
        data = read_json(File.join(@year_dir, 'sankey.json'))
        return unless data

        walk_sankey_node(items, data['spending_data'])
        walk_sankey_node(items, data['revenue_data'])
      end

      def add_departments(items)
        department_files.each do |path|
          dept = read_json(path)
          next unless dept

          add_item(items, dept['slug'], dept['name'])
          walk_sankey_node(items, dept.dig('miniSankey', 'spending_data'))
          (dept['entities'] || []).each { |e| add_item(items, e['id'], e['name']) }
          (dept['transferPayments'] || []).each { |t| add_item(items, t['id'], t['description']) }
        end
      end

      def department_files
        Dir.glob(File.join(@year_dir, 'departments', '*.json')).sort.reject do |f|
          File.basename(f).include?('.prose.')
        end
      end

      def add_reconciliation(items)
        data = read_json(File.join(@year_dir, 'reconciliation.json'))
        return unless data

        (data['items'] || []).each { |i| add_item(items, i['id'], i['name']) }
      end

      def read_json(path)
        return nil unless File.exist?(path)

        JSON.parse(File.read(path))
      rescue JSON::ParserError
        nil
      end
    end
  end
end
