require 'csv'

module PbCli
  module Export
    # Reads the open.canada.ca "Ministerial Expenditures by Standard Object as
    # per the Public Accounts of Canada" CSVs (dmac-meso-*.csv), one edition
    # per Public Accounts year (2014–2025). Each row is a
    # (ministry portfolio × organization) pair carrying the twelve Government
    # of Canada standard objects of expenditure plus external/internal
    # revenues. Amounts are in the row's Amt-units column (x1000).
    #
    # Column → standard-object-name mapping (Std-obj1..12) is fixed by the
    # dataset's Vol II Table 3 header (dmac-meso-eng.html): the twelve columns
    # are the canonical GC standard objects, stable across every edition. The
    # French labels come from the -fra Table 3 header and are recorded here so
    # the translation pipeline resolves object leaves to official wording.
    #
    #   Total gross expenditures        = Σ Std-obj1..12
    #   Total ministerial net expenditures = gross − external − internal revenues
    #
    # The miniSankey displays gross object leaves (positive) plus external and
    # internal revenues as NEGATIVE leaves (net presentation, matching the old
    # production chart). Reconciliation against Vol II allotment expenditures
    # is done against GROSS (see Export#validate_meso_reconciliation).
    class StandardObjects
      # Ordered Std-obj1..12 → English name (Vol II Table 3, dmac-meso-eng.html).
      OBJECTS = [
        'Personnel',
        'Transportation and communications',
        'Information',
        'Professional and special services',
        'Rentals',
        'Repair and maintenance',
        'Utilities, materials and supplies',
        'Acquisition of land, buildings and works',
        'Acquisition of machinery and equipment',
        'Transfer payments',
        'Public debt charges',
        'Other subsidies and payments'
      ].freeze

      # Official French object names (Vol II Table 3, dmac-meso-fra.html), by
      # the same 1..12 ordering. Consumed by the translation pipeline.
      OBJECTS_FR = [
        'Personnel',
        'Transports et communications',
        'Information',
        'Services professionnels et spéciaux',
        'Location',
        'Réparation et entretien',
        'Services publics, fournitures et approvisionnements',
        'Acquisition de terrains, bâtiments et travaux',
        'Acquisition de machinerie et matériel',
        'Paiements de transfert',
        'Frais de la dette publique',
        'Autres subventions et paiements'
      ].freeze

      EXTERNAL_REVENUE_LABEL = 'External revenues'.freeze
      INTERNAL_REVENUE_LABEL = 'Internal revenues'.freeze
      EXTERNAL_REVENUE_LABEL_FR = 'Revenus externes'.freeze
      INTERNAL_REVENUE_LABEL_FR = 'Revenus internes'.freeze

      # A parsed meso row. `objects` is an ordered array of [name, dollars]
      # for Std-obj1..12; external/internal are revenue dollars (>= 0).
      Row = Struct.new(:portfolio, :organization, :objects, :external, :internal, keyword_init: true) do
        def gross
          objects.sum { |_, dollars| dollars }
        end

        def net
          gross - external - internal
        end
      end

      def initialize(data_dir)
        @data_dir = data_dir
        @by_year = {}
        (2014..2025).each do |year|
          path = edition_path(year)
          next unless path

          @by_year[year] = parse(path)
        end
      end

      def year?(year)
        @by_year.key?(year)
      end

      def available_years
        @by_year.keys.sort
      end

      # Parsed rows for a fiscal year (ending), or [].
      def rows(year)
        @by_year[year] || []
      end

      private

      # ≤2023 editions ship an -eng.csv; 2024/2025 a single bilingual .csv.
      def edition_path(year)
        eng = File.join(@data_dir, "dmac-meso-#{year}-eng.csv")
        return eng if File.exist?(eng)

        single = File.join(@data_dir, "dmac-meso-#{year}.csv")
        return single if File.exist?(single)

        nil
      end

      def parse(path)
        table = CSV.read(path, headers: true)
        pcol = column(table, /\AMin-portfolio.*eng\z/) || column(table, /\AMin-portfolio/)
        dcol = column(table, /\ADept-name.*eng\z/) || column(table, /\ADept-name/)
        table.map do |r|
          units = r['Amt-units_Mnt-unite']
          objects = OBJECTS.each_with_index.map do |name, i|
            [name, dollars(r["Std-obj#{i + 1}_Art-crnt#{i + 1}"], units)]
          end
          Row.new(
            portfolio: clean(r[pcol]),
            organization: clean(r[dcol]),
            objects: objects,
            external: dollars(r['External-revenues_Revenus-externes'], units),
            internal: dollars(r['Internal-revenues_Revenus-internes'], units)
          )
        end
      end

      def column(table, regexp)
        table.headers.find { |h| h.to_s =~ regexp }
      end

      def dollars(value, units)
        Units.csv_amount_to_dollars(value.to_s.delete(','), units)
      end

      # Strips the footnote <sup> markers some editions leave in labels and
      # normalizes whitespace/dashes so display names are clean.
      def clean(str)
        str.to_s.gsub(%r{<sup>.*?</sup>}, '').gsub(/[‑–]/, '-').gsub(/\s+/, ' ').strip
      end
    end
  end
end
