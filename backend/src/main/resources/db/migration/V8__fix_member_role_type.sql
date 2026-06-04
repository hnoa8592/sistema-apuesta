-- Migration to fix member_role ENUM type issue
ALTER TABLE group_members ALTER COLUMN role TYPE VARCHAR(20) USING role::VARCHAR(20);
ALTER TABLE group_members ALTER COLUMN role SET DEFAULT 'PARTICIPANT';