require 'json'
require 'net/http'
require 'uri'

module PbCli
  # Minimal Anthropic Messages API client (spec §8-9). Plain Net::HTTP, no
  # official SDK dependency -- see etl/federal/README.md for why. The HTTP
  # transport is injectable (`http_post:`) so tests never hit the network.
  class ClaudeClient
    API_URL = 'https://api.anthropic.com/v1/messages'.freeze
    ANTHROPIC_VERSION = '2023-06-01'.freeze
    MODEL = 'claude-opus-4-8'.freeze
    DEFAULT_MAX_TOKENS = 8000

    class ApiError < StandardError; end

    attr_reader :last_usage, :model

    def initialize(api_key: ENV['ANTHROPIC_API_KEY'], model: MODEL, http_post: nil)
      @api_key = api_key
      @model = model
      @http_post = http_post || method(:default_post)
      @last_usage = nil
    end

    def configured?
      !@api_key.nil? && !@api_key.to_s.strip.empty?
    end

    # Sends a single-turn Messages API request and returns the text of the
    # first text content block. Raises ApiError on a non-2xx response or a
    # response with no text content block.
    def complete(system:, user:, max_tokens: DEFAULT_MAX_TOKENS)
      raise ApiError, 'ANTHROPIC_API_KEY is not set' unless configured?

      body = {
        model: @model,
        max_tokens: max_tokens,
        system: system,
        messages: [{ role: 'user', content: user }]
      }

      response = @http_post.call(API_URL, headers, body.to_json)
      parsed = JSON.parse(response.body)

      unless success?(response)
        message = parsed.is_a?(Hash) ? parsed.dig('error', 'message') : nil
        raise ApiError, "#{status_code(response)}: #{message || response.body}"
      end

      @last_usage = parsed['usage']

      text_block = (parsed['content'] || []).find { |b| b['type'] == 'text' }
      raise ApiError, "No text content block in response: #{parsed.inspect}" unless text_block

      text_block['text']
    end

    private

    def success?(response)
      response.respond_to?(:is_a?) && response.is_a?(Net::HTTPSuccess)
    end

    def status_code(response)
      response.respond_to?(:code) ? response.code : 'unknown'
    end

    def headers
      {
        'x-api-key' => @api_key,
        'anthropic-version' => ANTHROPIC_VERSION,
        'content-type' => 'application/json'
      }
    end

    def default_post(url, headers, body)
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 30
      http.read_timeout = 180
      request = Net::HTTP::Post.new(uri.request_uri, headers)
      request.body = body
      http.request(request)
    end
  end
end
