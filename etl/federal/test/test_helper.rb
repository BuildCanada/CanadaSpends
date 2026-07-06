$LOAD_PATH.unshift File.expand_path('../lib', __dir__)

require 'minitest/autorun'
require 'pb_cli'

# Module for managing isolated test directories
# Ensures tests don't write to or delete production files
module TestPaths
  # Generate isolated directory structure for a test
  # @param test_name [String] name of the test (e.g., 'extract', 'create_db')
  # @return [Hash] paths hash with all necessary directories
  def paths_for_test(test_name)
    base_dir = File.join(Dir.pwd, 'tmp', 'test', test_name)

    {
      base_dir: base_dir,
      raw_dir: File.join(base_dir, 'raw'),
      extracted_dir: File.join(base_dir, 'extracted'),
      data_dir: File.join(base_dir, 'extracted', 'data'),
      metadata_dir: File.join(base_dir, 'extracted', 'metadata'),
      statscan_dir: File.join(base_dir, 'statscan'),
      statscan_data_dir: File.join(base_dir, 'statscan', 'data'),
      statscan_metadata_dir: File.join(base_dir, 'statscan', 'metadata'),
      open_tables_dir: File.join(base_dir, 'open_tables'),
      db_path: File.join(base_dir, 'test.db')
    }
  end

  # Setup isolated directories for a test
  # @param test_name [String] name of the test
  # @return [Hash] paths hash
  def setup_test_paths(test_name)
    paths = paths_for_test(test_name)
    FileUtils.mkdir_p(paths[:base_dir])
    paths
  end

  # Cleanup isolated directories after a test
  # @param paths [Hash] paths hash from setup_test_paths
  def cleanup_test_paths(paths)
    FileUtils.rm_rf(paths[:base_dir]) if paths && paths[:base_dir]
  end
end
