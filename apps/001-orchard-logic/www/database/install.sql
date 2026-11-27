-- ============================================================================
-- Orchard Logic (001-orchard-logic) — Full Clean SQLite Install Script
-- Execute from database/ directory: sqlite3 orchard_logic.db < install.sql
-- ============================================================================
PRAGMA foreign_keys = ON;
.read tables.sql
.read seed.sql
