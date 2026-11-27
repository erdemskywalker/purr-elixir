-- ============================================================================
-- Orchard Logic (001-orchard-logic) — Real SQLite Schema (v2)
-- 100% compatible with @capacitor-community/sqlite (iOS/Android) & sql.js (WASM)
-- Zero Mock Data: All 90 verified levels, endless runs, progress, streaks & prefs
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Bilingual Reference Catalog of the 10 Orchard Fruits & Watercolor Regions
CREATE TABLE IF NOT EXISTS fruit_catalog (
  color_id INTEGER PRIMARY KEY CHECK (color_id BETWEEN 0 AND 9),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_tr TEXT NOT NULL,
  color_name_en TEXT NOT NULL,
  color_name_tr TEXT NOT NULL,
  light_bg TEXT NOT NULL,
  dark_bg TEXT NOT NULL,
  accent_hex TEXT NOT NULL
);

-- 2. Mathematically Verified Single-Solution Levels (30 Campaign + 60 Daily)
CREATE TABLE IF NOT EXISTS levels (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('tutorial', 'starter', 'warmup', 'intermediate', 'master', 'daily')),
  grid_size INTEGER NOT NULL CHECK (grid_size IN (4, 5, 6, 8, 10)),
  regions_json TEXT NOT NULL,
  solution_json TEXT NOT NULL,
  par_seconds INTEGER NOT NULL DEFAULT 120,
  title_en TEXT NOT NULL DEFAULT '',
  title_tr TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 3. Per-Level Player Progress & Active Board Persistence
-- board_state_json values: 0 = empty, 1 = manual X, 2 = fruit, 3 = auto X
CREATE TABLE IF NOT EXISTS level_progress (
  level_id INTEGER PRIMARY KEY REFERENCES levels(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  board_state_json TEXT NOT NULL DEFAULT '[]',
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  best_seconds INTEGER,
  hints_used INTEGER NOT NULL DEFAULT 0,
  free_hints_left INTEGER NOT NULL DEFAULT 2,
  mistakes_count INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  active_day_key TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Daily Harvest Completions & Streak History ('YYYY-MM-DD' local keys)
CREATE TABLE IF NOT EXISTS daily_completions (
  day_key TEXT PRIMARY KEY,
  level_id INTEGER NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  elapsed_seconds INTEGER NOT NULL,
  hints_used INTEGER NOT NULL DEFAULT 0,
  mistakes_count INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 3 CHECK (stars BETWEEN 1 AND 3),
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. On-Device Endless Orchard Completed Runs (6x6 / 8x8 / 10x10)
CREATE TABLE IF NOT EXISTS endless_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grid_size INTEGER NOT NULL CHECK (grid_size IN (6, 8, 10)),
  elapsed_seconds INTEGER NOT NULL,
  hints_used INTEGER NOT NULL DEFAULT 0,
  mistakes_count INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 3 CHECK (stars BETWEEN 1 AND 3),
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Player Preferences (Auto-X, Conflicts, Haptics, Music, SFX, Colorblind Hints)
CREATE TABLE IF NOT EXISTS player_prefs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for fast filtering, sorting & dashboard aggregations
CREATE INDEX IF NOT EXISTS idx_levels_tier_sort ON levels(tier, sort_order);
CREATE INDEX IF NOT EXISTS idx_levels_grid_size ON levels(grid_size, sort_order);
CREATE INDEX IF NOT EXISTS idx_level_progress_status ON level_progress(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_daily_completions_level ON daily_completions(level_id);
CREATE INDEX IF NOT EXISTS idx_endless_runs_size ON endless_runs(grid_size, elapsed_seconds);
