require 'test_helper'
require 'pb_cli/export/units'
require 'pb_cli/export/truncation'

class TestExportTruncation < Minitest::Test
  Truncation = PbCli::Export::Truncation

  def node(id, amount, children = nil)
    n = { 'id' => id, 'name' => id, 'amount' => amount }
    n['children'] = children if children
    n
  end

  def test_keeps_all_children_when_under_top_n
    parent = node('p', 6.0, [node('a', 1.0), node('b', 2.0), node('c', 3.0)])
    out = Truncation.truncate(parent, top_n: 12)
    assert_equal 3, out['children'].size
    refute out['children'].any? { |c| c['isAggregate'] }
  end

  def test_rolls_remainder_into_other_by_absolute_amount
    children = (1..15).map { |i| node("c#{i}", i.to_f) }
    parent = node('p', children.sum { |c| c['amount'] }, children)
    out = Truncation.truncate(parent, top_n: 12)

    assert_equal 13, out['children'].size # 12 kept + Other
    other = out['children'].last
    assert_equal 'Other', other['name']
    assert_equal 'p-other', other['id']
    assert other['isAggregate']
    # Smallest 3 (1+2+3) roll into Other; largest 12 (4..15) kept.
    assert_equal 6.0, other['amount']
    assert_equal 3, other['count']
  end

  def test_sorts_by_absolute_value_so_large_negatives_survive
    children = [node('big_neg', -100.0), node('small', 1.0), node('mid', 5.0)]
    parent = node('p', -94.0, children)
    out = Truncation.truncate(parent, top_n: 2)
    kept = out['children'].reject { |c| c['isAggregate'] }.map { |c| c['id'] }
    assert_includes kept, 'big_neg'
  end

  def test_is_recursive
    grandchildren = (1..15).map { |i| node("g#{i}", i.to_f) }
    parent = node('p', 0.0, [node('mid', grandchildren.sum { |c| c['amount'] }, grandchildren)])
    out = Truncation.truncate(parent, top_n: 12)
    assert_equal 13, out['children'].first['children'].size
  end
end
