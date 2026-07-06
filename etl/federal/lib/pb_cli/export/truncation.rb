module PbCli
  module Export
    # Top-N + "Other" truncation for Sankey nodes (spec §7). Each node keeps its
    # top N children by absolute amount; the remainder rolls into a single
    # aggregate "Other" child { name, id: "<parent-id>-other", amount,
    # isAggregate: true, count }. Applied recursively and deterministically.
    module Truncation
      DEFAULT_TOP_N = 12

      class << self
        # Returns a deep-truncated copy of `node`. Children are sorted by
        # |amount| desc (name asc tiebreak) before truncation so output is
        # stable across runs.
        def truncate(node, top_n: DEFAULT_TOP_N)
          children = node['children']
          return node if children.nil? || children.empty?

          truncated_children = children.map { |c| truncate(c, top_n: top_n) }
          sorted = sort_children(truncated_children)

          if sorted.size > top_n
            kept = sorted.first(top_n)
            rest = sorted.drop(top_n)
            kept << other_node(node, rest)
            sorted = kept
          end

          node.merge('children' => sorted)
        end

        def sort_children(children)
          children.sort_by.with_index do |c, i|
            [-(c['amount'] || 0).abs, c['name'].to_s, i]
          end
        end

        private

        def other_node(parent, rest)
          {
            'name' => 'Other',
            'id' => "#{parent['id']}-other",
            'amount' => Units.round_billions(rest.sum { |c| c['amount'] || 0 }),
            'isAggregate' => true,
            'count' => rest.sum { |c| c['count'] || 1 }
          }
        end
      end
    end
  end
end
