module PbCli
  module Prose
    # Guardrail (spec §9): generated prose must never contain a literal
    # dollar figure or percentage outside a {{placeholder}} token -- the LLM
    # writes structure and context; JSON-driven interpolation at render time
    # supplies every number. Also rejects any placeholder token that isn't
    # one of the three the site actually interpolates (renderProse() in
    # src/app/[lang]/(main)/federal/spending/[year]/[department]/page.tsx) --
    # an unsupported token would silently render as an empty string.
    #
    # Section tokens (spec §A) -- e.g. {{section:miniSankey}} -- are the page
    # composition markers. They are consumed by the page splitter, not
    # interpolated, so they are allowed only when they name one of the five
    # sections the page can place; an unknown section name is rejected (it
    # would be silently dropped by the splitter).
    module Lint
      DOLLAR_RE = /\$\s?\d/.freeze
      PERCENT_RE = /\d+(?:\.\d+)?\s?%/.freeze
      # A figure placeholder such as {{totalSpending}}. Excludes section tokens
      # (which carry a ":") so those are validated separately below.
      PLACEHOLDER_RE = /\{\{\s*([\w.]+)\s*\}\}/.freeze
      SECTION_TOKEN_RE = /\{\{\s*section:([A-Za-z]+)\s*\}\}/.freeze
      SUPPORTED_PLACEHOLDERS = %w[name totalSpending percentageOfFederal].freeze
      SUPPORTED_SECTIONS = %w[stats miniSankey entities historicalShare lineItems].freeze

      class << self
        # Returns an array of human-readable violation strings; empty when
        # +text+ is clean.
        def check(text)
          violations = []
          violations.concat(placeholder_violations(text))
          violations.concat(section_violations(text))
          violations.concat(figure_violations(text))
          violations
        end

        def clean?(text)
          check(text).empty?
        end

        private

        def section_violations(text)
          text.scan(SECTION_TOKEN_RE).flatten.uniq.filter_map do |name|
            "unknown section token {{section:#{name}}} (page only places #{SUPPORTED_SECTIONS.join(', ')})" unless SUPPORTED_SECTIONS.include?(name)
          end
        end

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
