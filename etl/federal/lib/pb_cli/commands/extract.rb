require 'cli/ui'
require_relative '../extractors/major_transfers_by_provinces_and_territories'
require_relative '../extractors/transfer_payments_by_ministry'
require_relative '../extractors/budgetary_details_by_allotment'

module PbCli
  module Commands
    class Extract
      # Registry of available extractors
      EXTRACTORS = {
        'major_transfers_by_provinces_and_territories' => PbCli::Extractors::MajorTransfersByProvincesAndTerritories,
        'transfer_payments_by_ministry' => PbCli::Extractors::TransferPaymentsByMinistry,
        'budgetary_details_by_allotment' => PbCli::Extractors::BudgetaryDetailsByAllotment
      }.freeze

      def initialize(paths = {})
        @paths = paths
      end

      def call(args)
        if args.empty?
          # Run all extractors
          run_all_extractors
        else
          # Run specific extractor(s)
          extractor_name = args[0]
          if EXTRACTORS.key?(extractor_name)
            run_extractor(extractor_name)
          else
            puts "Error: Unknown extractor '#{extractor_name}'"
            puts ""
            print_help
            return 1
          end
        end

        0
      end

      private

      def run_all_extractors
        ::CLI::UI::Frame.open("Running all extractors (#{EXTRACTORS.size} total)") do
          EXTRACTORS.each_key do |name|
            run_extractor(name)
          end
        end
      end

      def run_extractor(name)
        ::CLI::UI::Frame.open("Extractor: #{name}") do
          extractor_class = EXTRACTORS[name]
          extractor = extractor_class.new(@paths)

          result = extractor.extract

          if result
            puts ::CLI::UI.fmt("{{v}} Extracted #{result[:record_count]} records")
            puts ::CLI::UI.fmt("{{v}} JSON: #{result[:json_path]}")
            puts ::CLI::UI.fmt("{{v}} Metadata: #{result[:yaml_path]}")
          else
            puts ::CLI::UI.fmt("{{x}} Extraction failed")
          end
        end
      rescue => e
        puts ::CLI::UI.fmt("{{x}} Error: #{e.message}")
        puts e.backtrace.first(5).join("\n") if ENV['DEBUG']
      end

      def print_help
        puts "Available extractors:"
        EXTRACTORS.keys.each do |name|
          puts "  - #{name}"
        end
        puts ""
        puts "Usage:"
        puts "  pb extract                                      # Run all extractors"
        puts "  pb extract major_transfers_by_provinces_and_territories  # Run specific extractor"
      end
    end
  end
end
