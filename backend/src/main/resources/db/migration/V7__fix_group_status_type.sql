-- Migration to fix group_status ENUM type issue
-- Create a temporary column, copy data, drop old column, rename new column
ALTER TABLE betting_groups ALTER COLUMN status TYPE VARCHAR(20) USING status::VARCHAR(20);
ALTER TABLE betting_groups ALTER COLUMN status SET DEFAULT 'OPEN';