CREATE TABLE IF NOT EXISTS explorer_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  station text NOT NULL,
  vibe text NOT NULL,
  password_hash text NOT NULL,
  salt text NOT NULL,
  created_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS explorer_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES explorer_users(id),
  expires_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS explorer_library (
  user_id text PRIMARY KEY REFERENCES explorer_users(id),
  saved text NOT NULL DEFAULT '[]',
  plans text NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS contributions (
  id text PRIMARY KEY,
  place_id text,
  place_name text NOT NULL,
  topic text NOT NULL,
  note text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at text NOT NULL,
  reviewed_at text,
  session_id text NOT NULL
);
CREATE TABLE IF NOT EXISTS moderation_audit (
  id text PRIMARY KEY,
  contribution_id text NOT NULL,
  action text NOT NULL,
  created_at text NOT NULL
);
CREATE INDEX IF NOT EXISTS explorer_sessions_user_idx ON explorer_sessions(user_id);
CREATE INDEX IF NOT EXISTS contributions_queue_idx ON contributions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS contributions_session_idx ON contributions(session_id, created_at);
CREATE INDEX IF NOT EXISTS moderation_audit_contribution_idx ON moderation_audit(contribution_id);
