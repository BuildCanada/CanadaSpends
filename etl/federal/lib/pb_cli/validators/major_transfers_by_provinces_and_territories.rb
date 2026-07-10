require_relative 'base'

module PbCli
  module Validators
    class MajorTransfersByProvincesAndTerritories < Base
      # Valid province/territory/jurisdiction names (not totals/adjustments)
      VALID_JURISDICTIONS = [
        'Alberta',
        'British Columbia',
        'International',
        'Manitoba',
        'New Brunswick',
        'Newfoundland and Labrador',
        'Northwest Territories',
        'Nova Scotia',
        'Nunavut',
        'Ontario',
        'Prince Edward Island',
        'Quebec',
        'Saskatchewan',
        'Yukon'
      ].freeze

      # Subset that are actual provinces/territories (for data completeness checks)
      PROVINCES_AND_TERRITORIES = VALID_JURISDICTIONS - ['International']

      def table_name
        'major_transfers_by_provinces_and_territories'
      end

      def validate
        validate_required_columns_present
        validate_no_malformed_column_names
        validate_no_double_spaces
        validate_province_territory_names
        validate_source_year_range
        validate_fiscal_year_relationship
        validate_position_values
        validate_is_total_or_subtotal_flag
        validate_monetary_columns_numeric
        validate_provinces_have_core_data
      end

      private

      # Validate that expected columns exist in the table
      def validate_required_columns_present
        run_validation('required_columns_present', 'Check that required columns exist')
        required = %w[source_year year province_territory position is_total_or_subtotal]

        return if all_rows.empty?

        actual_columns = all_rows.first.keys

        required.each do |col|
          unless actual_columns.include?(col)
            record_failure("Required column '#{col}' is missing from table")
          end
        end
      end

      # Validate no column names contain "link_to" (indicates extraction bug)
      def validate_no_malformed_column_names
        run_validation('no_malformed_column_names', 'Check for columns with extraction artifacts like "link_to"')
        return if all_rows.empty?

        actual_columns = all_rows.first.keys
        malformed = actual_columns.select { |col| col.include?('link_to') }

        malformed.each do |col|
          record_failure("Malformed column name '#{col}' - contains 'link_to' (extraction bug)")
        end
      end

      # Validate no string cells contain double spaces
      def validate_no_double_spaces
        run_validation('no_double_spaces', 'Check that no text cells contain double spaces')

        each_row do |row, _|
          context = row_context(row)

          row.each do |col, value|
            next unless value.is_a?(String)
            next unless value.include?('  ')

            record_failure("Column '#{col}' contains double spaces: '#{value}' #{format_context(context)}")
          end
        end
      end

      # Validate province_territory names are valid for non-total/subtotal rows
      def validate_province_territory_names
        run_validation('province_territory_names', 'Check province/territory names are valid')

        each_row do |row, _|
          province = row['province_territory']
          is_total = row['is_total_or_subtotal'] == 1
          context = row_context(row)

          # Skip rows marked as totals/subtotals
          next if is_total

          # For non-total rows, province_territory should be a valid jurisdiction
          unless VALID_JURISDICTIONS.include?(province)
            record_failure("Invalid province_territory '#{province}' - not in valid jurisdictions list #{format_context(context)}")
          end
        end
      end

      # Validate source_year is within expected range
      # Data starts from 2013, upper bound allows for future years
      def validate_source_year_range
        run_validation('source_year_range', 'Check source_year is between 2013 and 2030')
        each_row do |row, _|
          source_year = row['source_year']
          context = row_context(row)

          assert_not_blank(source_year, 'source_year', context)
          assert_in_range(source_year, 2013, 2030, 'source_year', context)
        end
      end

      # Validate that fiscal year is reasonable relative to source_year
      # Each document shows current and prior fiscal year, so year should be
      # source_year or source_year - 1
      def validate_fiscal_year_relationship
        run_validation('fiscal_year_relationship', 'Check year equals source_year or source_year-1')
        each_row do |row, _|
          source_year = row['source_year']
          year = row['year']
          context = row_context(row)

          assert_not_blank(year, 'year', context)

          next if year.nil? || source_year.nil?

          # Fiscal year should be within [source_year - 1, source_year]
          valid_years = [source_year - 1, source_year]
          unless valid_years.include?(year)
            record_failure("year (#{year}) should be source_year or source_year-1 (#{source_year}) #{format_context(context)}")
          end
        end
      end

      # Validate position is a positive integer
      def validate_position_values
        run_validation('position_values', 'Check position is greater than zero')
        each_row do |row, _|
          position = row['position']
          context = row_context(row)

          assert_greater_than_zero(position, 'position', context)
        end
      end

      # Validate is_total_or_subtotal flag is 0 or 1
      def validate_is_total_or_subtotal_flag
        run_validation('is_total_or_subtotal_flag', 'Check is_total_or_subtotal is 0 or 1')
        each_row do |row, _|
          flag = row['is_total_or_subtotal']
          context = row_context(row)

          assert_one_of(flag, [0, 1], 'is_total_or_subtotal', context)
        end
      end

      # Validate monetary columns have numeric values when present
      def validate_monetary_columns_numeric
        run_validation('monetary_columns_numeric', 'Check monetary columns are numeric when present')
        # Core monetary columns that should be present
        monetary_columns = %w[
          old_age_security_benefits
          fiscal_arrangements
          quebec_abatement
          canada_health_transfer
          canada_social_transfer
          other_major_transfers
          childrens_benefits
          total
        ]

        each_row do |row, _|
          context = row_context(row)

          monetary_columns.each do |col|
            next unless row.key?(col)
            assert_numeric(row[col], col, context)
          end
        end
      end

      # Validate that provinces/territories have core monetary data
      # For each source_year, provinces should have values in key columns
      def validate_provinces_have_core_data
        run_validation('provinces_have_core_data', 'Check provinces have data in core monetary columns')

        # Core columns that provinces should always have (pre-2020, before column changes)
        core_columns = %w[old_age_security_benefits total]

        # Group rows by source_year
        rows_by_source_year = all_rows.group_by { |r| r['source_year'] }

        rows_by_source_year.each do |source_year, rows|
          # Check only provincial rows (not totals/adjustments)
          provincial_rows = rows.select do |r|
            PROVINCES_AND_TERRITORIES.include?(r['province_territory'])
          end

          provincial_rows.each do |row|
            context = row_context(row)

            core_columns.each do |col|
              next unless row.key?(col)
              value = row[col]

              if value.nil?
                record_failure("#{col} is NULL for province #{format_context(context)}")
              end
            end
          end
        end
      end

      def row_context(row)
        {
          source_year: row['source_year'],
          year: row['year'],
          province_territory: row['province_territory']
        }
      end

      def format_context(context)
        return "" if context.empty?
        parts = context.map { |k, v| "#{k}=#{v}" }
        "[#{parts.join(', ')}]"
      end
    end
  end
end
