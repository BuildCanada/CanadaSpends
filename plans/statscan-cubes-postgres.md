# Plan: Loading StatsCan Cubes into PostgreSQL with the Cube Extension

## Overview

Load Statistics Canada data cubes into a dedicated `statscan` PostgreSQL schema, using the
`cube` extension to model multi-dimensional coordinates. Expose the data through the Supabase
REST API so the Next.js frontend can query census profiles and other StatsCan tables directly.

Starting point: **Census Profile (product ID 98-10-0001-01)** from the 2021 Census.

---

## 1. Background: StatsCan Data Model

### What is a StatsCan "cube"?

A cube is StatsCan's term for a data table. Each cube has:

- **Product ID (PID)**: 8-digit identifier (e.g., `98100001` for Census Profile)
- **Dimensions**: 1-10 categorical axes (Geography, Sex, Age Group, Characteristics, etc.)
- **Members**: The values within each dimension (e.g., Geography → Ontario, Toronto CMA, ...)
- **Coordinates**: Dot-delimited member IDs that uniquely identify a data point (e.g., `1.3.1.1`)
- **Vectors**: Unique time-series identifiers (e.g., `v12345678`)

### Census Profile specifics

- ~2,600 characteristics profiled per geographic area
- Available at every geographic level from Canada down to Dissemination Areas
- CSV download sizes: ~10 MB (provinces only) to ~1.6 GB (all DAs)
- Uses a **transposed CSV format** where the last dimension's members become column headers

### Data sources

| Method | URL Pattern | Notes |
|--------|-------------|-------|
| Full CSV download | `https://www150.statcan.gc.ca/n1/en/tbl/csv/{pid}-eng.zip` | Bulk, recommended for initial load |
| WDS API | `https://www150.statcan.gc.ca/t1/wds/rest/` | For incremental updates, metadata |
| Census Profile files | Catalogue 98-401-X series | Pre-built CSVs by geographic level |

---

## 2. PostgreSQL Schema Design (`statscan`)

### 2.1 Enable extensions

```sql
CREATE EXTENSION IF NOT EXISTS cube;
CREATE SCHEMA IF NOT EXISTS statscan;
```

### 2.2 Reference tables

```sql
-- Cube/table metadata
CREATE TABLE statscan.cubes (
    product_id    integer PRIMARY KEY,       -- e.g., 98100001
    cansim_id     integer,                   -- legacy CANSIM number, nullable
    title_en      text NOT NULL,
    title_fr      text,
    subject_code  smallint,                  -- first 2 digits of PID
    frequency     text,                      -- 'annual', 'monthly', 'quarterly', etc.
    start_date    date,
    end_date      date,
    num_dimensions smallint NOT NULL,
    source_url    text,
    loaded_at     timestamptz DEFAULT now(),
    row_count     bigint
);

-- Dimensions within each cube
CREATE TABLE statscan.dimensions (
    id                 serial PRIMARY KEY,
    product_id         integer NOT NULL REFERENCES statscan.cubes(product_id),
    dimension_position smallint NOT NULL,     -- 1-based position in coordinate
    name_en            text NOT NULL,
    name_fr            text,
    UNIQUE (product_id, dimension_position)
);

-- Members within each dimension
CREATE TABLE statscan.members (
    id                serial PRIMARY KEY,
    dimension_id      integer NOT NULL REFERENCES statscan.dimensions(id),
    member_id         smallint NOT NULL,      -- numeric ID used in coordinates
    name_en           text NOT NULL,
    name_fr           text,
    parent_member_id  smallint,               -- for hierarchical members
    classification_code text,                 -- e.g., NAICS, NOC, geo codes
    UNIQUE (dimension_id, member_id)
);

-- Geography reference (shared across cubes)
CREATE TABLE statscan.geographies (
    dguid          text PRIMARY KEY,
    name_en        text NOT NULL,
    name_fr        text,
    geo_level      text NOT NULL,             -- 'Province', 'CMA', 'CD', 'CSD', 'CT', 'DA'
    alt_geo_code   text,
    province_code  text,
    parent_dguid   text REFERENCES statscan.geographies(dguid)
);

-- Unit of measure lookup
CREATE TABLE statscan.units_of_measure (
    uom_id   smallint PRIMARY KEY,
    name_en  text NOT NULL,
    name_fr  text
);

-- Scalar factor lookup
CREATE TABLE statscan.scalar_factors (
    scalar_id   smallint PRIMARY KEY,
    name_en     text NOT NULL,
    name_fr     text,
    multiplier  integer NOT NULL              -- 1, 1000, 1000000, etc.
);
```

### 2.3 Fact table: `data_points` (partitioned by product_id)

This is the core table. Each row is a single data observation. The `coordinate` column uses
the PostgreSQL `cube` extension to store the multi-dimensional coordinate as a point, enabling
GiST-indexed dimensional queries.

```sql
CREATE TABLE statscan.data_points (
    id              bigserial,
    product_id      integer NOT NULL,
    ref_date        text NOT NULL,            -- '2021', '2021-01', etc.
    dguid           text,
    coordinate      cube NOT NULL,            -- cube(ARRAY[1,3,1,1]) -- the key innovation
    coordinate_text text NOT NULL,            -- '1.3.1.1' for debugging/reference
    vector          text,                     -- 'v12345678'
    value           double precision,
    uom_id          smallint,
    scalar_id       smallint,
    status          char(1),
    symbol          char(1),
    decimals        smallint,
    terminated      boolean DEFAULT false,
    PRIMARY KEY (product_id, id)
) PARTITION BY LIST (product_id);

-- One partition per cube. Start with census profile:
CREATE TABLE statscan.data_points_98100001
    PARTITION OF statscan.data_points
    FOR VALUES IN (98100001);
```

### 2.4 Indexes

```sql
-- GiST index on cube coordinates (per partition, created automatically)
-- Enables: containment (@>), overlap (&&), nearest-neighbor (<->)
CREATE INDEX idx_dp_98100001_coordinate
    ON statscan.data_points_98100001 USING gist (coordinate);

-- B-tree indexes for common query patterns
CREATE INDEX idx_dp_98100001_ref_date
    ON statscan.data_points_98100001 (ref_date);

CREATE INDEX idx_dp_98100001_dguid
    ON statscan.data_points_98100001 (dguid);

CREATE INDEX idx_dp_98100001_vector
    ON statscan.data_points_98100001 (vector);

-- Geography hierarchy lookups
CREATE INDEX idx_geo_level ON statscan.geographies (geo_level);
CREATE INDEX idx_geo_parent ON statscan.geographies (parent_dguid);
CREATE INDEX idx_geo_province ON statscan.geographies (province_code);
```

### 2.5 How the `cube` extension is used

Each StatsCan data point has a coordinate like `1.3.1.1.1.1.0.0.0.0` — a point in
n-dimensional space where each axis corresponds to a dimension of the cube.

```sql
-- Store: coordinate '1.3.1.1' becomes cube(ARRAY[1,3,1,1])
INSERT INTO statscan.data_points (product_id, ref_date, dguid, coordinate, coordinate_text, value)
VALUES (98100001, '2021', '2021A000235', cube(ARRAY[1,3,1,1]), '1.3.1.1', 14223942);

-- Query: "All data where Geography (dim 1) = member 3 and Sex (dim 2) = member 1"
-- Model this as a containment check against a range cube:
SELECT * FROM statscan.data_points
WHERE product_id = 98100001
  AND coordinate <@ cube(ARRAY[3,1,0,0], ARRAY[3,1,999,999]);
  --                      dim1=3, dim2=1, dim3=any, dim4=any

-- Nearest-neighbor: find data points with the most similar dimensional profile
SELECT *, coordinate <-> cube(ARRAY[3,1,2,5]) AS distance
FROM statscan.data_points
WHERE product_id = 98100001
ORDER BY coordinate <-> cube(ARRAY[3,1,2,5])
LIMIT 10;
```

Key `cube` operations:

| Operation | Operator | Use case |
|-----------|----------|----------|
| Containment | `<@`, `@>` | Slice by dimension values (most common) |
| Overlap | `&&` | Find data in a dimension range |
| Euclidean distance | `<->` | Nearest-neighbor / similarity |
| Taxicab distance | `<#>` | Alternative distance metric |
| Equality | `=` | Exact coordinate match |
| Extract dimension | `cube_ll_coord(c, n)` | Get the nth dimension value |

---

## 3. ETL Pipeline

### 3.1 Phase 1: Census Profile initial load

```
┌──────────────┐     ┌──────────────┐     ┌───────────────┐     ┌────────────┐
│ Download CSV │────▶│ Parse & Map  │────▶│ Transform to  │────▶│ COPY INTO  │
│ from StatsCan│     │ columns      │     │ cube coords   │     │ PostgreSQL │
└──────────────┘     └──────────────┘     └───────────────┘     └────────────┘
```

**Script: `scripts/statscan/load-census-profile.ts`**

Steps:
1. **Download**: Fetch CSV zip from StatsCan via `getFullTableDownloadCSV` API
2. **Extract**: Unzip to get the CSV and metadata files
3. **Parse metadata**: Extract dimension names, member lists, UOM/scalar lookups
4. **Load reference data**: Populate `cubes`, `dimensions`, `members`, `geographies`,
   `units_of_measure`, `scalar_factors`
5. **Transform CSV rows**: For each row:
   - Parse the coordinate string into a numeric array
   - Create a `cube` value: `cube(ARRAY[1,3,1,1])`
   - Handle transposed census format by unpivoting member columns into rows
6. **Bulk load**: Use `COPY` or batched `INSERT` for performance (target: 50k rows/batch)
7. **Create indexes**: Build GiST and B-tree indexes after bulk load (faster than indexing
   during insert)
8. **Validate**: Row count check, spot-check known values

**Census Profile CSV handling (transposed format)**:

The census CSV has member columns as headers. For a table with dimensions
[Geography, Characteristic] where Characteristic is transposed:

```csv
REF_DATE,GEO,DGUID,GEO_LEVEL,Coordinate,"Population, 2021 [1]",Symbol 1,"Population, 2016 [2]",Symbol 2
2021,Canada,2021A000011124,Country,1,36991981,,35151728,
```

The ETL unpivots this into one row per characteristic:

```
(product_id=98100001, ref_date='2021', dguid='2021A000011124',
 coordinate=cube(ARRAY[1,1]), value=36991981)
(product_id=98100001, ref_date='2021', dguid='2021A000011124',
 coordinate=cube(ARRAY[1,2]), value=35151728)
```

### 3.2 Phase 2: Generic cube loader

**Script: `scripts/statscan/load-cube.ts`**

A generic loader that works with any standard (non-transposed) StatsCan CSV:

```typescript
interface LoadCubeOptions {
  productId: number;         // e.g., 17100005
  csvUrl?: string;           // override auto-detected URL
  batchSize?: number;        // default 50000
  truncateFirst?: boolean;   // for reloads
}

async function loadCube(options: LoadCubeOptions): Promise<void> {
  // 1. Fetch metadata via WDS API: getCubeMetadata
  // 2. Download CSV via getFullTableDownloadCSV
  // 3. Parse standard columns (REF_DATE, GEO, DGUID, ..., VECTOR, COORDINATE, VALUE, ...)
  // 4. Load into data_points with cube(coordinate_array)
}
```

### 3.3 Phase 3: Incremental updates

Use the WDS API's `getChangedCubeList/{date}` and `getChangedSeriesDataFromVector` methods
to fetch only new/updated data since the last load. Store last-sync timestamps in a
`statscan.sync_log` table.

```sql
CREATE TABLE statscan.sync_log (
    id          serial PRIMARY KEY,
    product_id  integer NOT NULL REFERENCES statscan.cubes(product_id),
    sync_type   text NOT NULL,    -- 'full', 'incremental'
    started_at  timestamptz NOT NULL,
    completed_at timestamptz,
    rows_loaded bigint,
    status      text              -- 'success', 'failed', 'in_progress'
);
```

---

## 4. Querying Through the Supabase API

### 4.1 Expose the `statscan` schema

In the Supabase dashboard: **Settings → API → Exposed Schemas** → add `statscan`.

Or via SQL:

```sql
-- Grant access to Supabase roles
GRANT USAGE ON SCHEMA statscan TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA statscan TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA statscan
    GRANT SELECT ON TABLES TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA statscan TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA statscan
    GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
```

### 4.2 Client-side schema access

```typescript
// Option A: Dedicated client for statscan schema
import { createClient } from '@supabase/supabase-js';

const statscan = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'statscan' }
});

// Direct table query
const { data } = await statscan.from('geographies')
  .select('*')
  .eq('geo_level', 'Province');

// RPC call
const { data } = await statscan.rpc('census_profile', {
  p_dguid: '2021A000235',
  p_ref_date: '2021'
});
```

```typescript
// Option B: Per-query schema switching (existing client)
const { data } = await supabase
  .schema('statscan')
  .from('geographies')
  .select('*')
  .eq('geo_level', 'Province');
```

```typescript
// Option C: Raw fetch with Accept-Profile header (no supabase-js dependency)
const response = await fetch(`${BASE_URL}/geographies?geo_level=eq.Province`, {
  headers: {
    'apikey': API_KEY,
    'Accept-Profile': 'statscan',
    'Content-Type': 'application/json'
  }
});
```

### 4.3 RPC functions for common queries

PostgREST can't express `cube` operators directly in URL query parameters, so we expose
them via RPC functions.

```sql
-- Get census profile characteristics for a geography
CREATE OR REPLACE FUNCTION statscan.census_profile(
    p_dguid text,
    p_ref_date text DEFAULT '2021'
)
RETURNS TABLE (
    characteristic_name text,
    value double precision,
    symbol char(1),
    uom text,
    coordinate_text text
)
LANGUAGE sql STABLE
AS $$
    SELECT
        m.name_en AS characteristic_name,
        dp.value,
        dp.symbol,
        u.name_en AS uom,
        dp.coordinate_text
    FROM statscan.data_points dp
    JOIN statscan.dimensions d
        ON d.product_id = dp.product_id
        AND d.name_en = 'Characteristic'
    JOIN statscan.members m
        ON m.dimension_id = d.id
        AND m.member_id = cube_ll_coord(dp.coordinate, d.dimension_position)::smallint
    LEFT JOIN statscan.units_of_measure u ON u.uom_id = dp.uom_id
    WHERE dp.product_id = 98100001
      AND dp.dguid = p_dguid
      AND dp.ref_date = p_ref_date
    ORDER BY dp.coordinate_text;
$$;

-- Slice any cube by dimension member names
-- Accepts a JSONB filter like: {"Geography": "Ontario", "Sex": "Both sexes"}
CREATE OR REPLACE FUNCTION statscan.slice_cube(
    p_product_id integer,
    p_filters jsonb DEFAULT '{}',
    p_ref_date text DEFAULT NULL,
    p_limit integer DEFAULT 1000,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    ref_date text,
    geo_name text,
    coordinate_text text,
    value double precision,
    uom text,
    dimension_values jsonb
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_num_dims smallint;
    v_lower float8[];
    v_upper float8[];
    v_dim_key text;
    v_member_name text;
    v_dim_pos smallint;
    v_member_id smallint;
BEGIN
    -- Get number of dimensions
    SELECT num_dimensions INTO v_num_dims
    FROM statscan.cubes WHERE product_id = p_product_id;

    -- Initialize bounds: lower = all zeros, upper = all 999s (wildcard)
    v_lower := array_fill(0::float8, ARRAY[v_num_dims]);
    v_upper := array_fill(999::float8, ARRAY[v_num_dims]);

    -- Apply filters: for each specified dimension, pin both lower and upper
    FOR v_dim_key, v_member_name IN SELECT * FROM jsonb_each_text(p_filters)
    LOOP
        SELECT d.dimension_position, m.member_id
        INTO v_dim_pos, v_member_id
        FROM statscan.dimensions d
        JOIN statscan.members m ON m.dimension_id = d.id
        WHERE d.product_id = p_product_id
          AND d.name_en = v_dim_key
          AND m.name_en = v_member_name;

        IF v_dim_pos IS NOT NULL THEN
            v_lower[v_dim_pos] := v_member_id;
            v_upper[v_dim_pos] := v_member_id;
        END IF;
    END LOOP;

    -- Query using cube containment with GiST index
    RETURN QUERY
    SELECT
        dp.ref_date,
        g.name_en AS geo_name,
        dp.coordinate_text,
        dp.value,
        u.name_en AS uom,
        (
            SELECT jsonb_object_agg(d2.name_en, m2.name_en)
            FROM statscan.dimensions d2
            JOIN statscan.members m2
                ON m2.dimension_id = d2.id
                AND m2.member_id = cube_ll_coord(dp.coordinate, d2.dimension_position)::smallint
            WHERE d2.product_id = dp.product_id
        ) AS dimension_values
    FROM statscan.data_points dp
    LEFT JOIN statscan.geographies g ON g.dguid = dp.dguid
    LEFT JOIN statscan.units_of_measure u ON u.uom_id = dp.uom_id
    WHERE dp.product_id = p_product_id
      AND dp.coordinate <@ cube(v_lower, v_upper)
      AND (p_ref_date IS NULL OR dp.ref_date = p_ref_date)
    ORDER BY dp.coordinate_text
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Compare a characteristic across geographies
CREATE OR REPLACE FUNCTION statscan.compare_geographies(
    p_product_id integer,
    p_characteristic text,
    p_geo_level text DEFAULT 'Province',
    p_ref_date text DEFAULT '2021'
)
RETURNS TABLE (
    dguid text,
    geo_name text,
    value double precision,
    symbol char(1)
)
LANGUAGE sql STABLE
AS $$
    SELECT
        dp.dguid,
        g.name_en AS geo_name,
        dp.value,
        dp.symbol
    FROM statscan.data_points dp
    JOIN statscan.geographies g ON g.dguid = dp.dguid
    JOIN statscan.dimensions d
        ON d.product_id = dp.product_id
        AND d.name_en = 'Characteristic'
    JOIN statscan.members m
        ON m.dimension_id = d.id
        AND m.name_en = p_characteristic
        AND m.member_id = cube_ll_coord(dp.coordinate, d.dimension_position)::smallint
    WHERE dp.product_id = p_product_id
      AND dp.ref_date = p_ref_date
      AND g.geo_level = p_geo_level
    ORDER BY dp.value DESC NULLS LAST;
$$;

-- List available cubes (lightweight, no auth needed)
CREATE OR REPLACE FUNCTION statscan.list_cubes()
RETURNS TABLE (
    product_id integer,
    title_en text,
    num_dimensions smallint,
    frequency text,
    row_count bigint,
    loaded_at timestamptz
)
LANGUAGE sql STABLE
AS $$
    SELECT product_id, title_en, num_dimensions, frequency, row_count, loaded_at
    FROM statscan.cubes
    ORDER BY product_id;
$$;

-- Get full dimension/member tree for a cube
CREATE OR REPLACE FUNCTION statscan.cube_dimensions(p_product_id integer)
RETURNS TABLE (
    dimension_position smallint,
    dimension_name text,
    member_id smallint,
    member_name text,
    parent_member_id smallint
)
LANGUAGE sql STABLE
AS $$
    SELECT
        d.dimension_position,
        d.name_en AS dimension_name,
        m.member_id,
        m.name_en AS member_name,
        m.parent_member_id
    FROM statscan.dimensions d
    JOIN statscan.members m ON m.dimension_id = d.id
    WHERE d.product_id = p_product_id
    ORDER BY d.dimension_position, m.member_id;
$$;
```

### 4.4 Usage examples from the frontend

```typescript
// Get Ontario's census profile
const { data } = await statscan.rpc('census_profile', {
  p_dguid: '2021A000235'   // Ontario DGUID
});
// Returns: [{ characteristic_name: "Population, 2021", value: 14223942, ... }, ...]

// Slice the Labour Force Survey cube by filters
const { data } = await statscan.rpc('slice_cube', {
  p_product_id: 14100287,
  p_filters: { "Geography": "Ontario", "Sex": "Both sexes", "Age group": "15 years and over" },
  p_ref_date: '2024-01'
});

// Compare population across provinces
const { data } = await statscan.rpc('compare_geographies', {
  p_product_id: 98100001,
  p_characteristic: 'Population, 2021',
  p_geo_level: 'Province'
});

// Browse what dimensions a cube has
const { data } = await statscan.rpc('cube_dimensions', {
  p_product_id: 98100001
});

// Direct table query: all provinces
const { data } = await statscan.from('geographies')
  .select('dguid, name_en, alt_geo_code')
  .eq('geo_level', 'Province')
  .order('name_en');
```

### 4.5 Row Level Security (optional)

All StatsCan data is public, so RLS can be permissive:

```sql
ALTER TABLE statscan.data_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON statscan.data_points
    FOR SELECT TO anon, authenticated USING (true);

-- Repeat for all tables in the schema
```

---

## 5. Census Profile: Concrete Loading Steps

### Step 1: Create the schema and tables

Run the SQL from sections 2.1–2.4 above as a Supabase migration.

### Step 2: Download census profile data

```bash
# Via WDS API
curl -s "https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/98100001/en" \
  | jq -r '.object' > /tmp/census_url.txt

# Or directly (Canada + Provinces level ~10MB)
wget "https://www150.statcan.gc.ca/n1/en/tbl/csv/98100001-eng.zip" -O census.zip
unzip census.zip
```

### Step 3: Parse metadata file

The zip contains a `*_MetaData.csv` with cube structure. Parse to populate:
- `statscan.cubes` (one row for product_id 98100001)
- `statscan.dimensions` (Geography, Characteristic dimensions)
- `statscan.members` (all geography codes, all 2600+ characteristics)

### Step 4: Load geographic reference data

Parse `DGUID`, `GEO`, and `GEO_LEVEL` columns from the data CSV to populate
`statscan.geographies`. Deduplicate since the same geography appears in many rows.

### Step 5: Transform and load data points

For each CSV row:
1. Parse the coordinate and transposed member columns
2. Unpivot: create one `data_points` row per characteristic member
3. Convert coordinate to `cube(ARRAY[...])`
4. Batch insert using `COPY` or multi-row `INSERT`

### Step 6: Build indexes and validate

```sql
-- Analyze for query planner
ANALYZE statscan.data_points_98100001;

-- Validate row counts
SELECT count(*) FROM statscan.data_points WHERE product_id = 98100001;

-- Spot check: Canada's population
SELECT dp.value
FROM statscan.data_points dp
WHERE dp.product_id = 98100001
  AND dp.dguid = '2021A000011124'  -- Canada
  AND dp.coordinate = cube(ARRAY[1,1]);  -- first geo, first characteristic
```

---

## 6. Estimated Data Volumes

| Geographic Level | Geographies | × 2,600 Characteristics | Rows |
|------------------|-------------|-------------------------|------|
| Canada + Provinces | ~14 | ~36,400 | ~36K |
| + CMAs/CAs | ~160 | ~416,000 | ~450K |
| + Census Divisions | ~293 | ~762,000 | ~1.2M |
| + Census Subdivisions | ~5,161 | ~13.4M | ~14.6M |
| + Dissemination Areas | ~57,000 | ~148M | ~150M |

**Recommendation**: Start with Canada + Provinces + CMAs (~450K rows, manageable).
Add finer geographies incrementally. The DA-level load (~150M rows) needs careful
batching and takes ~10 GB of storage.

---

## 7. File Structure

```
scripts/statscan/
├── load-census-profile.ts    # Census profile ETL (Phase 1)
├── load-cube.ts              # Generic cube loader (Phase 2)
├── sync-cubes.ts             # Incremental updater (Phase 3)
├── utils/
│   ├── wds-client.ts         # StatsCan WDS API client
│   ├── csv-parser.ts         # CSV parsing with transposed format handling
│   └── db.ts                 # PostgreSQL connection (direct, not via Supabase)
└── sql/
    ├── 001_create_schema.sql         # Schema + extensions
    ├── 002_create_tables.sql         # All tables from section 2
    ├── 003_create_indexes.sql        # Indexes from section 2.4
    ├── 004_create_rpc_functions.sql  # RPC functions from section 4.3
    ├── 005_grants.sql                # Supabase role grants
    └── 006_rls_policies.sql          # Row level security
```

---

## 8. Implementation Order

| Phase | Task | Depends On |
|-------|------|------------|
| **1a** | Create `statscan` schema + tables + indexes (SQL migrations) | — |
| **1b** | Write WDS API client (`wds-client.ts`) | — |
| **1c** | Write CSV parser with transposed format support | — |
| **2a** | Load census profile metadata (cubes, dimensions, members) | 1a, 1b |
| **2b** | Load geography reference data | 1a, 1c |
| **2c** | Load census profile data points | 2a, 2b |
| **3a** | Create RPC functions | 1a |
| **3b** | Configure Supabase schema exposure + grants | 1a |
| **3c** | Add `statscan` client to `src/lib/supabase/` | 3a, 3b |
| **4** | Build generic cube loader for non-census tables | 2c |
| **5** | Build incremental sync pipeline | 4 |

---

## 9. Key Design Decisions

### Why the `cube` extension?

StatsCan coordinates are inherently n-dimensional points. The `cube` extension:

1. **Stores coordinates natively** as n-dimensional points with 64-bit float precision
2. **GiST indexing** enables efficient multi-dimensional range queries without scanning
3. **Containment queries** (`<@`, `@>`) let you slice across any combination of dimensions
   in a single index lookup — no need for one index per dimension
4. **Nearest-neighbor** (`<->`) enables finding similar data profiles, useful for
   geographic or demographic comparisons
5. **Max 100 dimensions** — StatsCan cubes max out at 10, so well within limits

### Why partition by product_id?

- Each cube has different dimensions and coordinate semantics
- Partitioning gives each cube its own GiST index (more efficient)
- Can drop/reload individual cubes without affecting others
- Query planner can skip irrelevant partitions

### Why RPC functions instead of direct table queries?

- PostgREST URL syntax can't express `cube` operators like `<@` or `<->`
- RPC functions encapsulate the dimensional logic (translating member names to coordinate
  positions)
- Reduces client complexity — callers pass human-readable filters, not cube coordinates
- Still accessible via Supabase `.rpc()` with full PostgREST features (pagination, etc.)

### Why keep `coordinate_text` alongside `coordinate`?

- The text column (`'1.3.1.1'`) is human-readable and matches StatsCan's own format
- Useful for debugging, logging, and joining back to StatsCan source data
- The `cube` column is the indexed, queryable representation
- Minimal storage overhead (~20 bytes per row)

---

## 10. Open Questions

1. **Geographic level cutoff**: Should we load down to DA level (150M rows) or stop at
   CSD level (~15M rows) for the initial deployment?
2. **Bilingual**: Should RPC functions accept a language parameter and return `name_en` vs
   `name_fr`? Or always return both?
3. **Caching strategy**: Census data is static between census years. Should we set long
   `Cache-Control` headers via Supabase, or handle caching in the Next.js layer as we
   currently do (1-hour revalidation)?
4. **Which cubes next?** After census profile, likely candidates:
   - `17-10-0005-01` — Population estimates
   - `14-10-0287-01` — Labour force characteristics
   - `18-10-0005-01` — CPI / inflation
   - `36-10-0104-01` — GDP by industry
