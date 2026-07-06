require_relative 'base'

module PbCli
  module Extractors
    class MajorTransfersByProvincesAndTerritories < Base
      def initialize(paths = {})
        super(paths)
      end

      def extractor_name
        'major_transfers_by_provinces_and_territories'
      end

      def extract
        all_records = []

        # Find all charges-expenses files (2013 onwards, skip 2012)
        html_files = find_html_files('**/vol1/s3/charges-expenses-eng.html')

        html_files.each do |filepath|
          source_year = year_from_path(filepath)

          # Skip 2012 as it has different structure
          next if source_year && source_year < 2013

          records = extract_from_file(filepath, source_year)
          all_records.concat(records) if records
        end

        # Sort by source_year, then fiscal year, then province
        all_records.sort_by! { |r| [r[:source_year], r[:year], r[:province_territory]] }

        # Export JSON
        json_path = export_json(all_records, "#{extractor_name}.json")

        # Export metadata
        metadata = generate_metadata(all_records)
        yaml_path = export_metadata(metadata, "#{extractor_name}.yaml")

        { json_path: json_path, yaml_path: yaml_path, record_count: all_records.size }
      end

      private

      def extract_from_file(filepath, source_year)
        return nil unless File.exist?(filepath)

        doc = Nokogiri::HTML(File.read(filepath))

        # Find table 3.7
        table = doc.at_css('table#t3\.7')
        return nil unless table

        records = []
        current_province = nil
        province_position = 0

        # Get column headers
        headers = extract_headers(table)

        # Process each row in tbody
        table.css('tbody tr').each do |row|
          # Check if this row has a province/territory name (rowspan cell)
          province_cell = row.at_css('th[rowspan]')
          if province_cell
            # Normalize whitespace: replace multiple spaces/newlines with single space
            current_province = province_cell.text.strip.gsub(/\s+/, ' ')
            # Normalize province names
            current_province = normalize_province_name(current_province)
            province_position += 1
          end

          # Skip if we don't have a province
          next unless current_province

          # Extract fiscal year
          year_cell = row.at_css('th:not([rowspan])')
          next unless year_cell

          # Parse fiscal year - handle both formats:
          # - Old format (2017 and earlier): "2016-2017" or "2016‑2017" (en-dash or non-breaking hyphen)
          # - New format (2018+): "2017"
          # Fiscal year convention: FY 2017 = the period 2016-2017
          year_text = year_cell.text.strip.gsub(/[\u2011\u2013]/, '-')  # Normalize dashes
          fiscal_year = if year_text.include?('-')
                          # Old format: take the second year from "2016-2017"
                          year_text.split('-').last.to_i
                        else
                          # New format: take the year directly
                          year_text.to_i
                        end
          next if fiscal_year == 0

          # Extract ALL data cells (not just .num) to handle empty cells correctly
          data_cells = row.css('td')

          # Build record
          record = {
            source_year: source_year,
            year: fiscal_year,
            province_territory: current_province,
            position: province_position,
            is_total_or_subtotal: is_total_or_subtotal?(current_province)
          }

          # Add all column values
          data_cells.each_with_index do |cell, index|
            next if index >= headers.size

            column_name = headers[index]
            value = parse_numeric(cell.text)
            record[column_name.to_sym] = value
          end

          records << record
        end

        records
      end

      def normalize_province_name(name)
        # Yukon Territory was renamed to just "Yukon" in 2003 (Yukon Act)
        name = 'Yukon' if name == 'Yukon Territory'
        name
      end

      def is_total_or_subtotal?(province_territory)
        # Check if the province_territory name indicates a total, subtotal, or adjustment row
        name_lower = province_territory.downcase.strip

        # Patterns that indicate totals, subtotals, or adjustments (not actual provinces/territories)
        total_patterns = [
          /^total/,
          /^subtotal/,
          /^add:/,
          /^accrual and other adjustments$/,
          /^transfers made through the tax system$/
        ]

        total_patterns.any? { |pattern| name_lower.match?(pattern) }
      end

      # Mapping of variant column names to canonical names
      # This handles cases where the same data has different header names across years
      COLUMN_NAME_MAPPINGS = {
        # "Employment insurance benefits" (2013-2016) and "Employment insurance" (2017+)
        # represent the same data series
        'employment_insurance_benefits' => 'employment_insurance'
      }.freeze

      def extract_headers(table)
        headers = []

        # Find header row
        header_row = table.at_css('thead tr')
        return headers unless header_row

        # Get all th elements
        header_cells = header_row.css('th')

        # Determine how many header columns to skip
        # Check if first th has colspan (older format) or if there's an empty td (newer format)
        first_th = header_cells.first
        has_empty_td = header_row.at_css('td.empty_col')

        # In older format (2013-2019), first th has colspan="2" covering Province and Fiscal year
        # In newer format (2020+), there's an empty td, then th for Fiscal year
        # In both cases, we want to skip the Province/Territory and Fiscal year columns
        skip_count = if first_th && first_th['colspan'] == '2'
                       1  # Skip only the first th (which covers both Province and Fiscal year)
                     elsif has_empty_td
                       1  # Skip the first th (Fiscal year)
                     else
                       2  # Default: skip first two th elements
                     end

        # Process remaining header cells
        header_cells.drop(skip_count).each do |th|
          # Get text content, removing footnote links
          header_text = th.text.strip

          # Remove footnote references (e.g., "Link to footnote 6", "Link to table note 8", "Link to Table note 7")
          # Note: case-insensitive to handle variations like "Table note" vs "table note"
          header_text = header_text.gsub(/Links? to (footnote|table note) \d+( in [^,]+)?/i, '')
                                   .gsub(/\d+$/, '')  # Remove trailing numbers
                                   .strip

          normalized = normalize_column_name(header_text)
          # Apply column name mappings to standardize variant names
          normalized = COLUMN_NAME_MAPPINGS.fetch(normalized, normalized)
          headers << normalized unless normalized.empty?
        end

        headers
      end

      def generate_metadata(records)
        # Get all unique column names from records
        all_columns = records.flat_map(&:keys).uniq

        # Build columns metadata
        columns_metadata = {
          'source_year' => 'Year of the Public Accounts document',
          'year' => 'Fiscal year of the data',
          'province_territory' => 'Province or territory name',
          'position' => 'Position of the province/territory in the original table',
          'is_total_or_subtotal' => 'Whether this row represents a total, subtotal, or adjustment (true/false)'
        }

        # Add descriptions for transfer columns
        transfer_columns = all_columns - [:source_year, :year, :province_territory, :position, :is_total_or_subtotal]
        transfer_columns.each do |col|
          readable_name = col.to_s.split('_').map(&:capitalize).join(' ')
          columns_metadata[col.to_s] = "#{readable_name} (millions of dollars)"
        end

        {
          'databases' => {
            'public_accounts' => {
              'tables' => {
                extractor_name => {
                  'title' => 'Major Transfer Payments by Province and Territory',
                  'description_html' => "Major transfer payments to provinces and territories from the\nPublic Accounts of Canada (Table 3.7). Data extracted from\nVolume 1, Section 3 (charges-expenses-eng.html) for fiscal years 2013 onwards.\nValues are in millions of dollars.",
                  'source' => 'Public Accounts of Canada',
                  'source_url' => 'https://www.tpsgc-pwgsc.gc.ca/recgen/cpc-pac/index-eng.html',
                  'license' => 'Open Government License - Canada',
                  'license_url' => 'https://open.canada.ca/en/open-government-licence-canada',
                  'columns' => columns_metadata
                }
              }
            }
          }
        }
      end
    end
  end
end
