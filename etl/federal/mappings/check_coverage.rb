# Coverage check for ministry_slugs.yaml + thematic_tree.yaml against the
# extracted Public Accounts datasets. Run from this directory:
#   ruby check_coverage.rb [path-to-extracted-data-dir]
# Exits non-zero if any non-total row is unassignable.
require "json"
require "yaml"

DATA_DIR = ARGV[0] || "/Volumes/floppy/public_accounts/extracted/data"
slugs = YAML.load_file(File.join(__dir__, "ministry_slugs.yaml"))
tree  = YAML.load_file(File.join(__dir__, "thematic_tree.yaml"))

# --- build lookup tables from ministry_slugs.yaml ---
name_to_slug = {}
slugs["portfolios"].each do |p|
  p["ministries"].each { |m| name_to_slug[m.gsub(/[‑–]/, "-")] = p["slug"] }
end
override_lookup = {}
(slugs["overrides"] || []).each do |o|
  override_lookup[o["code"]] = o
end

# --- collect rules from thematic_tree.yaml ---
ministry_rules, ministry_name_rules, org_rules, line_rules = {}, {}, {}, []
walk = lambda do |node|
  (node["rules"] || []).each do |r|
    if r["line"]
      line_rules << { re: Regexp.new(r["line"]), ministry: r["ministry"], node: node["id"] }
    elsif r["organization"]
      (org_rules[r["organization"]] ||= []) << node["id"]
    elsif r["ministry_name"]
      (ministry_name_rules[r["ministry_name"]] ||= []) << node["id"]
    elsif r["ministry"]
      (ministry_rules[r["ministry"]] ||= []) << node["id"]
    end # source: vol1 rules don't match Vol II rows
  end
  (node["children"] || []).each { |c| walk.call(c) }
end
tree["themes"].each { |t| walk.call(t) }

# --- rule-conflict check: same-level duplicate targets ---
dups = ministry_rules.select { |_, v| v.uniq.size > 1 }
dups.merge!(org_rules.select { |_, v| v.uniq.size > 1 })
abort("CONFLICT: #{dups.inspect}") unless dups.empty?

resolve_slug = lambda do |row|
  name = row["ministry_name_normalized"]
  name = nil if name == "Public Accounts of Canada"
  if name
    s = name_to_slug[name.gsub(/[‑–]/, "-")]
    return s if s
  end
  o = override_lookup[row["ministry_code"]]
  return o["slug"] if o && (o["years"].nil? || o["years"].include?(row["year"]))
  nil
end

match_node = lambda do |row, slug|
  desc = row["description"].to_s
  line_rules.each do |lr|
    next if lr[:ministry] && lr[:ministry] != slug
    return lr[:node] if lr[:re].match?(desc)
  end
  org = row["organization"]
  return org_rules[org].first if org && org_rules[org]
  raw = row["ministry_name_normalized"]
  return ministry_name_rules[raw].first if raw && ministry_name_rules[raw]
  return ministry_rules[slug].first if ministry_rules[slug]
  nil
end

grand_unmatched = 0
%w[budgetary_details_by_allotment transfer_payments_by_ministry].each do |ds|
  rows = JSON.parse(File.read(File.join(DATA_DIR, "#{ds}.json")))
  by_year = Hash.new { |h, k| h[k] = { total: 0, no_slug: [], no_node: [] } }
  rows.each do |row|
    next if row["is_total_or_subtotal"]
    y = by_year[row["year"]]
    y[:total] += 1
    slug = resolve_slug.call(row)
    if slug.nil?
      y[:no_slug] << [row["ministry_code"], row["ministry_name_normalized"]]
      next
    end
    y[:no_node] << [slug, row["organization"]] unless match_node.call(row, slug)
  end
  puts "== #{ds} =="
  by_year.keys.sort.each do |yr|
    y = by_year[yr]
    bad = y[:no_slug].size + y[:no_node].size
    grand_unmatched += bad
    line = "  #{yr}: #{y[:total]} rows, #{y[:no_slug].size} slug-unresolved, #{y[:no_node].size} node-unmatched"
    line += "  NO_SLUG: #{y[:no_slug].uniq.inspect}" unless y[:no_slug].empty?
    line += "  NO_NODE: #{y[:no_node].uniq.inspect}" unless y[:no_node].empty?
    puts line
  end
end
puts grand_unmatched.zero? ? "COVERAGE OK" : "UNMATCHED: #{grand_unmatched}"
exit(grand_unmatched.zero? ? 0 : 1)
