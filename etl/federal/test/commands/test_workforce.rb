require 'test_helper'
require 'json'
require 'pb_cli/commands/workforce'

class TestWorkforce < Minitest::Test
  FIXTURE_DIR = File.expand_path('../fixtures/workforce', __dir__)

  def setup
    @command = PbCli::Commands::Workforce.new(retrieved: '2026-07-08')
    @html = File.read(File.join(FIXTURE_DIR, 'population-by-department-excerpt.html'))
    @csv = File.read(File.join(FIXTURE_DIR, 'population-by-department-excerpt.csv'))
  end

  def test_parse_html_reads_totals_from_total_row
    years = @command.parse_html(@html)

    # Government-wide total comes from the table's Total row (the published
    # "Population of the Federal Public Service" figure), not a department sum.
    assert_equal 257_034, years[2015][:total]
    assert_equal 258_979, years[2016][:total]
    assert_equal 262_696, years[2017][:total]
  end

  def test_parse_html_reads_departments_across_sections
    years = @command.parse_html(@html)

    # A Core public administration department and a Separate agencies one.
    assert_equal 5291, years[2015][:departments]['Agriculture and Agri-Food Canada']
    assert_equal 38_975, years[2015][:departments]['Canada Revenue Agency']
  end

  def test_parse_html_handles_nbsp_thousands_and_dashes
    years = @command.parse_html(@html)

    # "23&nbsp;601" -> 23601 (non-breaking-space thousands separator).
    assert_equal 23_601, years[2017][:departments]['National Defence']
    # An em-dash cell is treated as no data (skipped), not zero.
    refute years[2017][:departments].key?('The Correctional Investigator Canada')
    assert_equal 35, years[2015][:departments]['The Correctional Investigator Canada']
  end

  def test_parse_html_skips_section_and_header_rows
    depts = @command.parse_html(@html)[2015][:departments]

    refute depts.key?('Core public administration')
    refute depts.key?('Separate agencies')
    refute depts.key?('Total')
    refute depts.key?('Department or agency')
  end

  def test_parse_csv_sums_total_and_reads_departments
    years = @command.parse_csv(@csv)

    assert_equal 5291 + 14_096 + 38_975 + 3876, years[2014][:total]
    assert_equal 5291, years[2014][:departments]['Agriculture and Agri-Food Canada']
    assert_equal 38_975, years[2014][:departments]['Canada Revenue Agency']
  end

  def test_merge_prefers_html_and_backfills_2014_from_csv
    merged = @command.merge(@command.parse_html(@html), @command.parse_csv(@csv))

    # 2014 is absent from the HTML window, so it is backfilled from the CSV.
    assert merged.key?(2014)
    assert_equal 62_238, merged[2014]['headcount']
    assert_includes merged[2014]['source_url'], 'ssa-pop-eng.csv'
    assert_equal '2014-03-31', merged[2014]['headcountAsOf']

    # 2015 exists in both; the HTML Total row wins over the CSV partial sum.
    assert_equal 257_034, merged[2015]['headcount']
    assert_includes merged[2015]['source_url'], 'population-federal-public-service-department.html'
  end

  def test_merge_only_covers_published_years
    merged = @command.merge(@command.parse_html(@html), @command.parse_csv(@csv))

    # Years present in the source (2016, 2017) but nothing outside 2014-2025.
    assert(merged.keys.all? { |y| (2014..2025).cover?(y) })
    assert merged.key?(2016)
  end

  def test_entry_department_map_is_alphabetized_for_determinism
    merged = @command.merge(@command.parse_html(@html), @command.parse_csv(@csv))
    names = merged[2015]['headcountByDepartment'].keys

    assert_equal names.sort, names
  end
end
