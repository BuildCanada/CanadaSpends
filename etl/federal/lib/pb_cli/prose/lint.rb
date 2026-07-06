module PbCli
  module Prose
    # Guardrail (spec §9): generated prose must never contain a literal
    # dollar figure or percentage outside a {{placeholder}} token -- the LLM
    # writes structure and context; JSON-driven interpolation at render time
    # supplies every number. Also rejects any placeholder token that isn't
    # one of the three the site actually interpolates (renderProse() in
    # src/app/[lang]/(main)/federal/spending/[year]/[department]/page.tsx) --
    # an unsupported token would silently render as an empty string.
    module Lint
      DOLLAR_RE = /\$\s?\d/.freeze
      PERCENT_RE = /\d+(?:\.\d+)?\s?%/.freeze
      PLACEHOLDER_RE = /\{\{\s*([\w.]+)\s*\}\}/.freeze
      SUPPORTED_PLACEHOLDERS = %w[name totalSpending percentageOfFederal].freeze

      class << self
        # Returns an array of human-readable violation strings; empty when
        # +text+ is clean.
        def check(text)
          violations = []
          violations.concat(placeholder_violations(text))
          violations.concat(figure_violations(text))
          violations
        end

        def clean?(text)
          check(text).empty?
        end

        private

        def placeholder_violations(text)
          text.scan(PLACEHOLDER_RE).flatten.uniq.filter_map do |key|
            "unsupported placeholder {{#{key}}} (site only interpolates #{SUPPORTED_PLACEHOLDERS.join(', ')})" unless SUPPORTED_PLACEHOLDERS.include?(key)
          end
        end

        def figure_violations(text)
          scrubbed = text.gsub(PLACEHOLDER_RE, '')
          violations = []
          violations << 'contains a literal dollar figure outside a placeholder' if scrubbed.match?(DOLLAR_RE)
          violations << 'contains a literal percentage outside a placeholder' if scrubbed.match?(PERCENT_RE)
          violations
        end
      end
    end
  end
end
