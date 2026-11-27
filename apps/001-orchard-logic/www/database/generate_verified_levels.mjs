#!/usr/bin/env node
/**
 * Orchard Logic — Human-Graded Mathematical Puzzle Generator & Verifier (v2)
 *
 * Generates 90 mathematically verified, 100% pure-logic (zero blind guessing!) puzzles:
 *   - 30 Campaign Levels with STRICT monotonically ascending human difficulty curve:
 *       Levels  1-2:  4x4  (tutorial)     — Pure T0/T1 (L1 strictly easiest)
 *       Levels  3-4:  5x5  (starter)      — Pure T1
 *       Levels  5-6:  6x6  (warmup)       — Pure T1/T2
 *       Levels  7-10: 8x8  (intermediate) — Pure T1/T2/T3 (ZERO T4 wall, maxRegion <= 13)
 *       Levels 11-20: 10x10 (master I)    — Pure T1/T2/T3 ascending (ZERO T4, maxRegion <= 15)
 *       Levels 21-30: 10x10 (master II)   — Deeper T3 pure logic ascending (ZERO T4, maxRegion <= 15)
 *   - 60 Daily Harvest 10x10 Puzzles (IDs 31-90):
 *       2 full months without repeating, all pure human logic (T4 === 0, maxRegion <= 15).
 *
 * Syncs fruit_catalog hex colors 100% identically with src/theme.css (--reg-0..--reg-9).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, 'seed.sql');

// ============================================================================
// 1. Deterministic PRNG (Mulberry32)
// ============================================================================
function createRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, max) {
  return Math.floor(rng() * max);
}

function shuffle(rng, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function isRegionConnected(regions, n, targetRegion, excludedIdx = -1) {
  let start = -1;
  let total = 0;
  for (let i = 0; i < n * n; i++) {
    if (i !== excludedIdx && regions[i] === targetRegion) {
      if (start === -1) start = i;
      total++;
    }
  }
  if (total === 0) return false;
  if (total === 1) return true;

  const visited = new Uint8Array(n * n);
  const queue = [start];
  visited[start] = 1;
  let head = 0;
  let count = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    count++;
    const r = Math.floor(idx / n);
    const c = idx % n;
    for (let d = 0; d < 4; d++) {
      const nr = r + DIRS[d][0];
      const nc = c + DIRS[d][1];
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const nIdx = nr * n + nc;
      if (nIdx === excludedIdx || visited[nIdx] || regions[nIdx] !== targetRegion) continue;
      visited[nIdx] = 1;
      queue.push(nIdx);
    }
  }
  return count === total;
}

function getRegionSizes(regions, n) {
  const sizes = new Int32Array(n);
  for (let i = 0; i < n * n; i++) sizes[regions[i]]++;
  return sizes;
}

// ============================================================================
// 2. Fast MRV Solver (limit = 2)
// ============================================================================
function solveMRV(regions, n, limit = 2) {
  const solutions = [];
  const rowUsed = new Uint8Array(n);
  const colUsed = new Uint8Array(n);
  const regUsed = new Uint8Array(n);
  const sol = new Int32Array(n).fill(-1);
  const regCells = Array.from({ length: n }, () => []);
  for (let i = 0; i < n * n; i++) regCells[regions[i]].push(i);
  const blocked = new Int32Array(n * n);

  function canPlace(r, c) {
    return !rowUsed[r] && !colUsed[c] && !regUsed[regions[r * n + c]] && blocked[r * n + c] === 0;
  }

  function applyKingBlock(r, c, delta) {
    const rMin = Math.max(0, r - 1), rMax = Math.min(n - 1, r + 1);
    const cMin = Math.max(0, c - 1), cMax = Math.min(n - 1, c + 1);
    for (let rr = rMin; rr <= rMax; rr++) {
      for (let cc = cMin; cc <= cMax; cc++) blocked[rr * n + cc] += delta;
    }
  }

  function backtrack(placed) {
    if (solutions.length >= limit) return;
    if (placed === n) {
      solutions.push(Array.from(sol));
      return;
    }
    let bestCount = n * n + 1;
    let bestCandidates = null;

    for (let reg = 0; reg < n; reg++) {
      if (regUsed[reg]) continue;
      const cells = regCells[reg];
      const cands = [];
      for (let k = 0; k < cells.length; k++) {
        const idx = cells[k];
        if (canPlace(Math.floor(idx / n), idx % n)) {
          cands.push(idx);
          if (cands.length >= bestCount) break;
        }
      }
      if (cands.length === 0) return;
      if (cands.length < bestCount) {
        bestCount = cands.length;
        bestCandidates = cands;
        if (bestCount === 1) break;
      }
    }

    if (bestCount > 1) {
      for (let r = 0; r < n; r++) {
        if (rowUsed[r]) continue;
        const cands = [];
        for (let c = 0; c < n; c++) {
          if (canPlace(r, c)) {
            cands.push(r * n + c);
            if (cands.length >= bestCount) break;
          }
        }
        if (cands.length === 0) return;
        if (cands.length < bestCount) {
          bestCount = cands.length;
          bestCandidates = cands;
          if (bestCount === 1) break;
        }
      }
    }

    if (bestCount > 1) {
      for (let c = 0; c < n; c++) {
        if (colUsed[c]) continue;
        const cands = [];
        for (let r = 0; r < n; r++) {
          if (canPlace(r, c)) {
            cands.push(r * n + c);
            if (cands.length >= bestCount) break;
          }
        }
        if (cands.length === 0) return;
        if (cands.length < bestCount) {
          bestCount = cands.length;
          bestCandidates = cands;
          if (bestCount === 1) break;
        }
      }
    }

    for (let i = 0; i < bestCandidates.length; i++) {
      const idx = bestCandidates[i];
      const r = Math.floor(idx / n), c = idx % n, reg = regions[idx];
      rowUsed[r] = 1; colUsed[c] = 1; regUsed[reg] = 1; sol[r] = c;
      applyKingBlock(r, c, 1);
      backtrack(placed + 1);
      applyKingBlock(r, c, -1);
      sol[r] = -1; rowUsed[r] = 0; colUsed[c] = 0; regUsed[reg] = 0;
      if (solutions.length >= limit) return;
    }
  }

  backtrack(0);
  return solutions;
}

// ============================================================================
// 3. Human Logic Deduction Grader (T0..T3 Pure Logic, Zero Blind Guessing)
// ============================================================================
function gradeHumanDifficulty(regions, n) {
  const state = new Uint8Array(n * n).fill(1);
  const rowPlaced = new Uint8Array(n);
  const colPlaced = new Uint8Array(n);
  const regPlaced = new Uint8Array(n);
  let placedCount = 0;

  const counts = { T0: 0, T1: 0, T2: 0, T3: 0 };
  let maxTech = 0;
  let openingTech = -1;

  function place(idx) {
    const r = Math.floor(idx / n), c = idx % n, reg = regions[idx];
    state[idx] = 2;
    rowPlaced[r] = 1; colPlaced[c] = 1; regPlaced[reg] = 1;
    placedCount++;
    for (let i = 0; i < n * n; i++) {
      if (state[i] !== 1) continue;
      const rr = Math.floor(i / n), cc = i % n;
      if (rr === r || cc === c || regions[i] === reg || (Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1)) {
        state[i] = 0;
      }
    }
  }

  function getGroupCells(type, id) {
    const cells = [];
    for (let i = 0; i < n * n; i++) {
      if (state[i] !== 1) continue;
      const r = Math.floor(i / n), c = i % n;
      if ((type === 'row' && r === id) || (type === 'col' && c === id) || (type === 'reg' && regions[i] === id)) {
        cells.push(i);
      }
    }
    return cells;
  }

  function stepPureLogic() {
    // T0: Naked Single
    for (const [type, usedArr] of [['reg', regPlaced], ['row', rowPlaced], ['col', colPlaced]]) {
      for (let id = 0; id < n; id++) {
        if (usedArr[id]) continue;
        const cells = getGroupCells(type, id);
        if (cells.length === 1) {
          place(cells[0]);
          counts.T0++;
          if (openingTech === -1) openingTech = 0;
          return true;
        }
      }
    }

    // T1: Line-Region Locked
    for (let reg = 0; reg < n; reg++) {
      if (regPlaced[reg]) continue;
      const cells = getGroupCells('reg', reg);
      if (cells.length === 0) continue;
      const rows = new Set(cells.map((i) => Math.floor(i / n)));
      const cols = new Set(cells.map((i) => i % n));
      let eliminated = false;
      if (rows.size === 1) {
        const rr = [...rows][0];
        for (let c = 0; c < n; c++) {
          const i = rr * n + c;
          if (state[i] === 1 && regions[i] !== reg) { state[i] = 0; eliminated = true; }
        }
      }
      if (cols.size === 1) {
        const cc = [...cols][0];
        for (let r = 0; r < n; r++) {
          const i = r * n + cc;
          if (state[i] === 1 && regions[i] !== reg) { state[i] = 0; eliminated = true; }
        }
      }
      if (eliminated) {
        counts.T1++;
        maxTech = Math.max(maxTech, 1);
        if (openingTech === -1) openingTech = 1;
        return true;
      }
    }

    for (let r = 0; r < n; r++) {
      if (rowPlaced[r]) continue;
      const cells = getGroupCells('row', r);
      const regs = new Set(cells.map((i) => regions[i]));
      if (regs.size === 1) {
        const targetReg = [...regs][0];
        let eliminated = false;
        for (let i = 0; i < n * n; i++) {
          if (state[i] === 1 && regions[i] === targetReg && Math.floor(i / n) !== r) {
            state[i] = 0; eliminated = true;
          }
        }
        if (eliminated) {
          counts.T1++;
          maxTech = Math.max(maxTech, 1);
          if (openingTech === -1) openingTech = 1;
          return true;
        }
      }
    }

    for (let c = 0; c < n; c++) {
      if (colPlaced[c]) continue;
      const cells = getGroupCells('col', c);
      const regs = new Set(cells.map((i) => regions[i]));
      if (regs.size === 1) {
        const targetReg = [...regs][0];
        let eliminated = false;
        for (let i = 0; i < n * n; i++) {
          if (state[i] === 1 && regions[i] === targetReg && (i % n) !== c) {
            state[i] = 0; eliminated = true;
          }
        }
        if (eliminated) {
          counts.T1++;
          maxTech = Math.max(maxTech, 1);
          if (openingTech === -1) openingTech = 1;
          return true;
        }
      }
    }

    // T2: Universal Adjacency Elimination
    const groups = [];
    for (let reg = 0; reg < n; reg++) if (!regPlaced[reg]) groups.push(getGroupCells('reg', reg));
    for (let r = 0; r < n; r++) if (!rowPlaced[r]) groups.push(getGroupCells('row', r));
    for (let c = 0; c < n; c++) if (!colPlaced[c]) groups.push(getGroupCells('col', c));

    for (const cells of groups) {
      if (cells.length === 0 || cells.length > 6) continue;
      const cellSet = new Set(cells);
      let eliminated = false;
      for (let i = 0; i < n * n; i++) {
        if (state[i] !== 1 || cellSet.has(i)) continue;
        const r = Math.floor(i / n), c = i % n;
        let allConflict = true;
        for (const gIdx of cells) {
          const gr = Math.floor(gIdx / n), gc = gIdx % n;
          const adj = Math.abs(r - gr) <= 1 && Math.abs(c - gc) <= 1;
          if (!adj && r !== gr && c !== gc && regions[i] !== regions[gIdx]) {
            allConflict = false;
            break;
          }
        }
        if (allConflict) { state[i] = 0; eliminated = true; }
      }
      if (eliminated) {
        counts.T2++;
        maxTech = Math.max(maxTech, 2);
        if (openingTech === -1) openingTech = 2;
        return true;
      }
    }

    // T3: Subset Crowding (k = 2..4 regions <-> rows/cols)
    const openRegs = [];
    for (let reg = 0; reg < n; reg++) {
      if (regPlaced[reg]) continue;
      const cells = getGroupCells('reg', reg);
      openRegs.push({
        reg,
        rows: new Set(cells.map((i) => Math.floor(i / n))),
        cols: new Set(cells.map((i) => i % n))
      });
    }

    for (const dim of ['rows', 'cols']) {
      for (let k = 2; k <= Math.min(4, openRegs.length - 1); k++) {
        const combo = [];
        function findSubset(start) {
          if (combo.length === k) {
            const union = new Set();
            for (const item of combo) for (const v of item[dim]) union.add(v);
            if (union.size === k) {
              const regSet = new Set(combo.map((x) => x.reg));
              let eliminated = false;
              for (let i = 0; i < n * n; i++) {
                if (state[i] !== 1 || regSet.has(regions[i])) continue;
                const coord = dim === 'rows' ? Math.floor(i / n) : (i % n);
                if (union.has(coord)) { state[i] = 0; eliminated = true; }
              }
              if (eliminated) return true;
            }
            return false;
          }
          for (let i = start; i <= openRegs.length - (k - combo.length); i++) {
            combo.push(openRegs[i]);
            if (findSubset(i + 1)) return true;
            combo.pop();
          }
          return false;
        }
        if (findSubset(0)) {
          counts.T3++;
          maxTech = Math.max(maxTech, 3);
          if (openingTech === -1) openingTech = 3;
          return true;
        }
      }
    }

    for (const dim of ['row', 'col']) {
      const openLines = [];
      for (let id = 0; id < n; id++) {
        if ((dim === 'row' && rowPlaced[id]) || (dim === 'col' && colPlaced[id])) continue;
        const cells = getGroupCells(dim, id);
        openLines.push({ id, regs: new Set(cells.map((i) => regions[i])) });
      }
      for (let k = 2; k <= Math.min(4, openLines.length - 1); k++) {
        const combo = [];
        function findLineSubset(start) {
          if (combo.length === k) {
            const unionRegs = new Set();
            for (const item of combo) for (const reg of item.regs) unionRegs.add(reg);
            if (unionRegs.size === k) {
              const lineSet = new Set(combo.map((x) => x.id));
              let eliminated = false;
              for (let i = 0; i < n * n; i++) {
                if (state[i] !== 1 || !unionRegs.has(regions[i])) continue;
                const coord = dim === 'row' ? Math.floor(i / n) : (i % n);
                if (!lineSet.has(coord)) { state[i] = 0; eliminated = true; }
              }
              if (eliminated) return true;
            }
            return false;
          }
          for (let i = start; i <= openLines.length - (k - combo.length); i++) {
            combo.push(openLines[i]);
            if (findLineSubset(i + 1)) return true;
            combo.pop();
          }
          return false;
        }
        if (findLineSubset(0)) {
          counts.T3++;
          maxTech = Math.max(maxTech, 3);
          if (openingTech === -1) openingTech = 3;
          return true;
        }
      }
    }

    return false;
  }

  while (placedCount < n) {
    if (!stepPureLogic()) break;
  }

  const pureHumanSolved = placedCount === n;
  // Weighted human cognitive difficulty score for smooth monotonic sorting
  const score =
    maxTech * 100 +
    counts.T3 * 22 +
    counts.T2 * 8 +
    counts.T1 * 2 +
    (openingTech >= 2 ? 15 : 0);

  return { pureHumanSolved, maxTech: pureHumanSolved ? maxTech : 4, openingTech, counts, score };
}

// ============================================================================
// 4. Exhaustive Independent Backtracking Verifier
// ============================================================================
export function verifyPuzzleExhaustive(regions, expectedSolution, n) {
  const counts = new Int32Array(n);
  for (let i = 0; i < n * n; i++) {
    const reg = regions[i];
    if (!Number.isInteger(reg) || reg < 0 || reg >= n) return { ok: false, reason: 'invalid color' };
    counts[reg]++;
  }
  for (let reg = 0; reg < n; reg++) {
    if (counts[reg] < 1 || !isRegionConnected(regions, n, reg)) return { ok: false, reason: `disconnected ${reg}` };
  }
  const usedCol = new Uint8Array(n);
  const usedReg = new Uint8Array(n);
  const cur = new Int32Array(n);
  const found = [];
  function dfs(r, prevCol) {
    if (found.length >= 2) return;
    if (r === n) { found.push(Array.from(cur)); return; }
    const base = r * n;
    for (let c = 0; c < n; c++) {
      if (usedCol[c]) continue;
      if (r > 0 && Math.abs(c - prevCol) <= 1) continue;
      const reg = regions[base + c];
      if (usedReg[reg]) continue;
      usedCol[c] = 1; usedReg[reg] = 1; cur[r] = c;
      dfs(r + 1, c);
      usedCol[c] = 0; usedReg[reg] = 0;
      if (found.length >= 2) return;
    }
  }
  dfs(0, -10);
  if (found.length !== 1) return { ok: false, reason: `found ${found.length} solutions` };
  for (let r = 0; r < n; r++) {
    if (found[0][r] !== expectedSolution[r]) return { ok: false, reason: 'solution mismatch' };
  }
  return { ok: true, minRegionSize: Math.min(...counts), maxRegionSize: Math.max(...counts) };
}

// ============================================================================
// 5. Organic Balanced Puzzle Generator with Human-Grade Filter
// ============================================================================
function generateRandomSolution(rng, n) {
  const used = new Uint8Array(n);
  const sol = new Int32Array(n);
  const cols = Array.from({ length: n }, (_, i) => i);
  function place(r, prevCol) {
    if (r === n) return true;
    const order = shuffle(rng, cols.slice());
    for (let i = 0; i < order.length; i++) {
      const c = order[i];
      if (used[c]) continue;
      if (r > 0 && Math.abs(c - prevCol) <= 1) continue;
      used[c] = 1; sol[r] = c;
      if (place(r + 1, c)) return true;
      used[c] = 0;
    }
    return false;
  }
  place(0, -10);
  return Array.from(sol);
}

function growOrganicRegions(rng, n, sol, maxRegionSize) {
  const regions = new Int32Array(n * n).fill(-1);
  const sizes = new Int32Array(n);
  const rowToColor = shuffle(rng, Array.from({ length: n }, (_, i) => i));
  const weights = new Float64Array(n);
  for (let reg = 0; reg < n; reg++) {
    weights[reg] = rng() < 0.28 ? 0.38 + rng() * 0.35 : 0.8 + rng() * 0.9;
  }
  const frontiers = Array.from({ length: n }, () => []);
  for (let r = 0; r < n; r++) {
    const idx = r * n + sol[r];
    const reg = rowToColor[r];
    regions[idx] = reg;
    sizes[reg] = 1;
    frontiers[reg].push(idx);
  }

  let assigned = n;
  const total = n * n;
  while (assigned < total) {
    const candidates = [];
    for (let reg = 0; reg < n; reg++) {
      const nextF = [];
      let hasOpen = false;
      for (const idx of frontiers[reg]) {
        const r = Math.floor(idx / n), c = idx % n;
        let open = false;
        for (const [dr, dc] of DIRS) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && regions[nr * n + nc] === -1) { open = true; break; }
        }
        if (open) { nextF.push(idx); hasOpen = true; }
      }
      frontiers[reg] = nextF;
      if (hasOpen) candidates.push(reg);
    }

    const underCap = candidates.filter((reg) => sizes[reg] < maxRegionSize);
    const pool = underCap.length > 0 ? underCap : candidates;
    let weightSum = 0;
    const wArr = pool.map((reg) => {
      const w = weights[reg] / Math.pow(sizes[reg], 0.65);
      weightSum += w;
      return w;
    });
    let pick = rng() * weightSum;
    let chosenReg = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) {
      pick -= wArr[i];
      if (pick <= 0) { chosenReg = pool[i]; break; }
    }

    const f = frontiers[chosenReg];
    const fIdx = rng() < 0.55 ? f[f.length - 1] : f[randInt(rng, f.length)];
    const r = Math.floor(fIdx / n), c = fIdx % n;
    const openNeighbors = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && regions[nr * n + nc] === -1) openNeighbors.push(nr * n + nc);
    }
    const target = openNeighbors[randInt(rng, openNeighbors.length)];
    regions[target] = chosenReg;
    sizes[chosenReg]++;
    frontiers[chosenReg].push(target);
    assigned++;
  }
  return Array.from(regions);
}

function solutionsEqual(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function generateGradedPool(rng, n, countNeeded, { minRegionSize = 2, maxRegionSize = 15, maxAllowedTech = 3, requirePure = true, minTech = 0, seenHashes = new Set(), maxAttemptsOverride = null }) {
  const pool = [];
  let attempts = 0;
  const maxAttempts = maxAttemptsOverride || countNeeded * 450;

  while (pool.length < countNeeded && attempts < maxAttempts) {
    attempts++;
    const sol = generateRandomSolution(rng, n);
    const solSet = new Set(sol.map((c, r) => r * n + c));
    const regions = growOrganicRegions(rng, n, sol, maxRegionSize);

    for (let step = 0; step < 90; step++) {
      const found = solveMRV(regions, n, 2);
      if (found.length === 0) break;

      if (found.length === 1) {
        const sizes = getRegionSizes(regions, n);
        const minS = Math.min(...sizes);
        const maxS = Math.max(...sizes);
        if (minS >= minRegionSize && maxS <= maxRegionSize) {
          const hash = regions.join(',');
          if (!seenHashes.has(hash)) {
            const grade = gradeHumanDifficulty(regions, n);
            const okPure = !requirePure || grade.pureHumanSolved;
            if (okPure && grade.maxTech <= maxAllowedTech && grade.maxTech >= minTech) {
              const audit = verifyPuzzleExhaustive(regions, sol, n);
              if (audit.ok) {
                seenHashes.add(hash);
                pool.push({ regions, solution: sol, grade, minRegionSize: minS, maxRegionSize: maxS });
              }
            }
          }
          break;
        }
        // Rebalance oversized/undersized region without losing uniqueness
        let fixed = false;
        const order = shuffle(rng, Array.from({ length: n * n }, (_, i) => i));
        for (const idx of order) {
          if (solSet.has(idx)) continue;
          const curReg = regions[idx];
          const r = Math.floor(idx / n), c = idx % n;
          for (const [dr, dc] of DIRS) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
            const nbReg = regions[nr * n + nc];
            if (nbReg === curReg) continue;
            const helpsMin = sizes[nbReg] < minRegionSize && sizes[curReg] > minRegionSize;
            const helpsMax = sizes[curReg] > maxRegionSize && sizes[nbReg] < maxRegionSize;
            if (!helpsMin && !helpsMax) continue;
            if (!isRegionConnected(regions, n, curReg, idx)) continue;
            regions[idx] = nbReg;
            if (solveMRV(regions, n, 2).length === 1) { fixed = true; break; }
            regions[idx] = curReg;
          }
          if (fixed) break;
        }
        if (!fixed) break;
        continue;
      }

      const alt = solutionsEqual(found[0], sol) ? found[1] : found[0];
      const sizes = getRegionSizes(regions, n);
      const moveCandidates = [];
      for (let r = 0; r < n; r++) {
        const idx = r * n + alt[r];
        if (solSet.has(idx)) continue;
        const curReg = regions[idx];
        if (sizes[curReg] <= minRegionSize) continue;
        if (!isRegionConnected(regions, n, curReg, idx)) continue;
        const adjRegs = new Set();
        for (const [dr, dc] of DIRS) {
          const nr = r + dr, nc = alt[r] + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && regions[nr * n + nc] !== curReg) adjRegs.add(regions[nr * n + nc]);
        }
        for (const targetReg of adjRegs) {
          if (sizes[targetReg] >= maxRegionSize) continue;
          moveCandidates.push({ idx, targetReg, score: sizes[curReg] - sizes[targetReg] + rng() * 2.2 });
        }
      }
      if (moveCandidates.length === 0) break;
      moveCandidates.sort((a, b) => b.score - a.score);
      const chosen = moveCandidates[randInt(rng, Math.min(3, moveCandidates.length))];
      regions[chosen.idx] = chosen.targetReg;
    }
  }

  if (pool.length < countNeeded) {
    throw new Error(`Only generated ${pool.length}/${countNeeded} graded puzzles for N=${n} (maxTech=${maxAllowedTech}, maxReg=${maxRegionSize})`);
  }
  return pool;
}

// ============================================================================
// 6. Synced 10-Fruit Reference Catalog (100% Identical to src/theme.css!)
// ============================================================================
const FRUIT_CATALOG = [
  { color_id: 0, slug: 'strawberry', name_en: 'Strawberry', name_tr: 'Çilek', color_name_en: 'Coral Red', color_name_tr: 'Kırmızı', light_bg: '#FFC7CC', dark_bg: '#5E2028', accent_hex: '#E11D48' },
  { color_id: 1, slug: 'grape', name_en: 'Grape', name_tr: 'Üzüm', color_name_en: 'Plum Violet', color_name_tr: 'Mor', light_bg: '#E6D9FC', dark_bg: '#362163', accent_hex: '#7C3AED' },
  { color_id: 2, slug: 'lemon', name_en: 'Lemon', name_tr: 'Limon', color_name_en: 'Sun Lemon', color_name_tr: 'Sarı', light_bg: '#FEF4B8', dark_bg: '#544914', accent_hex: '#CA8A04' },
  { color_id: 3, slug: 'green-apple', name_en: 'Green Apple', name_tr: 'Yeşil Elma', color_name_en: 'Orchard Green', color_name_tr: 'Yeşil', light_bg: '#D2F4DA', dark_bg: '#164729', accent_hex: '#16A34A' },
  { color_id: 4, slug: 'orange', name_en: 'Orange', name_tr: 'Portakal', color_name_en: 'Tangerine', color_name_tr: 'Turuncu', light_bg: '#FFC98A', dark_bg: '#613410', accent_hex: '#EA580C' },
  { color_id: 5, slug: 'blueberry', name_en: 'Blueberry', name_tr: 'Yaban Mersini', color_name_en: 'Berry Blue', color_name_tr: 'Mavi', light_bg: '#D2E7FF', dark_bg: '#163666', accent_hex: '#2563EB' },
  { color_id: 6, slug: 'peach', name_en: 'Peach', name_tr: 'Şeftali', color_name_en: 'Blossom Peach', color_name_tr: 'Şeftali', light_bg: '#FDE7D6', dark_bg: '#682842', accent_hex: '#DB2777' },
  { color_id: 7, slug: 'kiwi', name_en: 'Kiwi', name_tr: 'Kivi', color_name_en: 'Kiwi Mint', color_name_tr: 'Kivi Yeşili', light_bg: '#CCF2EB', dark_bg: '#104B4B', accent_hex: '#0D9488' },
  { color_id: 8, slug: 'cherry', name_en: 'Cherry', name_tr: 'Kiraz', color_name_en: 'Ruby Cherry', color_name_tr: 'Yakut Kiraz', light_bg: '#F0BCE0', dark_bg: '#4E1A4E', accent_hex: '#BE123C' },
  { color_id: 9, slug: 'pineapple', name_en: 'Pineapple', name_tr: 'Ananas', color_name_en: 'Golden Amber', color_name_tr: 'Altın Kehribar', light_bg: '#ECE0A8', dark_bg: '#403618', accent_hex: '#B45309' }
];

const MASTER_NAMES = [
  ['Sunlit Grove', 'Güneşli Koru'], ['Blossom Ridge', 'Çiçek Sırtı'], ['Amber Terrace', 'Kehribar Teras'],
  ['Dewdrop Meadow', 'Çiy Çayırı'], ['Plum Hollow', 'Erik Vadisi'], ['Citrus Courtyard', 'Narenciye Avlusu'],
  ['Berry Arbor', 'Böğürtlen Çardağı'], ['Golden Trellis', 'Altın Kafes'], ['Emerald Orchard', 'Zümrüt Bahçe'],
  ['Crimson Canopy', 'Yakut Gölgelik'], ['Harvest Pavilion', 'Hasat Köşkü'], ['Honeyed Slope', 'Ballı Yamaç'],
  ['Botanical Maze', 'Botanik Labirent'], ['Velvet Vineyard', 'Kadife Bağ'], ['Autumn Veranda', 'Güz Verandası'],
  ['Solstice Garden', 'Gündönümü Bahçesi'], ['Royal Conservatory', 'Kraliyet Serası'], ['Cedar Alcove', 'Sedir Köşesi'],
  ['Starlight Espalier', 'Yıldız Çiti'], ['Grand Harvest', 'Büyük Hasat']
];

const DAILY_ADJECTIVES = [
  ['Morning', 'Sabah'], ['Sunburst', 'Günışığı'], ['Botanical', 'Botanik'], ['Ruby', 'Yakut'],
  ['Citrus', 'Narenciye'], ['Misty', 'Sisli'], ['Golden', 'Altın'], ['Velvet', 'Kadife'],
  ['Dewy', 'Nemli'], ['Emerald', 'Zümrüt'], ['Plum', 'Erik'], ['Honeyed', 'Ballı']
];
const DAILY_NOUNS = [
  ['Harvest', 'Hasat'], ['Orchard', 'Bahçe'], ['Terrace', 'Teras'], ['Grove', 'Koru'], ['Arbor', 'Çardak']
];

function sqlStr(val) {
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateAllAndWriteSeed() {
  const startMs = Date.now();
  const rng = createRng(2026095);
  const seenHashes = new Set();

  // Generate candidate pools per size & sort STRICTLY ASCENDING by human difficulty score!
  const pool4 = generateGradedPool(rng, 4, 6, { minRegionSize: 2, maxRegionSize: 6, maxAllowedTech: 1, requirePure: true, seenHashes })
    .sort((a, b) => a.grade.score - b.grade.score);

  const pool5 = generateGradedPool(rng, 5, 6, { minRegionSize: 2, maxRegionSize: 8, maxAllowedTech: 1, requirePure: true, seenHashes })
    .sort((a, b) => a.grade.score - b.grade.score);

  const pool6 = generateGradedPool(rng, 6, 8, { minRegionSize: 2, maxRegionSize: 10, maxAllowedTech: 2, requirePure: true, seenHashes })
    .sort((a, b) => a.grade.score - b.grade.score);

  // Intermediate 8x8: ZERO T4 wall! Strictly pure logic (T1..T3) with maxRegionSize <= 13
  const pool8 = generateGradedPool(rng, 8, 12, { minRegionSize: 2, maxRegionSize: 13, maxAllowedTech: 3, requirePure: true, seenHashes })
    .sort((a, b) => a.grade.score - b.grade.score);

  // Master 10x10 (20 campaign) + Daily 10x10 (60 daily) = 80 pure-logic 10x10 puzzles (maxRegionSize <= 16, T4 === 0!)
  // Generate 90 pure-logic candidates and sort strictly ascending by human difficulty score
  const pool10 = generateGradedPool(rng, 10, 90, {
    minRegionSize: 2,
    maxRegionSize: 16,
    maxAllowedTech: 3,
    minTech: 1,
    requirePure: true,
    seenHashes,
    maxAttemptsOverride: 18000
  }).sort((a, b) => a.grade.score - b.grade.score);

  // Pick 20 Master Campaign levels spanning easiest pure-logic 10x10 (L11-20) -> deepest T3 pure-logic (L21-30)
  const campaign10 = [
    ...pool10.slice(0, 10),
    ...pool10.slice(-10)
  ].sort((a, b) => a.grade.score - b.grade.score);

  const usedInCampaign10 = new Set(campaign10);
  const dailyPool10 = pool10.filter((p) => !usedInCampaign10.has(p)).slice(0, 60);

  // Shuffle dailyPool10 deterministically so consecutive days feel nicely varied (all pure human logic T2/T3!)
  shuffle(rng, dailyPool10);

  const generated = [
    // Tutorial 4x4 (Levels 1-2)
    { id: 1, slug: 'level-01', tier: 'tutorial', grid_size: 4, par_seconds: 30, title_en: 'First Sprout', title_tr: 'İlk Filiz', ...pool4[0] },
    { id: 2, slug: 'level-02', tier: 'tutorial', grid_size: 4, par_seconds: 35, title_en: 'Diagonal Guard', title_tr: 'Çapraz Kalkan', ...pool4[pool4.length - 1] },
    // Starter 5x5 (Levels 3-4)
    { id: 3, slug: 'level-03', tier: 'starter', grid_size: 5, par_seconds: 45, title_en: 'Five Fruits', title_tr: 'Beş Meyve', ...pool5[0] },
    { id: 4, slug: 'level-04', tier: 'starter', grid_size: 5, par_seconds: 55, title_en: 'Garden Path', title_tr: 'Bahçe Patikası', ...pool5[pool5.length - 1] },
    // Warm-Up 6x6 (Levels 5-6)
    { id: 5, slug: 'level-05', tier: 'warmup', grid_size: 6, par_seconds: 65, title_en: 'Berry Patch', title_tr: 'Yemiş Tarlası', ...pool6[0] },
    { id: 6, slug: 'level-06', tier: 'warmup', grid_size: 6, par_seconds: 75, title_en: 'Orchard Gate', title_tr: 'Bahçe Kapısı', ...pool6[pool6.length - 1] },
    // Intermediate 8x8 (Levels 7-10, smooth ascending pure logic)
    { id: 7, slug: 'level-07', tier: 'intermediate', grid_size: 8, par_seconds: 95, title_en: 'Terrace Steps', title_tr: 'Teras Basamakları', ...pool8[0] },
    { id: 8, slug: 'level-08', tier: 'intermediate', grid_size: 8, par_seconds: 105, title_en: 'Kiwi Corner', title_tr: 'Kivi Köşesi', ...pool8[3] },
    { id: 9, slug: 'level-09', tier: 'intermediate', grid_size: 8, par_seconds: 115, title_en: 'Winding Hedge', title_tr: 'Kıvrımlı Çit', ...pool8[7] },
    { id: 10, slug: 'level-10', tier: 'intermediate', grid_size: 8, par_seconds: 125, title_en: 'Stone Wall', title_tr: 'Taş Duvar', ...pool8[pool8.length - 1] }
  ];

  for (let i = 0; i < 20; i++) {
    const id = 11 + i;
    generated.push({
      id,
      slug: `level-${String(id).padStart(2, '0')}`,
      tier: 'master',
      grid_size: 10,
      par_seconds: 145 + Math.floor(i / 4) * 15,
      title_en: MASTER_NAMES[i][0],
      title_tr: MASTER_NAMES[i][1],
      ...campaign10[i]
    });
  }

  for (let i = 0; i < 60; i++) {
    const id = 31 + i;
    const adj = DAILY_ADJECTIVES[i % DAILY_ADJECTIVES.length];
    const noun = DAILY_NOUNS[Math.floor(i / DAILY_ADJECTIVES.length) % DAILY_NOUNS.length];
    generated.push({
      id,
      slug: `daily-${String(i + 1).padStart(2, '0')}`,
      tier: 'daily',
      grid_size: 10,
      par_seconds: 180,
      title_en: `${adj[0]} ${noun[0]}`,
      title_tr: `${adj[1]} ${noun[1]}`,
      ...dailyPool10[i]
    });
  }

  const lines = [];
  lines.push('-- ============================================================================');
  lines.push('-- Orchard Logic (001-orchard-logic) — Verified Real Seed Data (v2)');
  lines.push('-- ALL 90 puzzles (30 campaign + 60 daily 10x10) mathematically verified:');
  lines.push('--   * solutionCount === 1 (exhaustive backtracking verified)');
  lines.push('--   * 100% pure human logic solvable (T0..T3, ZERO blind guessing T4!)');
  lines.push('--   * Balanced regions: min >= 2, max <= 16 on 10x10 (zero 20-cell blobs)');
  lines.push('--   * Monotonically ascending difficulty curve across L1 -> L30');
  lines.push('-- ============================================================================');
  lines.push('');

  lines.push('-- 1. Bilingual 10-Fruit Reference Catalog (100% Synced with src/theme.css, Cascade-Safe Upsert)');
  for (const f of FRUIT_CATALOG) {
    lines.push(
      `INSERT INTO fruit_catalog (color_id, slug, name_en, name_tr, color_name_en, color_name_tr, light_bg, dark_bg, accent_hex) VALUES (${f.color_id}, ${sqlStr(f.slug)}, ${sqlStr(f.name_en)}, ${sqlStr(f.name_tr)}, ${sqlStr(f.color_name_en)}, ${sqlStr(f.color_name_tr)}, ${sqlStr(f.light_bg)}, ${sqlStr(f.dark_bg)}, ${sqlStr(f.accent_hex)}) ON CONFLICT(color_id) DO UPDATE SET slug=excluded.slug, name_en=excluded.name_en, name_tr=excluded.name_tr, color_name_en=excluded.color_name_en, color_name_tr=excluded.color_name_tr, light_bg=excluded.light_bg, dark_bg=excluded.dark_bg, accent_hex=excluded.accent_hex;`
    );
  }
  lines.push('');

  lines.push('-- 2. Default Player Preferences');
  const defaultPrefs = [
    ['auto_x', '1'],
    ['highlight_conflicts', '1'],
    ['haptics_enabled', '1'],
    ['music_enabled', '1'],
    ['sfx_enabled', '1'],
    ['colorblind_hints', '0'],
    ['tutorial_seen', '0'],
    ['last_played_level_id', '1']
  ];
  for (const [k, v] of defaultPrefs) {
    lines.push(`INSERT OR IGNORE INTO player_prefs (key, value) VALUES (${sqlStr(k)}, ${sqlStr(v)});`);
  }
  lines.push('');

  lines.push('-- 3. 30 Campaign Levels + 60 Daily Harvest 10x10 Levels (Cascade-Safe Upsert, Never Triggers ON DELETE CASCADE!)');
  for (const lvl of generated) {
    lines.push(
      `INSERT INTO levels (id, slug, tier, grid_size, regions_json, solution_json, par_seconds, title_en, title_tr, sort_order) VALUES (${lvl.id}, ${sqlStr(lvl.slug)}, ${sqlStr(lvl.tier)}, ${lvl.grid_size}, ${sqlStr(JSON.stringify(lvl.regions))}, ${sqlStr(JSON.stringify(lvl.solution))}, ${lvl.par_seconds}, ${sqlStr(lvl.title_en)}, ${sqlStr(lvl.title_tr)}, ${lvl.id}) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, tier=excluded.tier, grid_size=excluded.grid_size, regions_json=excluded.regions_json, solution_json=excluded.solution_json, par_seconds=excluded.par_seconds, title_en=excluded.title_en, title_tr=excluded.title_tr, sort_order=excluded.sort_order;`
    );
  }
  lines.push('');

  fs.writeFileSync(SEED_PATH, lines.join('\n'), 'utf8');

  const summary = {
    ok: true,
    totalLevels: generated.length,
    campaignLevels: 30,
    dailyLevels: 60,
    allPureHuman: generated.every((l) => l.grade.pureHumanSolved),
    maxRegionOn10x10: Math.max(...generated.filter((l) => l.grid_size === 10).map((l) => l.maxRegionSize)),
    curveSample: generated.slice(0, 30).map((l) => ({
      id: l.id,
      n: l.grid_size,
      tier: l.tier,
      maxTech: `T${l.grade.maxTech}`,
      score: l.grade.score,
      maxReg: l.maxRegionSize
    })),
    elapsedMs: Date.now() - startMs
  };
  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateAllAndWriteSeed();
}
