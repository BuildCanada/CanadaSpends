-- Partition for Census Profile (product_id 98100001)

CREATE TABLE statscan.data_points_98100001
    PARTITION OF statscan.data_points
    FOR VALUES IN (98100001);

-- GiST index on cube coordinates for multi-dimensional queries
CREATE INDEX idx_dp_98100001_coordinate
    ON statscan.data_points_98100001 USING gist (coordinate);

-- B-tree indexes for common query patterns
CREATE INDEX idx_dp_98100001_dguid
    ON statscan.data_points_98100001 (dguid);

CREATE INDEX idx_dp_98100001_ref_date
    ON statscan.data_points_98100001 (ref_date);

CREATE INDEX idx_dp_98100001_vector
    ON statscan.data_points_98100001 (vector)
    WHERE vector IS NOT NULL;

-- Geography indexes
CREATE INDEX idx_geo_level ON statscan.geographies (geo_level);
CREATE INDEX idx_geo_parent ON statscan.geographies (parent_dguid);
CREATE INDEX idx_geo_province ON statscan.geographies (province_code);

-- Member lookups
CREATE INDEX idx_members_dimension ON statscan.members (dimension_id, member_id);
CREATE INDEX idx_members_name ON statscan.members (dimension_id, name_en);

-- Dimension lookups
CREATE INDEX idx_dimensions_product ON statscan.dimensions (product_id, name_en);
