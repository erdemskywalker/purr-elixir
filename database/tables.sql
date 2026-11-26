-- ============================================================================
-- Purr Elixir (002-purr-elixir) — Real SQLite Schema (v1)
-- 100% compatible with @capacitor-community/sqlite (iOS/Android) & sql.js (WASM)
-- Zero Mock Data: 10 elixirs, 6 visitor cats, 120 BFS-verified levels,
-- live bottle progress, daily streaks, endless runs & player preferences.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Bilingual Reference Catalog of the 10 High-Contrast Elixirs (elixir_id 0..9)
CREATE TABLE IF NOT EXISTS elixir_catalog (
  elixir_id INTEGER PRIMARY KEY CHECK (elixir_id BETWEEN 0 AND 9),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_tr TEXT NOT NULL,
  hex_color TEXT NOT NULL,
  meniscus_hex TEXT NOT NULL,
  symbol TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 2. 6 Unlockable Visitor & Assistant Cat Companions (EN/TR)
CREATE TABLE IF NOT EXISTS cat_companions (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_tr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_tr TEXT NOT NULL,
  personality_en TEXT NOT NULL,
  personality_tr TEXT NOT NULL,
  tone_key TEXT NOT NULL,
  coat_color TEXT NOT NULL,
  accent_hex TEXT NOT NULL,
  unlock_level INTEGER NOT NULL DEFAULT 0 CHECK (unlock_level >= 0),
  favorite_elixir_id INTEGER NOT NULL REFERENCES elixir_catalog(elixir_id),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 3. 120 BFS-Verified Solvable Levels (60 Campaign + 60 Daily Brew)
-- bottles_json: JSON array of bottles, each bottle is array of 0..4 elixir_id ints (bottom -> top)
CREATE TABLE IF NOT EXISTS levels (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'apprentice', 'alchemist', 'master', 'grandmaster', 'daily')),
  color_count INTEGER NOT NULL CHECK (color_count BETWEEN 3 AND 10),
  empty_count INTEGER NOT NULL DEFAULT 2 CHECK (empty_count BETWEEN 1 AND 4),
  bottle_capacity INTEGER NOT NULL DEFAULT 4 CHECK (bottle_capacity = 4),
  bottles_json TEXT NOT NULL,
  optimal_moves INTEGER NOT NULL CHECK (optimal_moves >= 1),
  par_moves INTEGER NOT NULL CHECK (par_moves >= 1),
  visitor_cat_id TEXT NOT NULL REFERENCES cat_companions(id),
  title_en TEXT NOT NULL DEFAULT '',
  title_tr TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 4. Per-Level Player Progress & Live Bottle State Persistence
CREATE TABLE IF NOT EXISTS level_progress (
  level_id INTEGER PRIMARY KEY REFERENCES levels(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  bottles_state_json TEXT NOT NULL DEFAULT '[]',
  moves_count INTEGER NOT NULL DEFAULT 0 CHECK (moves_count >= 0),
  best_moves INTEGER,
  extra_flasks_used INTEGER NOT NULL DEFAULT 0 CHECK (extra_flasks_used BETWEEN 0 AND 2),
  hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  free_hints_left INTEGER NOT NULL DEFAULT 2 CHECK (free_hints_left >= 0),
  max_combo INTEGER NOT NULL DEFAULT 0 CHECK (max_combo >= 0),
  stars INTEGER NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  active_day_key TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Daily Brew Completions & Streak History ('YYYY-MM-DD' local keys)
CREATE TABLE IF NOT EXISTS daily_completions (
  day_key TEXT PRIMARY KEY,
  level_id INTEGER NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  moves_count INTEGER NOT NULL CHECK (moves_count >= 1),
  hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  extra_flasks_used INTEGER NOT NULL DEFAULT 0 CHECK (extra_flasks_used BETWEEN 0 AND 2),
  stars INTEGER NOT NULL DEFAULT 3 CHECK (stars BETWEEN 1 AND 3),
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. On-Device Endless Alchemy Completed Runs (Easy 5 / Medium 7 / Master 9 Colors)
CREATE TABLE IF NOT EXISTS endless_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'master')),
  color_count INTEGER NOT NULL CHECK (color_count BETWEEN 3 AND 10),
  moves_count INTEGER NOT NULL CHECK (moves_count >= 1),
  bottles_sealed INTEGER NOT NULL CHECK (bottles_sealed >= 1),
  hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  extra_flasks_used INTEGER NOT NULL DEFAULT 0 CHECK (extra_flasks_used BETWEEN 0 AND 2),
  stars INTEGER NOT NULL DEFAULT 3 CHECK (stars BETWEEN 1 AND 3),
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Persistent Player Preferences & Aggregate Counters
CREATE TABLE IF NOT EXISTS player_prefs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Per-Level Undo Snapshot History (Preserves Undo Across Reloads)
CREATE TABLE IF NOT EXISTS level_undo_history (
  level_id INTEGER PRIMARY KEY REFERENCES levels(id) ON DELETE CASCADE,
  stack_json TEXT NOT NULL DEFAULT '[]',
  active_day_key TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for fast filtering, sorting & dashboard aggregations
CREATE INDEX IF NOT EXISTS idx_cat_companions_unlock ON cat_companions(unlock_level, sort_order);
CREATE INDEX IF NOT EXISTS idx_levels_tier_sort ON levels(tier, sort_order);
CREATE INDEX IF NOT EXISTS idx_levels_color_count ON levels(color_count, sort_order);
CREATE INDEX IF NOT EXISTS idx_level_progress_status ON level_progress(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_daily_completions_level ON daily_completions(level_id);
CREATE INDEX IF NOT EXISTS idx_endless_runs_difficulty ON endless_runs(difficulty, completed_at);
