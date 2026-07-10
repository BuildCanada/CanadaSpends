require 'json'
require 'fileutils'
require 'tempfile'

module PbCli
  class OpenCanadaApi
    API_BASE_URL = 'https://open.canada.ca/data/api/3/action/package_show'.freeze

    DatasetMetadata = Struct.new(
      :id,
      :title_en,
      :title_fr,
      :description_en,
      :description_fr,
      :license_id,
      :license_url,
      :keywords_en,
      :keywords_fr,
      :organization_name,
      :date_modified,
      :resources,
      keyword_init: true
    )

    ResourceMetadata = Struct.new(
      :id,
      :name_en,
      :name_fr,
      :url,
      :format,
      :language,
      keyword_init: true
    )

    def fetch_dataset(dataset_id)
      url = "#{API_BASE_URL}?id=#{dataset_id}"

      # Use curl with -k to bypass SSL verification (like statscan command)
      temp_file = Tempfile.new(['open_canada_api', '.json'])
      begin
        cmd = "curl -k -s '#{url}' -o '#{temp_file.path}'"
        system(cmd)

        unless File.exist?(temp_file.path) && File.size(temp_file.path) > 0
          return nil
        end

        json = JSON.parse(File.read(temp_file.path))
        return nil unless json['success']

        parse_dataset(json['result'])
      rescue JSON::ParserError
        nil
      ensure
        temp_file.close
        temp_file.unlink
      end
    end

    def cache_metadata(dataset_id, metadata, cache_dir)
      FileUtils.mkdir_p(cache_dir)
      cache_path = File.join(cache_dir, "#{dataset_id}.json")

      data = {
        'id' => metadata.id,
        'title_en' => metadata.title_en,
        'title_fr' => metadata.title_fr,
        'description_en' => metadata.description_en,
        'description_fr' => metadata.description_fr,
        'license_id' => metadata.license_id,
        'license_url' => metadata.license_url,
        'keywords_en' => metadata.keywords_en,
        'keywords_fr' => metadata.keywords_fr,
        'organization_name' => metadata.organization_name,
        'date_modified' => metadata.date_modified,
        'resources' => metadata.resources.map do |r|
          {
            'id' => r.id,
            'name_en' => r.name_en,
            'name_fr' => r.name_fr,
            'url' => r.url,
            'format' => r.format,
            'language' => r.language
          }
        end
      }

      File.write(cache_path, JSON.pretty_generate(data))
      cache_path
    end

    def load_cached_metadata(dataset_id, cache_dir)
      cache_path = File.join(cache_dir, "#{dataset_id}.json")
      return nil unless File.exist?(cache_path)

      data = JSON.parse(File.read(cache_path))

      resources = (data['resources'] || []).map do |r|
        ResourceMetadata.new(
          id: r['id'],
          name_en: r['name_en'],
          name_fr: r['name_fr'],
          url: r['url'],
          format: r['format'],
          language: r['language']
        )
      end

      DatasetMetadata.new(
        id: data['id'],
        title_en: data['title_en'],
        title_fr: data['title_fr'],
        description_en: data['description_en'],
        description_fr: data['description_fr'],
        license_id: data['license_id'],
        license_url: data['license_url'],
        keywords_en: data['keywords_en'],
        keywords_fr: data['keywords_fr'],
        organization_name: data['organization_name'],
        date_modified: data['date_modified'],
        resources: resources
      )
    rescue JSON::ParserError
      nil
    end

    def find_cached_metadata_for_url(url, cache_dir)
      Dir.glob(File.join(cache_dir, '*.json')).each do |cache_file|
        metadata = load_cached_metadata(File.basename(cache_file, '.json'), cache_dir)
        next unless metadata

        metadata.resources.each do |resource|
          return metadata if resource.url == url
        end
      end
      nil
    end

    # Find data dictionary URL from dataset resources
    def data_dictionary_url(metadata)
      return nil unless metadata&.resources

      metadata.resources.each do |resource|
        # Check for Data Dictionary resource by name or format+URL pattern
        if resource.name_en&.downcase&.include?('data dictionary') ||
           resource.name_en&.downcase&.include?('dictionnaire') ||
           (resource.format == 'XML' && resource.url&.include?('dd.xml'))
          return resource.url
        end
      end
      nil
    end

    private

    def parse_dataset(result)
      title_translated = result['title_translated'] || {}
      notes_translated = result['notes_translated'] || {}
      keywords = result['keywords'] || {}

      resources = (result['resources'] || []).map do |r|
        name_translated = r['name_translated'] || {}
        ResourceMetadata.new(
          id: r['id'],
          name_en: name_translated['en'] || r['name'],
          name_fr: name_translated['fr'] || r['name'],
          url: r['url'],
          format: r['format'],
          language: r['language']
        )
      end

      DatasetMetadata.new(
        id: result['id'],
        title_en: title_translated['en'] || result['title'],
        title_fr: title_translated['fr'] || result['title'],
        description_en: notes_translated['en'] || result['notes'],
        description_fr: notes_translated['fr'] || result['notes'],
        license_id: result['license_id'],
        license_url: result['license_url'],
        keywords_en: keywords['en'] || [],
        keywords_fr: keywords['fr'] || [],
        organization_name: result.dig('organization', 'title'),
        date_modified: result['date_modified'],
        resources: resources
      )
    end
  end
end
