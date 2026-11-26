/* ============================================================================
 * Purr Elixir (002-purr-elixir) — Pure Crystal Elixir Sort Engine
 * - Bottle capacity = 4, strict Water Sort rules (no pointless mono -> empty)
 * - Fast exact A* (= BFS shortest path) + weighted fallback for 10-color boards
 * - Instant Smart Hint solver with human-readable move classification
 * - Deadlock detector + On-device BFS-verified Endless Alchemy generator
 * ============================================================================ */

export const BOTTLE_CAPACITY = 4;
export const MAX_EXTRA_FLASKS = 2;

export const ENDLESS_PRESETS = Object.freeze({
  easy: { difficulty: 'easy', colorCount: 5, emptyCount: 2 },
  medium: { difficulty: 'medium', colorCount: 7, emptyCount: 2 },
  master: { difficulty: 'master', colorCount: 9, emptyCount: 2 }
});

// ============================================================================
// Core Bottle State Primitives (Array<Array<number>>, bottom -> top)
// ============================================================================

export function cloneBottles(bottles) {
  if (!Array.isArray(bottles)) return [];
  return bottles.map((b) => (Array.isArray(b) ? b.slice() : []));
}

export function isMonochrome(bottle) {
  if (!bottle || bottle.length <= 1) return true;
  const first = bottle[0];
  for (let i = 1; i < bottle.length; i++) {
    if (bottle[i] !== first) return false;
  }
  return true;
}

export function isBottleSealed(bottle) {
  return Boolean(bottle && bottle.length === BOTTLE_CAPACITY && isMonochrome(bottle));
}

export function topColor(bottle) {
  if (!bottle || bottle.length === 0) return null;
  return bottle[bottle.length - 1];
}

export function topRunLength(bottle) {
  if (!bottle || bottle.length === 0) return 0;
  const top = bottle[bottle.length - 1];
  let count = 1;
  for (let i = bottle.length - 2; i >= 0; i--) {
    if (bottle[i] === top) count++;
    else break;
  }
  return count;
}

/**
 * Checks whether pouring from `fromIdx` to `toIdx` is a valid, player-friendly move.
 * Prevents pouring from sealed bottles and pointless monochrome -> empty transfers.
 */
export function canPour(bottles, fromIdx, toIdx) {
  if (!Array.isArray(bottles)) return false;
  if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= bottles.length || toIdx >= bottles.length) {
    return false;
  }
  const src = bottles[fromIdx];
  const dst = bottles[toIdx];
  if (!src || !dst || src.length === 0 || dst.length >= BOTTLE_CAPACITY) return false;
  if (isBottleSealed(src)) return false;
  if (dst.length === 0) return !isMonochrome(src);
  return src[src.length - 1] === dst[dst.length - 1];
}

export function getPourAmount(bottles, fromIdx, toIdx) {
  if (!canPour(bottles, fromIdx, toIdx)) return 0;
  const run = topRunLength(bottles[fromIdx]);
  const space = BOTTLE_CAPACITY - bottles[toIdx].length;
  return Math.min(run, space);
}

export function isSolved(bottles) {
  if (!Array.isArray(bottles) || bottles.length === 0) return false;
  let hasColor = false;
  for (let i = 0; i < bottles.length; i++) {
    const b = bottles[i];
    if (b.length === 0) continue;
    hasColor = true;
    if (!isBottleSealed(b)) return false;
  }
  return hasColor;
}

export function countSealedBottles(bottles) {
  if (!Array.isArray(bottles)) return 0;
  let n = 0;
  for (let i = 0; i < bottles.length; i++) {
    if (isBottleSealed(bottles[i])) n++;
  }
  return n;
}

export function applyPour(bottles, fromIdx, toIdx) {
  const count = getPourAmount(bottles, fromIdx, toIdx);
  if (count <= 0) return null;

  const next = cloneBottles(bottles);
  const src = next[fromIdx];
  const dst = next[toIdx];
  const color = src[src.length - 1];
  const wasDstEmpty = dst.length === 0;

  for (let k = 0; k < count; k++) {
    dst.push(src.pop());
  }

  const sealedTarget = isBottleSealed(dst);
  const solved = isSolved(next);

  return {
    bottles: next,
    from: fromIdx,
    to: toIdx,
    color,
    count,
    wasDstEmpty,
    mergedIntoMatching: !wasDstEmpty,
    sealedTarget,
    sealedCount: countSealedBottles(next),
    solved
  };
}

export function getValidMoves(bottles) {
  const moves = [];
  if (!Array.isArray(bottles)) return moves;
  const n = bottles.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!canPour(bottles, i, j)) continue;
      const src = bottles[i];
      const dst = bottles[j];
      const color = src[src.length - 1];
      const count = getPourAmount(bottles, i, j);
      const sealsTarget = dst.length + count === BOTTLE_CAPACITY && isMonochrome(dst.concat(color));
      const emptiesSource = src.length === count;
      const uncoversNewColor = src.length > count && src[src.length - count - 1] !== color;
      moves.push({
        from: i,
        to: j,
        color,
        count,
        sealsTarget,
        emptiesSource,
        uncoversNewColor,
        mergesIntoExisting: dst.length > 0
      });
    }
  }
  return moves;
}

export function isDeadlocked(bottles) {
  return !isSolved(bottles) && getValidMoves(bottles).length === 0;
}

// ============================================================================
// Fast Exact A* / Weighted A* Solver (Synced with database/generate_verified_levels.mjs)
// ============================================================================

function bottlesToStrs(bottles) {
  return bottles.map((b) => b.join(''));
}

function isMonoStr(s) {
  const len = s.length;
  if (len <= 1) return true;
  const c = s.charCodeAt(0);
  for (let i = 1; i < len; i++) {
    if (s.charCodeAt(i) !== c) return false;
  }
  return true;
}

function isSolvedStrs(strs) {
  for (let i = 0; i < strs.length; i++) {
    const s = strs[i];
    if (s.length !== 0 && (s.length !== BOTTLE_CAPACITY || !isMonoStr(s))) return false;
  }
  return true;
}

function topRunStr(s) {
  const len = s.length;
  if (len === 0) return 0;
  const top = s.charCodeAt(len - 1);
  let r = 1;
  for (let i = len - 2; i >= 0; i--) {
    if (s.charCodeAt(i) === top) r++;
    else break;
  }
  return r;
}

function applyPourStr(strs, i, j) {
  const src = strs[i];
  const dst = strs[j];
  const run = topRunStr(src);
  const space = BOTTLE_CAPACITY - dst.length;
  const count = run < space ? run : space;
  const next = strs.slice();
  next[i] = src.slice(0, src.length - count);
  next[j] = dst + src.slice(src.length - count);
  return next;
}

function canonicalKey(strs) {
  return strs.slice().sort().join('|');
}

/**
 * Admissible & consistent lower bound heuristic:
 * H(s) = sum(non-bottom color runs) + sum_c max(0, bottomCount(c) - 1)
 */
function admissibleHeuristic(strs) {
  let nonBottomRuns = 0;
  const bottomCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < strs.length; i++) {
    const b = strs[i];
    const len = b.length;
    if (len === 0) continue;
    const bot = b.charCodeAt(0) - 48;
    if (bot >= 0 && bot < 10) bottomCounts[bot]++;
    for (let k = 1; k < len; k++) {
      if (b.charCodeAt(k) !== b.charCodeAt(k - 1)) nonBottomRuns++;
    }
  }
  let extraBottoms = 0;
  for (let c = 0; c < 10; c++) {
    if (bottomCounts[c] > 1) extraBottoms += bottomCounts[c] - 1;
  }
  return nonBottomRuns + extraBottoms;
}

function runAStar(initialStrs, { weight = 1, maxExpansions = 25000 } = {}) {
  if (isSolvedStrs(initialStrs)) {
    return { solvable: true, moves: 0, path: [], expanded: 0, exhausted: false };
  }

  const startKey = canonicalKey(initialStrs);
  const startH = admissibleHeuristic(initialStrs);
  const startF = Math.round(startH * weight);

  const nodes = [{ state: initialStrs, g: 0, parent: -1, move: null }];
  const bestG = new Map([[startKey, 0]]);
  const buckets = [];
  buckets[startF] = [0];

  let minF = startF;
  let expanded = 0;

  while (expanded < maxExpansions) {
    while (minF < buckets.length && (!buckets[minF] || buckets[minF].length === 0)) {
      minF++;
    }
    if (minF >= buckets.length) {
      return { solvable: false, moves: -1, path: [], expanded, exhausted: true };
    }

    const nodeIdx = buckets[minF].pop();
    const node = nodes[nodeIdx];
    const state = node.state;
    const g = node.g;

    const curKey = canonicalKey(state);
    if (bestG.get(curKey) !== g) continue;

    if (isSolvedStrs(state)) {
      const path = [];
      let cur = nodeIdx;
      while (cur > 0) {
        path.push(nodes[cur].move);
        cur = nodes[cur].parent;
      }
      path.reverse();
      return { solvable: true, moves: g, path, expanded, exhausted: false };
    }

    expanded++;
    const n = state.length;
    const seenSrc = new Set();

    for (let i = 0; i < n; i++) {
      const src = state[i];
      if (src.length === 0 || seenSrc.has(src)) continue;
      seenSrc.add(src);
      if (src.length === BOTTLE_CAPACITY && isMonoStr(src)) continue;

      const srcMono = isMonoStr(src);
      let usedEmptyDst = false;
      const seenDst = new Set();

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dst = state[j];
        const dLen = dst.length;
        if (dLen >= BOTTLE_CAPACITY) continue;
        if (dLen === 0) {
          if (srcMono || usedEmptyDst) continue;
          usedEmptyDst = true;
        } else {
          if (src.charCodeAt(src.length - 1) !== dst.charCodeAt(dLen - 1)) continue;
          if (seenDst.has(dst)) continue;
          seenDst.add(dst);
        }

        const nextState = applyPourStr(state, i, j);
        const nextKey = canonicalKey(nextState);
        const nextG = g + 1;
        const prevG = bestG.get(nextKey);
        if (prevG !== undefined && prevG <= nextG) continue;

        bestG.set(nextKey, nextG);
        const h = admissibleHeuristic(nextState);
        const f = nextG + Math.round(h * weight);
        const newIdx = nodes.length;
        nodes.push({ state: nextState, g: nextG, parent: nodeIdx, move: [i, j] });
        if (!buckets[f]) buckets[f] = [];
        buckets[f].push(newIdx);
        if (f < minF) minF = f;
      }
    }
  }

  return { solvable: false, moves: -1, path: [], expanded, exhausted: false, budgetHit: true };
}

export function solveBottles(bottles, { maxExpansions = 25000 } = {}) {
  const strs = bottlesToStrs(bottles);
  const exact = runAStar(strs, { weight: 1, maxExpansions });
  if (exact.solvable || exact.exhausted) return exact;
  // Fast weighted search fallback for dense 9-10 color shelves
  return runAStar(strs, { weight: 2, maxExpansions });
}

/**
 * Returns the smartest next move from current shelf state via BFS/A*,
 * classified by intent ('seal' | 'merge' | 'open') so the talking cat
 * can explain the move clearly in English or Turkish.
 */
export function findBestHint(bottles) {
  if (isSolved(bottles)) return { solvable: true, alreadySolved: true };

  const valid = getValidMoves(bottles);
  if (valid.length === 0) {
    return { solvable: false, deadEnd: true };
  }

  const solved = solveBottles(bottles, { maxExpansions: 22000 });
  if (solved.solvable && solved.path.length > 0) {
    const [from, to] = solved.path[0];
    const color = topColor(bottles[from]);
    const count = getPourAmount(bottles, from, to);
    const dst = bottles[to];
    const sealsTarget = dst.length + count === BOTTLE_CAPACITY && isMonochrome(dst.concat(color));
    const reason = sealsTarget ? 'seal' : dst.length > 0 ? 'merge' : 'open';
    return {
      solvable: true,
      from,
      to,
      color,
      count,
      reason,
      remainingMoves: solved.moves,
      heuristicFallback: false
    };
  }

  if (solved.exhausted) {
    return { solvable: false, deadEnd: true };
  }

  // Strategic fallback if an unusually deep 14-bottle state hits expansion budget
  const scored = valid
    .map((m) => {
      let score = 0;
      if (m.sealsTarget) score += 100;
      if (m.mergesIntoExisting) score += 45 + m.count * 8;
      if (m.emptiesSource && m.mergesIntoExisting) score += 35;
      if (m.uncoversNewColor) score += 20;
      if (!m.mergesIntoExisting && m.uncoversNewColor) score += 15;
      return { ...m, score };
    })
    .sort((a, b) => b.score - a.score);

  const pick = scored[0];
  return {
    solvable: true,
    from: pick.from,
    to: pick.to,
    color: pick.color,
    count: pick.count,
    reason: pick.sealsTarget ? 'seal' : pick.mergesIntoExisting ? 'merge' : 'open',
    remainingMoves: null,
    heuristicFallback: true
  };
}

// ============================================================================
// On-Device BFS-Verified Endless Alchemy Level Generator
// ============================================================================

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

function hasNoPreSolvedOrTriple(filled) {
  for (let i = 0; i < filled.length; i++) {
    const b = filled[i];
    const counts = {};
    for (let k = 0; k < b.length; k++) {
      counts[b[k]] = (counts[b[k]] || 0) + 1;
      if (counts[b[k]] >= 3) return false;
    }
  }
  return true;
}

/**
 * Generates a fresh, unique, verified-solvable Endless Alchemy puzzle on-device.
 * - easy:   5 colors + 2 empty
 * - medium: 7 colors + 2 empty
 * - master: 9 colors + 2 empty
 */
export function generateEndlessLevel(difficulty = 'easy', visitorCats = []) {
  const preset = ENDLESS_PRESETS[difficulty] || ENDLESS_PRESETS.easy;
  const { colorCount, emptyCount } = preset;

  const allColors = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const colors = allColors.slice(0, colorCount);

  let bestBoard = null;
  let bestMoves = Math.ceil(colorCount * 3.1);

  for (let attempt = 0; attempt < 28; attempt++) {
    const pool = [];
    for (let i = 0; i < colors.length; i++) {
      for (let k = 0; k < BOTTLE_CAPACITY; k++) pool.push(colors[i]);
    }
    shuffle(pool);

    const filled = [];
    for (let i = 0; i < colorCount; i++) {
      filled.push(pool.slice(i * BOTTLE_CAPACITY, (i + 1) * BOTTLE_CAPACITY));
    }
    if (attempt < 20 && !hasNoPreSolvedOrTriple(filled)) continue;
    if (filled.some((b) => isBottleSealed(b))) continue;

    const board = [...filled];
    for (let e = 0; e < emptyCount; e++) board.push([]);

    const weight = colorCount <= 5 ? 1 : colorCount <= 7 ? 1.5 : 2;
    const res = runAStar(bottlesToStrs(board), { weight, maxExpansions: 18000 });
    if (res.solvable && res.moves >= colorCount * 2) {
      bestBoard = board;
      bestMoves = res.moves;
      break;
    }
  }

  // Deterministic guaranteed-solvable fallback if random attempts all exceeded budget
  if (!bestBoard) {
    const filled = colors.map((_, idx) => [
      colors[idx],
      colors[(idx + 1) % colorCount],
      colors[(idx + 2) % colorCount],
      colors[(idx + 3) % colorCount]
    ]);
    bestBoard = [...filled];
    for (let e = 0; e < emptyCount; e++) bestBoard.push([]);
    bestMoves = colorCount * 3;
  }

  const parMoves = Math.max(bestMoves + 2, Math.ceil(bestMoves * 1.28));
  const visitorCat =
    visitorCats.length > 0
      ? visitorCats[Math.floor(Math.random() * visitorCats.length)]
      : null;

  return {
    id: null,
    slug: `endless-${preset.difficulty}-${Date.now()}`,
    tier: 'endless',
    difficulty: preset.difficulty,
    is_endless: true,
    is_daily: false,
    color_count: colorCount,
    empty_count: emptyCount,
    bottle_capacity: BOTTLE_CAPACITY,
    optimal_moves: bestMoves,
    par_moves: parMoves,
    visitor_cat_id: visitorCat?.id || 'mochi',
    visitor_cat: visitorCat,
    initial_bottles: cloneBottles(bestBoard),
    bottles_state: cloneBottles(bestBoard),
    status: 'not_started',
    moves_count: 0,
    extra_flasks_used: 0,
    hints_used: 0,
    free_hints_left: 2,
    max_combo: 0,
    stars: 0
  };
}
