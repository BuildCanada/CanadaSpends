require 'cli/ui'
require 'pb_cli/prose/figure_lint_corpus'

module PbCli
  module Commands
    # `pb prose-figures` -- figure-consistency guardrail over reviewed prose
    # (adversarial-review M1/M2/M3). Extracts every $ amount / percentage from
    # the visible body of each `reviewed: true` department-year prose file and
    # verifies it against that year's shipped data. Exits non-zero on any
    # violation so `bundle exec rake` (and CI) catch figure regressions.
    class ProseFigures
      def initialize(paths = {})
        @root = paths[:root] || Dir.pwd
        @data_dir = paths[:data_dir] || File.expand_path(File.join(@root, '../../data/federal'))
        @allowlist_path = paths[:allowlist_path] || File.join(@root, 'mappings/prose_figure_allowlist.yaml')
      end

      def call(args)
        return print_help_and(0) if args.include?('--help') || args.include?('-h')

        results = PbCli::Prose::FigureLintCorpus.new(
          data_dir: @data_dir,
          allowlist_path: @allowlist_path
        ).run

        offenders = results.select { |r| r[:violations].any? }
        reviewed_count = results.size

        if offenders.empty?
          puts ::CLI::UI.fmt("{{v}} prose-figures: #{reviewed_count} reviewed files, 0 figure violations")
          return 0
        end

        ::CLI::UI::Frame.open('Prose figure-consistency violations') do
          offenders.each do |r|
            puts ::CLI::UI.fmt("{{x}} #{r[:rel]}")
            r[:violations].each { |v| puts "    #{v}" }
          end
        end
        total = offenders.sum { |r| r[:violations].size }
        puts ::CLI::UI.fmt("{{x}} #{total} violation(s) across #{offenders.size} file(s) (of #{reviewed_count} reviewed)")
        1
      end

      private

      def print_help_and(code)
        puts 'Usage: pb prose-figures'
        puts 'Checks every literal $ / % figure in reviewed prose against the shipped data.'
        code
      end
    end
  end
end
