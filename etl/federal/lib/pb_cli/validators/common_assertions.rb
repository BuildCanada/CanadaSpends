module PbCli
  module Validators
    module CommonAssertions
      def initialize_assertions
        @assertions = 0
        @failures = []
      end

      def record_failure(message)
        @failures << message
      end

      def failures
        @failures
      end

      # Asserts value is not nil and not empty string
      def assert_not_blank(value, column_name, context = {})
        if value.nil? || (value.is_a?(String) && value.strip.empty?)
          record_failure("#{column_name} is blank #{format_context(context)}")
        end
      end

      # Asserts value is greater than zero (for values that must be positive)
      def assert_greater_than_zero(value, column_name, context = {})
        return if value.nil?
        unless value.is_a?(Numeric) && value > 0
          record_failure("#{column_name} must be > 0, got #{value.inspect} #{format_context(context)}")
        end
      end

      # Asserts value is greater than or equal to zero (non-negative)
      def assert_non_negative(value, column_name, context = {})
        return if value.nil?
        unless value.is_a?(Numeric) && value >= 0
          record_failure("#{column_name} must be >= 0, got #{value.inspect} #{format_context(context)}")
        end
      end

      # Asserts value is within a range (inclusive)
      def assert_in_range(value, min, max, column_name, context = {})
        return if value.nil?
        unless value.is_a?(Numeric) && value >= min && value <= max
          record_failure("#{column_name} must be between #{min} and #{max}, got #{value.inspect} #{format_context(context)}")
        end
      end

      # Asserts value is one of the allowed values
      def assert_one_of(value, allowed_values, column_name, context = {})
        unless allowed_values.include?(value)
          record_failure("#{column_name} must be one of #{allowed_values.inspect}, got #{value.inspect} #{format_context(context)}")
        end
      end

      # Asserts value is numeric (Integer or Float)
      def assert_numeric(value, column_name, context = {})
        return if value.nil?
        unless value.is_a?(Numeric)
          record_failure("#{column_name} must be numeric, got #{value.class} #{format_context(context)}")
        end
      end

      private

      def format_context(context)
        return "" if context.empty?
        parts = context.map { |k, v| "#{k}=#{v}" }
        "[#{parts.join(', ')}]"
      end
    end
  end
end
