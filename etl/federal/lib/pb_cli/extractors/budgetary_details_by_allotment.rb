require_relative 'base'
require_relative 'transfer_payments_by_ministry'

module PbCli
  module Extractors
    class BudgetaryDetailsByAllotment < Base
      # Reuse ministry normalization from transfer_payments_by_ministry
      MINISTRY_NAME_NORMALIZATION = TransferPaymentsByMinistry::MINISTRY_NAME_NORMALIZATION

      def initialize(paths = {})
        super(paths)
      end

      def extractor_name
        'budgetary_details_by_allotment'
      end

      def extract
        all_records = []

        # Find all allotment files (vol2 for 2015+, vol3 for 2013-2014)
        html_files = find_allotment_files

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

        # Sort by year, then ministry, then position
        all_records.sort_by! { |r| [r[:year], r[:ministry_code], r[:position] || 0] }

        # Export JSON
        json_path = export_json(all_records, "#{extractor_name}.json")

        # Export metadata
        metadata = generate_metadata
        yaml_path = export_metadata(metadata, "#{extractor_name}.yaml")

        { json_path: json_path, yaml_path: yaml_path, record_count: all_records.size }
      end

      private

      def find_allotment_files
        vol2_files = find_html_files('**/vol2/**/dba-bda-eng.html')
        vol3_files = find_html_files('**/vol3/s10/dba-bda-eng.html')
        (vol2_files + vol3_files).sort
      end

      def extract_ministry_code(filepath)
        # Vol2 pattern: /vol2/rcaanc-cirnac/dba-bda-eng.html
        if (match = filepath.match(%r{/vol2/([^/]+)/dba-bda-eng\.html$}))
          return match[1]
        end
        # Vol3 pattern: /vol3/s10/dba-bda-eng.html (consolidated file)
        if filepath.include?('/vol3/s10/')
          return 'consolidated'
        end
        nil
      end

      def extract_from_file(filepath, source_year)
        return nil unless File.exist?(filepath)

        doc = Nokogiri::HTML(File.read(filepath))

        ministry_code = extract_ministry_code(filepath)
        return nil unless ministry_code

        ministry_name_from_page = extract_ministry_name(doc)

        table = find_table(doc)
        return nil unless table

        records = []

        # Context tracking
        # 2013-2014 (vol3): indent0=ministry, indent1=department, indent2=vote, indent3=data
        # 2015+ (vol2): indent0=organization, indent1=vote, indent2=data/section, indent3=sub-data
        is_consolidated = (ministry_code == 'consolidated')
        current_ministry = nil  # Only used for consolidated files
        current_organization = nil
        current_vote = nil
        current_vote_number = nil
        current_parent_description = nil
        position = 0

        table.css('tbody tr').each do |row|
          row_type = detect_row_type(row, is_consolidated)
          next if row_type.nil?

          th = row.at_css('th')
          next unless th

          text = extract_clean_text(th)
          classes = th['class'] || ''

          case row_type
          when :ministry
            # Only in consolidated files - indent0 bold is ministry
            current_ministry = text
            current_organization = nil
            current_vote = nil
            current_vote_number = nil
            current_parent_description = nil

          when :department
            # Only in consolidated files - indent1 is department
            current_organization = text
            current_vote = nil
            current_vote_number = nil
            current_parent_description = nil

          when :organization
            # 2015+ format - indent0 bold is organization
            current_organization = text
            current_vote = nil
            current_vote_number = nil
            current_parent_description = nil

          when :vote
            current_vote = text
            current_vote_number = parse_vote_number(text)
            current_parent_description = nil

          when :statutory
            current_vote = 'Statutory amounts'
            current_vote_number = 'Statutory'
            current_parent_description = nil
            # Statutory amounts row has data - build record
            effective_ministry = is_consolidated ? current_ministry : ministry_name_from_page
            record = build_record(
              row, source_year, ministry_code, effective_ministry,
              current_organization, current_vote, current_vote_number,
              nil, classes
            )
            if record
              position += 1
              record[:position] = position
              records << record
            end

          when :section_header
            current_parent_description = text

          when :total
            effective_ministry = is_consolidated ? current_ministry : ministry_name_from_page
            record = build_record(
              row, source_year, ministry_code, effective_ministry,
              current_organization, current_vote, current_vote_number,
              current_parent_description, classes
            )
            if record
              record[:is_total_or_subtotal] = true
              position += 1
              record[:position] = position
              records << record
            end

          when :data_row
            effective_ministry = is_consolidated ? current_ministry : ministry_name_from_page
            record = build_record(
              row, source_year, ministry_code, effective_ministry,
              current_organization, current_vote, current_vote_number,
              current_parent_description, classes
            )
            if record
              position += 1
              record[:position] = position
              records << record
            end
          end
        end

        records
      end

      def extract_ministry_name(doc)
        # Try breadcrumb (most reliable for vol2)
        breadcrumb_items = doc.css('ol.breadcrumb li a')
        breadcrumb_items.reverse_each do |item|
          text = item.text.strip
          # Skip generic items
          next if text.include?('Volume')
          next if text.include?('Budgetary')
          next if text.include?('allotment')
          next if text.match?(/^\d{4}$/)
          next if text.match?(/^Section\s*\d+/)

          cleaned = clean_ministry_name(text)
          return cleaned if cleaned && !cleaned.empty?
        end

        nil
      end

      def clean_ministry_name(text)
        return nil if text.nil?

        # Normalize whitespace (including &nbsp; which becomes \u00A0)
        text = text.strip.gsub(/[\u00A0\s]+/, ' ')

        # Remove section numbers like "Section 5:", "Section 5—", etc.
        text = text.gsub(/^Section\s*[\d]+[\s:—–\-]+/i, '')

        text.strip
      end

      def normalize_ministry_name(name)
        return nil unless name
        MINISTRY_NAME_NORMALIZATION.fetch(name, name)
      end

      def find_table(doc)
        # Modern format (2020+): table with specific class
        table = doc.at_css('table.table.table-bordered.basic')
        return table if table

        # Older format: table.basic without other classes
        table = doc.at_css('table.basic')
        return table if table

        # Fallback: any table in main content
        doc.at_css('main table, #wb-main table, .patable-container table')
      end

      def detect_row_type(row, is_consolidated = false)
        th = row.at_css('th')
        return nil unless th

        classes = th['class'] || ''
        has_colspan = th['colspan'] && th['colspan'].to_i >= 2
        text = th.text.strip.downcase
        cells = row.css('td')
        has_data_cells = cells.any? { |c| c.text.strip.match?(/[\d,]+/) }

        # Normalize non-breaking spaces for pattern matching
        normalized_text = text.gsub(/\u00a0/, ' ')

        if is_consolidated
          # 2013-2014 consolidated format:
          # indent0 bold = ministry, indent1 = department, indent2 = vote, indent3 = data

          # Ministry header (indent0 bold)
          if classes.include?('indent0') && classes.include?('bold')
            if normalized_text.include?('total') || normalized_text.include?('grand total')
              return :total
            else
              return :ministry
            end
          end

          # Department header (indent1 without data, not a vote or statutory)
          if classes.include?('indent1') && !has_data_cells
            if normalized_text.match?(/^vote\s*\d+/i)
              return :vote
            elsif normalized_text.include?('statutory')
              return nil  # Will be handled as data row if has data
            else
              return :department
            end
          end

          # Vote header (indent2 containing "Vote")
          if classes.include?('indent2') && normalized_text.match?(/^vote\s*\d+/i)
            return :vote
          end

          # Statutory amounts at indent2 with data
          if classes.include?('indent2') && normalized_text.include?('statutory') && has_data_cells
            return :statutory
          end

          # Total/Subtotal row
          if normalized_text.match?(/^(sub)?total|^total\s*$/i)
            return :total
          end

          # Data row at indent3 (or indent2 with data)
          if has_data_cells
            return :data_row
          end

        else
          # 2015+ per-ministry format:
          # indent0 bold = organization, indent1 = vote, indent2 = data/section, indent3 = sub-data

          # Organization header (indent0 bold with colspan, but not "Total Ministry")
          if classes.include?('indent0') && classes.include?('bold')
            if normalized_text.include?('total')
              return :total
            else
              return :organization
            end
          end

          # Vote header (indent1, contains "Vote")
          if classes.include?('indent1') && normalized_text.match?(/^vote\s*\d/i)
            return :vote
          end

          # Statutory amounts (indent1, "Statutory amounts")
          if classes.include?('indent1') && normalized_text.include?('statutory')
            return has_data_cells ? :statutory : nil
          end

          # Section header (indent2 with colspan - e.g., "Frozen Allotments")
          if classes.include?('indent2') && has_colspan
            return :section_header
          end

          # Total/Subtotal row (check text pattern)
          if normalized_text.match?(/^(sub)?total|^total ministry/i)
            return :total
          end

          # Data row (has td cells with numeric data)
          if has_data_cells && !has_colspan
            return :data_row
          end
        end

        nil
      end

      def parse_vote_number(vote_text)
        return nil if vote_text.nil?

        # Normalize non-breaking spaces and various dash characters
        normalized = vote_text.gsub(/\u00a0/, ' ')
        normalized = normalized.gsub(/[\u2011\u2013\u2014]/, '-')

        # Match "Vote X" pattern
        if (match = normalized.match(/^Vote\s*(\d+)/i))
          return match[1].to_i
        end

        # Statutory amounts
        if normalized.downcase.include?('statutory')
          return 'Statutory'
        end

        nil
      end

      def build_record(row, source_year, ministry_code, ministry_name_from_page,
                       organization, vote, vote_number, parent_description, classes)
        th = row.at_css('th:not([colspan])')
        th ||= row.at_css('th')
        return nil unless th

        description = extract_clean_text(th)
        return nil if description.empty?

        indent_level = extract_indent_level(classes)

        # Determine ministry name
        ministry_name = ministry_name_from_page || organization
        ministry_name_normalized = normalize_ministry_name(ministry_name)

        cells = row.css('td')

        record = {
          source_year: source_year,
          year: source_year,  # For vol2, document year = fiscal year
          ministry_code: ministry_code,
          ministry_name: ministry_name,
          ministry_name_normalized: ministry_name_normalized,
          organization: organization,
          vote: vote,
          vote_number: vote_number,
          description: description,
          parent_description: parent_description,
          indent_level: indent_level,
          is_total_or_subtotal: is_total_or_subtotal?(description)
        }

        add_numeric_columns(record, cells, source_year)

        record
      end

      def add_numeric_columns(record, cells, source_year)
        # 2013-2015 format: 2 columns (Allotments, Expenditures)
        # 2016+ format: 4 columns (Allotments, Expenditures, Lapsed, Available subsequent)
        if source_year <= 2015
          column_names = [:allotments, :expenditures]
        else
          column_names = [
            :allotments,
            :expenditures,
            :lapsed_or_overexpended,
            :available_subsequent_years
          ]
        end

        cells.each_with_index do |cell, index|
          break if index >= column_names.length
          record[column_names[index]] = parse_numeric(cell.text)
        end
      end

      def extract_indent_level(classes)
        match = classes.match(/indent(\d+)/)
        match ? match[1].to_i : 0
      end

      def extract_clean_text(element)
        return '' unless element

        # Clone to avoid modifying original
        clone = element.dup

        # Remove footnote elements
        clone.css('sup').each(&:remove)

        # Remove screen reader hints
        clone.css('.wb-invisible').each(&:remove)

        # Get text and normalize whitespace
        text = clone.text.strip.gsub(/\s+/, ' ')

        # Remove remaining footnote patterns
        text = text.gsub(/Link to footnote\s*\w*/i, '')
        text = text.gsub(/Links? to table note\s*\d*/i, '')

        text.strip
      end

      def is_total_or_subtotal?(description)
        desc_lower = description.downcase.strip
        patterns = [/^total/, /^subtotal/, /^sub-total/, /^grand total/, /^total ministry/]
        patterns.any? { |p| desc_lower.match?(p) }
      end

      def generate_metadata
        {
          'databases' => {
            'public_accounts' => {
              'tables' => {
                extractor_name => {
                  'title' => 'Budgetary Details by Allotment',
                  'description_html' => "Federal government budgetary appropriations broken down by allotment.\nShows approved allotments, actual expenditures, lapsed amounts, and\namounts available for use in subsequent years.\nData from Volume II of the Public Accounts of Canada.",
                  'source' => 'Public Accounts of Canada, Volume II',
                  'source_url' => 'https://www.tpsgc-pwgsc.gc.ca/recgen/cpc-pac/index-eng.html',
                  'license' => 'Open Government License - Canada',
                  'license_url' => 'https://open.canada.ca/en/open-government-licence-canada',
                  'columns' => {
                    'source_year' => 'Year of the Public Accounts document',
                    'year' => 'Fiscal year (ending year of the fiscal period)',
                    'ministry_code' => 'Ministry identifier from file path (e.g., pc, rcaanc-cirnac)',
                    'ministry_name' => 'Ministry name as it appeared in the original document',
                    'ministry_name_normalized' => 'Ministry name normalized to current (2025) naming',
                    'organization' => 'Department or agency name',
                    'vote' => 'Vote description (e.g., "Vote 1—Operating expenditures")',
                    'vote_number' => 'Numeric vote number (1, 5, 10) or "Statutory"',
                    'description' => 'Allotment item description',
                    'parent_description' => 'Parent description for sub-items (e.g., "Frozen Allotments")',
                    'indent_level' => 'Hierarchy depth (0=organization, 1=vote, 2=allotment, 3=sub-item)',
                    'is_total_or_subtotal' => 'Whether this row is a total or subtotal (true/false)',
                    'allotments' => 'Approved allotment amount (dollars)',
                    'expenditures' => 'Actual expenditures (dollars)',
                    'lapsed_or_overexpended' => 'Lapsed or overexpended amount (dollars, 2016+ only)',
                    'available_subsequent_years' => 'Amount available for future use (dollars, 2016+ only)',
                    'position' => 'Row position within the ministry file for ordering'
                  }
                }
              }
            }
          }
        }
      end
    end
  end
end
