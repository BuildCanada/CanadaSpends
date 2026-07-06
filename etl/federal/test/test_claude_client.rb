require 'test_helper'
require 'json'
require 'pb_cli/claude_client'

FakeHttpResponse = Struct.new(:code, :body) do
  def is_a?(klass)
    return (200..299).cover?(code.to_i) if klass == Net::HTTPSuccess

    super
  end
end

class TestClaudeClient < Minitest::Test
  def test_configured_is_false_without_an_api_key
    client = PbCli::ClaudeClient.new(api_key: nil, http_post: ->(*) { raise 'unused' })
    refute client.configured?
  end

  def test_configured_is_true_with_an_api_key
    client = PbCli::ClaudeClient.new(api_key: 'sk-test', http_post: ->(*) { raise 'unused' })
    assert client.configured?
  end

  def test_complete_raises_without_calling_out_when_unconfigured
    client = PbCli::ClaudeClient.new(api_key: nil, http_post: ->(*) { raise 'should not be called' })

    assert_raises(PbCli::ClaudeClient::ApiError) { client.complete(system: 's', user: 'u') }
  end

  def test_complete_returns_the_first_text_block_and_records_usage
    body = JSON.generate(
      'content' => [{ 'type' => 'text', 'text' => 'bonjour' }],
      'usage' => { 'input_tokens' => 12, 'output_tokens' => 3 }
    )
    posted = nil
    client = PbCli::ClaudeClient.new(api_key: 'sk-test', http_post: lambda { |url, headers, req_body|
      posted = { url: url, headers: headers, body: req_body }
      FakeHttpResponse.new(200, body)
    })

    result = client.complete(system: 'sys', user: 'hello')

    assert_equal 'bonjour', result
    assert_equal({ 'input_tokens' => 12, 'output_tokens' => 3 }, client.last_usage)
    assert_equal 'https://api.anthropic.com/v1/messages', posted[:url]
    assert_equal 'sk-test', posted[:headers]['x-api-key']

    sent = JSON.parse(posted[:body])
    assert_equal 'claude-opus-4-8', sent['model']
    assert_equal 'sys', sent['system']
    assert_equal 'hello', sent['messages'].first['content']
  end

  def test_complete_raises_api_error_on_non_success_response
    body = JSON.generate('error' => { 'message' => 'invalid api key' })
    client = PbCli::ClaudeClient.new(api_key: 'sk-bad', http_post: ->(*) { FakeHttpResponse.new(401, body) })

    error = assert_raises(PbCli::ClaudeClient::ApiError) { client.complete(system: 's', user: 'u') }
    assert_includes error.message, 'invalid api key'
  end

  def test_complete_raises_when_response_has_no_text_block
    body = JSON.generate('content' => [{ 'type' => 'tool_use' }])
    client = PbCli::ClaudeClient.new(api_key: 'sk-test', http_post: ->(*) { FakeHttpResponse.new(200, body) })

    assert_raises(PbCli::ClaudeClient::ApiError) { client.complete(system: 's', user: 'u') }
  end
end
