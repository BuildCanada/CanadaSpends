require 'test_helper'
require 'json'
require 'fileutils'
require 'pb_cli/commands/export'
require 'pb_cli/export/standard_objects'
require 'pb_cli/export/units'

# Exporter side of the workforce spec: data/federal/{year}/workforce.json is the
# committed TBS headcount reference merged with the government-wide standard
# -object Personnel figure. Runs against the real committed inputs
# (reference/workforce.json + open_tables meso CSVs).
class TestExportWorkforce < Minitest::Test
  def setup
    @out = File.join(Dir.pwd, 'tmp', 'test', 'workforce_out')
    FileUtils.rm_rf(@out)
    @errors_path = File.join(Dir.pwd, 'tmp', 'test', 'workforce_errors.md')
    @command = PbCli::Commands::Export.new(
      out_dir: @out, errors_path: @errors_path, timestamp: '2026-01-01T00:00:00Z'
    )
  end

  def teardown
    FileUtils.rm_rf(File.join(Dir.pwd, 'tmp', 'test'))
  end

  def load(year)
    JSON.parse(File.read(File.join(@out, year.to_s, 'workforce.json')))
  end

  def test_workforce_json_written_for_every_exported_year
    assert_equal 0, @command.call(['--all-years'])

    index = JSON.parse(File.read(File.join(@out, 'index.json')))
    index['years'].each do |year|
      path = File.join(@out, year.to_s, 'workforce.json')
      assert File.exist?(path), "expected workforce.json for #{year}"
    end
  end

  def test_workforce_json_shape_and_provenance
    @command.call(['--year', '2024'])
    wf = load(2024)

    %w[financialYearEnding headcount headcountAsOf personnelSpending
       averagePersonnelCost source source_url headcountByDepartment].each do |key|
      assert wf.key?(key), "missing #{key}"
    end
    assert_equal 2024, wf['financialYearEnding']
    assert_equal '2024-03-31', wf['headcountAsOf']
    assert_match %r{canada\.ca}, wf['source_url']
    assert_match(/Treasury Board/, wf['source'])
  end

  def test_headcount_in_plausible_range_all_years
    @command.call(['--all-years'])
    index = JSON.parse(File.read(File.join(@out, 'index.json')))

    index['years'].each do |year|
      hc = load(year)['headcount']
      assert_operator hc, :>=, 200_000, "#{year} headcount below plausible floor"
      assert_operator hc, :<=, 400_000, "#{year} headcount above plausible ceiling"
    end
  end

  def test_known_public_headcount_figures
    @command.call(['--all-years'])

    # Spot-checks against published TBS figures (as of March 31).
    assert_equal 257_034, load(2015)['headcount']
    assert_equal 367_772, load(2024)['headcount']
  end

  # averagePersonnelCost = government-wide Personnel (Σ meso rows) ÷ headcount,
  # as whole dollars (salaries + benefits, not "average salary").
  def test_average_personnel_cost_equals_personnel_over_headcount
    @command.call(['--year', '2024'])
    wf = load(2024)

    objects = PbCli::Export::StandardObjects.new(File.join(Dir.pwd, 'open_tables', 'data'))
    personnel = objects.rows(2024).sum do |row|
      pair = row.objects.find { |name, _| name == 'Personnel' }
      pair ? pair[1] : 0.0
    end

    assert_in_delta PbCli::Export::Units.dollars_to_billions(personnel),
                    wf['personnelSpending'], 1e-6
    assert_equal (personnel / wf['headcount']).round, wf['averagePersonnelCost']
    # Sanity: salary+benefits per head sits in a six-figure band.
    assert_operator wf['averagePersonnelCost'], :>, 100_000
    assert_operator wf['averagePersonnelCost'], :<, 250_000
  end

  def test_headcount_by_department_resolution_and_verbatim_unresolved
    @command.call(['--year', '2024'])
    depts = load(2024)['headcountByDepartment']

    assert_operator depts.size, :>, 50
    # Sorted by headcount descending (deterministic).
    counts = depts.map { |d| d['headcount'] }
    assert_equal counts.sort.reverse, counts
    # Resolved rows carry a slug; unresolved keep the raw TBS label, no slug.
    resolved = depts.select { |d| d['resolved'] }
    unresolved = depts.reject { |d| d['resolved'] }
    assert resolved.any? { |d| d['slug'] }
    assert(resolved.all? { |d| d['slug'] })
    assert(unresolved.none? { |d| d.key?('slug') })
    assert(depts.all? { |d| d['name'] && d['headcount'] })
  end

  def test_export_is_deterministic
    @command.call(['--year', '2024'])
    first = File.read(File.join(@out, '2024', 'workforce.json'))

    other = PbCli::Commands::Export.new(
      out_dir: @out, errors_path: @errors_path, timestamp: '2026-01-01T00:00:00Z'
    )
    other.call(['--year', '2024'])
    second = File.read(File.join(@out, '2024', 'workforce.json'))

    assert_equal first, second
  end
end
