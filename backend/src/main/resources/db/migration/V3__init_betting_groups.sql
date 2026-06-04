CREATE TYPE group_status AS ENUM ('OPEN', 'ACTIVE', 'FINISHED', 'CANCELLED');
CREATE TYPE member_role  AS ENUM ('ORGANIZER', 'PARTICIPANT');

CREATE TABLE betting_groups (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        VARCHAR(100) NOT NULL,
    tournament_id               UUID NOT NULL REFERENCES tournaments(id),
    organizer_id                UUID NOT NULL REFERENCES users(id),
    max_participants            SMALLINT,
    is_open                     BOOLEAN NOT NULL DEFAULT TRUE,
    password_hash               VARCHAR(255),
    prediction_deadline_minutes SMALLINT NOT NULL DEFAULT 15,
    wildcards_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
    entry_fee                   DECIMAL(10,2),
    invite_code                 VARCHAR(16) UNIQUE NOT NULL,
    status                      group_status NOT NULL DEFAULT 'OPEN',
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE group_members (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id           UUID NOT NULL REFERENCES betting_groups(id) ON DELETE CASCADE,
    user_id            UUID NOT NULL REFERENCES users(id),
    role               member_role NOT NULL DEFAULT 'PARTICIPANT',
    total_points       INT NOT NULL DEFAULT 0,
    exact_predictions  INT NOT NULL DEFAULT 0,
    correct_results    INT NOT NULL DEFAULT 0,
    current_position   SMALLINT,
    previous_position  SMALLINT,
    joined_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user  ON group_members(user_id);
