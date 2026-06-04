-- Convert tournament_type from PostgreSQL ENUM to VARCHAR
ALTER TABLE tournaments ALTER COLUMN type TYPE VARCHAR(20) USING type::VARCHAR(20);