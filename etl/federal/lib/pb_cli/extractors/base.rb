require 'json'
require 'fileutils'
require 'nokogiri'

module PbCli
  module Extractors
    class Base
      def initialize(paths = {})
        @raw_dir = paths[:raw_dir] || './raw'
        @data_dir = paths[:data_dir] || './extracted/data'
        @metadata_dir = paths[:metadata_dir] || './extracted/metadata'
      end

      # Abstract method - must be implemented by subclasses
      def extract
        raise NotImplementedError, "Subclasses must implement #extract"
      end

      # Abstract method - must be implemented by subclasses
      def extractor_name
        raise NotImplementedError, "Subclasses must implement #extractor_name"
      end

      protected

      # Find HTML files matching a glob pattern across all year directories
      def find_html_files(pattern)
        Dir.glob("#{@raw_dir}/*/#{pattern}").sort
      end

      # Extract year from a file path
      # Works with both ./raw/2024/... and /tmp/test/raw/2024/... patterns
      def year_from_path(path)
        path.match(%r{/(\d{4})/})&.captures&.first&.to_i
      end

      # Export data as JSON
      def export_json(data, filename)
        FileUtils.mkdir_p(@data_dir)
        filepath = File.join(@data_dir, filename)

        File.write(filepath, JSON.pretty_generate(data))
        filepath
      end

      # Export metadata as YAML
      def export_metadata(metadata, filename)
        FileUtils.mkdir_p(@metadata_dir)
        filepath = File.join(@metadata_dir, filename)

        # Convert hash to YAML format
        yaml_content = hash_to_yaml(metadata)
        File.write(filepath, yaml_content)
        filepath
      end

      # Parse numeric value from table cell
      def parse_numeric(text)
        return nil if text.nil? || text.strip.empty?

        # Remove HTML entities and whitespace
        clean_text = text.gsub(/&[^;]+;/, '').strip

        # Handle dashes (em dash, en dash, hyphen)
        return nil if clean_text.match?(/^[—–\-]$/)

        # Handle negative values (in parentheses)
        if clean_text.match?(/^\((.+)\)$/)
          value = clean_text.match(/^\((.+)\)$/)[1]
          value = value.gsub(',', '').to_f
          return -value
        end

        # Handle regular numbers
        clean_text.gsub(',', '').to_f
      end

      # Normalize column name to snake_case
      def normalize_column_name(name)
        name.strip
          .downcase
          .gsub(/\s+/, '_')
          .gsub(/[^\w]/, '')
          .gsub(/_+/, '_')
          .gsub(/^_|_$/, '')
      end

      private

      # Convert hash to YAML format (simple implementation)
      def hash_to_yaml(hash, indent = 0)
        lines = []
        hash.each do |key, value|
          if value.is_a?(Hash)
            lines << "#{' ' * indent}#{key}:"
            lines << hash_to_yaml(value, indent + 2)
          elsif value.is_a?(String) && value.include?("\n")
            lines << "#{' ' * indent}#{key}: |"
            value.each_line do |line|
              lines << "#{' ' * (indent + 2)}#{line.rstrip}"
            end
          else
            lines << "#{' ' * indent}#{key}: #{value}"
          end
        end
        lines.join("\n")
      end
    end
  end
end
