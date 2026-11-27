-- Factory Smoke Test App — Real SQLite Schema
CREATE TABLE IF NOT EXISTS engine_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_tr TEXT NOT NULL,
  detail_en TEXT NOT NULL,
  detail_tr TEXT NOT NULL,
  is_verified INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
