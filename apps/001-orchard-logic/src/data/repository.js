/* ============================================================================
 * Orchard Logic (001-orchard-logic) — Real SQLite Data Repository
 * Single source of truth over core-engine/js/db-adapter.js
 * Zero mock data: All levels, fruit catalog, progress, streaks & prefs come
 * exclusively from parameterized (?) SQLite queries.
 * ============================================================================ */

import { db } from '../../../../core-engine/js/db-adapter.js';

export const CELL_EMPTY = 0;
export const CELL_X = 1;
export const CELL_FRUIT = 2;
export const CELL_AUTO_X = 3;

export const DEFAULT_FREE_HINTS = 2;
export const DAILY_EPOCH_KEY = '2026-01-01';

export const DEFAULT_PREFS = Object.freeze({
  auto_x: true,
  highlight_conflicts: true,
  haptics_enabled: true,
  music_enabled: true,
  sfx_enabled: true,
  colorblind_hints: false,
  tutorial_seen: false,
  last_played_level_id: 1
});

// ============================================================================
// Pure Date, Star & Serialization Helpers
// ============================================================================

/**
 * Returns local calendar key 'YYYY-MM-DD' (flips at user's local midnight).
 */
export function getTodayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts 'YYYY-MM-DD' into an exact UTC day integer (immune to DST shifts).
 */
export function parseDayKeyToDayNumber(dayKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayKey || ''));
  if (!match) return Math.floor(Date.now() / 86400000);
  return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000);
}

/**
 * Shifts a 'YYYY-MM-DD' key by deltaDays using UTC arithmetic.
 */
export function shiftDayKey(dayKey, deltaDays) {
  const dayNum = parseDayKeyToDayNumber(dayKey) + deltaDays;
  const dt = new Date(dayNum * 86400000);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates 1..3 stars from solve time, par time, hints used, and mistakes.
 */
export function calculateStars({
  elapsedSeconds = 0,
  parSeconds = 120,
  hintsUsed = 0,
  mistakesCount = 0
} = {}) {
  const elapsed = Math.max(0, Number(elapsedSeconds) || 0);
  const par = Math.max(15, Number(parSeconds) || 120);
  const hints = Math.max(0, Number(hintsUsed) || 0);
  const mistakes = Math.max(0, Number(mistakesCount) || 0);

  if (mistakes >= 3 || hints >= 2 || elapsed > par * 3) return 1;
  if (mistakes >= 1 || hints >= 1 || elapsed > par * 1.6) return 2;
  return 3;
}

function safeJsonParse(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function sanitizeBoardState(boardState, gridSize) {
  const total = gridSize * gridSize;
  const out = new Array(total).fill(CELL_EMPTY);
  if (!Array.isArray(boardState)) return out;
  for (let i = 0; i < total && i < boardState.length; i++) {
    const v = Number(boardState[i]);
    out[i] = v === CELL_X || v === CELL_FRUIT || v === CELL_AUTO_X ? v : CELL_EMPTY;
  }
  return out;
}

function hydrateLevelRow(row, { dayKey = null } = {}) {
  if (!row) return null;
  const gridSize = Number(row.grid_size);
  const totalCells = gridSize * gridSize;
  const isDaily = row.tier === 'daily';
  const regions = safeJsonParse(row.regions_json, []);
  const solution = safeJsonParse(row.solution_json, []);

  // If this is a daily puzzle reused on a different date, present a fresh board state
  const isStaleDailyCycle =
    isDaily && Boolean(dayKey) && Boolean(row.active_day_key) && row.active_day_key !== dayKey;

  const rawBoard = isStaleDailyCycle ? [] : safeJsonParse(row.board_state_json, []);
  const boardState =
    Array.isArray(rawBoard) && rawBoard.length === totalCells
      ? sanitizeBoardState(rawBoard, gridSize)
      : new Array(totalCells).fill(CELL_EMPTY);

  const hasProgress = !isStaleDailyCycle && row.progress_status != null;
  const status = hasProgress ? row.progress_status : 'not_started';

  return {
    id: Number(row.id),
    slug: row.slug,
    tier: row.tier,
    grid_size: gridSize,
    par_seconds: Number(row.par_seconds),
    title_en: row.title_en || '',
    title_tr: row.title_tr || '',
    sort_order: Number(row.sort_order ?? row.id),
    is_daily: isDaily,
    regions,
    solution,
    status,
    is_completed: status === 'completed' || (!isStaleDailyCycle && row.completed_at != null),
    board_state: boardState,
    elapsed_seconds: hasProgress ? Number(row.elapsed_seconds || 0) : 0,
    best_seconds: row.best_seconds != null ? Number(row.best_seconds) : null,
    hints_used: hasProgress ? Number(row.hints_used || 0) : 0,
    free_hints_left: hasProgress ? Number(row.free_hints_left ?? DEFAULT_FREE_HINTS) : DEFAULT_FREE_HINTS,
    mistakes_count: hasProgress ? Number(row.mistakes_count || 0) : 0,
    stars: row.stars != null ? Number(row.stars) : 0,
    active_day_key: row.active_day_key || null,
    completed_at: isStaleDailyCycle ? null : row.completed_at || null,
    updated_at: hasProgress ? row.updated_at || null : null
  };
}

const LEVEL_WITH_PROGRESS_SELECT = `
  SELECT
    l.id,
    l.slug,
    l.tier,
    l.grid_size,
    l.regions_json,
    l.solution_json,
    l.par_seconds,
    l.title_en,
    l.title_tr,
    l.sort_order,
    p.status AS progress_status,
    p.board_state_json,
    p.elapsed_seconds,
    p.best_seconds,
    p.hints_used,
    p.free_hints_left,
    p.mistakes_count,
    p.stars,
    p.active_day_key,
    p.completed_at,
    p.updated_at
  FROM levels l
  LEFT JOIN level_progress p ON p.level_id = l.id
`;

// ============================================================================
// 1. Fruit Catalog (Bilingual EN/TR Reference Data)
// ============================================================================

export async function getFruitCatalog() {
  const rows = await db.query(
    `SELECT color_id, slug, name_en, name_tr, color_name_en, color_name_tr, light_bg, dark_bg, accent_hex
     FROM fruit_catalog
     ORDER BY color_id ASC`
  );
  return rows.map((r) => ({ ...r, color_id: Number(r.color_id) }));
}

export async function getFruitsForGridSize(gridSize) {
  const n = Math.min(10, Math.max(1, Number(gridSize) || 10));
  const rows = await db.query(
    `SELECT color_id, slug, name_en, name_tr, color_name_en, color_name_tr, light_bg, dark_bg, accent_hex
     FROM fruit_catalog
     WHERE color_id < ?
     ORDER BY color_id ASC`,
    [n]
  );
  return rows.map((r) => ({ ...r, color_id: Number(r.color_id) }));
}

// ============================================================================
// 2. Campaign & Level Queries (Read, Filter, Search)
// ============================================================================

/**
 * Fetches campaign levels (30 levels, excluding daily pool) with optional
 * filter ('all' | '4-6' | '8x8' | '10x10' | tier | grid_size | status) and search.
 */
export async function getCampaignLevels({ filter = 'all', search = '' } = {}) {
  const where = ["l.tier != 'daily'"];
  const params = [];

  const normFilter = String(filter ?? 'all').trim().toLowerCase();
  if (normFilter && normFilter !== 'all') {
    if (normFilter === '4-6' || normFilter === '4-6x' || normFilter === 'intro' || normFilter === 'small' || normFilter === 'beginner') {
      where.push('l.grid_size IN (?, ?, ?)');
      params.push(4, 5, 6);
    } else if (normFilter === '8' || normFilter === '8x8' || normFilter === 'intermediate') {
      where.push('l.grid_size = ?');
      params.push(8);
    } else if (normFilter === '10' || normFilter === '10x10' || normFilter === 'master') {
      where.push('l.grid_size = ?');
      params.push(10);
    } else if (normFilter === 'tutorial' || normFilter === 'starter' || normFilter === 'warmup') {
      where.push('l.tier = ?');
      params.push(normFilter);
    } else if (normFilter === '4' || normFilter === '5' || normFilter === '6') {
      where.push('l.grid_size = ?');
      params.push(Number(normFilter));
    } else if (normFilter === 'completed') {
      where.push("(p.status = 'completed' OR p.completed_at IS NOT NULL)");
    } else if (normFilter === 'in_progress') {
      where.push("p.status = 'in_progress'");
    } else if (normFilter === 'not_started') {
      where.push("(p.status IS NULL OR p.status = 'not_started')");
    }
  }

  const trimmedSearch = String(search ?? '').trim();
  if (trimmedSearch) {
    const like = `%${trimmedSearch}%`;
    where.push('(l.slug LIKE ? OR l.title_en LIKE ? OR l.title_tr LIKE ? OR l.tier LIKE ? OR CAST(l.id AS TEXT) = ?)');
    params.push(like, like, like, like, trimmedSearch);
  }

  const sql = `
    ${LEVEL_WITH_PROGRESS_SELECT}
    WHERE ${where.join(' AND ')}
    ORDER BY l.sort_order ASC, l.id ASC
  `;
  const rows = await db.query(sql, params);
  return rows.map((row) => hydrateLevelRow(row));
}

export async function getLevelById(levelId, { dayKey = null } = {}) {
  const row = await db.queryOne(
    `${LEVEL_WITH_PROGRESS_SELECT} WHERE l.id = ?`,
    [Number(levelId)]
  );
  return hydrateLevelRow(row, { dayKey });
}

export async function getLevelBySlug(slug, { dayKey = null } = {}) {
  const row = await db.queryOne(
    `${LEVEL_WITH_PROGRESS_SELECT} WHERE l.slug = ?`,
    [String(slug)]
  );
  return hydrateLevelRow(row, { dayKey });
}

export async function getNextCampaignLevel(currentLevelId) {
  const row = await db.queryOne(
    `${LEVEL_WITH_PROGRESS_SELECT}
     WHERE l.tier != 'daily' AND l.sort_order > (
       SELECT COALESCE(sort_order, id) FROM levels WHERE id = ?
     )
     ORDER BY l.sort_order ASC, l.id ASC
     LIMIT 1`,
    [Number(currentLevelId)]
  );
  return hydrateLevelRow(row);
}

/**
 * Returns the best level for the Home "Continue Campaign" card:
 * 1. Most recently updated in-progress campaign level
 * 2. Otherwise first uncompleted campaign level
 * 3. Otherwise level 11 (or last) if all 30 are completed
 */
export async function getActiveCampaignLevel() {
  const inProgress = await db.queryOne(
    `${LEVEL_WITH_PROGRESS_SELECT}
     WHERE l.tier != 'daily' AND p.status = 'in_progress'
     ORDER BY p.updated_at DESC, l.sort_order ASC
     LIMIT 1`
  );
  if (inProgress) return hydrateLevelRow(inProgress);

  const nextUnsolved = await db.queryOne(
    `${LEVEL_WITH_PROGRESS_SELECT}
     WHERE l.tier != 'daily' AND (p.status IS NULL OR (p.status != 'completed' AND p.completed_at IS NULL))
     ORDER BY l.sort_order ASC, l.id ASC
     LIMIT 1`
  );
  if (nextUnsolved) return hydrateLevelRow(nextUnsolved);

  const firstLevel = await db.queryOne(
    `${LEVEL_WITH_PROGRESS_SELECT}
     WHERE l.tier != 'daily'
     ORDER BY l.sort_order ASC, l.id ASC
     LIMIT 1`
  );
  return hydrateLevelRow(firstLevel);
}

export async function getCampaignSummary() {
  const agg = await db.queryOne(`
    SELECT
      COUNT(l.id) AS total_levels,
      SUM(CASE WHEN p.status = 'completed' OR p.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed_levels,
      SUM(CASE WHEN p.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_levels,
      COALESCE(SUM(CASE WHEN p.stars > 0 THEN p.stars ELSE 0 END), 0) AS total_stars
    FROM levels l
    LEFT JOIN level_progress p ON p.level_id = l.id
    WHERE l.tier != 'daily'
  `);

  const totalLevels = Number(agg?.total_levels || 0);
  const completedLevels = Number(agg?.completed_levels || 0);
  const inProgressLevels = Number(agg?.in_progress_levels || 0);
  const totalStars = Number(agg?.total_stars || 0);
  const maxStars = totalLevels * 3;
  const activeLevel = await getActiveCampaignLevel();

  return {
    totalLevels,
    completedLevels,
    inProgressLevels,
    totalStars,
    maxStars,
    completionPct: totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0,
    allCompleted: totalLevels > 0 && completedLevels >= totalLevels,
    activeLevel
  };
}

// ============================================================================
// 3. Level Progress CRUD (Save Board, Hints, Mistakes, Complete, Reset)
// ============================================================================

async function ensureProgressRow(levelId, dayKey = null) {
  const lvl = await db.queryOne('SELECT id, grid_size FROM levels WHERE id = ?', [Number(levelId)]);
  if (!lvl) throw new Error(`Level not found: ${levelId}`);
  const emptyBoard = JSON.stringify(new Array(Number(lvl.grid_size) * Number(lvl.grid_size)).fill(CELL_EMPTY));
  await db.run(
    `INSERT OR IGNORE INTO level_progress (
       level_id, status, board_state_json, elapsed_seconds, hints_used, free_hints_left, mistakes_count, stars, active_day_key, updated_at
     ) VALUES (?, 'not_started', ?, 0, 0, ?, 0, 0, ?, datetime('now'))`,
    [Number(levelId), emptyBoard, DEFAULT_FREE_HINTS, dayKey]
  );
  return lvl;
}

/**
 * Saves live board state, elapsed timer, hint counters, and mistake count.
 * Preserves previously earned best_seconds, stars, and completed_at when replaying.
 */
export async function saveBoardProgress(
  levelId,
  {
    boardState,
    elapsedSeconds = 0,
    hintsUsed = 0,
    freeHintsLeft = DEFAULT_FREE_HINTS,
    mistakesCount = 0,
    status = 'in_progress',
    dayKey = null
  } = {}
) {
  const id = Number(levelId);
  const lvl = await db.queryOne('SELECT id, tier, grid_size FROM levels WHERE id = ?', [id]);
  if (!lvl) throw new Error(`Level not found: ${levelId}`);

  const existing = await db.queryOne(
    'SELECT status, best_seconds, stars, completed_at, active_day_key FROM level_progress WHERE level_id = ?',
    [id]
  );

  const isDaily = lvl.tier === 'daily';
  const effectiveDayKey = isDaily ? dayKey || getTodayKey() : null;
  const sanitizedBoard = sanitizeBoardState(boardState, Number(lvl.grid_size));
  const boardJson = JSON.stringify(sanitizedBoard);
  const safeElapsed = Math.max(0, Math.floor(Number(elapsedSeconds) || 0));
  const safeHints = Math.max(0, Math.floor(Number(hintsUsed) || 0));
  const safeFreeHints = Math.max(0, Math.floor(Number(freeHintsLeft ?? DEFAULT_FREE_HINTS)));
  const safeMistakes = Math.max(0, Math.floor(Number(mistakesCount) || 0));

  // Replaying an already-completed campaign level keeps its completed status
  const isAlreadyCompletedCampaign = !isDaily && existing && (existing.status === 'completed' || existing.completed_at != null);
  const nextStatus =
    isAlreadyCompletedCampaign && status === 'in_progress'
      ? 'completed'
      : status === 'completed' || status === 'not_started'
        ? status
        : 'in_progress';

  await db.run(
    `INSERT INTO level_progress (
       level_id, status, board_state_json, elapsed_seconds, best_seconds,
       hints_used, free_hints_left, mistakes_count, stars, active_day_key, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 0, ?, NULL, datetime('now'))
     ON CONFLICT(level_id) DO UPDATE SET
       status = excluded.status,
       board_state_json = excluded.board_state_json,
       elapsed_seconds = excluded.elapsed_seconds,
       hints_used = excluded.hints_used,
       free_hints_left = excluded.free_hints_left,
       mistakes_count = excluded.mistakes_count,
       active_day_key = excluded.active_day_key,
       updated_at = datetime('now')`,
    [id, nextStatus, boardJson, safeElapsed, safeHints, safeFreeHints, safeMistakes, effectiveDayKey]
  );

  if (!isDaily) {
    await setPref('last_played_level_id', String(id));
  }

  return getLevelById(id, { dayKey: effectiveDayKey });
}

/**
 * Records a completed puzzle, updates best time & stars, and logs Daily Harvest completions.
 */
export async function completeLevel(
  levelId,
  {
    boardState,
    elapsedSeconds = 0,
    hintsUsed = 0,
    freeHintsLeft = 0,
    mistakesCount = 0,
    dayKey = null
  } = {}
) {
  const id = Number(levelId);
  const lvl = await db.queryOne('SELECT id, slug, tier, grid_size, par_seconds FROM levels WHERE id = ?', [id]);
  if (!lvl) throw new Error(`Level not found: ${levelId}`);

  const existing = await db.queryOne(
    'SELECT best_seconds, stars, completed_at FROM level_progress WHERE level_id = ?',
    [id]
  );

  const isDaily = lvl.tier === 'daily';
  const effectiveDayKey = isDaily ? dayKey || getTodayKey() : null;
  const safeElapsed = Math.max(1, Math.floor(Number(elapsedSeconds) || 0));
  const safeHints = Math.max(0, Math.floor(Number(hintsUsed) || 0));
  const safeFreeHints = Math.max(0, Math.floor(Number(freeHintsLeft) || 0));
  const safeMistakes = Math.max(0, Math.floor(Number(mistakesCount) || 0));
  const sanitizedBoard = sanitizeBoardState(boardState, Number(lvl.grid_size));
  const boardJson = JSON.stringify(sanitizedBoard);

  const earnedStars = calculateStars({
    elapsedSeconds: safeElapsed,
    parSeconds: Number(lvl.par_seconds),
    hintsUsed: safeHints,
    mistakesCount: safeMistakes
  });

  const prevBest = existing?.best_seconds != null ? Number(existing.best_seconds) : null;
  const bestSeconds = prevBest != null ? Math.min(prevBest, safeElapsed) : safeElapsed;
  const isNewBest = prevBest == null || safeElapsed < prevBest;
  const bestStars = Math.max(Number(existing?.stars || 0), earnedStars);

  await db.run(
    `INSERT INTO level_progress (
       level_id, status, board_state_json, elapsed_seconds, best_seconds,
       hints_used, free_hints_left, mistakes_count, stars, active_day_key, completed_at, updated_at
     ) VALUES (?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(level_id) DO UPDATE SET
       status = 'completed',
       board_state_json = excluded.board_state_json,
       elapsed_seconds = excluded.elapsed_seconds,
       best_seconds = CASE
         WHEN level_progress.best_seconds IS NULL THEN excluded.best_seconds
         WHEN excluded.best_seconds < level_progress.best_seconds THEN excluded.best_seconds
         ELSE level_progress.best_seconds
       END,
       hints_used = excluded.hints_used,
       free_hints_left = excluded.free_hints_left,
       mistakes_count = excluded.mistakes_count,
       stars = CASE
         WHEN excluded.stars > level_progress.stars THEN excluded.stars
         ELSE level_progress.stars
       END,
       active_day_key = excluded.active_day_key,
       completed_at = COALESCE(level_progress.completed_at, datetime('now')),
       updated_at = datetime('now')`,
    [id, boardJson, safeElapsed, bestSeconds, safeHints, safeFreeHints, safeMistakes, bestStars, effectiveDayKey]
  );

  let dailyStreak = null;
  if (isDaily) {
    await db.run(
      `INSERT INTO daily_completions (
         day_key, level_id, elapsed_seconds, hints_used, mistakes_count, stars, completed_at
       ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(day_key) DO UPDATE SET
         elapsed_seconds = CASE
           WHEN excluded.elapsed_seconds < daily_completions.elapsed_seconds THEN excluded.elapsed_seconds
           ELSE daily_completions.elapsed_seconds
         END,
         stars = CASE
           WHEN excluded.stars > daily_completions.stars THEN excluded.stars
           ELSE daily_completions.stars
         END`,
      [effectiveDayKey, id, safeElapsed, safeHints, safeMistakes, earnedStars]
    );
    dailyStreak = await getDailyStreak(effectiveDayKey);
  } else {
    await setPref('last_played_level_id', String(id));
  }

  const nextLevel = isDaily ? null : await getNextCampaignLevel(id);

  return {
    levelId: id,
    slug: lvl.slug,
    isDaily,
    dayKey: effectiveDayKey,
    stars: earnedStars,
    bestStars,
    elapsedSeconds: safeElapsed,
    bestSeconds,
    isNewBest,
    hintsUsed: safeHints,
    mistakesCount: safeMistakes,
    nextLevel,
    dailyStreak
  };
}

/**
 * Resets a level's active board and counters.
 * By default keepBest=true preserves earned campaign stars & best_seconds.
 */
export async function resetLevelProgress(levelId, { keepBest = true, dayKey = null } = {}) {
  const id = Number(levelId);
  const lvl = await db.queryOne('SELECT id, tier, grid_size FROM levels WHERE id = ?', [id]);
  if (!lvl) throw new Error(`Level not found: ${levelId}`);

  if (!keepBest) {
    await db.run('DELETE FROM level_progress WHERE level_id = ?', [id]);
    return getLevelById(id, { dayKey });
  }

  const existing = await db.queryOne(
    'SELECT status, best_seconds, stars, completed_at FROM level_progress WHERE level_id = ?',
    [id]
  );
  const emptyBoard = JSON.stringify(new Array(Number(lvl.grid_size) * Number(lvl.grid_size)).fill(CELL_EMPTY));
  const effectiveDayKey = lvl.tier === 'daily' ? dayKey || getTodayKey() : null;
  const nextStatus = existing && existing.completed_at != null && lvl.tier !== 'daily' ? 'completed' : 'not_started';

  await db.run(
    `INSERT INTO level_progress (
       level_id, status, board_state_json, elapsed_seconds, best_seconds,
       hints_used, free_hints_left, mistakes_count, stars, active_day_key, completed_at, updated_at
     ) VALUES (?, ?, ?, 0, NULL, 0, ?, 0, 0, ?, NULL, datetime('now'))
     ON CONFLICT(level_id) DO UPDATE SET
       status = excluded.status,
       board_state_json = excluded.board_state_json,
       elapsed_seconds = 0,
       hints_used = 0,
       free_hints_left = ?,
       mistakes_count = 0,
       active_day_key = excluded.active_day_key,
       updated_at = datetime('now')`,
    [id, nextStatus, emptyBoard, DEFAULT_FREE_HINTS, effectiveDayKey, DEFAULT_FREE_HINTS]
  );

  return getLevelById(id, { dayKey: effectiveDayKey });
}

export async function consumeHint(levelId, { isFree = true, dayKey = null } = {}) {
  const id = Number(levelId);
  await ensureProgressRow(id, dayKey);
  if (isFree) {
    await db.run(
      `UPDATE level_progress
       SET hints_used = hints_used + 1,
           free_hints_left = CASE WHEN free_hints_left > 0 THEN free_hints_left - 1 ELSE 0 END,
           updated_at = datetime('now')
       WHERE level_id = ?`,
      [id]
    );
  } else {
    await db.run(
      `UPDATE level_progress
       SET hints_used = hints_used + 1,
           updated_at = datetime('now')
       WHERE level_id = ?`,
      [id]
    );
  }
  const row = await db.queryOne(
    'SELECT hints_used, free_hints_left FROM level_progress WHERE level_id = ?',
    [id]
  );
  return {
    hintsUsed: Number(row?.hints_used || 0),
    freeHintsLeft: Number(row?.free_hints_left || 0)
  };
}

export async function grantRewardedHint(levelId, amount = 1, { dayKey = null } = {}) {
  const id = Number(levelId);
  const delta = Math.max(1, Math.floor(Number(amount) || 1));
  await ensureProgressRow(id, dayKey);
  await db.run(
    `UPDATE level_progress
     SET free_hints_left = free_hints_left + ?,
         updated_at = datetime('now')
     WHERE level_id = ?`,
    [delta, id]
  );
  const row = await db.queryOne(
    'SELECT hints_used, free_hints_left FROM level_progress WHERE level_id = ?',
    [id]
  );
  return {
    hintsUsed: Number(row?.hints_used || 0),
    freeHintsLeft: Number(row?.free_hints_left || 0)
  };
}

export async function recordMistake(levelId, { dayKey = null } = {}) {
  const id = Number(levelId);
  await ensureProgressRow(id, dayKey);
  await db.run(
    `UPDATE level_progress
     SET mistakes_count = mistakes_count + 1,
         updated_at = datetime('now')
     WHERE level_id = ?`,
    [id]
  );
  const row = await db.queryOne(
    'SELECT mistakes_count FROM level_progress WHERE level_id = ?',
    [id]
  );
  return Number(row?.mistakes_count || 0);
}

// ============================================================================
// 4. Daily Harvest Pool & Streak Calculations
// ============================================================================

export async function getDailyPool() {
  const rows = await db.query(
    `${LEVEL_WITH_PROGRESS_SELECT}
     WHERE l.tier = 'daily'
     ORDER BY l.sort_order ASC, l.id ASC`
  );
  return rows.map((row) => hydrateLevelRow(row));
}

export async function getDailyStreak(todayKey = getTodayKey()) {
  const rows = await db.query(
    'SELECT day_key FROM daily_completions ORDER BY day_key DESC'
  );
  const keys = rows.map((r) => r.day_key);
  const totalDailyCompleted = keys.length;
  if (totalDailyCompleted === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      completedToday: false,
      totalDailyCompleted: 0,
      lastCompletedDay: null
    };
  }

  const keySet = new Set(keys);
  const completedToday = keySet.has(todayKey);
  const yesterdayKey = shiftDayKey(todayKey, -1);

  // Active streak counts backward from today (if completed today) or yesterday (grace until midnight)
  let currentStreak = 0;
  let cursor = completedToday ? todayKey : keySet.has(yesterdayKey) ? yesterdayKey : null;
  while (cursor && keySet.has(cursor)) {
    currentStreak++;
    cursor = shiftDayKey(cursor, -1);
  }

  // Longest historical consecutive run
  const sortedAsc = [...keySet]
    .map((k) => parseDayKeyToDayNumber(k))
    .sort((a, b) => a - b);
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sortedAsc.length; i++) {
    if (sortedAsc[i] === sortedAsc[i - 1] + 1) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    completedToday,
    totalDailyCompleted,
    lastCompletedDay: keys[0] || null
  };
}

export async function getDailyLevelForDate(dayKey = getTodayKey()) {
  const poolRows = await db.query(
    `${LEVEL_WITH_PROGRESS_SELECT}
     WHERE l.tier = 'daily'
     ORDER BY l.sort_order ASC, l.id ASC`
  );
  if (poolRows.length === 0) return null;

  const epochDay = parseDayKeyToDayNumber(DAILY_EPOCH_KEY);
  const targetDay = parseDayKeyToDayNumber(dayKey);
  const offset = targetDay - epochDay;
  const poolIndex = ((offset % poolRows.length) + poolRows.length) % poolRows.length;

  const level = hydrateLevelRow(poolRows[poolIndex], { dayKey });
  const completion = await db.queryOne(
    `SELECT day_key, level_id, elapsed_seconds, hints_used, mistakes_count, stars, completed_at
     FROM daily_completions
     WHERE day_key = ?`,
    [dayKey]
  );
  const streak = await getDailyStreak(dayKey);

  return {
    dayKey,
    dailyNumber: Math.max(1, offset + 1),
    poolIndex,
    level,
    completion: completion
      ? {
          day_key: completion.day_key,
          level_id: Number(completion.level_id),
          elapsed_seconds: Number(completion.elapsed_seconds),
          hints_used: Number(completion.hints_used || 0),
          mistakes_count: Number(completion.mistakes_count || 0),
          stars: Number(completion.stars || 3),
          completed_at: completion.completed_at
        }
      : null,
    isCompletedToday: Boolean(completion),
    streak
  };
}

export async function getDailyCompletions(limit = 30) {
  const safeLimit = Math.max(1, Math.min(365, Math.floor(Number(limit) || 30)));
  const rows = await db.query(
    `SELECT
       dc.day_key,
       dc.level_id,
       dc.elapsed_seconds,
       dc.hints_used,
       dc.mistakes_count,
       dc.stars,
       dc.completed_at,
       l.slug,
       l.title_en,
       l.title_tr,
       l.grid_size
     FROM daily_completions dc
     INNER JOIN levels l ON l.id = dc.level_id
     ORDER BY dc.day_key DESC
     LIMIT ?`,
    [safeLimit]
  );
  return rows.map((r) => ({
    ...r,
    level_id: Number(r.level_id),
    elapsed_seconds: Number(r.elapsed_seconds),
    hints_used: Number(r.hints_used || 0),
    mistakes_count: Number(r.mistakes_count || 0),
    stars: Number(r.stars || 3),
    grid_size: Number(r.grid_size)
  }));
}

// ============================================================================
// 5. Statistics & Bento Summary Aggregations
// ============================================================================

export async function getStatsSummary(todayKey = getTodayKey()) {
  const campaignAgg = await db.queryOne(`
    SELECT
      COUNT(l.id) AS total_campaign,
      SUM(CASE WHEN p.status = 'completed' OR p.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS solved_campaign,
      SUM(CASE WHEN p.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_campaign,
      COALESCE(SUM(CASE WHEN p.stars > 0 THEN p.stars ELSE 0 END), 0) AS total_stars,
      COALESCE(SUM(p.hints_used), 0) AS campaign_hints,
      COALESCE(SUM(p.mistakes_count), 0) AS campaign_mistakes
    FROM levels l
    LEFT JOIN level_progress p ON p.level_id = l.id
    WHERE l.tier != 'daily'
  `);

  const best10Row = await db.queryOne(`
    SELECT MIN(sec) AS best_10x10
    FROM (
      SELECT p.best_seconds AS sec
      FROM level_progress p
      INNER JOIN levels l ON l.id = p.level_id
      WHERE l.grid_size = 10
        AND p.best_seconds IS NOT NULL
        AND (p.status = 'completed' OR p.completed_at IS NOT NULL)
      UNION ALL
      SELECT dc.elapsed_seconds AS sec
      FROM daily_completions dc
      INNER JOIN levels l ON l.id = dc.level_id
      WHERE l.grid_size = 10
        AND dc.elapsed_seconds IS NOT NULL
    )
  `);

  const avgRow = await db.queryOne(`
    SELECT AVG(sec) AS avg_seconds, COUNT(sec) AS sample_count
    FROM (
      SELECT p.best_seconds AS sec
      FROM level_progress p
      INNER JOIN levels l ON l.id = p.level_id
      WHERE l.tier != 'daily'
        AND p.best_seconds IS NOT NULL
        AND (p.status = 'completed' OR p.completed_at IS NOT NULL)
      UNION ALL
      SELECT dc.elapsed_seconds AS sec
      FROM daily_completions dc
      WHERE dc.elapsed_seconds IS NOT NULL
    )
  `);

  const dailyTotals = await db.queryOne(`
    SELECT
      COUNT(day_key) AS solved_daily,
      COALESCE(SUM(hints_used), 0) AS daily_hints,
      COALESCE(SUM(mistakes_count), 0) AS daily_mistakes
    FROM daily_completions
  `);

  const tierRows = await db.query(`
    SELECT
      l.tier,
      l.grid_size,
      COUNT(l.id) AS total_count,
      SUM(CASE WHEN p.status = 'completed' OR p.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed_count,
      COALESCE(SUM(CASE WHEN p.stars > 0 THEN p.stars ELSE 0 END), 0) AS stars,
      MIN(CASE WHEN p.status = 'completed' OR p.completed_at IS NOT NULL THEN p.best_seconds ELSE NULL END) AS best_seconds
    FROM levels l
    LEFT JOIN level_progress p ON p.level_id = l.id
    WHERE l.tier != 'daily'
    GROUP BY l.tier, l.grid_size
    ORDER BY l.grid_size ASC
  `);

  const endlessRow = await db.queryOne(`
    SELECT
      COUNT(id) AS solved_endless,
      MIN(CASE WHEN grid_size = 10 THEN elapsed_seconds ELSE NULL END) AS best_endless_10
    FROM endless_runs
  `);

  const streak = await getDailyStreak(todayKey);
  const totalCampaignLevels = Number(campaignAgg?.total_campaign || 0);
  const solvedCampaignLevels = Number(campaignAgg?.solved_campaign || 0);
  const solvedDailyCount = Number(dailyTotals?.solved_daily || 0);
  const solvedEndlessCount = Number(endlessRow?.solved_endless || 0);
  const avgRaw = avgRow?.avg_seconds;
  const best10Candidates = [
    best10Row?.best_10x10 != null ? Number(best10Row.best_10x10) : null,
    endlessRow?.best_endless_10 != null ? Number(endlessRow.best_endless_10) : null
  ].filter((v) => v != null);

  return {
    solvedCampaignLevels,
    totalCampaignLevels,
    inProgressCampaignLevels: Number(campaignAgg?.in_progress_campaign || 0),
    totalStars: Number(campaignAgg?.total_stars || 0),
    maxStars: totalCampaignLevels * 3,
    solvedDailyCount,
    solvedEndlessCount,
    totalSolved: solvedCampaignLevels + solvedDailyCount + solvedEndlessCount,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    completedToday: streak.completedToday,
    best10x10Seconds: best10Candidates.length > 0 ? Math.min(...best10Candidates) : null,
    averageSeconds: avgRaw != null && Number.isFinite(Number(avgRaw)) ? Math.round(Number(avgRaw)) : null,
    totalHintsUsed: Number(campaignAgg?.campaign_hints || 0) + Number(dailyTotals?.daily_hints || 0),
    totalMistakes: Number(campaignAgg?.campaign_mistakes || 0) + Number(dailyTotals?.daily_mistakes || 0),
    tierBreakdown: tierRows.map((r) => ({
      tier: r.tier,
      grid_size: Number(r.grid_size),
      total: Number(r.total_count),
      completed: Number(r.completed_count),
      stars: Number(r.stars),
      best_seconds: r.best_seconds != null ? Number(r.best_seconds) : null
    }))
  };
}

export async function recordEndlessRun({ gridSize, elapsedSeconds, hintsUsed = 0, mistakesCount = 0, parSeconds = 180 }) {
  const safeSec = Math.max(1, Math.floor(Number(elapsedSeconds) || 1));
  const safeHints = Math.max(0, Math.floor(Number(hintsUsed) || 0));
  const safeMistakes = Math.max(0, Math.floor(Number(mistakesCount) || 0));
  const stars = calculateStars({
    elapsedSeconds: safeSec,
    parSeconds,
    hintsUsed: safeHints,
    mistakesCount: safeMistakes
  });

  await db.run(
    `INSERT INTO endless_runs (grid_size, elapsed_seconds, hints_used, mistakes_count, stars, completed_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [Number(gridSize), safeSec, safeHints, safeMistakes, stars]
  );

  const agg = await db.queryOne('SELECT COUNT(id) AS cnt, MIN(elapsed_seconds) AS best FROM endless_runs WHERE grid_size = ?', [Number(gridSize)]);
  return {
    isEndless: true,
    isDaily: false,
    stars,
    elapsedSeconds: safeSec,
    hintsUsed: safeHints,
    mistakesCount: safeMistakes,
    isNewBest: agg?.best != null && Number(agg.best) === safeSec,
    endlessTotalForSize: Number(agg?.cnt || 1),
    nextLevel: null
  };
}

// ============================================================================
// 6. Player Preferences CRUD & Full Progress Reset
// ============================================================================

export async function getPref(key, fallback = null) {
  const row = await db.queryOne('SELECT value FROM player_prefs WHERE key = ?', [String(key)]);
  return row ? row.value : fallback;
}

export async function setPref(key, value) {
  const normalized =
    typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? '');
  await db.run(
    `INSERT INTO player_prefs (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = datetime('now')`,
    [String(key), normalized]
  );
  return normalized;
}

export async function deletePref(key) {
  await db.run('DELETE FROM player_prefs WHERE key = ?', [String(key)]);
}

export async function getAllPrefs() {
  const rows = await db.query('SELECT key, value FROM player_prefs ORDER BY key ASC');
  const raw = {};
  for (const row of rows) {
    raw[row.key] = row.value;
  }
  const toBool = (k, def) => (k in raw ? raw[k] === '1' || raw[k] === 'true' : def);
  const toInt = (k, def) => {
    const n = Number(raw[k]);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
  };
  return {
    auto_x: toBool('auto_x', DEFAULT_PREFS.auto_x),
    highlight_conflicts: toBool('highlight_conflicts', DEFAULT_PREFS.highlight_conflicts),
    haptics_enabled: toBool('haptics_enabled', DEFAULT_PREFS.haptics_enabled),
    music_enabled: toBool('music_enabled', DEFAULT_PREFS.music_enabled),
    sfx_enabled: toBool('sfx_enabled', DEFAULT_PREFS.sfx_enabled),
    colorblind_hints: toBool('colorblind_hints', DEFAULT_PREFS.colorblind_hints),
    tutorial_seen: toBool('tutorial_seen', DEFAULT_PREFS.tutorial_seen),
    last_played_level_id: toInt('last_played_level_id', DEFAULT_PREFS.last_played_level_id),
    raw
  };
}

export async function resetAllProgress() {
  await db.run('DELETE FROM level_progress');
  await db.run('DELETE FROM daily_completions');
  await db.run('DELETE FROM endless_runs');
  await setPref('last_played_level_id', '1');
}
