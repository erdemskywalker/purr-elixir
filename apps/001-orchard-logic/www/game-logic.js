/* ============================================================================
 * Fruitopia — Pure Puzzle Rules, Auto-X, Conflict & Human-Logic Smart Hint Engine
 * ============================================================================ */

import { CELL_EMPTY, CELL_X, CELL_FRUIT, CELL_AUTO_X } from './data/repository.js';

/**
 * Recomputes CELL_AUTO_X marks cleanly from all currently placed fruits.
 * Never overwrites manual CELL_X or CELL_FRUIT cells.
 */
export function recomputeAutoX(board, regions, gridSize, autoXEnabled) {
  const n = Number(gridSize);
  const next = board.map((cell) => (cell === CELL_AUTO_X ? CELL_EMPTY : cell));
  if (!autoXEnabled) return next;

  const fruits = [];
  for (let i = 0; i < next.length; i++) {
    if (next[i] === CELL_FRUIT) {
      fruits.push({
        r: Math.floor(i / n),
        c: i % n,
        region: regions[i]
      });
    }
  }

  for (const f of fruits) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const idx = r * n + c;
        if (next[idx] !== CELL_EMPTY) continue;
        const sameRow = r === f.r;
        const sameCol = c === f.c;
        const sameReg = regions[idx] === f.region;
        const adjacent = Math.abs(r - f.r) <= 1 && Math.abs(c - f.c) <= 1;
        if (sameRow || sameCol || sameReg || adjacent) {
          next[idx] = CELL_AUTO_X;
        }
      }
    }
  }

  return next;
}

/**
 * Analyzes placed fruits for all 4 Fruitopia rule violations and win status.
 * Priority for human-readable reason: row -> col -> region -> diag.
 */
export function analyzeBoard(board, regions, gridSize) {
  const n = Number(gridSize);
  const fruits = [];

  for (let i = 0; i < board.length; i++) {
    if (board[i] === CELL_FRUIT) {
      fruits.push({
        index: i,
        r: Math.floor(i / n),
        c: i % n,
        region: regions[i]
      });
    }
  }

  const conflictIndices = new Set();
  const reasonSet = new Set();

  for (let i = 0; i < fruits.length; i++) {
    for (let j = i + 1; j < fruits.length; j++) {
      const a = fruits[i];
      const b = fruits[j];
      let matched = false;

      if (a.r === b.r) {
        reasonSet.add('row');
        matched = true;
      }
      if (a.c === b.c) {
        reasonSet.add('col');
        matched = true;
      }
      if (a.region === b.region) {
        reasonSet.add('region');
        matched = true;
      }
      if (Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1) {
        if (a.r !== b.r && a.c !== b.c) {
          reasonSet.add('diag');
        } else if (!matched) {
          reasonSet.add('diag');
        }
        matched = true;
      }

      if (matched) {
        conflictIndices.add(a.index);
        conflictIndices.add(b.index);
      }
    }
  }

  let primaryReason = null;
  if (reasonSet.has('row')) primaryReason = 'row';
  else if (reasonSet.has('col')) primaryReason = 'col';
  else if (reasonSet.has('region')) primaryReason = 'region';
  else if (reasonSet.has('diag')) primaryReason = 'diag';

  // Verify strict win: exactly N fruits, 0 conflicts, every row/col/region covered
  let isSolved = false;
  if (fruits.length === n && conflictIndices.size === 0) {
    const rowSet = new Set(fruits.map((f) => f.r));
    const colSet = new Set(fruits.map((f) => f.c));
    const regSet = new Set(fruits.map((f) => f.region));
    isSolved = rowSet.size === n && colSet.size === n && regSet.size === n;
  }

  // Per-region status map for Live Fruit Harvest Tray (unplaced / found / conflict)
  const regionStatus = new Map();
  for (let reg = 0; reg < n; reg++) {
    regionStatus.set(reg, { placed: false, count: 0, hasConflict: false });
  }
  for (const f of fruits) {
    const st = regionStatus.get(f.region) || { placed: false, count: 0, hasConflict: false };
    st.placed = true;
    st.count += 1;
    if (conflictIndices.has(f.index)) st.hasConflict = true;
    regionStatus.set(f.region, st);
  }

  return {
    fruitCount: fruits.length,
    totalNeeded: n,
    conflictIndices,
    reasons: Array.from(reasonSet),
    primaryReason,
    regionStatus,
    isSolved
  };
}

/**
 * Finds which currently placed fruits are blocking a locked AUTO_X cell,
 * plus the primary rule reason (row / col / region / diag) for clear user feedback.
 */
export function findBlockingFruits(board, regions, gridSize, targetIdx) {
  const n = Number(gridSize);
  const tr = Math.floor(targetIdx / n);
  const tc = targetIdx % n;
  const tReg = regions[targetIdx];
  const blockers = [];
  const reasons = new Set();

  for (let i = 0; i < board.length; i++) {
    if (board[i] !== CELL_FRUIT || i === targetIdx) continue;
    const fr = Math.floor(i / n);
    const fc = i % n;
    let blocks = false;
    if (fr === tr) { reasons.add('row'); blocks = true; }
    if (fc === tc) { reasons.add('col'); blocks = true; }
    if (regions[i] === tReg) { reasons.add('region'); blocks = true; }
    if (Math.abs(fr - tr) <= 1 && Math.abs(fc - tc) <= 1 && fr !== tr && fc !== tc) {
      reasons.add('diag');
      blocks = true;
    }
    if (blocks) blockers.push(i);
  }
  return { blockers, reasons: Array.from(reasons) };
}

/**
 * Single-tap toggle transition (no accidental fruit on single tap of X!):
 *   EMPTY (0)  -> MANUAL_X (1)
 *   MANUAL_X   -> EMPTY (0)
 *   FRUIT (2)  -> EMPTY (0)
 * Note: AUTO_X (3) cells are locked by active fruits and handled before tap mutation.
 */
export function nextSingleTapState(currentValue) {
  if (currentValue === CELL_EMPTY) return CELL_X;
  return CELL_EMPTY;
}

export const nextTapState = nextSingleTapState;

/**
 * Computes a crystal-clear, human-deduction smart hint with visual context cells:
 *   1. Removes any misplaced fruit first (explains clearly without coordinate jargon).
 *   2. Fixes any manual X that is blocking a true solution square and places the fruit.
 *   3. Computes true remaining legal candidates (even if Auto-X is OFF!) and picks the
 *      EASIEST human deduction step in strict priority:
 *        a) Only 1 open square left in a color zone      (reason: 'only_in_region')
 *        b) Only 1 open square left in a row             (reason: 'only_in_row')
 *        c) Only 1 open square left in a column          (reason: 'only_in_col')
 *        d) Color zone locked to 1 row or 1 column       (reason: 'line_lock_row' / 'line_lock_col')
 *        e) Smallest remaining color zone (2-3 squares)  (reason: 'narrow_region')
 *   Returns `contextIndices` (cells of the relevant zone/row/col) so Play highlights WHY!
 */
export function computeSmartHint(board, regions, solution, gridSize) {
  const n = Number(gridSize);
  const total = n * n;

  const regionCells = Array.from({ length: n }, () => []);
  for (let i = 0; i < total; i++) regionCells[regions[i]].push(i);

  const rowCells = (r) => Array.from({ length: n }, (_, c) => r * n + c);
  const colCells = (c) => Array.from({ length: n }, (_, r) => r * n + c);

  // 1. Check for misplaced fruits first (prefer conflicting fruits first!)
  const analysis = analyzeBoard(board, regions, n);
  const wrongFruits = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const idx = r * n + c;
      if (board[idx] === CELL_FRUIT && solution[r] !== c) {
        wrongFruits.push({
          idx,
          r,
          c,
          colorId: regions[idx],
          inConflict: analysis.conflictIndices.has(idx) ? 0 : 1
        });
      }
    }
  }
  if (wrongFruits.length > 0) {
    wrongFruits.sort((a, b) => a.inConflict - b.inConflict || a.idx - b.idx);
    const w = wrongFruits[0];
    return {
      action: 'remove_wrong',
      reason: 'wrong_fruit',
      index: w.idx,
      r: w.r,
      c: w.c,
      colorId: w.colorId,
      contextIndices: regionCells[w.colorId]
    };
  }

  // 2. Check if the player manually put X on a true solution square
  for (let r = 0; r < n; r++) {
    const c = solution[r];
    const idx = r * n + c;
    if (board[idx] === CELL_X) {
      const colorId = regions[idx];
      return {
        action: 'place_fruit',
        reason: 'wrong_x',
        index: idx,
        r,
        c,
        colorId,
        contextIndices: regionCells[colorId]
      };
    }
  }

  // 3. Build true legal open-cell map based on currently placed (all valid!) fruits & manual X
  const legal = new Uint8Array(total).fill(1);
  const placedFruits = [];
  for (let i = 0; i < total; i++) {
    if (board[i] === CELL_FRUIT) {
      placedFruits.push({ r: Math.floor(i / n), c: i % n, reg: regions[i] });
      legal[i] = 0;
    } else if (board[i] === CELL_X) {
      legal[i] = 0;
    }
  }
  for (const f of placedFruits) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const idx = r * n + c;
        if (!legal[idx]) continue;
        if (
          r === f.r ||
          c === f.c ||
          regions[idx] === f.reg ||
          (Math.abs(r - f.r) <= 1 && Math.abs(c - f.c) <= 1)
        ) {
          legal[idx] = 0;
        }
      }
    }
  }

  // Collect all unplaced true solution targets with their real human-deduction metrics
  const targets = [];
  for (let r = 0; r < n; r++) {
    const c = solution[r];
    const idx = r * n + c;
    if (board[idx] === CELL_FRUIT) continue;

    const reg = regions[idx];
    const regOpen = regionCells[reg].filter((i) => legal[i] === 1);
    const rowOpen = rowCells(r).filter((i) => legal[i] === 1);
    const colOpen = colCells(c).filter((i) => legal[i] === 1);

    const sameRowLocked = regOpen.length > 0 && regOpen.every((i) => Math.floor(i / n) === r);
    const sameColLocked = regOpen.length > 0 && regOpen.every((i) => i % n === c);

    let priority = 50 + regOpen.length;
    let reason = 'narrow_region';
    let contextIndices = regionCells[reg];
    let eliminatedIndices = [];

    if (regOpen.length <= 1) {
      priority = 1;
      reason = 'only_in_region';
      contextIndices = regionCells[reg];
    } else if (rowOpen.length <= 1) {
      priority = 2;
      reason = 'only_in_row';
      contextIndices = rowCells(r);
    } else if (colOpen.length <= 1) {
      priority = 3;
      reason = 'only_in_col';
      contextIndices = colCells(c);
    } else if (sameRowLocked && regOpen.length <= 4) {
      priority = 10 + regOpen.length;
      reason = 'line_lock_row';
      contextIndices = regionCells[reg];
      eliminatedIndices = rowCells(r).filter((i) => regions[i] !== reg && legal[i] === 1);
    } else if (sameColLocked && regOpen.length <= 4) {
      priority = 10 + regOpen.length;
      reason = 'line_lock_col';
      contextIndices = regionCells[reg];
      eliminatedIndices = colCells(c).filter((i) => regions[i] !== reg && legal[i] === 1);
    }

    targets.push({
      index: idx,
      r,
      c,
      colorId: reg,
      regOpenCount: regOpen.length,
      priority,
      reason,
      contextIndices,
      eliminatedIndices
    });
  }

  if (targets.length === 0) {
    return { action: 'none' };
  }

  targets.sort((a, b) => a.priority - b.priority || a.regOpenCount - b.regOpenCount || a.r - b.r);
  const pick = targets[0];
  return {
    action: 'place_fruit',
    reason: pick.reason,
    index: pick.index,
    r: pick.r,
    c: pick.c,
    colorId: pick.colorId,
    contextIndices: pick.contextIndices,
    eliminatedIndices: pick.eliminatedIndices
  };
}
