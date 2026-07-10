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

  # --- demographics dimensions -----------------------------------------

  def fixture(name)
    File.read(File.join(FIXTURE_DIR, name))
  end

  def test_parse_bands_html_reads_the_federal_public_service_section_only
    bands = @command.parse_bands_html(fixture('population-by-age-band-excerpt.html'))

    # Government-wide figures (496), not the CPA (416) or SA (80) sections.
    assert_equal [['<20', 496], ['20-24', 8101], ['65+', 5175], ['Unknown', 1]], bands[2015]
    assert_equal 478, bands[2016].first[1]
  end

  def test_parse_bands_html_keeps_unknown_and_excludes_total
    bands = @command.parse_bands_html(fixture('population-by-tenure-excerpt.html'))
    labels = bands[2015].map(&:first)

    assert_includes labels, 'Unknown'
    refute_includes labels, 'Total'
    assert_equal [['Casual', 8663], ['Indeterminate', 219_668], ['Unknown', 0]], bands[2015]
  end

  def test_parse_bands_csv_sums_universes_in_band_order
    bands = @command.parse_bands_csv(fixture('age-band-excerpt.csv'), 'Ageband')

    assert_equal [['<20', 520], ['20-24', 7429], ['65+', 4625]], bands[2014]
    assert_equal [['<20', 496]], bands[2015]
  end

  def test_parse_salary_html_pairs_years_tables_and_french_labels
    salary = @command.parse_salary_html(fixture('salary-range-excerpt-en.html'),
                                        fixture('salary-range-excerpt-fr.html'))

    assert_equal [2024, 2025], salary.keys.sort
    first = salary[2025].first
    assert_equal 'under-50000', first['key']
    assert_equal 'Under 50,000', first['label_en']
    assert_equal 'Moins de 50,000', first['label_fr']
    assert_equal 3030, first['count']
    # The footnoted Total row is not a band.
    refute salary[2025].any? { |b| b['label_en'].match?(/total/i) }
    # 2024 is absent from the FR fixture: English labels are kept.
    assert_equal '150,000 and over', salary[2024].last['label_en']
    assert_equal '150,000 and over', salary[2024].last['label_fr']
    assert_equal '150000-and-over', salary[2024].last['key']
  end

  def test_band_key_is_stable_and_ascii
    assert_equal 'under-20', @command.band_key('<20')
    assert_equal '65-plus', @command.band_key('65+')
    assert_equal 'unknown', @command.band_key('Unknown')
    assert_equal '50000-to-54999', @command.band_key('50,000 to 54,999')
    assert_equal '150000-and-over', @command.band_key('150,000 and over')
  end

  def test_backfill_bands_prefers_html_and_attaches_french_labels
    html_bands = @command.parse_bands_html(fixture('population-by-age-band-excerpt.html'))
    csv_bands = @command.parse_bands_csv(fixture('age-band-excerpt.csv'), 'Ageband')
    dims = @command.backfill_bands(html_bands, csv_bands,
                                   PbCli::Commands::Workforce::AGE_FR)

    # 2014 exists only in the CSV; 2015 in both, HTML wins (496 not 496-from-csv).
    assert_equal 520, dims[2014].first['count']
    assert_equal 496, dims[2015].first['count']
    assert_equal 4, dims[2015].size
    unknown = dims[2015].find { |b| b['key'] == 'unknown' }
    assert_equal 'Non disponible', unknown['label_fr']
    assert_equal '<20', dims[2015].first['label_fr'] # numeric bands identical in French
  end

  def test_merge_carries_dimensions_per_year
    dims = {
      age: @command.backfill_bands(
        @command.parse_bands_html(fixture('population-by-age-band-excerpt.html')),
        @command.parse_bands_csv(fixture('age-band-excerpt.csv'), 'Ageband'),
        PbCli::Commands::Workforce::AGE_FR
      ),
      salary: @command.parse_salary_html(fixture('salary-range-excerpt-en.html'),
                                         fixture('salary-range-excerpt-fr.html'))
    }
    merged = @command.merge(@command.parse_html(@html), @command.parse_csv(@csv), dims)

    assert merged[2015].key?('ageBands')
    assert_equal 496, merged[2015]['ageBands'].first['count']
    # The salary fixture has no 2015/2016 table: dimension omitted, never faked.
    refute merged[2015].key?('salaryBands')
    refute merged[2016].key?('salaryBands')
    refute merged[2016].key?('tenure')
  end
end
