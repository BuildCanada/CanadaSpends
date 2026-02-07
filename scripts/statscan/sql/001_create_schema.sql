-- StatsCan cubes schema
-- Requires PostgreSQL with the cube extension

CREATE EXTENSION IF NOT EXISTS cube;
CREATE SCHEMA IF NOT EXISTS statscan;

-- Cube/table metadata
CREATE TABLE statscan.cubes (
    product_id     integer PRIMARY KEY,       -- e.g., 98100001
    cansim_id      integer,                   -- legacy CANSIM number
    title_en       text NOT NULL,
    title_fr       text,
    subject_code   smallint,
    frequency      text,                      -- 'annual', 'monthly', 'quarterly', etc.
    start_date     date,
    end_date       date,
    num_dimensions smallint NOT NULL,
    source_url     text,
    loaded_at      timestamptz DEFAULT now(),
    row_count      bigint
);

-- Dimensions within each cube
CREATE TABLE statscan.dimensions (
    id                 serial PRIMARY KEY,
    product_id         integer NOT NULL REFERENCES statscan.cubes(product_id) ON DELETE CASCADE,
    dimension_position smallint NOT NULL,     -- 1-based position in coordinate
    name_en            text NOT NULL,
    name_fr            text,
    UNIQUE (product_id, dimension_position)
);

-- Members within each dimension
CREATE TABLE statscan.members (
    id                 serial PRIMARY KEY,
    dimension_id       integer NOT NULL REFERENCES statscan.dimensions(id) ON DELETE CASCADE,
    member_id          integer NOT NULL,      -- numeric ID used in coordinates
    name_en            text NOT NULL,
    name_fr            text,
    parent_member_id   integer,               -- for hierarchical members
    classification_code text,                 -- e.g., NAICS, NOC, geo codes
    UNIQUE (dimension_id, member_id)
);

-- Geography reference (shared across cubes)
CREATE TABLE statscan.geographies (
    dguid          text PRIMARY KEY,
    name_en        text NOT NULL,
    name_fr        text,
    geo_level      text NOT NULL,             -- 'Country', 'Province', 'CMA', 'CD', 'CSD', 'CT', 'DA'
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
    multiplier  integer NOT NULL DEFAULT 1
);

-- Fact table: partitioned by product_id
CREATE TABLE statscan.data_points (
    id              bigserial,
    product_id      integer NOT NULL,
    ref_date        text NOT NULL,            -- '2021', '2021-01', etc.
    dguid           text,
    coordinate      cube NOT NULL,            -- multi-dimensional coordinate
    coordinate_text text NOT NULL,            -- '1.3.1.1' human-readable
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

-- Sync log for tracking loads
CREATE TABLE statscan.sync_log (
    id           serial PRIMARY KEY,
    product_id   integer NOT NULL REFERENCES statscan.cubes(product_id),
    sync_type    text NOT NULL,               -- 'full', 'incremental'
    started_at   timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    rows_loaded  bigint,
    status       text DEFAULT 'in_progress'   -- 'success', 'failed', 'in_progress'
);
