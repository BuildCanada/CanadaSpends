require 'cli/ui'
require 'json'
require 'pb_cli/claude_client'
require 'pb_cli/i18n/glossary'
require 'pb_cli/i18n/translator'

module PbCli
  module Commands
    # `pb translate [--year N | --all-years]` (spec §8) -- reads
    # data/federal/{year}/{sankey,departments/*,reconciliation}.json, resolves
    # French labels via the glossary first and the Claude API for whatever is
    # left, and writes data/federal/{year}/i18n/{fr.json,fr.hashes.json}.
    # Incremental: only new-or-changed source text is (re)translated.
    class Translate
      def initialize(paths = {})
        root = paths[:root] || Dir.pwd
        @data_dir = paths[:data_dir] || File.expand_path(File.join(root, '../../data/federal'))
        @glossary_path = paths[:glossary_path] || File.join(root, 'mappings/glossary_fr.yaml')
        @prompt_path = paths[:prompt_path] || File.join(root, 'prompts/translation.md')
        @client = paths[:client]
      end

      def call(args)
        opts = parse_args(args)
        return opts[:exit] if opts[:exit]

        glossary = PbCli::I18n::Glossary.load(@glossary_path)
        client = @client || PbCli::ClaudeClient.new
        template = File.read(@prompt_path)

        years = opts[:all] ? all_years : [opts[:year]]
        if years.empty?
          puts ::CLI::UI.fmt('{{x}} No years found -- has `pb export` run?')
          return 1
        end

        overall_ok = true

        ::CLI::UI::Frame.open('Translating federal labels to French') do
          years.each do |year|
            overall_ok &= translate_year(year, glossary, client, template)
          end
        end

        overall_ok ? 0 : 1
      end

      private

      def translate_year(year, glossary, client, template)
        year_dir = File.join(@data_dir, year.to_s)
        unless Dir.exist?(year_dir)
          puts ::CLI::UI.fmt("{{x}} #{year}: no data directory at #{year_dir}")
          return false
        end

        if glossary.size.zero? && !client.configured?
          puts ::CLI::UI.fmt(
            "{{x}} #{year}: empty glossary and ANTHROPIC_API_KEY not set -- nothing to translate with"
          )
          return false
        end

        translator = PbCli::I18n::Translator.new(
          year_dir: year_dir,
          glossary: glossary,
          client: client,
          prompt_template: template,
          logger: ->(msg) { puts ::CLI::UI.fmt("{{x}} #{year}: #{msg}") }
        )
        result = translator.run

        puts ::CLI::UI.fmt(
          "{{v}} #{year}: #{result.translated_count} labels " \
          "(#{result.glossary_count} glossary, #{result.llm_count} LLM, " \
          "#{result.cache_hit_count} unchanged, #{result.untranslated_count} still missing)"
        )
        true
      end

      def parse_args(args)
        opts = { all: false, year: nil }
        i = 0
        while i < args.length
          case args[i]
          when '--all-years' then opts[:all] = true
          when '--year' then opts[:year] = args[i += 1].to_i
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

      def all_years
        index_path = File.join(@data_dir, 'index.json')
        return [] unless File.exist?(index_path)

        (JSON.parse(File.read(index_path))['years'] || []).sort
      rescue JSON::ParserError
        []
      end

      def print_help
        puts 'Usage: pb translate [--year N | --all-years]'
      end
    end
  end
end
