require 'digest'
require 'fileutils'
require 'json'
require 'pb_cli/i18n/collector'

module PbCli
  module I18n
    # Orchestrates the translate pipeline for one year (spec §8):
    #
    #   1. Collect every translatable (id, EN text) pair.
    #   2. Skip ids whose EN source text is unchanged since the last run
    #      (tracked via a per-id source-text hash sidecar) -- incremental.
    #   3. Resolve as many of the rest as possible from the glossary (no API
    #      call).
    #   4. Batch anything left over to the Claude API.
    #   5. Write fr.json (a flat id -> string map -- the exact shape
    #      src/lib/federal.ts requires) and fr.hashes.json, both sorted by
    #      key for deterministic PR diffs.
    #
    # `client` only needs to respond to `#complete(system:, user:, max_tokens:)`
    # and `#last_usage` -- see PbCli::ClaudeClient. Injected in tests.
    class Translator
      BATCH_SIZE = 40
      MAX_GLOSSARY_TERMS_PER_BATCH = 200

      Result = Struct.new(
        :translated_count, :glossary_count, :llm_count, :cache_hit_count,
        :untranslated_count, :input_tokens, :output_tokens,
        keyword_init: true
      )

      def initialize(year_dir:, glossary:, client:, prompt_template:, logger: ->(_msg) {})
        @year_dir = year_dir
        @glossary = glossary
        @client = client
        @prompt_template = prompt_template
        @logger = logger
      end

      def run
        items = Collector.new(@year_dir).collect
        fr_path = i18n_path('fr.json')
        hashes_path = i18n_path('fr.hashes.json')

        existing_fr = load_json(fr_path)
        existing_hashes = load_json(hashes_path)

        new_fr = {}
        new_hashes = {}
        needs_translation = {}
        glossary_count = 0
        cache_hit_count = 0

        items.each do |id, text|
          hash = source_hash(text)

          if reusable?(existing_fr, existing_hashes, id, hash)
            new_fr[id] = existing_fr[id]
            new_hashes[id] = hash
            cache_hit_count += 1
            next
          end

          glossary_hit = @glossary.translate(text)
          if glossary_hit
            new_fr[id] = glossary_hit
            new_hashes[id] = hash
            glossary_count += 1
          else
            needs_translation[id] = text
          end
        end

        llm_count, usage = translate_remaining(needs_translation, new_fr, new_hashes)

        write_json(fr_path, new_fr)
        write_json(hashes_path, new_hashes)

        Result.new(
          translated_count: new_fr.size,
          glossary_count: glossary_count,
          llm_count: llm_count,
          cache_hit_count: cache_hit_count,
          untranslated_count: needs_translation.size - llm_count,
          input_tokens: usage[:input_tokens],
          output_tokens: usage[:output_tokens]
        )
      end

      private

      def reusable?(existing_fr, existing_hashes, id, hash)
        existing_hashes[id] == hash && existing_fr.key?(id)
      end

      def translate_remaining(needs_translation, new_fr, new_hashes)
        llm_count = 0
        usage = { input_tokens: 0, output_tokens: 0 }
        return [llm_count, usage] if needs_translation.empty?

        needs_translation.each_slice(BATCH_SIZE) do |slice|
          batch = slice.to_h
          translations = translate_batch(batch)
          batch.each_key do |id|
            translation = translations[id]
            next unless translation && !translation.to_s.strip.empty?

            new_fr[id] = translation
            new_hashes[id] = source_hash(batch[id])
            llm_count += 1
          end
          accumulate_usage(usage)
        end

        [llm_count, usage]
      end

      def accumulate_usage(usage)
        last_usage = @client.respond_to?(:last_usage) ? @client.last_usage : nil
        return unless last_usage

        usage[:input_tokens] += last_usage['input_tokens'].to_i
        usage[:output_tokens] += last_usage['output_tokens'].to_i
      end

      def source_hash(text)
        Digest::SHA256.hexdigest(text)
      end

      def translate_batch(batch)
        prompt = build_prompt(batch)
        response_text = @client.complete(system: system_prompt, user: prompt)
        parse_translations(response_text, batch.keys)
      rescue StandardError => e
        @logger.call("translate batch of #{batch.size} failed: #{e.message}")
        {}
      end

      def system_prompt
        'You are a professional Government of Canada translator producing ' \
          'French labels for a public federal-spending transparency site. ' \
          'Follow official bilingual terminology and civil-service register.'
      end

      def build_prompt(batch)
        items_payload = batch.map { |id, text| { id: id, text: text } }
        @prompt_template
          .sub('{{GLOSSARY}}', glossary_block(batch.values))
          .sub('{{ITEMS}}', JSON.pretty_generate(items_payload))
      end

      def glossary_block(texts)
        relevant_glossary_terms(texts)
          .map { |en, fr| "- #{en} => #{fr}" }
          .join("\n")
      end

      def relevant_glossary_terms(texts)
        combined = texts.join(' ␟ ').downcase
        @glossary.terms
                 .select { |en, _fr| combined.include?(en.downcase) }
                 .first(MAX_GLOSSARY_TERMS_PER_BATCH)
      end

      def parse_translations(text, expected_ids)
        parsed = JSON.parse(extract_json(text))
        return {} unless parsed.is_a?(Hash)

        expected = expected_ids.each_with_object({}) { |id, h| h[id] = true }
        parsed.select { |k, _v| expected.key?(k) }
      rescue JSON::ParserError
        {}
      end

      def extract_json(text)
        fenced = text[/```(?:json)?\s*(\{.*?\})\s*```/m, 1]
        return fenced if fenced

        text[/\{.*\}/m] || text
      end

      def i18n_path(filename)
        File.join(@year_dir, 'i18n', filename)
      end

      def load_json(path)
        return {} unless File.exist?(path)

        parsed = JSON.parse(File.read(path))
        parsed.is_a?(Hash) ? parsed : {}
      rescue JSON::ParserError
        {}
      end

      def write_json(path, hash)
        FileUtils.mkdir_p(File.dirname(path))
        sorted = hash.sort.to_h
        File.write(path, "#{JSON.pretty_generate(sorted)}\n")
      end
    end
  end
end
