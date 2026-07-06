require 'yaml'

module PbCli
  module I18n
    # Loads mappings/glossary_fr.yaml (spec §8) and resolves English strings
    # to their official French term via exact or case-normalized lookup --
    # the "glossary pass" that needs no LLM call.
    #
    # "Vote N" (e.g. "Vote 1", "Vote 10") is a special case: it is not a
    # literal value in the open-data CSVs (the exported JSON synthesizes it
    # as "Vote " + the vote code), so it can't be harvested directly. Its
    # French term "Crédit" is confirmed instead by the paired open-data
    # column names Vote-nbr / No-credit ("Vote number" / "Numéro de crédit")
    # in detailbudgetaireaffectation-budgetarydetailsallotment.csv --
    # PbCli::Commands::HarvestGlossary::CURATED_TERMS records that single
    # base term, and VOTE_RE reconstructs "Vote N" -> "Crédit N" here.
    class Glossary
      VOTE_RE = /\AVote\s+(\S+)\z/.freeze

      attr_reader :terms

      class << self
        def load(path)
          terms = File.exist?(path) ? (YAML.load_file(path) || {}) : {}
          new(terms)
        end
      end

      def initialize(terms)
        @terms = terms
        @downcased = {}
        terms.each { |k, v| @downcased[k.downcase] = v }
      end

      def size
        @terms.size
      end

      # Returns the official French term for +text+, or nil when there is no
      # glossary match (the caller should fall back to the LLM pass).
      def translate(text)
        return nil if text.nil?

        stripped = text.to_s.strip
        return nil if stripped.empty?

        return @terms[stripped] if @terms.key?(stripped)

        downcased_hit = @downcased[stripped.downcase]
        return downcased_hit if downcased_hit

        vote_hit(stripped)
      end

      private

      def vote_hit(stripped)
        match = VOTE_RE.match(stripped)
        return nil unless match

        vote_term = @terms['Vote'] || @downcased['vote']
        return nil unless vote_term

        "#{vote_term} #{match[1]}"
      end
    end
  end
end
