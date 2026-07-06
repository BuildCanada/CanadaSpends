require 'json'
require 'pb_cli/prose/lint'

module PbCli
  module Prose
    # Builds the department-year prose prompt from ONLY that department-
    # year's exported JSON (spec §9) plus summary.json for federal-total
    # framing, calls the LLM, lints the draft, runs a second-pass
    # verification call, and returns the full markdown file content
    # (frontmatter + body + an HTML-comment verification block).
    #
    # `client` only needs to respond to `#complete(system:, user:, max_tokens:)`
    # -- see PbCli::ClaudeClient. Injected in tests.
    class Generator
      MAX_CONTEXT_ITEMS = 12

      class LintFailure < StandardError; end

      def initialize(client:, prose_template:, verify_template:)
        @client = client
        @prose_template = prose_template
        @verify_template = verify_template
      end

      def generate(department:, summary: nil)
        context = build_context(department, summary)
        prose_text = call_prose(context)

        violations = Lint.check(prose_text)
        raise LintFailure, "#{department['slug']}: #{violations.join('; ')}" unless violations.empty?

        verification = call_verify(context, prose_text)
        render(prose_text, verification)
      end

      private

      def build_context(department, summary)
        {
          name: department['name'],
          slug: department['slug'],
          financialYearEnding: department['financialYearEnding'],
          totalSpending: department['totalSpending'],
          percentageOfFederal: department['percentageOfFederal'],
          reportedAs: department['reportedAs'],
          entities: top(department['entities'], 'value').map { |e| { name: e['name'], value: e['value'] } },
          topVotes: top(department['votes'], 'used').map do |v|
            { vote: v['vote'], description: v['description'], used: v['used'] }
          end,
          topTransferPayments: top(department['transferPayments'], 'used').map do |t|
            { category: t['category'], description: t['description'], used: t['used'] }
          end,
          federal: summary && {
            financialYear: summary['financialYear'],
            totalSpending: summary['totalSpending']
          }
        }.compact
      end

      def top(collection, sort_key)
        (collection || []).sort_by { |item| -(item[sort_key] || 0) }.first(MAX_CONTEXT_ITEMS)
      end

      def call_prose(context)
        prompt = @prose_template.sub('{{CONTEXT}}', JSON.pretty_generate(context))
        @client.complete(system: prose_system_prompt, user: prompt, max_tokens: 2000).strip
      end

      def call_verify(context, prose_text)
        prompt = @verify_template
                 .sub('{{CONTEXT}}', JSON.pretty_generate(context))
                 .sub('{{PROSE}}', prose_text)
        @client.complete(system: verify_system_prompt, user: prompt, max_tokens: 1500).strip
      end

      def prose_system_prompt
        'You write short, neutral civic-transparency copy about Government of Canada ' \
          'department spending for a public data website. You never state a figure that ' \
          "isn't one of the three supported placeholder tokens."
      end

      def verify_system_prompt
        'You fact-check draft civic copy against a JSON source of record and flag ' \
          'any claim the JSON does not directly support.'
      end

      def render(prose_text, verification)
        <<~MD
          ---
          reviewed: false
          ---

          #{prose_text.strip}

          <!--
          VERIFICATION (spec §9): second-pass fact-check against the source JSON.
          Resolve every flagged claim (edit the prose, or confirm it's fine) before
          setting `reviewed: true`.

          #{verification.strip}
          -->
        MD
      end
    end
  end
end
