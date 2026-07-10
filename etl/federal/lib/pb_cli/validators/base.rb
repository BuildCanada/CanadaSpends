require 'json'
require 'open3'
require_relative 'common_assertions'

module PbCli
  module Validators
    class Base
      include CommonAssertions

      def initialize(db_path)
        @db_path = db_path
        initialize_assertions
        @validations_run = []
      end

      # Abstract method - must be implemented by subclasses
      def validate
        raise NotImplementedError, "Subclasses must implement #validate"
      end

      # Abstract method - returns the table name
      def table_name
        raise NotImplementedError, "Subclasses must implement #table_name"
      end

      # Run validation and return results
      def run
        start_time = Time.now

        validate

        {
          table: table_name,
          passed: failures.empty?,
          failure_count: failures.size,
          failures: failures,
          validations_run: @validations_run,
          duration: Time.now - start_time
        }
      end

      protected

      # Track a validation being run
      def run_validation(name, description = nil)
        @validations_run << { name: name, description: description }
      end

      # Execute a SQL query and return results as array of hashes
      def query(sql)
        cmd = ['sqlite3', '-json', @db_path, sql]
        stdout, stderr, status = Open3.capture3(*cmd)

        unless status.success?
          raise "SQL query failed: #{stderr}"
        end

        # sqlite3 -json returns empty string for no results
        return [] if stdout.strip.empty?

        JSON.parse(stdout)
      end

      # Get all rows from the table
      def all_rows
        @all_rows ||= query("SELECT * FROM #{table_name}")
      end

      # Get distinct values for a column
      def distinct_values(column)
        query("SELECT DISTINCT #{column} FROM #{table_name} ORDER BY #{column}")
          .map { |row| row[column] }
      end

      # Get count of rows
      def row_count
        result = query("SELECT COUNT(*) as count FROM #{table_name}")
        result.first['count']
      end

      # Iterate over all rows with context
      def each_row(&block)
        all_rows.each_with_index do |row, index|
          yield row, index
        end
      end
    end
  end
end
