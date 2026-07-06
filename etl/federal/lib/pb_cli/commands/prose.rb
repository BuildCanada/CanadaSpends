require 'cli/ui'
require 'json'
require 'pb_cli/claude_client'
require 'pb_cli/prose/generator'
require 'yaml'

module PbCli
  module Commands
    # `pb prose [--year N] [--department SLUG]` (spec §9) -- generates
    # data/federal/{year}/departments/{slug}.prose.en.md for each requested
    # department-year, with `reviewed: false` frontmatter so the site renders
    # stats-only until a human reviews it. The 14 legacy departments' FY2024
    # prose (their hand-written pages, `existing_page: true` in
    # mappings/ministry_slugs.yaml) is out of scope -- generation fills every
    # other department-year.
    class Prose
      def initialize(paths = {})
        @root = paths[:root] || Dir.pwd
        @data_dir = paths[:data_dir] || File.expand_path(File.join(@root, '../../data/federal'))
        @slugs_path = paths[:slugs_path] || File.join(@root, 'mappings/ministry_slugs.yaml')
        @prose_prompt_path = paths[:prose_prompt_path] || File.join(@root, 'prompts/prose.md')
        @verify_prompt_path = paths[:verify_prompt_path] || File.join(@root, 'prompts/prose_verify.md')
        @client = paths[:client]
      end

      def call(args)
        opts = parse_args(args)
        return opts[:exit] if opts[:exit]

        client = @client || PbCli::ClaudeClient.new
        unless client.configured?
          puts ::CLI::UI.fmt('{{x}} ANTHROPIC_API_KEY not set -- cannot generate prose')
          return 1
        end

        generator = PbCli::Prose::Generator.new(
          client: client,
          prose_template: File.read(@prose_prompt_path),
          verify_template: File.read(@verify_prompt_path)
        )

        years = opts[:year] ? [opts[:year]] : all_years
        if years.empty?
          puts ::CLI::UI.fmt('{{x}} No years found -- has `pb export` run?')
          return 1
        end

        ok = true
        ::CLI::UI::Frame.open('Generating federal department prose') do
          years.each do |year|
            slugs = opts[:department] ? [opts[:department]] : department_slugs(year)
            slugs.each do |slug|
              next if skip_legacy?(year, slug)

              ok &= generate_one(generator, year, slug)
            end
          end
        end

        ok ? 0 : 1
      end

      private

      def skip_legacy?(year, slug)
        year.to_i == 2024 && legacy_slugs.include?(slug)
      end

      def legacy_slugs
        return @legacy_slugs if defined?(@legacy_slugs)

        @legacy_slugs =
          if File.exist?(@slugs_path)
            (YAML.load_file(@slugs_path)['portfolios'] || [])
              .select { |p| p['existing_page'] }
              .map { |p| p['slug'] }
          else
            []
          end
      end

      def generate_one(generator, year, slug)
        dept_path = File.join(@data_dir, year.to_s, 'departments', "#{slug}.json")
        unless File.exist?(dept_path)
          puts ::CLI::UI.fmt("{{x}} #{year}/#{slug}: no department JSON at #{dept_path}")
          return false
        end

        department = JSON.parse(File.read(dept_path))
        summary = load_summary(year)
        markdown = generator.generate(department: department, summary: summary)

        out_path = File.join(@data_dir, year.to_s, 'departments', "#{slug}.prose.en.md")
        File.write(out_path, markdown)
        puts ::CLI::UI.fmt("{{v}} #{year}/#{slug}: wrote #{out_path} (reviewed: false)")
        true
      rescue PbCli::Prose::Generator::LintFailure => e
        puts ::CLI::UI.fmt("{{x}} #{e.message}")
        false
      rescue PbCli::ClaudeClient::ApiError => e
        puts ::CLI::UI.fmt("{{x}} #{year}/#{slug}: #{e.message}")
        false
      end

      def load_summary(year)
        path = File.join(@data_dir, year.to_s, 'summary.json')
        return nil unless File.exist?(path)

        JSON.parse(File.read(path))
      rescue JSON::ParserError
        nil
      end

      def department_slugs(year)
        Dir.glob(File.join(@data_dir, year.to_s, 'departments', '*.json'))
           .reject { |f| File.basename(f).include?('.prose.') }
           .map { |f| File.basename(f, '.json') }
           .sort
      end

      def all_years
        index_path = File.join(@data_dir, 'index.json')
        return [] unless File.exist?(index_path)

        (JSON.parse(File.read(index_path))['years'] || []).sort
      rescue JSON::ParserError
        []
      end

      def parse_args(args)
        opts = { year: nil, department: nil }
        i = 0
        while i < args.length
          case args[i]
          when '--year' then opts[:year] = args[i += 1].to_i
          when '--department' then opts[:department] = args[i += 1]
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
        opts
      end

      def print_help
        puts 'Usage: pb prose [--year N] [--department SLUG]'
      end
    end
  end
end
