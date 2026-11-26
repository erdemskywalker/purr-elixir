/* ============================================================================
 * Purr Elixir (002-purr-elixir) — Real SQLite Data Repository
 * Single source of truth over core-engine/js/db-adapter.js
 * Zero mock data: All elixirs, cat companions, 120 BFS-verified levels,
 * progress, daily streaks, endless runs & prefs flow via parameterized (?) SQL.
 * ============================================================================ */

import { db } from '../../../../core-engine/js/db-adapter.js';

export const BOTTLE_CAPACITY = 4;
export const MAX_EXTRA_FLASKS = 2;
export const DEFAULT_FREE_HINTS = 2;
export const MAX_UNDO_SNAPSHOTS = 15;
export const DAILY_EPOCH_KEY = '2026-01-01';

export const DEFAULT_PREFS = Object.freeze({
  active_cat_id: 'mochi',
  music_enabled: true,
  sfx_enabled: true,
  haptics_enabled: true,
  cat_talk_enabled: true,
  colorblind_symbols: false,
  simple_ad_counter: 0,
  total_bottles_sealed: 0,
  last_played_level_id: 1,
  tutorial_seen: false,
  best_combo: 0
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
 * Calculates 1..3 stars from moves, par moves, hints used, and extra flasks used.
 */
export function calculateStars({
  movesCount = 1,
  parMoves = 15,
  hintsUsed = 0,
  extraFlasksUsed = 0
} = {}) {
  const moves = Math.max(1, Math.floor(Number(movesCount) || 1));
  const par = Math.max(3, Math.floor(Number(parMoves) || 15));
  const hints = Math.max(0, Math.floor(Number(hintsUsed) || 0));
  const extra = Math.max(0, Math.floor(Number(extraFlasksUsed) || 0));

  if (extra >= 2 || hints >= 3 || moves > Math.ceil(par * 1.65)) return 1;
  if (extra >= 1 || hints >= 1 || moves > par) return 2;
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

function cloneBottles(bottles) {
  if (!Array.isArray(bottles)) return [];
  return bottles.map((b) => (Array.isArray(b) ? b.map((c) => Number(c)) : []));
}

function sanitizeBottlesState(bottlesState, fallbackInitial, { minBottles = 1, maxBottles = 14 } = {}) {
  if (!Array.isArray(bottlesState) || bottlesState.length < minBottles || bottlesState.length > maxBottles) {
    return cloneBottles(fallbackInitial);
  }
  const out = [];
  for (let i = 0; i < bottlesState.length; i++) {
    const rawBottle = bottlesState[i];
    if (!Array.isArray(rawBottle) || rawBottle.length > BOTTLE_CAPACITY) {
      return cloneBottles(fallbackInitial);
    }
    const cleanBottle = [];
    for (let k = 0; k < rawBottle.length; k++) {
      const v = Number(rawBottle[k]);
      if (!Number.isInteger(v) || v < 0 || v > 9) {
        return cloneBottles(fallbackInitial);
      }
      cleanBottle.push(v);
    }
    out.push(cleanBottle);
  }
  return out;
}

function hydrateLevelRow(row, { dayKey = null } = {}) {
  if (!row) return null;
  const colorCount = Number(row.color_count);
  const emptyCount = Number(row.empty_count ?? 2);
  const bottleCapacity = Number(row.bottle_capacity ?? BOTTLE_CAPACITY);
  const baseBottleCount = colorCount + emptyCount;
  const isDaily = row.tier === 'daily';

  const initialBottles = sanitizeBottlesState(
    safeJsonParse(row.bottles_json, []),
    [],
    { minBottles: baseBottleCount, maxBottles: baseBottleCount }
  );

  // If this daily puzzle row belongs to an earlier date cycle, present a fresh shelf
  const isStaleDailyCycle =
    isDaily && Boolean(dayKey) && Boolean(row.active_day_key) && row.active_day_key !== dayKey;

  const rawSaved = isStaleDailyCycle ? [] : safeJsonParse(row.bottles_state_json, []);
  const hasSavedBottles =
    Array.isArray(rawSaved) &&
    rawSaved.length >= baseBottleCount &&
    rawSaved.length <= baseBottleCount + MAX_EXTRA_FLASKS;

  const bottlesState = hasSavedBottles
    ? sanitizeBottlesState(rawSaved, initialBottles, {
        minBottles: baseBottleCount,
        maxBottles: baseBottleCount + MAX_EXTRA_FLASKS
      })
    : cloneBottles(initialBottles);

  const hasProgress = !isStaleDailyCycle && row.progress_status != null;
  const status = hasProgress ? row.progress_status : 'not_started';

  const unlocksCat = row.unlock_cat_id
    ? {
        id: row.unlock_cat_id,
        name_en: row.unlock_cat_name_en,
        name_tr: row.unlock_cat_name_tr,
        accent_hex: row.unlock_cat_accent_hex,
        unlock_level: Number(row.id)
      }
    : null;

  const visitorCat = row.visitor_cat_id
    ? {
        id: row.visitor_cat_id,
        name_en: row.visitor_cat_name_en || '',
        name_tr: row.visitor_cat_name_tr || '',
        title_en: row.visitor_cat_title_en || '',
        title_tr: row.visitor_cat_title_tr || '',
        tone_key: row.visitor_cat_tone_key || 'cheerful',
        coat_color: row.visitor_cat_coat_color || '#EFE7FF',
        accent_hex: row.visitor_cat_accent_hex || '#7C3AED',
        favorite_elixir_id:
          row.visitor_cat_fav_elixir != null ? Number(row.visitor_cat_fav_elixir) : null
      }
    : null;

  return {
    id: Number(row.id),
    slug: row.slug,
    tier: row.tier,
    color_count: colorCount,
    empty_count: emptyCount,
    bottle_capacity: bottleCapacity,
    optimal_moves: Number(row.optimal_moves),
    par_moves: Number(row.par_moves),
    visitor_cat_id: row.visitor_cat_id,
    visitor_cat: visitorCat,
    unlocks_cat: unlocksCat,
    title_en: row.title_en || '',
    title_tr: row.title_tr || '',
    sort_order: Number(row.sort_order ?? row.id),
    is_daily: isDaily,
    initial_bottles: initialBottles,
    bottles_state: bottlesState,
    status,
    is_completed: status === 'completed' || (!isStaleDailyCycle && row.completed_at != null),
    moves_count: hasProgress ? Number(row.moves_count || 0) : 0,
    best_moves: row.best_moves != null ? Number(row.best_moves) : null,
    extra_flasks_used: hasProgress ? Number(row.extra_flasks_used || 0) : 0,
    hints_used: hasProgress ? Number(row.hints_used || 0) : 0,
    free_hints_left: hasProgress ? Number(row.free_hints_left ?? DEFAULT_FREE_HINTS) : DEFAULT_FREE_HINTS,
    max_combo: hasProgress ? Number(row.max_combo || 0) : 0,
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
    l.color_count,
    l.empty_count,
    l.bottle_capacity,
    l.bottles_json,
    l.optimal_moves,
    l.par_moves,
    l.visitor_cat_id,
    l.title_en,
    l.title_tr,
    l.sort_order,
    vc.name_en AS visitor_cat_name_en,
    vc.name_tr AS visitor_cat_name_tr,
    vc.title_en AS visitor_cat_title_en,
    vc.title_tr AS visitor_cat_title_tr,
    vc.tone_key AS visitor_cat_tone_key,
    vc.coat_color AS visitor_cat_coat_color,
    vc.accent_hex AS visitor_cat_accent_hex,
    vc.favorite_elixir_id AS visitor_cat_fav_elixir,
    uc.id AS unlock_cat_id,
    uc.name_en AS unlock_cat_name_en,
    uc.name_tr AS unlock_cat_name_tr,
    uc.accent_hex AS unlock_cat_accent_hex,
    p.status AS progress_status,
    p.bottles_state_json,
    p.moves_count,
    p.best_moves,
    p.extra_flasks_used,
    p.hints_used,
    p.free_hints_left,
    p.max_combo,
    p.stars,
    p.active_day_key,
    p.completed_at,
    p.updated_at
  FROM levels l
  LEFT JOIN cat_companions vc ON vc.id = l.visitor_cat_id
  LEFT JOIN cat_companions uc ON uc.unlock_level = l.id AND l.tier != 'daily'
  LEFT JOIN level_progress p ON p.level_id = l.id
`;

// ============================================================================
// 1. Elixir Catalog (10 Bilingual High-Contrast Elixirs)
// ============================================================================

export async function getElixirCatalog() {
  const rows = await db.query(
    `SELECT elixir_id, slug, name_en, name_tr, hex_color, meniscus_hex, symbol, sort_order
     FROM elixir_catalog
     ORDER BY sort_order ASC, elixir_id ASC`
  );
  return rows.map((r) => ({
    ...r,
    elixir_id: Number(r.elixir_id),
    sort_order: Number(r.sort_order)
  }));
}

export async function getElixirById(elixirId) {
  const row = await db.queryOne(
    `SELECT elixir_id, slug, name_en, name_tr, hex_color, meniscus_hex, symbol, sort_order
     FROM elixir_catalog
     WHERE elixir_id = ?`,
    [Number(elixirId)]
  );
  return row ? { ...row, elixir_id: Number(row.elixir_id), sort_order: Number(row.sort_order) } : null;
}

export async function getElixirMap() {
  const list = await getElixirCatalog();
  const map = {};
  for (const item of list) map[item.elixir_id] = item;
  return map;
}

// ============================================================================
// 2. Cat Companions (6 Unlockable Visitor & Talking Assistant Cats)
// ============================================================================

async function getCampaignCompletionContext() {
  const rows = await db.query(
    `SELECT p.level_id
     FROM level_progress p
     INNER JOIN levels l ON l.id = p.level_id
     WHERE l.tier != 'daily'
       AND (p.status = 'completed' OR p.completed_at IS NOT NULL)`
  );
  const completedIds = new Set(rows.map((r) => Number(r.level_id)));
  const activeCatId = (await getPref('active_cat_id', DEFAULT_PREFS.active_cat_id)) || DEFAULT_PREFS.active_cat_id;
  return {
    completedIds,
    completedCount: completedIds.size,
    activeCatId
  };
}

function hydrateCatRow(row, ctx) {
  if (!row) return null;
  const unlockLevel = Number(row.unlock_level || 0);
  const isUnlocked =
    unlockLevel <= 0 ||
    ctx.completedIds.has(unlockLevel) ||
    ctx.completedCount >= unlockLevel;
  const levelsRemaining = isUnlocked ? 0 : Math.max(1, unlockLevel - ctx.completedCount);
  const isActive = isUnlocked && ctx.activeCatId === row.id;

  return {
    id: row.id,
    name_en: row.name_en,
    name_tr: row.name_tr,
    title_en: row.title_en,
    title_tr: row.title_tr,
    personality_en: row.personality_en,
    personality_tr: row.personality_tr,
    tone_key: row.tone_key,
    coat_color: row.coat_color,
    accent_hex: row.accent_hex,
    unlock_level: unlockLevel,
    favorite_elixir_id: Number(row.favorite_elixir_id),
    favorite_elixir: {
      elixir_id: Number(row.favorite_elixir_id),
      slug: row.fav_slug || '',
      name_en: row.fav_name_en || '',
      name_tr: row.fav_name_tr || '',
      hex_color: row.fav_hex_color || row.accent_hex,
      symbol: row.fav_symbol || '✦'
    },
    sort_order: Number(row.sort_order),
    is_unlocked: isUnlocked,
    is_active: isActive,
    levels_remaining: levelsRemaining
  };
}

const CAT_WITH_ELIXIR_SELECT = `
  SELECT
    c.id,
    c.name_en,
    c.name_tr,
    c.title_en,
    c.title_tr,
    c.personality_en,
    c.personality_tr,
    c.tone_key,
    c.coat_color,
    c.accent_hex,
    c.unlock_level,
    c.favorite_elixir_id,
    c.sort_order,
    e.slug AS fav_slug,
    e.name_en AS fav_name_en,
    e.name_tr AS fav_name_tr,
    e.hex_color AS fav_hex_color,
    e.symbol AS fav_symbol
  FROM cat_companions c
  LEFT JOIN elixir_catalog e ON e.elixir_id = c.favorite_elixir_id
`;

export async function getCatCompanions() {
  const [rows, ctx] = await Promise.all([
    db.query(`${CAT_WITH_ELIXIR_SELECT} ORDER BY c.sort_order ASC, c.unlock_level ASC`),
    getCampaignCompletionContext()
  ]);
  const cats = rows.map((r) => hydrateCatRow(r, ctx));
  // Guarantee at least one active cat (fallback to Mochi if pref points to a locked/missing cat)
  if (cats.length > 0 && !cats.some((c) => c.is_active)) {
    const fallback = cats.find((c) => c.is_unlocked) || cats[0];
    fallback.is_active = true;
  }
  return cats;
}

export async function getCatById(catId) {
  const [row, ctx] = await Promise.all([
    db.queryOne(`${CAT_WITH_ELIXIR_SELECT} WHERE c.id = ?`, [String(catId)]),
    getCampaignCompletionContext()
  ]);
  return hydrateCatRow(row, ctx);
}

export async function getActiveCat() {
  const cats = await getCatCompanions();
  return cats.find((c) => c.is_active) || cats[0] || null;
}

export async function setActiveCat(catId) {
  const cat = await getCatById(catId);
  if (!cat) throw new Error(`Cat companion not found: ${catId}`);
  if (!cat.is_unlocked) {
    throw new Error(`Cat companion '${cat.id}' is locked until level ${cat.unlock_level}`);
  }
  await setPref('active_cat_id', cat.id);
  return { ...cat, is_active: true };
}

export async function getCatMilestoneMap() {
  const cats = await getCatCompanions();
  const map = {};
  for (const cat of cats) {
    if (cat.unlock_level > 0) map[cat.unlock_level] = cat;
  }
  return map;
}

export async function getUnlockedCatsCount() {
  const cats = await getCatCompanions();
  return {
    unlockedCount: cats.filter((c) => c.is_unlocked).length,
    totalCount: cats.length
  };
}

// ============================================================================
// 3. Campaign & Level Queries (Read, Filter, Search)
// ============================================================================

/**
 * Fetches campaign levels (60 levels, excluding daily pool) with flexible filter
 * ('all' | 'easy'/'kolay' | 'starter' | 'apprentice' | 'medium'/'orta'/'alchemist' |
 *  'master'/'usta' | 'grandmaster'/'buyuk-usta' | 'completed' | 'in_progress' |
 *  'not_started' | color_count '3'..'10') and bilingual text search.
 */
export async function getCampaignLevels({ filter = 'all', search = '' } = {}) {
  const where = ["l.tier != 'daily'"];
  const params = [];

  const normFilter = String(filter ?? 'all').trim().toLowerCase();
  if (normFilter && normFilter !== 'all' && normFilter !== 'tumu' && normFilter !== 'tümü') {
    if (normFilter === 'easy' || normFilter === 'kolay') {
      where.push('l.tier IN (?, ?)');
      params.push('starter', 'apprentice');
    } else if (normFilter === 'starter' || normFilter === 'baslangic' || normFilter === 'başlangıç') {
      where.push('l.tier = ?');
      params.push('starter');
    } else if (normFilter === 'apprentice' || normFilter === 'cirak' || normFilter === 'çırak') {
      where.push('l.tier = ?');
      params.push('apprentice');
    } else if (normFilter === 'medium' || normFilter === 'orta' || normFilter === 'alchemist' || normFilter === 'simyaci' || normFilter === 'simyacı') {
      where.push('l.tier = ?');
      params.push('alchemist');
    } else if (normFilter === 'master' || normFilter === 'usta') {
      where.push('l.tier = ?');
      params.push('master');
    } else if (
      normFilter === 'grandmaster' ||
      normFilter === 'grand' ||
      normFilter === 'buyuk-usta' ||
      normFilter === 'büyük usta' ||
      normFilter === 'buyuk usta'
    ) {
      where.push('l.tier = ?');
      params.push('grandmaster');
    } else if (normFilter === 'completed') {
      where.push("(p.status = 'completed' OR p.completed_at IS NOT NULL)");
    } else if (normFilter === 'in_progress') {
      where.push("p.status = 'in_progress'");
    } else if (normFilter === 'not_started') {
      where.push("(p.status IS NULL OR p.status = 'not_started')");
    } else if (/^([3-9]|10)$/.test(normFilter)) {
      where.push('l.color_count = ?');
      params.push(Number(normFilter));
    }
  }

  const trimmedSearch = String(search ?? '').trim();
  if (trimmedSearch) {
    const like = `%${trimmedSearch}%`;
    where.push(
      '(l.slug LIKE ? OR l.title_en LIKE ? OR l.title_tr LIKE ? OR l.tier LIKE ? OR l.visitor_cat_id LIKE ? OR CAST(l.id AS TEXT) = ?)'
    );
    params.push(like, like, like, like, like, trimmedSearch);
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
 * Returns the best level for the Home "Continue Campaign" hero card:
 * 1. Most recently updated in-progress campaign level
 * 2. Otherwise first uncompleted campaign level
 * 3. Otherwise Level 1 if all 60 campaign levels are completed
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
  const [activeLevel, catCounts] = await Promise.all([
    getActiveCampaignLevel(),
    getUnlockedCatsCount()
  ]);

  return {
    totalLevels,
    completedLevels,
    inProgressLevels,
    totalStars,
    maxStars,
    completionPct: totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0,
    allCompleted: totalLevels > 0 && completedLevels >= totalLevels,
    activeLevel,
    unlockedCatsCount: catCounts.unlockedCount,
    totalCatsCount: catCounts.totalCount
  };
}

// ============================================================================
// 4. Level Progress CRUD (Save Shelf, Hints, Extra Flasks, Complete, Reset)
// ============================================================================

async function ensureProgressRow(levelId, dayKey = null) {
  const id = Number(levelId);
  const lvl = await db.queryOne(
    'SELECT id, tier, color_count, empty_count, bottles_json FROM levels WHERE id = ?',
    [id]
  );
  if (!lvl) throw new Error(`Level not found: ${levelId}`);
  const effectiveDayKey = lvl.tier === 'daily' ? dayKey || getTodayKey() : null;
  await db.run(
    `INSERT OR IGNORE INTO level_progress (
       level_id, status, bottles_state_json, moves_count, extra_flasks_used,
       hints_used, free_hints_left, max_combo, stars, active_day_key, updated_at
     ) VALUES (?, 'not_started', ?, 0, 0, 0, ?, 0, 0, ?, datetime('now'))`,
    [id, lvl.bottles_json, DEFAULT_FREE_HINTS, effectiveDayKey]
  );
  return lvl;
}

/**
 * Persists live bottle shelf state, moves, extra flasks, hints & combo.
 * Preserves previously earned best_moves, stars & completed_at during replays.
 */
export async function saveLevelProgress(
  levelId,
  {
    bottlesState,
    movesCount = 0,
    extraFlasksUsed = 0,
    hintsUsed = 0,
    freeHintsLeft = DEFAULT_FREE_HINTS,
    maxCombo = 0,
    status = 'in_progress',
    dayKey = null
  } = {}
) {
  const id = Number(levelId);
  const lvl = await db.queryOne(
    'SELECT id, tier, color_count, empty_count, bottles_json FROM levels WHERE id = ?',
    [id]
  );
  if (!lvl) throw new Error(`Level not found: ${levelId}`);

  const existing = await db.queryOne(
    'SELECT status, best_moves, stars, completed_at, active_day_key FROM level_progress WHERE level_id = ?',
    [id]
  );

  const isDaily = lvl.tier === 'daily';
  const effectiveDayKey = isDaily ? dayKey || getTodayKey() : null;
  const baseCount = Number(lvl.color_count) + Number(lvl.empty_count);
  const initialBottles = safeJsonParse(lvl.bottles_json, []);
  const cleanBottles = sanitizeBottlesState(bottlesState, initialBottles, {
    minBottles: baseCount,
    maxBottles: baseCount + MAX_EXTRA_FLASKS
  });

  const safeMoves = Math.max(0, Math.floor(Number(movesCount) || 0));
  const safeExtra = Math.min(MAX_EXTRA_FLASKS, Math.max(0, Math.floor(Number(extraFlasksUsed) || 0)));
  const safeHints = Math.max(0, Math.floor(Number(hintsUsed) || 0));
  const safeFreeHints = Math.max(0, Math.floor(Number(freeHintsLeft ?? DEFAULT_FREE_HINTS)));
  const safeCombo = Math.max(0, Math.floor(Number(maxCombo) || 0));

  const isAlreadyCompletedCampaign =
    !isDaily && existing && (existing.status === 'completed' || existing.completed_at != null);
  const nextStatus = isAlreadyCompletedCampaign
    ? 'completed'
    : status === 'completed' || status === 'not_started'
      ? status
      : 'in_progress';

  await db.run(
    `INSERT INTO level_progress (
       level_id, status, bottles_state_json, moves_count, best_moves,
       extra_flasks_used, hints_used, free_hints_left, max_combo, stars,
       active_day_key, completed_at, updated_at
     ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 0, ?, NULL, datetime('now'))
     ON CONFLICT(level_id) DO UPDATE SET
       status = excluded.status,
       bottles_state_json = excluded.bottles_state_json,
       moves_count = excluded.moves_count,
       extra_flasks_used = excluded.extra_flasks_used,
       hints_used = excluded.hints_used,
       free_hints_left = excluded.free_hints_left,
       max_combo = CASE
         WHEN excluded.max_combo > level_progress.max_combo THEN excluded.max_combo
         ELSE level_progress.max_combo
       END,
       active_day_key = excluded.active_day_key,
       updated_at = datetime('now')`,
    [
      id,
      nextStatus,
      JSON.stringify(cleanBottles),
      safeMoves,
      safeExtra,
      safeHints,
      safeFreeHints,
      safeCombo,
      effectiveDayKey
    ]
  );

  if (!isDaily) {
    await setPref('last_played_level_id', String(id));
  }

  return getLevelById(id, { dayKey: effectiveDayKey });
}

/**
 * Persists the most recent Undo snapshots for an in-progress level so reloading preserves Undo.
 */
export async function saveLevelUndoHistory(levelId, undoStack = [], { dayKey = null } = {}) {
  const id = Number(levelId);
  if (!Number.isFinite(id)) return;
  try {
    if (!Array.isArray(undoStack) || undoStack.length === 0) {
      await db.run('DELETE FROM level_undo_history WHERE level_id = ?', [id]);
      return;
    }
    const trimmed = undoStack.slice(-MAX_UNDO_SNAPSHOTS).map((snap) => ({
      bottles: cloneBottles(snap?.bottles),
      movesCount: Math.max(0, Math.floor(Number(snap?.movesCount) || 0)),
      combo: Math.max(0, Math.floor(Number(snap?.combo) || 0)),
      maxCombo: Math.max(0, Math.floor(Number(snap?.maxCombo) || 0))
    }));
    await db.run(
      `INSERT INTO level_undo_history (level_id, stack_json, active_day_key, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(level_id) DO UPDATE SET
         stack_json = excluded.stack_json,
         active_day_key = excluded.active_day_key,
         updated_at = datetime('now')`,
      [id, JSON.stringify(trimmed), dayKey || null]
    );
  } catch {
    /* keep live gameplay resilient */
  }
}

export async function getLevelUndoHistory(levelId, { dayKey = null } = {}) {
  const id = Number(levelId);
  if (!Number.isFinite(id)) return [];
  try {
    const row = await db.queryOne(
      'SELECT stack_json, active_day_key FROM level_undo_history WHERE level_id = ?',
      [id]
    );
    if (!row) return [];
    if (dayKey && row.active_day_key && row.active_day_key !== dayKey) return [];
    const parsed = safeJsonParse(row.stack_json, []);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && Array.isArray(s.bottles) && s.bottles.length > 0)
      .slice(-MAX_UNDO_SNAPSHOTS)
      .map((s) => ({
        bottles: cloneBottles(s.bottles),
        movesCount: Math.max(0, Math.floor(Number(s.movesCount) || 0)),
        combo: Math.max(0, Math.floor(Number(s.combo) || 0)),
        maxCombo: Math.max(0, Math.floor(Number(s.maxCombo) || 0))
      }));
  } catch {
    return [];
  }
}

export async function clearLevelUndoHistory(levelId) {
  const id = Number(levelId);
  if (!Number.isFinite(id)) return;
  try {
    await db.run('DELETE FROM level_undo_history WHERE level_id = ?', [id]);
  } catch {
    /* ignore */
  }
}

/**
 * Records a completed campaign or daily level, updates best_moves & stars,
 * detects newly unlocked visitor cats, updates total_bottles_sealed & best_combo,
 * and logs Daily Brew streak entries.
 *
 * Commits total_bottles_sealed once per completed run (defaults to level.color_count).
 */
export async function completeLevel(
  levelId,
  {
    bottlesState,
    movesCount = 1,
    extraFlasksUsed = 0,
    hintsUsed = 0,
    freeHintsLeft = 0,
    maxCombo = 0,
    bottlesSealed = null,
    dayKey = null
  } = {}
) {
  const id = Number(levelId);
  const lvl = await db.queryOne(
    `SELECT id, slug, tier, color_count, empty_count, bottles_json, optimal_moves, par_moves, visitor_cat_id
     FROM levels WHERE id = ?`,
    [id]
  );
  if (!lvl) throw new Error(`Level not found: ${levelId}`);

  // Snapshot previously unlocked cats so we accurately report newly unlocked cats
  const catsBefore = await getCatCompanions();
  const unlockedBefore = new Set(catsBefore.filter((c) => c.is_unlocked).map((c) => c.id));

  const existing = await db.queryOne(
    'SELECT best_moves, stars, max_combo, completed_at FROM level_progress WHERE level_id = ?',
    [id]
  );

  const isDaily = lvl.tier === 'daily';
  const effectiveDayKey = isDaily ? dayKey || getTodayKey() : null;
  const baseCount = Number(lvl.color_count) + Number(lvl.empty_count);
  const initialBottles = safeJsonParse(lvl.bottles_json, []);
  const cleanBottles = sanitizeBottlesState(bottlesState, initialBottles, {
    minBottles: baseCount,
    maxBottles: baseCount + MAX_EXTRA_FLASKS
  });

  const safeMoves = Math.max(1, Math.floor(Number(movesCount) || 1));
  const safeExtra = Math.min(MAX_EXTRA_FLASKS, Math.max(0, Math.floor(Number(extraFlasksUsed) || 0)));
  const safeHints = Math.max(0, Math.floor(Number(hintsUsed) || 0));
  const safeFreeHints = Math.max(0, Math.floor(Number(freeHintsLeft) || 0));
  const safeCombo = Math.max(0, Math.floor(Number(maxCombo) || 0));

  const earnedStars = calculateStars({
    movesCount: safeMoves,
    parMoves: Number(lvl.par_moves),
    hintsUsed: safeHints,
    extraFlasksUsed: safeExtra
  });

  const prevBest = existing?.best_moves != null ? Number(existing.best_moves) : null;
  const bestMoves = prevBest != null ? Math.min(prevBest, safeMoves) : safeMoves;
  const isNewBest = prevBest == null || safeMoves < prevBest;
  const bestStars = Math.max(Number(existing?.stars || 0), earnedStars);
  const bestLevelCombo = Math.max(Number(existing?.max_combo || 0), safeCombo);

  await db.run(
    `INSERT INTO level_progress (
       level_id, status, bottles_state_json, moves_count, best_moves,
       extra_flasks_used, hints_used, free_hints_left, max_combo, stars,
       active_day_key, completed_at, updated_at
     ) VALUES (?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(level_id) DO UPDATE SET
       status = 'completed',
       bottles_state_json = excluded.bottles_state_json,
       moves_count = excluded.moves_count,
       best_moves = CASE
         WHEN level_progress.best_moves IS NULL THEN excluded.best_moves
         WHEN excluded.best_moves < level_progress.best_moves THEN excluded.best_moves
         ELSE level_progress.best_moves
       END,
       extra_flasks_used = excluded.extra_flasks_used,
       hints_used = excluded.hints_used,
       free_hints_left = excluded.free_hints_left,
       max_combo = CASE
         WHEN excluded.max_combo > level_progress.max_combo THEN excluded.max_combo
         ELSE level_progress.max_combo
       END,
       stars = CASE
         WHEN excluded.stars > level_progress.stars THEN excluded.stars
         ELSE level_progress.stars
       END,
       active_day_key = excluded.active_day_key,
       completed_at = COALESCE(level_progress.completed_at, datetime('now')),
       updated_at = datetime('now')`,
    [
      id,
      JSON.stringify(cleanBottles),
      safeMoves,
      bestMoves,
      safeExtra,
      safeHints,
      safeFreeHints,
      bestLevelCombo,
      bestStars,
      effectiveDayKey
    ]
  );

  // Clear transient per-level undo snapshots once level is won
  await clearLevelUndoHistory(id);

  // Update persistent bottles sealed & best combo counters
  const sealedDelta =
    bottlesSealed === null || bottlesSealed === undefined
      ? Number(lvl.color_count)
      : Math.max(0, Math.floor(Number(bottlesSealed) || 0));
  if (sealedDelta > 0) {
    await incrementBottlesSealed(sealedDelta);
  }
  const prevGlobalCombo = Number((await getPref('best_combo', '0')) || 0);
  if (safeCombo > prevGlobalCombo) {
    await setPref('best_combo', String(safeCombo));
  }

  let dailyStreak = null;
  if (isDaily) {
    await db.run(
      `INSERT INTO daily_completions (
         day_key, level_id, moves_count, hints_used, extra_flasks_used, stars, completed_at
       ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(day_key) DO UPDATE SET
         moves_count = CASE
           WHEN excluded.moves_count < daily_completions.moves_count THEN excluded.moves_count
           ELSE daily_completions.moves_count
         END,
         stars = CASE
           WHEN excluded.stars > daily_completions.stars THEN excluded.stars
           ELSE daily_completions.stars
         END`,
      [effectiveDayKey, id, safeMoves, safeHints, safeExtra, earnedStars]
    );
    dailyStreak = await getDailyStreak(effectiveDayKey);
  } else {
    await setPref('last_played_level_id', String(id));
  }

  const [catsAfter, visitorCat, nextLevel] = await Promise.all([
    getCatCompanions(),
    getCatById(lvl.visitor_cat_id),
    isDaily ? Promise.resolve(null) : getNextCampaignLevel(id)
  ]);

  const newlyUnlockedCats = catsAfter.filter((c) => c.is_unlocked && !unlockedBefore.has(c.id));

  return {
    levelId: id,
    slug: lvl.slug,
    tier: lvl.tier,
    isDaily,
    dayKey: effectiveDayKey,
    stars: earnedStars,
    bestStars,
    movesCount: safeMoves,
    bestMoves,
    parMoves: Number(lvl.par_moves),
    optimalMoves: Number(lvl.optimal_moves),
    isNewBest,
    hintsUsed: safeHints,
    extraFlasksUsed: safeExtra,
    maxCombo: safeCombo,
    visitorCat,
    newlyUnlockedCats,
    nextLevel,
    dailyStreak
  };
}

/**
 * Resets a level's active bottle shelf and per-run counters.
 * By default keepBest=true preserves earned campaign stars & best_moves.
 */
export async function resetLevelProgress(levelId, { keepBest = true, dayKey = null } = {}) {
  const id = Number(levelId);
  const lvl = await db.queryOne(
    'SELECT id, tier, bottles_json FROM levels WHERE id = ?',
    [id]
  );
  if (!lvl) throw new Error(`Level not found: ${levelId}`);

  await clearLevelUndoHistory(id);

  if (!keepBest) {
    await db.run('DELETE FROM level_progress WHERE level_id = ?', [id]);
    return getLevelById(id, { dayKey });
  }

  const existing = await db.queryOne(
    'SELECT completed_at FROM level_progress WHERE level_id = ?',
    [id]
  );
  const effectiveDayKey = lvl.tier === 'daily' ? dayKey || getTodayKey() : null;
  const nextStatus = existing && existing.completed_at != null && lvl.tier !== 'daily' ? 'completed' : 'not_started';

  await db.run(
    `INSERT INTO level_progress (
       level_id, status, bottles_state_json, moves_count, best_moves,
       extra_flasks_used, hints_used, free_hints_left, max_combo, stars,
       active_day_key, completed_at, updated_at
     ) VALUES (?, ?, ?, 0, NULL, 0, 0, ?, 0, 0, ?, NULL, datetime('now'))
     ON CONFLICT(level_id) DO UPDATE SET
       status = excluded.status,
       bottles_state_json = excluded.bottles_state_json,
       moves_count = 0,
       extra_flasks_used = 0,
       hints_used = 0,
       free_hints_left = ?,
       active_day_key = excluded.active_day_key,
       updated_at = datetime('now')`,
    [id, nextStatus, lvl.bottles_json, DEFAULT_FREE_HINTS, effectiveDayKey, DEFAULT_FREE_HINTS]
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

/**
 * Records usage of a rewarded "+1 Empty Flask" power-up (capped at MAX_EXTRA_FLASKS = 2).
 */
export async function consumeExtraFlask(levelId, { dayKey = null } = {}) {
  const id = Number(levelId);
  await ensureProgressRow(id, dayKey);
  await db.run(
    `UPDATE level_progress
     SET extra_flasks_used = CASE
           WHEN extra_flasks_used < ? THEN extra_flasks_used + 1
           ELSE extra_flasks_used
         END,
         updated_at = datetime('now')
     WHERE level_id = ?`,
    [MAX_EXTRA_FLASKS, id]
  );
  const row = await db.queryOne(
    'SELECT extra_flasks_used FROM level_progress WHERE level_id = ?',
    [id]
  );
  const used = Number(row?.extra_flasks_used || 0);
  return {
    extraFlasksUsed: used,
    remainingExtraFlasks: Math.max(0, MAX_EXTRA_FLASKS - used)
  };
}

// ============================================================================
// 5. Daily Brew Pool & Streak Calculations
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

  let currentStreak = 0;
  let cursor = completedToday ? todayKey : keySet.has(yesterdayKey) ? yesterdayKey : null;
  while (cursor && keySet.has(cursor)) {
    currentStreak++;
    cursor = shiftDayKey(cursor, -1);
  }

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
    `SELECT day_key, level_id, moves_count, hints_used, extra_flasks_used, stars, completed_at
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
          moves_count: Number(completion.moves_count),
          hints_used: Number(completion.hints_used || 0),
          extra_flasks_used: Number(completion.extra_flasks_used || 0),
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
       dc.moves_count,
       dc.hints_used,
       dc.extra_flasks_used,
       dc.stars,
       dc.completed_at,
       l.slug,
       l.title_en,
       l.title_tr,
       l.color_count,
       l.visitor_cat_id
     FROM daily_completions dc
     INNER JOIN levels l ON l.id = dc.level_id
     ORDER BY dc.day_key DESC
     LIMIT ?`,
    [safeLimit]
  );
  return rows.map((r) => ({
    ...r,
    level_id: Number(r.level_id),
    moves_count: Number(r.moves_count),
    hints_used: Number(r.hints_used || 0),
    extra_flasks_used: Number(r.extra_flasks_used || 0),
    stars: Number(r.stars || 3),
    color_count: Number(r.color_count)
  }));
}

// ============================================================================
// 6. On-Device Endless Alchemy Runs (Easy 5 / Medium 7 / Master 9 Colors)
// ============================================================================

function normalizeEndlessDifficulty(difficulty, colorCount) {
  const d = String(difficulty || '').trim().toLowerCase();
  if (d === 'easy' || d === 'medium' || d === 'master') return d;
  const c = Number(colorCount) || 5;
  if (c <= 5) return 'easy';
  if (c <= 7) return 'medium';
  return 'master';
}

export async function recordEndlessRun({
  difficulty = 'easy',
  colorCount = 5,
  movesCount = 1,
  bottlesSealed = null,
  hintsUsed = 0,
  extraFlasksUsed = 0,
  parMoves = null,
  maxCombo = 0,
  countBottlesSealed = true
} = {}) {
  const safeColorCount = Math.min(10, Math.max(3, Math.floor(Number(colorCount) || 5)));
  const normDiff = normalizeEndlessDifficulty(difficulty, safeColorCount);
  const safeMoves = Math.max(1, Math.floor(Number(movesCount) || 1));
  const safeBottles = Math.max(1, Math.floor(Number(bottlesSealed ?? safeColorCount)));
  const safeHints = Math.max(0, Math.floor(Number(hintsUsed) || 0));
  const safeExtra = Math.min(MAX_EXTRA_FLASKS, Math.max(0, Math.floor(Number(extraFlasksUsed) || 0)));
  const safeCombo = Math.max(0, Math.floor(Number(maxCombo) || 0));
  const effectivePar = parMoves != null ? Number(parMoves) : Math.ceil(safeColorCount * 3.6);

  const stars = calculateStars({
    movesCount: safeMoves,
    parMoves: effectivePar,
    hintsUsed: safeHints,
    extraFlasksUsed: safeExtra
  });

  const insertRes = await db.run(
    `INSERT INTO endless_runs (
       difficulty, color_count, moves_count, bottles_sealed, hints_used, extra_flasks_used, stars, completed_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [normDiff, safeColorCount, safeMoves, safeBottles, safeHints, safeExtra, stars]
  );

  if (countBottlesSealed) {
    await incrementBottlesSealed(safeBottles);
  }
  const prevGlobalCombo = Number((await getPref('best_combo', '0')) || 0);
  if (safeCombo > prevGlobalCombo) {
    await setPref('best_combo', String(safeCombo));
  }

  const agg = await db.queryOne(
    `SELECT
       COUNT(id) AS total_for_diff,
       MIN(moves_count) AS best_moves
     FROM endless_runs
     WHERE difficulty = ?`,
    [normDiff]
  );
  const allAgg = await db.queryOne('SELECT COUNT(id) AS total_all FROM endless_runs');

  return {
    id: insertRes.lastInsertRowid,
    isEndless: true,
    isDaily: false,
    difficulty: normDiff,
    colorCount: safeColorCount,
    movesCount: safeMoves,
    bottlesSealed: safeBottles,
    hintsUsed: safeHints,
    extraFlasksUsed: safeExtra,
    maxCombo: safeCombo,
    stars,
    isNewBestMoves: agg?.best_moves != null && Number(agg.best_moves) === safeMoves,
    bestMovesForDifficulty: agg?.best_moves != null ? Number(agg.best_moves) : safeMoves,
    totalForDifficulty: Number(agg?.total_for_diff || 1),
    totalEndlessRuns: Number(allAgg?.total_all || 1),
    nextLevel: null
  };
}

export async function getEndlessRuns({ difficulty = null, limit = 20 } = {}) {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(Number(limit) || 20)));
  const where = [];
  const params = [];
  if (difficulty && ['easy', 'medium', 'master'].includes(String(difficulty).toLowerCase())) {
    where.push('difficulty = ?');
    params.push(String(difficulty).toLowerCase());
  }
  params.push(safeLimit);

  const sql = `
    SELECT id, difficulty, color_count, moves_count, bottles_sealed, hints_used, extra_flasks_used, stars, completed_at
    FROM endless_runs
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY id DESC
    LIMIT ?
  `;
  const rows = await db.query(sql, params);
  return rows.map((r) => ({
    ...r,
    id: Number(r.id),
    color_count: Number(r.color_count),
    moves_count: Number(r.moves_count),
    bottles_sealed: Number(r.bottles_sealed),
    hints_used: Number(r.hints_used || 0),
    extra_flasks_used: Number(r.extra_flasks_used || 0),
    stars: Number(r.stars || 3)
  }));
}

export async function getEndlessStats() {
  const rows = await db.query(`
    SELECT
      difficulty,
      COUNT(id) AS runs_count,
      MIN(moves_count) AS best_moves,
      COALESCE(SUM(bottles_sealed), 0) AS total_bottles_sealed
    FROM endless_runs
    GROUP BY difficulty
  `);

  const byDifficulty = {
    easy: { runs: 0, bestMoves: null, bottlesSealed: 0 },
    medium: { runs: 0, bestMoves: null, bottlesSealed: 0 },
    master: { runs: 0, bestMoves: null, bottlesSealed: 0 }
  };

  let totalRuns = 0;
  let totalBottlesSealed = 0;
  for (const r of rows) {
    const runs = Number(r.runs_count || 0);
    const sealed = Number(r.total_bottles_sealed || 0);
    totalRuns += runs;
    totalBottlesSealed += sealed;
    if (r.difficulty in byDifficulty) {
      byDifficulty[r.difficulty] = {
        runs,
        bestMoves: r.best_moves != null ? Number(r.best_moves) : null,
        bottlesSealed: sealed
      };
    }
  }

  return {
    totalRuns,
    totalBottlesSealed,
    byDifficulty
  };
}

// ============================================================================
// 7. Dashboard & Statistics Bento Aggregations
// ============================================================================

export async function getHomeDashboard(todayKey = getTodayKey()) {
  const [campaign, daily, cats, prefs] = await Promise.all([
    getCampaignSummary(),
    getDailyLevelForDate(todayKey),
    getCatCompanions(),
    getAllPrefs()
  ]);
  const activeCat = cats.find((c) => c.is_active) || cats[0] || null;
  const unlockedCatsCount = cats.filter((c) => c.is_unlocked).length;

  return {
    campaign,
    daily,
    activeCat,
    cats,
    prefs,
    hud: {
      totalStars: campaign.totalStars,
      maxStars: campaign.maxStars,
      solvedCampaignLevels: campaign.completedLevels,
      totalCampaignLevels: campaign.totalLevels,
      unlockedCatsCount,
      totalCatsCount: cats.length,
      currentStreak: daily?.streak?.currentStreak || 0
    }
  };
}

export async function getStatsSummary(todayKey = getTodayKey()) {
  const campaignAgg = await db.queryOne(`
    SELECT
      COUNT(l.id) AS total_campaign,
      SUM(CASE WHEN p.status = 'completed' OR p.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS solved_campaign,
      SUM(CASE WHEN p.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_campaign,
      COALESCE(SUM(CASE WHEN p.stars > 0 THEN p.stars ELSE 0 END), 0) AS total_stars,
      COALESCE(SUM(p.hints_used), 0) AS campaign_hints,
      COALESCE(SUM(p.extra_flasks_used), 0) AS campaign_extra_flasks,
      COALESCE(SUM(CASE WHEN p.status = 'completed' OR p.completed_at IS NOT NULL THEN l.color_count ELSE 0 END), 0) AS campaign_sealed_floor
    FROM levels l
    LEFT JOIN level_progress p ON p.level_id = l.id
    WHERE l.tier != 'daily'
  `);

  const dailyTotals = await db.queryOne(`
    SELECT
      COUNT(dc.day_key) AS solved_daily,
      COALESCE(SUM(dc.hints_used), 0) AS daily_hints,
      COALESCE(SUM(dc.extra_flasks_used), 0) AS daily_extra_flasks,
      COALESCE(SUM(l.color_count), 0) AS daily_sealed_floor
    FROM daily_completions dc
    LEFT JOIN levels l ON l.id = dc.level_id
  `);

  const tierRows = await db.query(`
    SELECT
      l.tier,
      COUNT(l.id) AS total_count,
      SUM(CASE WHEN p.status = 'completed' OR p.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed_count,
      COALESCE(SUM(CASE WHEN p.stars > 0 THEN p.stars ELSE 0 END), 0) AS stars,
      MIN(CASE WHEN p.status = 'completed' OR p.completed_at IS NOT NULL THEN p.best_moves ELSE NULL END) AS best_moves
    FROM levels l
    LEFT JOIN level_progress p ON p.level_id = l.id
    WHERE l.tier != 'daily'
    GROUP BY l.tier
    ORDER BY MIN(l.sort_order) ASC
  `);

  const [streak, endless, cats, prefs] = await Promise.all([
    getDailyStreak(todayKey),
    getEndlessStats(),
    getCatCompanions(),
    getAllPrefs()
  ]);

  const totalCampaignLevels = Number(campaignAgg?.total_campaign || 0);
  const solvedCampaignLevels = Number(campaignAgg?.solved_campaign || 0);
  const solvedDailyCount = Number(dailyTotals?.solved_daily || 0);
  const solvedEndlessCount = endless.totalRuns;

  const floorSealed =
    Number(campaignAgg?.campaign_sealed_floor || 0) +
    Number(dailyTotals?.daily_sealed_floor || 0) +
    endless.totalBottlesSealed;
  const totalBottlesSealed = Math.max(prefs.total_bottles_sealed, floorSealed);

  return {
    solvedCampaignLevels,
    totalCampaignLevels,
    inProgressCampaignLevels: Number(campaignAgg?.in_progress_campaign || 0),
    totalStars: Number(campaignAgg?.total_stars || 0),
    maxStars: totalCampaignLevels * 3,
    solvedDailyCount,
    solvedEndlessCount,
    endlessRecord: solvedEndlessCount,
    endlessByDifficulty: endless.byDifficulty,
    totalSolved: solvedCampaignLevels + solvedDailyCount + solvedEndlessCount,
    totalBottlesSealed,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    completedToday: streak.completedToday,
    unlockedCatsCount: cats.filter((c) => c.is_unlocked).length,
    totalCatsCount: cats.length,
    bestCombo: prefs.best_combo,
    totalHintsUsed: Number(campaignAgg?.campaign_hints || 0) + Number(dailyTotals?.daily_hints || 0),
    totalExtraFlasksUsed:
      Number(campaignAgg?.campaign_extra_flasks || 0) + Number(dailyTotals?.daily_extra_flasks || 0),
    tierBreakdown: tierRows.map((r) => ({
      tier: r.tier,
      total: Number(r.total_count),
      completed: Number(r.completed_count),
      stars: Number(r.stars),
      best_moves: r.best_moves != null ? Number(r.best_moves) : null
    }))
  };
}

// ============================================================================
// 8. Player Preferences, Counters & Full Progress Reset
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
  const toNonNegInt = (k, def) => {
    if (!(k in raw)) return def;
    const n = Number(raw[k]);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
  };
  const toPosInt = (k, def) => {
    if (!(k in raw)) return def;
    const n = Number(raw[k]);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
  };

  return {
    active_cat_id: raw.active_cat_id || DEFAULT_PREFS.active_cat_id,
    music_enabled: toBool('music_enabled', DEFAULT_PREFS.music_enabled),
    sfx_enabled: toBool('sfx_enabled', DEFAULT_PREFS.sfx_enabled),
    haptics_enabled: toBool('haptics_enabled', DEFAULT_PREFS.haptics_enabled),
    cat_talk_enabled: toBool('cat_talk_enabled', DEFAULT_PREFS.cat_talk_enabled),
    colorblind_symbols: toBool('colorblind_symbols', DEFAULT_PREFS.colorblind_symbols),
    simple_ad_counter: toNonNegInt('simple_ad_counter', DEFAULT_PREFS.simple_ad_counter),
    total_bottles_sealed: toNonNegInt('total_bottles_sealed', DEFAULT_PREFS.total_bottles_sealed),
    last_played_level_id: toPosInt('last_played_level_id', DEFAULT_PREFS.last_played_level_id),
    tutorial_seen: toBool('tutorial_seen', DEFAULT_PREFS.tutorial_seen),
    best_combo: toNonNegInt('best_combo', DEFAULT_PREFS.best_combo),
    raw
  };
}

/**
 * Increments persistent total_bottles_sealed counter in SQLite.
 */
export async function incrementBottlesSealed(delta = 1) {
  const safeDelta = Math.max(0, Math.floor(Number(delta) || 0));
  const cur = Number((await getPref('total_bottles_sealed', '0')) || 0);
  const next = Math.max(0, cur) + safeDelta;
  await setPref('total_bottles_sealed', String(next));
  return next;
}

/**
 * Advances the Starter-tier (Levels 1-5) interstitial pacing counter in SQLite.
 * Per SPEC.md: show 1 interstitial every 3 starter completions (counter % 3 === 0).
 */
export async function advanceSimpleAdCounter(everyN = 3) {
  const cadence = Math.max(1, Math.floor(Number(everyN) || 3));
  const cur = Number((await getPref('simple_ad_counter', '0')) || 0);
  const next = Math.max(0, cur) + 1;
  await setPref('simple_ad_counter', String(next));
  return {
    counter: next,
    shouldShowAd: next % cadence === 0
  };
}

/**
 * Resets all gameplay progress (campaign, daily streaks, endless runs, unlocked cat selection)
 * while preserving user audio, haptics, speech bubble & accessibility settings.
 */
export async function resetAllProgress() {
  await db.run('DELETE FROM level_undo_history');
  await db.run('DELETE FROM level_progress');
  await db.run('DELETE FROM daily_completions');
  await db.run('DELETE FROM endless_runs');
  await setPref('active_cat_id', DEFAULT_PREFS.active_cat_id);
  await setPref('total_bottles_sealed', '0');
  await setPref('simple_ad_counter', '0');
  await setPref('best_combo', '0');
  await setPref('last_played_level_id', '1');
}
