module PbCli
  module Prose
    # Figure-consistency guardrail (adversarial-review M1/M2/M3): unlike
    # Prose::Lint -- which forbids ANY literal figure in *generated* prose --
    # this lint runs over the HAND-WRITTEN *reviewed* prose (frontmatter
    # `reviewed: true`), where literal figures are permitted but must tie to the
    # shipped data. Every dollar amount and percentage in the visible BODY (the
    # trailing `<!-- ... -->` audit comment and the {{placeholders}} are
    # stripped first) is checked against the reference figures derivable from
    # that department-year's JSON. A literal that matches NO reference within
    # tolerance is a violation. Genuinely-external source figures (e.g. CRA tax
    # revenue quoted from the Public Accounts narrative, absent from our JSON)
    # are exempted via mappings/prose_figure_allowlist.yaml.
    #
    # Tolerance: relative 1%, OR the half-ULP of the written precision
    # (whichever is larger) -- so "$0.8 billion" matches [0.75, 0.85) and
    # "$521.4 billion" matches 521.425, while "$513.9 billion" does not match
    # the shipped 521.425.
    module FigureLint
      WS = '[\s  ]'.freeze
      DOLLAR_EN = /\$#{WS}?([\d,]+(?:\.\d+)?)#{WS}*(billion|million|trillion|bn|B|M)\b/i.freeze
      DOLLAR_FR = /(\d[\d   ]*(?:,\d+)?)#{WS}*(milliards?|millions?)\b/i.freeze
      # After a FR "milliards/millions", a following "d'X" or "de X" (where X is
      # not "dollars") means the figure is a count, not money (e.g. "2 milliards
      # d'arbres" -- 2 billion trees), so it must not be treated as a $ figure.
      NON_DOLLAR_FR = /\A#{WS}*(?:d['’]|de#{WS}+(?!dollars?\b))/i.freeze
      PERCENT_RE = /(\d+(?:[.,]\d+)?)#{WS}?%/.freeze
      FRONTMATTER_RE = /\A---\n(.*?)\n---\n/m.freeze
      COMMENT_RE = /<!--.*?-->/m.freeze
      PLACEHOLDER_RE = /\{\{.*?\}\}/m.freeze

      class << self
        # --- pure checker (unit-testable) --------------------------------

        # Extract every dollar figure (in $ billions) and percentage from a
        # prose body. Returns an array of [type, literal, value, decimals].
        def figures(body, lang:)
          out = []
          if lang == 'fr'
            body.to_enum(:scan, DOLLAR_FR).each do
              m = Regexp.last_match
              next if NON_DOLLAR_FR.match?(body[m.end(0)..] || '')

              out << ['$', m[0].strip, parse_num(m[1]) * dollar_mult(m[2]), decimals(m[1])]
            end
          else
            body.to_enum(:scan, DOLLAR_EN).each do
              m = Regexp.last_match
              out << ['$', m[0].strip, parse_num(m[1]) * dollar_mult(m[2]), decimals(m[1])]
            end
          end
          body.to_enum(:scan, PERCENT_RE).each do
            m = Regexp.last_match
            out << ['%', m[0].strip, parse_num(m[1]), decimals(m[1])]
          end
          out
        end

        # Returns violation strings for a single body given its reference sets.
        # +allow+ is an array of { 'type' => '$'|'%', 'value' => Float }.
        def check_body(body, dollar_refs:, percent_refs:, lang:, allow: [])
          figures(body, lang: lang).filter_map do |type, literal, value, dec|
            refs = type == '$' ? dollar_refs : percent_refs
            next if matches?(value, refs, dec)
            next if allow.any? { |a| a['type'] == type && matches?(value, [a['value'].to_f], dec) }

            "#{literal} (#{value.round(4)}) matches no #{type == '$' ? '$ (billions)' : '%'} figure in the department-year data"
          end
        end

        def strip_body(text)
          body = text.sub(FRONTMATTER_RE, '')
          body = body.gsub(COMMENT_RE, '')
          body.gsub(PLACEHOLDER_RE, '')
        end

        def reviewed?(text)
          m = FRONTMATTER_RE.match(text)
          return false unless m

          # Match the site gate (getFederalDepartmentProse: reviewed === true).
          # A plain regex avoids YAML choking on unquoted dates in `source:`.
          m[1].match?(/^reviewed:[ \t]*true[ \t]*$/)
        end

        # --- numeric helpers ---------------------------------------------

        def parse_num(str)
          s = str.gsub(/#{WS}/, '')
          s = if s =~ /,\d+\z/ # french decimal comma
                s.delete('.').tr(',', '.')
              else
                s.delete(',')
              end
          s.to_f
        end

        def decimals(str)
          s = str.gsub(/#{WS}/, '')
          return s.split('.').last.length if s.include?('.')
          return s.split(',').last.length if s =~ /,\d+\z/

          0
        end

        def dollar_mult(unit)
          u = unit.downcase
          return 1.0 if u.start_with?('milliard') || %w[billion bn b].include?(u)
          return 0.001 if u.start_with?('million') || u == 'm'
          return 1000.0 if u == 'trillion'

          1.0
        end

        def matches?(value, refs, dec)
          tol = 0.5 * (10**(-dec))
          refs.any? { |r| (value - r).abs <= [0.01 * r.abs, tol].max }
        end
      end
    end
  end
end
