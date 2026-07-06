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

  def test_collects_entity_vote_and_transfer_payment_text_by_their_own_ids
    write_json('departments/transport-canada.json', {
      slug: 'transport-canada', name: 'Transport',
      miniSankey: { spending_data: { id: 'transport-canada', name: 'Transport' } },
      entities: [{ id: 'ent-1', name: 'Department of Transport', value: 1.0 }],
      votes: [{ id: 'vote-1', vote: 'Vote 1', description: 'Operating expenditures' }],
      transferPayments: [{ id: 'tp-1', category: 'Grant', description: 'Airport program', used: 1 }]
    })

    items = PbCli::I18n::Collector.new(@dir).collect

    assert_equal 'Department of Transport', items['ent-1']
    assert_equal 'Operating expenditures', items['vote-1']
    assert_equal 'Airport program', items['tp-1']
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
