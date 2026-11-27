-- ============================================================================
-- Purr Elixir (002-purr-elixir) — Full Clean SQLite Install Script
-- Execute from database/ directory: sqlite3 purr_elixir.db < install.sql
-- ============================================================================
PRAGMA foreign_keys = ON;
.read tables.sql
.read seed.sql
