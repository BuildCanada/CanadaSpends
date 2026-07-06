require_relative '../test_helper'
require 'pb_cli/commands/download_tables'
require 'pb_cli/table_mapping_parser'
require 'fileutils'
require 'csv'

module PbCli
  module Commands
    class TestDownloadTables < Minitest::Test
      include TestPaths

      def setup
        @test_paths = setup_test_paths('download_tables')
        @command = DownloadTables.new(@test_paths)
      end

      def teardown
        cleanup_test_paths(@test_paths)
      end

      def test_mapping_url_is_defined
        assert_equal 'https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/mappagedetableau-tablemapping/mappagedetableau-tablemapping.csv',
                     DownloadTables::MAPPING_URL
      end

      def test_creates_directory_structure
        open_tables_dir = @test_paths[:open_tables_dir]
        mapping_dir = File.join(open_tables_dir, 'mapping')
        metadata_dir = File.join(open_tables_dir, 'metadata')
        data_dir = File.join(open_tables_dir, 'data')

        # Initially directories don't exist
        refute File.exist?(mapping_dir)
        refute File.exist?(metadata_dir)
        refute File.exist?(data_dir)

        # Create the mapping file to avoid network access
        FileUtils.mkdir_p(mapping_dir)
        create_test_mapping_csv(File.join(mapping_dir, 'table_mapping.csv'))

        # Run command (CSVs won't download but directories should be created)
        capture_io do
          @command.call([])
        end

        # Directories should be created
        assert File.directory?(mapping_dir)
        assert File.directory?(metadata_dir)
        assert File.directory?(data_dir)
      end

      private

      def create_test_mapping_csv(path)
        CSV.open(path, 'w', write_headers: true, headers: [
          'Fscl-yr_Ex-fin', 'Volume', 'PAC_Section_CPC', 'Table_Tableau',
          'Table-name_Nom-tableau_eng', 'Table-name_Nom-tableau_fra',
          'Table_URL_Tableau_eng', 'Table_URL_Tableau_fra',
          'Dataset_Jeu-de-donnees_eng', 'Dataset_Jeu-de-donnees_fra',
          'Portal_URL_Portail_eng', 'Portal_URL_Portail_fra',
          'Resource_Ressource_eng', 'Resource_Ressource_fra',
          'Resource_URL_Ressource_eng', 'Resource_URL_Ressource_fra'
        ]) do |csv|
          csv << [
            '2022/2023', 'I', '3', '3.7',
            'Major Transfer Payments', 'Principaux paiements',
            'https://example.com/eng.html', 'https://example.com/fra.html',
            'Dataset', 'Ensemble',
            'https://open.canada.ca/data/en/dataset/test-id', 'https://ouvert.canada.ca/data/fr/dataset/test-id',
            '2023 - Data', '2023 - Données',
            'https://example.com/test.csv', 'https://example.com/test-fra.csv'
          ]
        end
      end

      def test_mapping_file_path
        expected_path = File.join(@test_paths[:open_tables_dir], 'mapping', 'table_mapping.csv')
        assert_equal expected_path, @command.mapping_file_path
      end
    end
  end

  class TestTableMappingParser < Minitest::Test
    include TestPaths

    def setup
      @test_paths = setup_test_paths('table_mapping_parser')
      @parser = TableMappingParser.new
      create_test_mapping_csv
    end

    def teardown
      cleanup_test_paths(@test_paths)
    end

    def create_test_mapping_csv
      FileUtils.mkdir_p(@test_paths[:base_dir])
      @csv_path = File.join(@test_paths[:base_dir], 'test_mapping.csv')

      CSV.open(@csv_path, 'w', write_headers: true, headers: [
        'Fscl-yr_Ex-fin', 'Volume', 'PAC_Section_CPC', 'Table_Tableau',
        'Table-name_Nom-tableau_eng', 'Table-name_Nom-tableau_fra',
        'Table_URL_Tableau_eng', 'Table_URL_Tableau_fra',
        'Dataset_Jeu-de-donnees_eng', 'Dataset_Jeu-de-donnees_fra',
        'Portal_URL_Portail_eng', 'Portal_URL_Portail_fra',
        'Resource_Ressource_eng', 'Resource_Ressource_fra',
        'Resource_URL_Ressource_eng', 'Resource_URL_Ressource_fra'
      ]) do |csv|
        # Valid entry
        csv << [
          '2022/2023', 'I', '3', '3.7',
          'Major Transfer Payments', 'Principaux paiements de transfert',
          'https://example.com/table-eng.html', 'https://example.com/table-fra.html',
          'Transfer Payments Dataset', 'Ensemble de données des paiements de transfert',
          'https://open.canada.ca/data/en/dataset/fcf3e4d7-054c-4165-ac34-b8809b2ae0cd', 'https://ouvert.canada.ca/data/fr/dataset/fcf3e4d7-054c-4165-ac34-b8809b2ae0cd',
          '2023 - Major Transfer Payments', '2023 - Principaux paiements de transfert',
          'https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/ppt-mtp/ppt-mtp-2023-eng.csv', 'https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/ppt-mtp/ppt-mtp-2023-fra.csv'
        ]

        # N/A entry (should be skipped)
        csv << [
          '2022/2023', 'I', '6', '6.1',
          'Interest-bearing debt', 'Dette portant intérêt',
          'https://example.com/debt-eng.html', 'https://example.com/debt-fra.html',
          'N/A - Not published', 's.o. - Non publié',
          'N/A - Not published', 's.o. - Non publié',
          'N/A - Not published', 's.o. - Non publié',
          'N/A - Not published', 's.o. - Non publié'
        ]

        # Another valid entry
        csv << [
          '2022/2023', 'II', '2', '2',
          'Budgetary Details', 'Détails budgétaires',
          'https://example.com/budget-eng.html', 'https://example.com/budget-fra.html',
          'Budgetary Data', 'Données budgétaires',
          'https://open.canada.ca/data/en/dataset/a679f1eb-2038-455d-8312-d6e111ff79ff', 'https://ouvert.canada.ca/data/fr/dataset/a679f1eb-2038-455d-8312-d6e111ff79ff',
          'Budgetary details', 'Détails budgétaires',
          'https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/budgetaires-budgetary/budgetaires-budgetary.csv', 'https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/budgetaires-budgetary/budgetaires-budgetary.csv'
        ]
      end
    end

    def test_parses_valid_entries
      result = @parser.parse(@csv_path)

      assert_equal 2, result.entries.size
      assert_equal 2, result.unique_resource_urls.size
      assert_equal 2, result.unique_dataset_ids.size
    end

    def test_skips_na_entries
      result = @parser.parse(@csv_path)

      # N/A entry should be excluded
      urls = result.unique_resource_urls
      refute urls.any? { |url| url.include?('N/A') }
    end

    def test_extracts_dataset_ids
      result = @parser.parse(@csv_path)

      assert_includes result.unique_dataset_ids, 'fcf3e4d7-054c-4165-ac34-b8809b2ae0cd'
      assert_includes result.unique_dataset_ids, 'a679f1eb-2038-455d-8312-d6e111ff79ff'
    end

    def test_generates_table_name_volume_i
      entry = TableMappingParser::Entry.new(
        fiscal_year: '2022/2023',
        volume: 'I',
        section: '3',
        table: '3.7',
        table_name_eng: 'Major Transfer Payments',
        resource_name_eng: '2023 - Major Transfer Payments',
        resource_url: 'https://example.com/ppt-mtp-2023-eng.csv',
        dataset_id: 'test-id',
        portal_url: 'https://open.canada.ca/data/en/dataset/test-id'
      )

      table_name = @parser.generate_table_name(entry)
      assert_equal 'v1_3_7_ppt_mtp_2023_eng', table_name
    end

    def test_generates_table_name_volume_ii
      entry = TableMappingParser::Entry.new(
        fiscal_year: '2022/2023',
        volume: 'II',
        section: '2',
        table: '2',
        table_name_eng: 'Budgetary Details',
        resource_name_eng: 'Budgetary details',
        resource_url: 'https://example.com/budgetaires-budgetary.csv',
        dataset_id: 'test-id',
        portal_url: 'https://open.canada.ca/data/en/dataset/test-id'
      )

      table_name = @parser.generate_table_name(entry)
      assert_equal 'v2_2_budgetaires_budgetary', table_name
    end

    def test_generates_table_name_volume_iii
      entry = TableMappingParser::Entry.new(
        fiscal_year: '2022/2023',
        volume: 'III',
        section: '10',
        table: '10.1',
        table_name_eng: 'Some Table',
        resource_name_eng: 'Resource Name',
        resource_url: 'https://example.com/some-data-2024.csv',
        dataset_id: 'test-id',
        portal_url: 'https://open.canada.ca/data/en/dataset/test-id'
      )

      table_name = @parser.generate_table_name(entry)
      assert_equal 'v3_10_1_some_data_2024', table_name
    end

    def test_url_to_entry_mapping
      result = @parser.parse(@csv_path)

      url = 'https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/ppt-mtp/ppt-mtp-2023-eng.csv'
      entry = result.url_to_entry[url]

      assert entry
      assert_equal 'I', entry.volume
      assert_equal '3.7', entry.table
      assert_equal 'Major Transfer Payments', entry.table_name_eng
    end
  end
end
