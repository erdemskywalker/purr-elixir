-- ============================================================================
-- Migration 002: Persist Per-Level Undo History Across Reloads
-- Compatible with @capacitor-community/sqlite & sql.js (WASM)
-- ============================================================================
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS level_undo_history (
  level_id INTEGER PRIMARY KEY REFERENCES levels(id) ON DELETE CASCADE,
  stack_json TEXT NOT NULL DEFAULT '[]',
  active_day_key TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
