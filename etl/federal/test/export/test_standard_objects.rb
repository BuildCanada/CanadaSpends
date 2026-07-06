require 'test_helper'
require 'pb_cli/export/standard_objects'
require 'pb_cli/export/units'
require 'fileutils'

class TestExportStandardObjects < Minitest::Test
  HEADER = [
    'Fscl-yr_Ex-fin', 'Min-portfolio_Portefeuille-min_eng', 'Dept-name_Nom-min_eng',
    *(1..12).map { |i| "Std-obj#{i}_Art-crnt#{i}" },
    'External-revenues_Revenus-externes', 'Internal-revenues_Revenus-internes',
    'Amt-units_Mnt-unite'
  ].freeze

  def setup
    @dir = File.join(Dir.pwd, 'tmp', 'test', 'standard_objects')
    FileUtils.mkdir_p(@dir)
    # ≤2023: an -eng edition (values in x1000). One org row.
    write('dmac-meso-2023-eng.csv', [
            ['2022/2023', 'National Defence', 'Department of National Defence',
             1_000, 20, 30, 500, 5, 6, 7, 8, 900, 10, 0, 40, 300, 25, 'x1000']
          ])
    # 2024: single bilingual edition; extra fr columns present but ignored.
    write('dmac-meso-2024.csv', [
            ['2023/2024', 'National Defence', 'Department of National Defence',
             2_000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 50, 'x1000']
          ], bilingual: true)
    @so = PbCli::Export::StandardObjects.new(@dir)
  end

  def teardown
    FileUtils.rm_rf(File.join(Dir.pwd, 'tmp', 'test', 'standard_objects'))
  end

  # The twelve Std-obj columns map to the canonical GC standard objects in order
  # (Vol II Table 3 header), and the x1000 units become dollars.
  def test_columns_map_to_named_objects_in_x1000_units
    row = @so.rows(2023).first
    by_name = row.objects.to_h

    assert_equal 'Personnel', row.objects.first.first
    assert_equal 1_000 * 1_000, by_name['Personnel']
    assert_equal 500 * 1_000, by_name['Professional and special services']
    assert_equal 900 * 1_000, by_name['Acquisition of machinery and equipment']
    assert_equal 12, row.objects.size
  end

  # External + internal revenues are read as (positive) dollars; gross/net derive.
  def test_revenues_and_gross_net
    row = @so.rows(2023).first

    assert_equal 300 * 1_000, row.external
    assert_equal 25 * 1_000, row.internal
    gross = (1_000 + 20 + 30 + 500 + 5 + 6 + 7 + 8 + 900 + 10 + 0 + 40) * 1_000
    assert_equal gross, row.gross
    assert_equal gross - 300_000 - 25_000, row.net
  end

  # The single-file 2024 edition (bilingual header) parses the -eng columns.
  def test_single_file_edition_parses
    assert @so.year?(2024)
    row = @so.rows(2024).first

    assert_equal 'Department of National Defence', row.organization
    assert_equal 2_000 * 1_000, row.objects.to_h['Personnel']
    assert_equal 100 * 1_000, row.external
  end

  def test_object_label_lists_are_aligned
    assert_equal PbCli::Export::StandardObjects::OBJECTS.size,
                 PbCli::Export::StandardObjects::OBJECTS_FR.size
    assert_equal 'Personnel', PbCli::Export::StandardObjects::OBJECTS.first
    assert_equal 'Services professionnels et spéciaux',
                 PbCli::Export::StandardObjects::OBJECTS_FR[3]
  end

  private

  def write(name, rows, bilingual: false)
    header = if bilingual
               [
                 'Fscl-yr_Ex-fin', 'Min-portfolio_Portefeuille-min_eng', 'Min-portfolio_Portefeuille-min_fra',
                 'Dept-name_Nom-min_eng', 'Dept-name_Nom-min_fra',
                 *(1..12).map { |i| "Std-obj#{i}_Art-crnt#{i}" },
                 'External-revenues_Revenus-externes', 'Internal-revenues_Revenus-internes', 'Amt-units_Mnt-unite'
               ]
             else
               HEADER
             end
    lines = [header.join(',')]
    rows.each do |r|
      r = r.dup
      if bilingual
        # inject fr portfolio + fr dept name after their eng counterparts
        r.insert(2, "#{r[1]} (fr)")
        r.insert(4, "#{r[3]} (fr)")
      end
      lines << r.map { |v| v.is_a?(String) && v.include?(' ') ? "\"#{v}\"" : v }.join(',')
    end
    File.write(File.join(@dir, name), "#{lines.join("\n")}\n")
  end
end
