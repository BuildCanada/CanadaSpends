-- RPC functions for querying StatsCan data through the Supabase API.
-- PostgREST cannot express cube operators in URL query params,
-- so these functions provide the dimensional query interface.

-- Get census profile characteristics for a geography
CREATE OR REPLACE FUNCTION statscan.census_profile(
    p_dguid text,
    p_ref_date text DEFAULT '2021'
)
RETURNS TABLE (
    characteristic_id integer,
    characteristic_name text,
    value double precision,
    symbol char(1),
    uom text,
    coordinate_text text
)
LANGUAGE sql STABLE
AS $$
    SELECT
        m.member_id AS characteristic_id,
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
        AND m.member_id = cube_ll_coord(dp.coordinate, d.dimension_position)::integer
    LEFT JOIN statscan.units_of_measure u ON u.uom_id = dp.uom_id
    WHERE dp.product_id = 98100001
      AND dp.dguid = p_dguid
      AND dp.ref_date = p_ref_date
    ORDER BY m.member_id;
$$;

-- Slice any cube by dimension member names.
-- Accepts a JSONB filter like: {"Geography": "Ontario", "Sex": "Both sexes"}
-- Uses cube containment with GiST index for efficient multi-dimensional filtering.
CREATE OR REPLACE FUNCTION statscan.slice_cube(
    p_product_id integer,
    p_filters jsonb DEFAULT '{}',
    p_ref_date text DEFAULT NULL,
    p_limit integer DEFAULT 1000,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    ref_date text,
    dguid text,
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
    v_member_id integer;
BEGIN
    -- Get number of dimensions
    SELECT num_dimensions INTO v_num_dims
    FROM statscan.cubes WHERE product_id = p_product_id;

    IF v_num_dims IS NULL THEN
        RAISE EXCEPTION 'Cube with product_id % not found', p_product_id;
    END IF;

    -- Initialize bounds: lower = all zeros, upper = all 9999s (wildcard)
    v_lower := array_fill(0::float8, ARRAY[v_num_dims]);
    v_upper := array_fill(9999::float8, ARRAY[v_num_dims]);

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

    -- Query using cube containment (GiST-indexed)
    RETURN QUERY
    SELECT
        dp.ref_date,
        dp.dguid,
        g.name_en AS geo_name,
        dp.coordinate_text,
        dp.value,
        u.name_en AS uom,
        (
            SELECT jsonb_object_agg(d2.name_en, m2.name_en)
            FROM statscan.dimensions d2
            JOIN statscan.members m2
                ON m2.dimension_id = d2.id
                AND m2.member_id = cube_ll_coord(dp.coordinate, d2.dimension_position)::integer
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
        AND m.member_id = cube_ll_coord(dp.coordinate, d.dimension_position)::integer
    WHERE dp.product_id = p_product_id
      AND dp.ref_date = p_ref_date
      AND g.geo_level = p_geo_level
    ORDER BY dp.value DESC NULLS LAST;
$$;

-- List available cubes
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

-- Get dimension tree for a cube
CREATE OR REPLACE FUNCTION statscan.cube_dimensions(p_product_id integer)
RETURNS TABLE (
    dimension_position smallint,
    dimension_name text,
    member_id integer,
    member_name text,
    parent_member_id integer
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

-- Search geographies by name
CREATE OR REPLACE FUNCTION statscan.search_geographies(
    p_query text,
    p_geo_level text DEFAULT NULL,
    p_limit integer DEFAULT 50
)
RETURNS TABLE (
    dguid text,
    name_en text,
    geo_level text,
    province_code text
)
LANGUAGE sql STABLE
AS $$
    SELECT g.dguid, g.name_en, g.geo_level, g.province_code
    FROM statscan.geographies g
    WHERE g.name_en ILIKE '%' || p_query || '%'
      AND (p_geo_level IS NULL OR g.geo_level = p_geo_level)
    ORDER BY g.name_en
    LIMIT p_limit;
$$;
