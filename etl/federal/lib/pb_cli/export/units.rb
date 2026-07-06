module PbCli
  module Export
    # Explicit unit normalization. Source data arrives in three different units
    # (spec §4.5):
    #   * Vol II extracted JSON: dollars
    #   * Vol I open CSVs: the row's Amt-units column (e.g. "x1000000" = millions)
    #   * Vol I HTML-derived tables: millions
    # Everything charted is normalized to billions; line-item tables stay in
    # dollars. All rounding lives here so JSON diffs are deterministic.
    module Units
      BILLION = 1_000_000_000.0
      MILLION = 1_000_000.0

      # Decimal places for billions in chart data (spec: 5+).
      BILLIONS_PRECISION = 6

      class << self
        # Dollars (Vol II) -> billions.
        def dollars_to_billions(dollars)
          round_billions(dollars.to_f / BILLION)
        end

        # A Vol I open-CSV amount + its Amt-units string -> billions.
        # Supports "x1000000" (millions), "x1000" (thousands) and "x1" (dollars).
        def csv_amount_to_billions(amount, amt_units)
          round_billions(csv_amount_to_dollars(amount, amt_units) / BILLION)
        end

        # A Vol I open-CSV amount + its Amt-units string -> raw dollars.
        def csv_amount_to_dollars(amount, amt_units)
          amount.to_f * csv_unit_multiplier(amt_units)
        end

        # Millions (Vol I HTML tables) -> billions.
        def millions_to_billions(millions)
          round_billions(millions.to_f / 1000.0)
        end

        # The dollar multiplier encoded by an "x1000000"-style units string.
        def csv_unit_multiplier(amt_units)
          m = amt_units.to_s.strip.downcase.match(/\Ax(\d+)\z/)
          raise ArgumentError, "unrecognized Amt-units: #{amt_units.inspect}" unless m

          m[1].to_i
        end

        def round_billions(value)
          value.round(BILLIONS_PRECISION)
        end

        # Dollars are always whole integers in line-item tables.
        def round_dollars(value)
          value.round
        end
      end
    end
  end
end
