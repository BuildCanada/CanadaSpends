require 'cli/ui'
require 'csv'
require 'fileutils'
require 'yaml'

module PbCli
  module Commands
    # `pb harvest-glossary` (spec §8) -- harvests official EN->FR term pairs
    # from the bilingual open.canada.ca Public Accounts CSVs so the translate
    # pipeline can resolve terminology without an LLM call. Every CSV in
    # open_tables/data/ that has paired `<prefix>_eng` / `<prefix>_fra`
    # columns is scanned (ministry/portfolio names, entity/organization
    # names, vote descriptions, transfer-payment categories and
    # descriptions, ...). Conflicting French variants for the same English
    # term are resolved by frequency, ties broken alphabetically so the
    # output is deterministic across re-runs.
    class HarvestGlossary
      MAX_VALUE_LENGTH = 200

      # Terms confirmed by evidence in the open data that isn't itself an
      # _eng/_fra data VALUE pair -- see PbCli::I18n::Glossary for how "Vote"
      # is expanded into "Vote N" -> "Crédit N" at lookup time.
      CURATED_TERMS = {
        'Vote' => 'Crédit',
        # Aggregate leaf for the transfer-program fanout (drop-authorities §2).
        'Other transfer programs' => 'Autres programmes de transfert',
        # PA-era "X Department" organization labels (and a few footnote-stripping
        # spacing artifacts) surfaced as entity + miniSankey org names once
        # department figures moved to the standard-object (meso) basis
        # (drop-authorities §1). Official-register names.
        'Agriculture and Agri-Food Department' => "Ministère de l'Agriculture et de l'Agroalimentaire",
        'Atlantic Canada Opportunities Agency Department' => 'Agence de promotion économique du Canada atlantique',
        'Atlantic Canada OpportunitiesAgency' => 'Agence de promotion économique du Canada atlantique',
        'Canadian Heritage Department' => 'Ministère du Patrimoine canadien',
        'Citizenship and Immigration Department' => "Ministère de la Citoyenneté et de l'Immigration",
        'Department of Foreign Affairs,Trade and Development' => 'Ministère des Affaires étrangères, du Commerce et du Développement',
        'Employment and Social Development Department' => "Ministère de l'Emploi et du Développement social",
        'Environment Department' => "Ministère de l'Environnement",
        'Finance Department' => 'Ministère des Finances',
        'Foreign Affairs,Trade and Development Department' => 'Ministère des Affaires étrangères, du Commerce et du Développement',
        'Health Department' => 'Ministère de la Santé',
        'Indian Affairs and Northern Development Department' => 'Ministère des Affaires indiennes et du Nord canadien',
        'Industry Department' => "Ministère de l'Industrie",
        'Justice Department' => 'Ministère de la Justice',
        'National Defence Department' => 'Ministère de la Défense nationale',
        'National Research Council ofCanada' => 'Conseil national de recherches du Canada',
        'National Security and Intelligence Review' => 'Examen de la sécurité nationale et du renseignement',
        'Natural Resources Department' => 'Ministère des Ressources naturelles',
        'Office of Infrastructure of Canada Department' => "Bureau de l'infrastructure du Canada",
        'Office of the ChiefElectoral Officer' => 'Bureau du directeur général des élections',
        'Office of the Director of PublicProsecutions' => 'Bureau du directeur des poursuites pénales',
        'Offices of the Information and Privacy Commissioners ofCanada' => "Commissariats à l'information et à la protection de la vie privée du Canada",
        'Privy Council Office Department' => 'Bureau du Conseil privé',
        'Public Safety and Emergency Preparedness Department' => 'Ministère de la Sécurité publique et de la Protection civile',
        'Public Works and Government Services Department' => 'Ministère des Travaux publics et des Services gouvernementaux',
        'Registrar of the Supreme Courtof Canada' => 'Registraire de la Cour suprême du Canada',
        'Transport Department' => 'Ministère des Transports',
        'Veterans Affairs Department' => 'Ministère des Anciens Combattants',
        'Veterans Review and AppealBoard' => 'Tribunal des anciens combattants (révision et appel)'
      }.freeze

      def initialize(paths = {})
        root = paths[:root] || Dir.pwd
        @open_tables_dir = paths[:open_tables_dir] || File.join(root, 'open_tables/data')
        @out_path = paths[:out_path] || File.join(root, 'mappings/glossary_fr.yaml')
      end

      def call(args)
        opts = parse_args(args)
        return opts[:exit] if opts[:exit]

        source_dir = opts[:source] || @open_tables_dir
        unless Dir.exist?(source_dir)
          puts ::CLI::UI.fmt("{{x}} No such directory: #{source_dir}")
          return 1
        end

        files = Dir.glob(File.join(source_dir, '*.csv')).sort
        if files.empty?
          puts ::CLI::UI.fmt("{{x}} No CSVs found in #{source_dir}")
          return 1
        end

        counts = Hash.new { |h, k| h[k] = Hash.new(0) }

        ::CLI::UI::Frame.open("Harvesting glossary from #{files.size} CSVs") do
          files.each { |file| harvest_file(file, counts) }
        end

        terms = resolve(counts)
        CURATED_TERMS.each { |k, v| terms[k] ||= v }

        FileUtils.mkdir_p(File.dirname(@out_path))
        write_yaml(terms)

        puts ::CLI::UI.fmt("{{v}} #{terms.size} terms written to #{@out_path}")
        0
      end

      private

      def parse_args(args)
        opts = {}
        i = 0
        while i < args.length
          case args[i]
          when '--source' then opts[:source] = File.expand_path(args[i += 1])
          when '--out' then @out_path = File.expand_path(args[i += 1])
          when '--help', '-h'
            print_help
            return { exit: 0 }
          else
            puts "Unknown argument: #{args[i]}"
            print_help
            return { exit: 1 }
          end
          i += 1
        end
        opts
      end

      def print_help
        puts 'Usage: pb harvest-glossary [--source DIR] [--out FILE]'
        puts ''
        puts "  --source DIR  Directory of bilingual open.canada.ca CSVs (default: #{@open_tables_dir})"
        puts "  --out FILE    Output glossary path (default: #{@out_path})"
      end

      def harvest_file(file, counts)
        pairs = nil

        CSV.foreach(file, headers: true, encoding: 'bom|utf-8:utf-8', liberal_parsing: true) do |row|
          pairs ||= column_pairs(row.headers)
          break if pairs.empty?

          pairs.each { |eng_h, fra_h| record_pair(counts, row[eng_h], row[fra_h]) }
        end
      rescue CSV::MalformedCSVError, ArgumentError => e
        puts ::CLI::UI.fmt("{{x}} #{File.basename(file)}: #{e.message}")
      end

      def record_pair(counts, eng, fra)
        return unless eng && fra

        eng = eng.strip
        fra = fra.strip
        return if eng.empty? || fra.empty?
        return if eng.length > MAX_VALUE_LENGTH
        return if eng == fra && !eng.match?(/[a-zA-Z]/) # identical + no letters: a code, not a term

        counts[eng][fra] += 1
      end

      def column_pairs(headers)
        headers.compact.select { |h| h.end_with?('_eng') }.filter_map do |eng_header|
          prefix = eng_header[0..-5]
          fra_header = "#{prefix}_fra"
          [eng_header, fra_header] if headers.include?(fra_header)
        end
      end

      def resolve(counts)
        counts.each_with_object({}) do |(eng, variants), terms|
          top_count = variants.values.max
          best = variants.select { |_fra, n| n == top_count }.keys.sort.first
          terms[eng] = best
        end
      end

      def write_yaml(terms)
        header = <<~HEADER
          # Generated by `bin/pb harvest-glossary` (spec §8). Official EN->FR term
          # pairs harvested from the bilingual open.canada.ca Public Accounts CSVs
          # (open_tables/data/*.csv), plus a small curated set --
          # see PbCli::Commands::HarvestGlossary::CURATED_TERMS.
          #
          # Do not hand-edit the harvested entries; re-run `bin/pb harvest-glossary`
          # to refresh them as new open-data editions are downloaded.
        HEADER
        sorted = terms.sort.to_h
        body = sorted.to_yaml.sub(/\A---\n/, '')
        File.write(@out_path, header + body)
      end
    end
  end
end
