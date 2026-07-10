require 'test_helper'
require 'fileutils'
require 'json'
require 'pb_cli/i18n/collector'
require 'tmpdir'

class TestI18nCollector < Minitest::Test
  def setup
    @dir = Dir.mktmpdir
    FileUtils.mkdir_p(File.join(@dir, 'departments'))
  end

  def teardown
    FileUtils.rm_rf(@dir)
  end

  def write_json(relative_path, data)
    File.write(File.join(@dir, relative_path), JSON.generate(data))
  end

  def test_collects_sankey_node_names_by_id_recursively
    write_json('sankey.json', {
      spending_data: {
        id: 'spending', name: 'Spending',
        children: [
          { id: 'economy', name: 'Economy', children: [{ id: 'leaf', name: 'Leaf', amount: 1 }] }
        ]
      },
      revenue_data: { id: 'revenue', name: 'Revenue' }
    })

    items = PbCli::I18n::Collector.new(@dir).collect

    assert_equal 'Spending', items['spending']
    assert_equal 'Economy', items['economy']
    assert_equal 'Leaf', items['leaf']
    assert_equal 'Revenue', items['revenue']
  end

  def test_collects_department_name_keyed_by_slug
    write_json('departments/transport-canada.json', {
      slug: 'transport-canada', name: 'Transport',
      miniSankey: { spending_data: { id: 'transport-canada', name: 'Transport' } },
      entities: [], votes: [], transferPayments: []
    })

    items = PbCli::I18n::Collector.new(@dir).collect

    assert_equal 'Transport', items['transport-canada']
  end

  def test_collects_entity_and_transfer_payment_text_by_their_own_ids
    write_json('departments/transport-canada.json', {
      slug: 'transport-canada', name: 'Transport',
      miniSankey: { spending_data: { id: 'transport-canada', name: 'Transport' } },
      entities: [{ id: 'ent-1', name: 'Department of Transport', value: 1.0 }],
      transferPayments: [{ id: 'tp-1', category: 'Grant', description: 'Airport program', used: 1 }]
    })

    items = PbCli::I18n::Collector.new(@dir).collect

    assert_equal 'Department of Transport', items['ent-1']
    assert_equal 'Airport program', items['tp-1']
  end

  # Transfer-program leaves in the miniSankey reuse the transferPayments ids, so
  # the collector resolves them through the same sankey-node walk (spec §2).
  def test_collects_transfer_program_leaves_from_the_mini_sankey
    write_json('departments/national-defence.json', {
      slug: 'national-defence', name: 'National Defence',
      miniSankey: { spending_data: { id: 'national-defence', name: 'National Defence',
                                     children: [{ id: 'org', name: 'DND', children: [
                                       { id: 'org-obj-10', name: 'Transfer payments', children: [
                                         { id: 'national-defence-2024-tp-0009', name: 'NATO Military Budget' },
                                         { id: 'org-tp-other', name: 'Other transfer programs' }
                                       ] }
                                     ] }] } },
      entities: [], transferPayments: []
    })

    items = PbCli::I18n::Collector.new(@dir).collect

    assert_equal 'NATO Military Budget', items['national-defence-2024-tp-0009']
    assert_equal 'Other transfer programs', items['org-tp-other']
  end

  def test_skips_entries_with_no_id_or_blank_text
    write_json('departments/no-slug.json', {
      slug: nil, name: 'Ignored',
      entities: [{ id: nil, name: 'No id' }, { id: 'e-2', name: '   ' }],
      votes: [], transferPayments: []
    })

    items = PbCli::I18n::Collector.new(@dir).collect

    refute items.value?('Ignored')
    refute items.key?('e-2')
  end

  def test_collects_reconciliation_item_names_by_id
    write_json('reconciliation.json', {
      items: [{ id: 'recon-1', name: 'Employment insurance', amount: 1.0 }]
    })

    items = PbCli::I18n::Collector.new(@dir).collect

    assert_equal 'Employment insurance', items['recon-1']
  end

  def test_ignores_prose_files_in_the_departments_directory
    File.write(File.join(@dir, 'departments', 'transport-canada.prose.en.md'), 'not json')

    items = PbCli::I18n::Collector.new(@dir).collect

    assert_empty items
  end

  def test_missing_files_produce_an_empty_result_without_raising
    items = PbCli::I18n::Collector.new(@dir).collect
    assert_empty items
  end
end
