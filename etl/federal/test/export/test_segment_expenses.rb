require 'test_helper'
require 'pb_cli/export/segment_expenses'
require 'pb_cli/export/units'
require 'fileutils'

class TestExportSegmentExpenses < Minitest::Test
  def setup
    @dir = File.join(Dir.pwd, 'tmp', 'test', 'segment_expenses')
    FileUtils.mkdir_p(@dir)

    # ≤2023 edition: -eng.csv, no _fra columns, "Other program expenses" wording,
    # a lump "Crown corporations and other entities" segment (blank portfolio).
    write_eng('cest-eest-2016-eng.csv', '2015/2016', [
                ['Ministries', 'Health', 'Major transfer payments', 100],
                ['Ministries', 'Health', 'Other transfer payments', 20],
                ['Ministries', 'Health', 'Other program expenses', 30],
                ['Ministries', 'Health', 'Public debt charges', 0],
                ['Crown corporations and other entities', '', 'Other program expenses', 50]
              ])

    # 2024 single bilingual edition: "Other expenses" wording, plus the two
    # modern standalone segments (Net actuarial losses, Provision).
    write_bilingual('cest-eest-2024.csv', '2023/2024', [
                      ['Ministries', 'Finance', 'Major transfer payments', 1_000],
                      ['Ministries', 'Finance', 'Other transfer payments', -10],
                      ['Ministries', 'Finance', 'Other expenses', 40],
                      ['Ministries', 'Finance', 'Public debt charges', 470],
                      ['Net actuarial losses', '', 'Other expenses', 75],
                      ['Provision for valuation and other items', '', 'Other expenses', -17]
                    ])

    @se = PbCli::Export::SegmentExpenses.new(@dir)
  end

  def teardown
    FileUtils.rm_rf(File.join(Dir.pwd, 'tmp', 'test', 'segment_expenses'))
  end

  # A ministerial portfolio's four expense-type buckets sum to its total, in
  # dollars (x1000000 units), across both the "Other program expenses" (≤2016)
  # and "Other expenses" (2017+) wordings.
  def test_ministerial_portfolio_buckets_and_total
    health = @se.portfolios(2016).fetch('Health')
    assert_equal 100 * 1_000_000, health.major_transfers
    assert_equal 20 * 1_000_000, health.other_transfers
    assert_equal 30 * 1_000_000, health.other_expenses
    assert_equal 0, health.debt_charges
    assert_equal 150 * 1_000_000, health.total

    finance = @se.portfolios(2024).fetch('Finance')
    assert_equal((1_000 - 10 + 40 + 470) * 1_000_000, finance.total)
    assert_equal 470 * 1_000_000, finance.debt_charges
  end

  # Standalone (non-ministerial) segments carry stable ids matching the Sankey
  # nodes; the ≤2016 "Crown corporations" lump and the modern actuarial/
  # provision lumps are all captured with no portfolio breakdown.
  def test_standalone_segments_and_ids
    crown = @se.segments(2016)
    assert_equal 1, crown.size
    assert_equal 'crown-corporations-and-other-entities', crown.first.id
    assert_equal 50 * 1_000_000, crown.first.dollars

    ids = @se.segments(2024).map(&:id)
    assert_includes ids, 'net-actuarial-losses'
    assert_includes ids, 'provision-for-valuation'
    assert_equal 75 * 1_000_000, @se.segment_dollars(2024, 'net-actuarial-losses')
    assert_equal(-17 * 1_000_000, @se.segment_dollars(2024, 'provision-for-valuation'))
    assert_equal 0.0, @se.segment_dollars(2024, 'crown-corporations-and-other-entities'),
                 'absent segment reads 0'
  end

  # The grand total (all segments) is what the exporter hard-checks against the
  # Vol1Statement headline; segments are sorted deterministically (desc dollars).
  def test_total_and_segment_ordering
    assert_in_delta(150 + 50, @se.total(2016) * 1000, 0.001) # billions -> millions
    finance_total = (1_000 - 10 + 40 + 470)
    assert_in_delta(finance_total + 75 - 17, @se.total(2024) * 1000, 0.001)

    # Net actuarial losses (75) sorts before Provision (-17).
    assert_equal %w[net-actuarial-losses provision-for-valuation],
                 @se.segments(2024).map(&:id)
  end

  def test_year_presence
    assert @se.year?(2016)
    assert @se.year?(2024)
    refute @se.year?(2099)
  end

  private

  def write_eng(name, year_col, rows)
    header = ['Segment_Secteur_eng', 'Min-portfolio_Portefeuille-min_eng',
              'Type-detail_eng', year_col, '2000/2001-COMP', 'Amt-units_Mnt-unite']
    body = rows.map { |seg, port, type, amt| [seg, port, type, amt, 0, 'x1000000'] }
    write_csv(name, header, body)
  end

  def write_bilingual(name, year_col, rows)
    header = ['Segment_Secteur_eng', 'Segment_Secteur_fra',
              'Min-portfolio_Portefeuille-min_eng', 'Min-portfolio_Portefeuille-min_fra',
              'Type-detail_eng', 'Type-detail_fra', year_col, '2000/2001-COMP', 'Amt-units_Mnt-unite']
    body = rows.map do |seg, port, type, amt|
      [seg, "#{seg} (fr)", port, port.empty? ? '' : "#{port} (fr)", type, "#{type} (fr)", amt, 0, 'x1000000']
    end
    write_csv(name, header, body)
  end

  def write_csv(name, header, body)
    lines = [header.join(',')]
    body.each do |r|
      lines << r.map { |v| v.is_a?(String) && (v.include?(' ') || v.include?(',')) ? "\"#{v}\"" : v }.join(',')
    end
    File.write(File.join(@dir, name), "#{lines.join("\n")}\n")
  end
end
