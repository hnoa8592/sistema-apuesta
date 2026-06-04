-- Convert tournament_status from PostgreSQL ENUM to VARCHAR
ALTER TABLE tournaments ALTER COLUMN status TYPE VARCHAR(20) USING status::VARCHAR(20);
ALTER TABLE tournaments ALTER COLUMN status SET DEFAULT 'SCHEDULED';