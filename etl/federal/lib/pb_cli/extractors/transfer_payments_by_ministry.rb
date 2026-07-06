require_relative 'base'

module PbCli
  module Extractors
    class TransferPaymentsByMinistry < Base
      # Mapping from historical ministry names to current (2025) names
      MINISTRY_NAME_NORMALIZATION = {
        # Indigenous Affairs reorganizations
        'Indian Affairs and Northern Development' => 'Crown-Indigenous Relations and Northern Affairs',
        'Aboriginal Affairs and Northern Development' => 'Crown-Indigenous Relations and Northern Affairs',
        'Indigenous and Northern Affairs' => 'Crown-Indigenous Relations and Northern Affairs',

        # Employment department name changes
        'Human Resources and Skills Development' => 'Employment and Workforce Development',
        'Employment and Social Development' => 'Employment and Workforce Development',

        # Foreign Affairs name changes
        'Foreign Affairs and International Trade' => 'Global Affairs',
        'Foreign Affairs, Trade and Development' => 'Global Affairs'
      }.freeze

      def initialize(paths = {})
        super(paths)
      end

      def extractor_name
        'transfer_payments_by_ministry'
      end

      def extract
        all_records = []

        # Find all transfer payment files (2013+ only)
        html_files = find_transfer_payment_files

        # Deduplicate files by year and ministry code
        # (needed for 2022 which has multiple Wayback Machine snapshots)
        files_by_year_ministry = {}
        html_files.each do |filepath|
          source_year = year_from_path(filepath)
          next if source_year.nil? || source_year < 2013

          ministry_code = extract_ministry_code(filepath)
          next unless ministry_code

          key = "#{source_year}:#{ministry_code}"
          # Keep only the first file for each year/ministry combo
          files_by_year_ministry[key] ||= filepath
        end

        files_by_year_ministry.values.each do |filepath|
          source_year = year_from_path(filepath)

          records = extract_from_file(filepath, source_year)
          all_records.concat(records) if records
        end

        # Sort by source_year, then ministry, then position
        all_records.sort_by! { |r| [r[:source_year], r[:ministry_code], r[:position] || 0] }

        # Export JSON
        json_path = export_json(all_records, "#{extractor_name}.json")

        # Export metadata
        metadata = generate_metadata(all_records)
        yaml_path = export_metadata(metadata, "#{extractor_name}.yaml")

        { json_path: json_path, yaml_path: yaml_path, record_count: all_records.size }
      end

      private

      def find_transfer_payment_files
        find_html_files('**/vol2/**/pt-tp-eng.html')
      end

      def extract_from_file(filepath, source_year)
        return nil unless File.exist?(filepath)

        doc = Nokogiri::HTML(File.read(filepath))

        # Extract ministry code from path
        ministry_code = extract_ministry_code(filepath)
        return nil unless ministry_code

        # Extract ministry name from page title or breadcrumb
        ministry_name = extract_ministry_name(doc)
        ministry_name_normalized = normalize_ministry_name(ministry_name)

        records = []
        current_category = nil
        position = 0

        # Find the transfer payments table
        # Try multiple selectors as table IDs vary
        table = find_table(doc)
        return nil unless table

        # Process each row in tbody
        table.css('tbody tr').each do |row|
          # Check if this is a category header row (colspan spanning all columns)
          category_header = extract_category_header(row)
          if category_header
            current_category = category_header
            next
          end

          # Check if this is a department header row (first level)
          dept_header = extract_department_header(row)
          next if dept_header

          # Extract data row
          record = extract_data_row(row, source_year, ministry_code, ministry_name,
                                     ministry_name_normalized, current_category)
          next unless record

          position += 1
          record[:position] = position
          records << record
        end

        records
      end

      def extract_ministry_code(filepath)
        # Extract ministry code from path like .../vol2/rcaanc-cirnac/pt-tp-eng.html
        match = filepath.match(%r{/vol2/([^/]+)/pt-tp-eng\.html$})
        match ? match[1] : nil
      end

      def extract_ministry_name(doc)
        # Try to get ministry name from breadcrumb
        breadcrumb = doc.at_css('ol.breadcrumb li:last-child a, ol.breadcrumb li:last a')
        if breadcrumb
          text = clean_ministry_name(breadcrumb.text)
          return text unless text.nil? || text.empty?
        end

        # Fallback: try the section header link before the current page
        breadcrumb_items = doc.css('ol.breadcrumb li a')
        breadcrumb_items.reverse_each do |item|
          text = item.text.strip
          next if text.include?('Transfer payments')
          next if text.include?('Volume')

          cleaned = clean_ministry_name(text)
          return cleaned if cleaned && !cleaned.empty?
        end

        # Fallback: try page title
        title = doc.at_css('title')
        if title
          text = title.text
          # Try to find ministry name after section number pattern
          match = text.match(/Section\s*[\d]+[:\s—–-]+([^—–\-]+?)(?:—|–|-|$)/i)
          if match
            cleaned = clean_ministry_name(match[1])
            return cleaned if cleaned && !cleaned.empty?
          end
        end

        nil
      end

      def clean_ministry_name(text)
        return nil if text.nil?

        # Normalize whitespace (including &nbsp; which becomes \u00A0)
        text = text.strip.gsub(/[\u00A0\s]+/, ' ')

        # Remove section numbers like "Section 5:", "Section 5—", etc.
        text = text.gsub(/^Section\s*[\d]+[\s:—–\-]+/i, '')

        # Remove trailing text about transfer payments
        text = text.gsub(/[—–\-]\s*Transfer payments.*$/i, '')

        # Remove common suffixes
        text = text.gsub(/\s*\([\d]+\..*$/, '')

        text.strip
      end

      def normalize_ministry_name(name)
        return nil unless name
        MINISTRY_NAME_NORMALIZATION.fetch(name, name)
      end

      def find_table(doc)
        # Try to find the main data table
        # Modern format has specific IDs, older format uses classes
        table = doc.at_css('table.table.table-bordered.basic')
        return table if table

        # Try table with just 'basic' class (older format 2013-2015)
        table = doc.at_css('table.basic')
        return table if table

        # Try any table in the main content
        doc.at_css('main table, #wb-cont table, .patable-container table')
      end

      def extract_category_header(row)
        # Check for bold header rows with colspan (category headers like "Grants", "Contributions")
        # Format 1 (2016+): th.indent1.bold with colspan="10"
        th = row.at_css('th.bold[colspan], th.indent1.bold[colspan]')
        if th
          colspan = th['colspan'].to_i
          if colspan >= 5
            text = th.text.strip
            return text unless text.empty?
          end
        end

        # Format 2 (2013-2015): th.indent1.bold WITHOUT colspan
        # These rows have td cells but they contain only &nbsp; (no actual data)
        th = row.at_css('th.indent1.bold:not([colspan])')
        if th
          # Check if all td cells are empty or contain only whitespace/nbsp
          cells = row.css('td')
          all_cells_empty = cells.all? do |cell|
            cell.text.strip.gsub(/[\u00A0\s]+/, '').empty?
          end

          if all_cells_empty
            text = th.text.strip
            # Only consider it a category if it matches known category names
            category_prefixes = ['Grants', 'Contributions', 'Other transfer payments']
            return text if category_prefixes.any? { |cat| text.start_with?(cat) }
          end
        end

        nil
      end

      def extract_department_header(row)
        # Check for department header row (indent0 bold spanning all columns)
        th = row.at_css('th.indent0.bold[colspan]')
        return nil unless th

        colspan = th['colspan'].to_i
        return nil if colspan < 5

        th.text.strip
      end

      def extract_data_row(row, source_year, ministry_code, ministry_name,
                           ministry_name_normalized, current_category)
        # Get the description cell (th element, not in colspan row)
        th = row.at_css('th:not([colspan])')
        return nil unless th

        description = extract_clean_text(th)
        return nil if description.empty?

        # Determine indent level from CSS class
        indent_level = extract_indent_level(th)

        # Check if this is a total/subtotal row
        is_total = is_total_or_subtotal?(description)

        # Get all data cells
        cells = row.css('td')
        return nil if cells.empty?

        # Build the record
        record = {
          source_year: source_year,
          year: source_year, # For vol2, document year = fiscal year
          ministry_code: ministry_code,
          ministry_name: ministry_name,
          ministry_name_normalized: ministry_name_normalized,
          category: current_category,
          description: description,
          indent_level: indent_level,
          is_total_or_subtotal: is_total
        }

        # Add numeric columns
        column_names = [
          :available_from_previous_years,
          :main_estimates,
          :supplementary_estimates,
          :adjustments_warrants_transfers,
          :total_available_for_use,
          :used_in_current_year,
          :variance,
          :available_for_subsequent_years,
          :used_in_previous_year
        ]

        cells.each_with_index do |cell, index|
          break if index >= column_names.length
          record[column_names[index]] = parse_numeric(cell.text)
        end

        record
      end

      def extract_indent_level(th)
        classes = th['class'] || ''
        match = classes.match(/indent(\d+)/)
        match ? match[1].to_i : 0
      end

      def extract_clean_text(element)
        # Clone the element to avoid modifying the original
        clone = element.dup

        # Remove footnote elements (sup tags containing footnote links)
        clone.css('sup').each(&:remove)

        # Remove elements with wb-invisible class (screen reader hints)
        clone.css('.wb-invisible').each(&:remove)

        # Get the text and normalize whitespace
        text = clone.text.strip.gsub(/\s+/, ' ')

        # Remove any remaining footnote patterns that might have been missed
        # Patterns like "Link to footnote X" or standalone footnote markers
        text = text.gsub(/Link to footnote\s*\w*/i, '')
        text = text.gsub(/\s+/, ' ').strip

        text
      end

      def is_total_or_subtotal?(description)
        desc_lower = description.downcase.strip
        total_patterns = [
          /^total/,
          /^subtotal/,
          /^sub-total/,
          /grand total/
        ]
        total_patterns.any? { |pattern| desc_lower.match?(pattern) }
      end

      def generate_metadata(records)
        # Get all unique column names from records
        all_columns = records.flat_map(&:keys).uniq

        # Build columns metadata
        columns_metadata = {
          'source_year' => 'Year of the Public Accounts document',
          'year' => 'Fiscal year of the data',
          'ministry_code' => 'Ministry code from the URL path (e.g., rcaanc-cirnac)',
          'ministry_name' => 'Ministry name as it appeared in the original document',
          'ministry_name_normalized' => 'Ministry name normalized to current (2025) naming',
          'category' => 'Transfer payment category (Grants, Contributions, Other)',
          'description' => 'Description of the transfer payment line item',
          'indent_level' => 'Indent level indicating hierarchy (0=top level)',
          'is_total_or_subtotal' => 'Whether this row is a total or subtotal (true/false)',
          'position' => 'Position of the row within the ministry file',
          'available_from_previous_years' => 'Available from previous years (dollars)',
          'main_estimates' => 'Main Estimates amount (dollars)',
          'supplementary_estimates' => 'Supplementary Estimates amount (dollars)',
          'adjustments_warrants_transfers' => 'Adjustments, warrants and transfers (dollars)',
          'total_available_for_use' => 'Total available for use (dollars)',
          'used_in_current_year' => 'Used in the current year (dollars)',
          'variance' => 'Variance between available and used (dollars)',
          'available_for_subsequent_years' => 'Available for use in subsequent years (dollars)',
          'used_in_previous_year' => 'Used in the previous year (dollars)'
        }

        {
          'databases' => {
            'public_accounts' => {
              'tables' => {
                extractor_name => {
                  'title' => 'Transfer Payments by Ministry (Volume II)',
                  'description_html' => "Transfer payment line items from Volume II of the\nPublic Accounts of Canada. Data extracted from each ministry's\ntransfer payments page (pt-tp-eng.html) for fiscal years 2013 onwards.\nValues are in dollars.",
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
