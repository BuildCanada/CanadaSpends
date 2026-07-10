require 'csv'

module PbCli
  class TableMappingParser
    MAPPING_COLUMNS = {
      fiscal_year: 'Fscl-yr_Ex-fin',
      volume: 'Volume',
      section: 'PAC_Section_CPC',
      table: 'Table_Tableau',
      table_name_eng: 'Table-name_Nom-tableau_eng',
      table_name_fra: 'Table-name_Nom-tableau_fra',
      table_url_eng: 'Table_URL_Tableau_eng',
      table_url_fra: 'Table_URL_Tableau_fra',
      dataset_name_eng: 'Dataset_Jeu-de-donnees_eng',
      dataset_name_fra: 'Dataset_Jeu-de-donnees_fra',
      portal_url_eng: 'Portal_URL_Portail_eng',
      portal_url_fra: 'Portal_URL_Portail_fra',
      resource_name_eng: 'Resource_Ressource_eng',
      resource_name_fra: 'Resource_Ressource_fra',
      resource_url_eng: 'Resource_URL_Ressource_eng',
      resource_url_fra: 'Resource_URL_Ressource_fra'
    }.freeze

    VOLUME_MAP = {
      'I' => '1',
      'II' => '2',
      'III' => '3'
    }.freeze

    ParsedMapping = Struct.new(
      :entries,               # All valid entries
      :unique_resource_urls,  # Unique CSV URLs (excluding N/A)
      :unique_dataset_ids,    # Unique Open Canada dataset IDs
      :url_to_entry,          # resource_url => entry
      keyword_init: true
    )

    Entry = Struct.new(
      :fiscal_year,
      :volume,
      :section,
      :table,
      :table_name_eng,
      :resource_name_eng,
      :resource_url,
      :dataset_id,
      :portal_url,
      keyword_init: true
    )

    def parse(csv_path)
      entries = []
      unique_urls = Set.new
      unique_dataset_ids = Set.new
      url_to_entry = {}

      CSV.foreach(csv_path, headers: true, encoding: 'bom|utf-8') do |row|
        resource_url = row[MAPPING_COLUMNS[:resource_url_eng]]&.strip

        # Skip N/A entries
        next if resource_url.nil? ||
                resource_url.empty? ||
                resource_url.downcase.include?('n/a') ||
                !resource_url.start_with?('https://')

        portal_url = row[MAPPING_COLUMNS[:portal_url_eng]]&.strip
        dataset_id = extract_dataset_id(portal_url)

        entry = Entry.new(
          fiscal_year: row[MAPPING_COLUMNS[:fiscal_year]]&.strip,
          volume: row[MAPPING_COLUMNS[:volume]]&.strip,
          section: row[MAPPING_COLUMNS[:section]]&.strip,
          table: row[MAPPING_COLUMNS[:table]]&.strip,
          table_name_eng: row[MAPPING_COLUMNS[:table_name_eng]]&.strip,
          resource_name_eng: row[MAPPING_COLUMNS[:resource_name_eng]]&.strip,
          resource_url: resource_url,
          dataset_id: dataset_id,
          portal_url: portal_url
        )

        entries << entry
        unique_urls << resource_url
        unique_dataset_ids << dataset_id if dataset_id

        # Store first entry for each URL (later entries may have same URL but different table refs)
        url_to_entry[resource_url] ||= entry
      end

      ParsedMapping.new(
        entries: entries,
        unique_resource_urls: unique_urls.to_a,
        unique_dataset_ids: unique_dataset_ids.to_a,
        url_to_entry: url_to_entry
      )
    end

    def generate_table_name(entry)
      volume_num = VOLUME_MAP[entry.volume] || entry.volume.to_s.gsub(/[^0-9]/, '')

      # Sanitize table number - remove special chars, replace with underscores
      # Examples: "3.7" -> "3_7", "App. 5" -> "app_5", "Various / Divers" -> "various_divers"
      table_num = entry.table.to_s
                       .downcase
                       .gsub(/[\/|]/, '_')  # Replace slashes and pipes
                       .gsub(/\./, '_')     # Replace periods
                       .gsub(/[^a-z0-9_]/, '_') # Replace any other non-alphanumeric
                       .gsub(/_+/, '_')     # Collapse multiple underscores
                       .gsub(/^_|_$/, '')   # Remove leading/trailing underscores

      # Skip table number if it's empty or just "n_a" after sanitization
      table_num = nil if table_num.empty? || table_num == 'n_a' || table_num == 's_o'

      # Extract base name from URL
      csv_filename = File.basename(entry.resource_url, '.*')
      csv_base = csv_filename.gsub('-', '_').downcase

      if table_num && !table_num.empty?
        "v#{volume_num}_#{table_num}_#{csv_base}"
      else
        "v#{volume_num}_#{csv_base}"
      end
    end

    def generate_table_name_from_url(url, url_to_entry)
      entry = url_to_entry[url]
      return nil unless entry

      generate_table_name(entry)
    end

    private

    def extract_dataset_id(portal_url)
      return nil if portal_url.nil? || portal_url.empty?

      # Extract UUID from URLs like:
      # https://open.canada.ca/data/en/dataset/fcf3e4d7-054c-4165-ac34-b8809b2ae0cd
      # https://ouvert.canada.ca/data/fr/dataset/fcf3e4d7-054c-4165-ac34-b8809b2ae0cd
      match = portal_url.match(%r{/dataset/([a-f0-9-]{36})})
      match ? match[1] : nil
    end
  end
end
