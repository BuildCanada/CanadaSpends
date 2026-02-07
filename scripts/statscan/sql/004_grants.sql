-- Grants for Supabase API access to the statscan schema.
-- The statscan schema must also be added to the "Exposed schemas"
-- setting in the Supabase dashboard (Settings -> API).

-- Schema usage
GRANT USAGE ON SCHEMA statscan TO anon, authenticated, service_role;

-- Read access on all current tables
GRANT SELECT ON ALL TABLES IN SCHEMA statscan TO anon, authenticated, service_role;

-- Read access on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA statscan
    GRANT SELECT ON TABLES TO anon, authenticated, service_role;

-- Execute access on all current functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA statscan TO anon, authenticated, service_role;

-- Execute access on future functions
ALTER DEFAULT PRIVILEGES IN SCHEMA statscan
    GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- Sequence usage (needed for inserts during ETL, service_role only)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA statscan TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA statscan
    GRANT USAGE ON SEQUENCES TO service_role;

-- Insert/update for ETL (service_role only)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA statscan TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA statscan
    GRANT INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- Row Level Security: all StatsCan data is public
ALTER TABLE statscan.cubes ENABLE ROW LEVEL SECURITY;
ALTER TABLE statscan.dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE statscan.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE statscan.geographies ENABLE ROW LEVEL SECURITY;
ALTER TABLE statscan.units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE statscan.scalar_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE statscan.data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE statscan.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON statscan.cubes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON statscan.dimensions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON statscan.members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON statscan.geographies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON statscan.units_of_measure FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON statscan.scalar_factors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON statscan.data_points FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON statscan.sync_log FOR SELECT TO anon, authenticated USING (true);

-- service_role bypasses RLS, so no additional policies needed for ETL writes
