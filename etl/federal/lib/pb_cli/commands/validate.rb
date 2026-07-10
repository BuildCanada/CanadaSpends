require 'cli/ui'

module PbCli
  module Commands
    class Validate
      DEFAULT_DB_PATH = File.join(Dir.pwd, 'public_accounts.db')

      # Registry of available validators
      VALIDATORS = {
        'major_transfers_by_provinces_and_territories' => 'MajorTransfersByProvincesAndTerritories'
      }.freeze

      def initialize(paths = {})
        @db_path = paths[:db_path] || DEFAULT_DB_PATH
      end

      def call(args)
        unless File.exist?(@db_path)
          puts ::CLI::UI.fmt("{{x}} Database not found: #{@db_path}")
          puts "Run 'pb initialize' first to create the database"
          return 1
        end

        if args.empty?
          run_all_validators
        else
          table_name = args[0]
          if VALIDATORS.key?(table_name)
            result = run_validator(table_name)
            result[:passed] ? 0 : 1
          else
            puts "Error: Unknown table '#{table_name}'"
            puts ""
            print_help
            return 1
          end
        end
      end

      private

      def run_all_validators
        results = []

        ::CLI::UI::Frame.open("Running all validators (#{VALIDATORS.size} total)") do
          VALIDATORS.each_key do |table_name|
            result = run_validator(table_name)
            results << result
          end
        end

        puts ""
        passed_count = results.count { |r| r[:passed] }
        failed_count = results.count { |r| !r[:passed] }
        total_failures = results.sum { |r| r[:failure_count] }

        puts ::CLI::UI.fmt("{{bold:Summary}}")
        puts "  Tables validated: #{results.size}"
        puts ::CLI::UI.fmt("  {{v}} Passed: #{passed_count}")
        puts ::CLI::UI.fmt("  {{x}} Failed: #{failed_count}") if failed_count > 0
        puts "  Total failures: #{total_failures}" if total_failures > 0

        failed_count > 0 ? 1 : 0
      end

      def run_validator(table_name)
        require_relative "../validators/#{table_name}"

        validator_class_name = VALIDATORS[table_name]
        validator_class = PbCli::Validators.const_get(validator_class_name)
        validator = validator_class.new(@db_path)

        result = nil

        ::CLI::UI::Frame.open("Validating: #{table_name}") do
          result = validator.run

          # Show validations that were run
          puts "Validations executed:"
          result[:validations_run].each do |v|
            puts ::CLI::UI.fmt("  {{*}} #{v[:name]}: #{v[:description]}")
          end
          puts ""

          if result[:passed]
            puts ::CLI::UI.fmt("{{v}} All #{result[:validations_run].size} validations passed (#{result[:duration].round(2)}s)")
          else
            puts ::CLI::UI.fmt("{{x}} #{result[:failure_count]} failure(s) in #{result[:validations_run].size} validations (#{result[:duration].round(2)}s)")
            puts ""

            result[:failures].each_with_index do |failure, i|
              puts ::CLI::UI.fmt("  {{x}} #{i + 1}. #{failure}")
            end
          end
        end

        result
      rescue LoadError => e
        puts ::CLI::UI.fmt("{{x}} Could not load validator for '#{table_name}': #{e.message}")
        { table: table_name, passed: false, failure_count: 1, failures: [e.message], validations_run: [], duration: 0 }
      rescue => e
        puts ::CLI::UI.fmt("{{x}} Error running validator: #{e.message}")
        puts e.backtrace.first(5).join("\n") if ENV['DEBUG']
        { table: table_name, passed: false, failure_count: 1, failures: [e.message], validations_run: [], duration: 0 }
      end

      def print_help
        puts "Available tables for validation:"
        VALIDATORS.keys.each do |name|
          puts "  - #{name}"
        end
        puts ""
        puts "Usage:"
        puts "  pb validate                                              # Validate all tables"
        puts "  pb validate major_transfers_by_provinces_and_territories # Validate specific table"
      end
    end
  end
end
