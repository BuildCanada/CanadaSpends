require 'cli/ui'
require 'fileutils'

module PbCli
  module CLI
    def self.start(args)
      if args.empty? || args[0] == 'help'
        print_help
        exit 0
      end

      command = args[0]
      command_args = args[1..-1]

      case command
      when 'scrape'
        require_relative 'pb_cli/commands/scrape'
        Commands::Scrape.new.call(command_args)
      when 'extract'
        require_relative 'pb_cli/commands/extract'
        Commands::Extract.new.call(command_args)
      when 'validate'
        require_relative 'pb_cli/commands/validate'
        Commands::Validate.new.call(command_args)
      when 'download-tables'
        require_relative 'pb_cli/commands/download_tables'
        Commands::DownloadTables.new.call(command_args)
      when 'export'
        require_relative 'pb_cli/commands/export'
        exit(Commands::Export.new.call(command_args) || 0)
      when 'harvest-glossary'
        require 'pb_cli/commands/harvest_glossary'
        exit(Commands::HarvestGlossary.new.call(command_args) || 0)
      when 'translate'
        require 'pb_cli/commands/translate'
        exit(Commands::Translate.new.call(command_args) || 0)
      when 'prose'
        require 'pb_cli/commands/prose'
        exit(Commands::Prose.new.call(command_args) || 0)
      else
        puts "Unknown command: #{command}"
        puts ""
        print_help
        exit 1
      end
    end

    def self.print_help
      puts "pb - Public Accounts CLI (federal ETL, trimmed for CanadaSpends)"
      puts ""
      puts "Usage:"
      puts "  pb scrape YEARS"
      puts "  pb extract [EXTRACTOR_NAME]"
      puts "  pb download-tables"
      puts "  pb validate [TABLE_NAME]"
      puts "  pb export [--year N | --all-years] [--out DIR]"
      puts "  pb harvest-glossary"
      puts "  pb translate [--year N | --all-years]"
      puts "  pb prose [--year N] [--department SLUG]"
      puts ""
      puts "Examples:"
      puts "  pb scrape 2025              # Scrape single year"
      puts "  pb scrape 2021-2025         # Scrape year range"
      puts "  pb scrape 2015,2017,2019-2025  # Scrape multiple years/ranges"
      puts "  pb extract                  # Run all extractors"
      puts "  pb extract major_transfers_by_provinces_and_territories  # Run specific extractor"
      puts "  pb download-tables          # Download Public Accounts open data CSVs"
      puts "  pb validate                 # Validate all tables in database"
      puts "  pb validate major_transfers_by_provinces_and_territories # Validate specific table"
      puts ""
      puts "Note: this is a trimmed copy of the public_accounts ETL. Commands for"
      puts "building a local SQLite database (create-db, initialize, create-views,"
      puts "create-metadata, import-tables, gen-bcid) and StatCan bulk imports were"
      puts "left behind. See etl/federal/README.md for provenance."
    end
  end
end
