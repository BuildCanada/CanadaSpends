require 'cli/ui'
require 'fileutils'
require 'tempfile'

module PbCli
  module Commands
    class DownloadTables
      MAPPING_URL = 'https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/mappagedetableau-tablemapping/mappagedetableau-tablemapping.csv'.freeze

      DEFAULT_OPEN_TABLES_DIR = File.join(Dir.pwd, 'open_tables')

      def initialize(paths = {})
        @open_tables_dir = paths[:open_tables_dir] || DEFAULT_OPEN_TABLES_DIR
        @mapping_dir = File.join(@open_tables_dir, 'mapping')
        @metadata_dir = File.join(@open_tables_dir, 'metadata')
        @data_dir = File.join(@open_tables_dir, 'data')
      end

      def call(args)
        force = args.include?('--force')

        ::CLI::UI::Frame.open("Downloading Public Accounts Open Data Tables") do
          # Create directories
          create_directories

          # Step 1: Download and check mapping CSV
          puts ::CLI::UI.fmt("{{*}} Checking for updates to mapping file...")
          if !force && mapping_unchanged?
            puts ::CLI::UI.fmt("{{v}} Mapping file unchanged - data is up-to-date")
            puts "Use --force to re-download all files"
            return 0
          end

          # Step 2: Parse mapping CSV
          puts ::CLI::UI.fmt("{{*}} Parsing mapping file...")
          require_relative '../table_mapping_parser'
          parser = TableMappingParser.new
          mapping = parser.parse(mapping_file_path)

          puts ::CLI::UI.fmt("{{i}} Found #{mapping.unique_resource_urls.size} unique CSV resources")
          puts ::CLI::UI.fmt("{{i}} Found #{mapping.unique_dataset_ids.size} unique Open Canada datasets")

          # Step 3: Download CSV files
          puts ""
          puts ::CLI::UI.fmt("{{*}} Downloading CSV files...")
          csv_results = download_csv_files(mapping.unique_resource_urls)

          # Step 4: Fetch and cache Open Canada API metadata
          puts ""
          puts ::CLI::UI.fmt("{{*}} Fetching Open Canada metadata...")
          metadata_results = fetch_all_metadata(mapping.unique_dataset_ids)

          # Step 5: Download data dictionaries from each dataset's resources
          puts ""
          puts ::CLI::UI.fmt("{{*}} Downloading data dictionaries from datasets...")
          dictionary_results = download_data_dictionaries_from_datasets

          # Summary
          puts ""
          puts ::CLI::UI.fmt("{{v}} Download complete!")
          puts ::CLI::UI.fmt("{{v}} CSVs: #{csv_results[:success]}/#{csv_results[:total]} downloaded")
          puts ::CLI::UI.fmt("{{v}} Metadata: #{metadata_results[:success]}/#{metadata_results[:total]} fetched")
          puts ::CLI::UI.fmt("{{v}} Data dictionaries: #{dictionary_results[:success]}/#{dictionary_results[:total]} downloaded")

          if csv_results[:failed] > 0
            puts ::CLI::UI.fmt("{{x}} #{csv_results[:failed]} CSV downloads failed")
          end
        end

        0
      end

      def mapping_file_path
        File.join(@mapping_dir, 'table_mapping.csv')
      end

      def mapping_unchanged?
        existing_mapping = mapping_file_path

        # Download mapping to temp file
        temp_file = Tempfile.new(['mapping', '.csv'])
        begin
          success = download_file(MAPPING_URL, temp_file.path)
          return false unless success

          # If no existing file, save the downloaded one and return false (needs processing)
          unless File.exist?(existing_mapping)
            FileUtils.cp(temp_file.path, existing_mapping)
            return false
          end

          # Compare file contents
          existing_content = File.read(existing_mapping)
          new_content = File.read(temp_file.path)

          if existing_content == new_content
            true
          else
            # Update mapping file with new content
            FileUtils.cp(temp_file.path, existing_mapping)
            false
          end
        ensure
          temp_file.close
          temp_file.unlink
        end
      end

      private

      def create_directories
        [@mapping_dir, @metadata_dir, @data_dir].each do |dir|
          FileUtils.mkdir_p(dir)
        end
      end

      def download_file(url, dest_path)
        # Use curl with -k to bypass SSL verification
        cmd = "curl -k -s -f '#{url}' -o '#{dest_path}'"
        system(cmd)
      end

      def download_csv_files(urls)
        results = { total: urls.size, success: 0, failed: 0 }

        urls.each_with_index do |url, index|
          filename = File.basename(url)
          dest_path = File.join(@data_dir, filename)

          print "\r  [#{index + 1}/#{urls.size}] Downloading #{filename}..."

          if download_file(url, dest_path)
            results[:success] += 1
          else
            results[:failed] += 1
            puts ::CLI::UI.fmt("\n{{x}} Failed to download #{filename}")
          end
        end

        puts "" # New line after progress
        results
      end

      def fetch_all_metadata(dataset_ids)
        require_relative '../open_canada_api'
        api = OpenCanadaApi.new

        results = { total: dataset_ids.size, success: 0, failed: 0 }

        dataset_ids.each_with_index do |dataset_id, index|
          print "\r  [#{index + 1}/#{dataset_ids.size}] Fetching #{dataset_id[0..7]}..."

          metadata = api.fetch_dataset(dataset_id)
          if metadata
            api.cache_metadata(dataset_id, metadata, @metadata_dir)
            results[:success] += 1
          else
            results[:failed] += 1
          end
        end

        puts "" # New line after progress
        results
      end

      # Download data dictionaries by traversing each dataset's resources
      def download_data_dictionaries_from_datasets
        require_relative '../open_canada_api'
        api = OpenCanadaApi.new

        # Collect unique data dictionary URLs from all cached dataset metadata
        data_dict_urls = Set.new
        Dir.glob(File.join(@metadata_dir, '*.json')).each do |cache_file|
          dataset_id = File.basename(cache_file, '.json')
          metadata = api.load_cached_metadata(dataset_id, @metadata_dir)
          next unless metadata

          dict_url = api.data_dictionary_url(metadata)
          data_dict_urls << dict_url if dict_url
        end

        results = { total: data_dict_urls.size, success: 0, failed: 0 }

        data_dict_urls.each_with_index do |url, index|
          # Create a filename based on the URL
          filename = File.basename(url)
          dest_path = File.join(@mapping_dir, filename)

          print "\r  [#{index + 1}/#{data_dict_urls.size}] Downloading #{filename}..."

          if download_file(url, dest_path)
            results[:success] += 1
          else
            results[:failed] += 1
            puts ::CLI::UI.fmt("\n{{x}} Failed to download #{filename}")
          end
        end

        puts "" if data_dict_urls.size > 0
        results
      end

      def dictionary_file_path
        File.join(@mapping_dir, 'cp-pa-dd.xml')
      end
    end
  end
end
