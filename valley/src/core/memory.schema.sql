-- Memory Layer 1: SQLite FTS5 + sqlite-vec

CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  salience REAL DEFAULT 1.0,
  pinned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  correlation_id TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  content,
  content='memories',
  content_rowid='id'
);

CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agent);
CREATE INDEX IF NOT EXISTS idx_memories_role ON memories(role);
CREATE INDEX IF NOT EXISTS idx_memories_pinned ON memories(pinned);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);

CREATE TABLE IF NOT EXISTS embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  vector BLOB NOT NULL,
  model TEXT NOT NULL DEFAULT 'nomic-embed-text',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_embeddings_memory ON embeddings(memory_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  agent TEXT,
  correlation_id TEXT,
  payload TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_agent ON audit_log(agent);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

CREATE TABLE IF NOT EXISTS mission (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  column TEXT DEFAULT 'queued',
  agent TEXT,
  priority INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mission_column ON mission(column);
CREATE INDEX IF NOT EXISTS idx_mission_agent ON mission(agent);

CREATE TABLE IF NOT EXISTS agents_status (
  codename TEXT PRIMARY KEY,
  status TEXT DEFAULT 'offline',
  last_heartbeat TEXT,
  tokens_local INTEGER DEFAULT 0,
  tokens_claude INTEGER DEFAULT 0,
  uptime_seconds INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  transcript TEXT,
  action_items TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);