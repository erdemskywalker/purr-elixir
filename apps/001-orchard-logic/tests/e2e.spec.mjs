/* ============================================================================
 * Orchard Logic (001-orchard-logic) — Comprehensive Playwright E2E Suite (v2)
 * Verifies Real WASM SQLite CRUD, Zero Home Solution Spoiler, Single-Tap X vs
 * Double-Tap Fruit, Locked AUTO_X (0 Ghost Undo / 0 Unfair Mistake), Drag-to-
 * Mark/Erase X, Idle Timer SQLite Persistence, Multi-Rule Conflict Highlights,
 * Dynamic Verified 4x4 & Daily 10x10 Solve, Ad-Free Victory Sheet + Share +
 * Solved Action Bar, On-Device Endless Mode, Exact 1:1 Square Board on SE,
 * Colorblind Watermarks, >=44pt HIG Touch Targets, EN <-> TR, Light <-> Dark,
 * Dev/Prod AdSlot Modes, and 4x4 Tutorial Multi-Device Screenshots.
 * ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.resolve(__dirname, '../artifacts/screenshots');

const TUTORIAL_MATRIX = [
  { id: 'promax-light-prod', width: 430, height: 932, dpr: 2, theme: 'light', adMode: 'prod-nofill', lang: 'en', simSafeTop: 59, simSafeBottom: 34, simChrome: 1 },
  { id: 'promax-dark-prod',  width: 430, height: 932, dpr: 2, theme: 'dark',  adMode: 'prod-nofill', lang: 'en', simSafeTop: 59, simSafeBottom: 34, simChrome: 1 },
  { id: 'promax-light-devad',width: 430, height: 932, dpr: 2, theme: 'light', adMode: 'dev',         lang: 'en', simSafeTop: 59, simSafeBottom: 34, simChrome: 1 },
  { id: 'se-light-tr',       width: 375, height: 667, dpr: 2, theme: 'light', adMode: 'prod-nofill', lang: 'tr', simSafeTop: 20, simSafeBottom: 0,  simChrome: 0 }
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function assertAllTouchTargetsAtLeast44(page, label) {
  const tiny = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button:not(.ol-cell), .af-switch, [role="tab"], .af-ad-house-cta').forEach((el) => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      if (rect.width < 44 || rect.height < 44) {
        out.push({
          id: el.id || null,
          cls: el.className,
          text: (el.textContent || '').trim().slice(0, 24),
          w: Math.round(rect.width),
          h: Math.round(rect.height)
        });
      }
    });
    return out;
  });
  assert(tiny.length === 0, `Found <44px touch targets on ${label}: ${JSON.stringify(tiny)}`);
}

export async function runE2E({ page, appUrl }) {
  const e2eConsoleErrors = [];
  const e2ePageErrors = [];
  const e2eFailedReqs = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') e2eConsoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => e2ePageErrors.push(err.message));
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
      e2eFailedReqs.push(`${res.status()} ${res.url()}`);
    }
  });

  // 1. Boot on Real WASM SQLite WITHOUT ?theme param to verify Light Mode is strictly default!
  await page.goto(`${appUrl}?lang=en&adMode=prod-nofill&ephemeralDb=1`, {
    waitUntil: 'networkidle'
  });
  await page.waitForFunction(() => Boolean(window.AppFactory && window.AppFactory.ready));
  await page.waitForSelector('#card-daily-hero');
  await assertAllTouchTargetsAtLeast44(page, 'home');

  const defaultTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  assert(defaultTheme === 'light', `Expected default theme to be "light", got "${defaultTheme}"`);

  // Verify Brand Header + ZERO Solution Spoiler on unstarted Level 1 Mini-Board!
  const brandReady = await page.evaluate(() => ({
    logoLoaded: Boolean(document.querySelector('.ol-brand-logo')?.complete),
    hasMiniBoard: Boolean(document.querySelector('.ol-mini-board')),
    miniSpoilerFruits: document.querySelectorAll('.ol-mini-board .ol-mini-fruit').length,
    hasMusicBtn: Boolean(document.querySelector('#btn-home-music'))
  }));
  assert(
    brandReady.logoLoaded && brandReady.hasMiniBoard && brandReady.hasMusicBtn,
    `Brand home check failed: ${JSON.stringify(brandReady)}`
  );
  assert(
    brandReady.miniSpoilerFruits === 0,
    `Home mini-board leaked ${brandReady.miniSpoilerFruits} spoiler fruits on unstarted level!`
  );

  const dbMode = await page.evaluate(() => window.AppFactory.db.mode);
  assert(dbMode === 'wasm-sqlite', `Expected wasm-sqlite DB mode, got ${dbMode}`);

  const initialProgress = await page.locator('#home-campaign-progress').textContent();
  assert(
    initialProgress?.includes('0 / 30'),
    `Expected initial campaign progress "0 / 30", got "${initialProgress}"`
  );

  // Verify House Ad renders on Home in prod-nofill mode (CLS = 0, no empty box)
  const homeHouseAd = await page.locator('[data-ad-slot="home-inline"].af-ad-slot--house').count();
  assert(homeHouseAd === 1, 'Expected home-inline House Ad in prod-nofill mode');

  // 2. Navigate to Levels tab & verify all 30 seeded SQLite campaign levels + Endless Orchard Card
  await page.click('[data-tab-route="levels"]');
  await page.waitForSelector('#levels-grid .ol-level-card');
  await page.waitForSelector('#card-endless-mode');
  await assertAllTouchTargetsAtLeast44(page, 'levels');

  const totalCampaignCards = await page.locator('#levels-grid .ol-level-card').count();
  assert(totalCampaignCards === 30, `Expected 30 seeded campaign levels, got ${totalCampaignCards}`);

  await page.click('[data-filter-val="10x10"]');
  await page.waitForTimeout(150);
  const masterCards = await page.locator('#levels-grid .ol-level-card').count();
  assert(masterCards === 20, `Expected 20 Master 10x10 levels, got ${masterCards}`);

  await page.click('[data-filter-val="4-6"]');
  await page.waitForTimeout(150);
  const smallCards = await page.locator('#levels-grid .ol-level-card').count();
  assert(smallCards === 6, `Expected 6 tutorial/starter/warmup 4-6x levels, got ${smallCards}`);

  await page.click('[data-filter-val="all"]');
  await page.waitForTimeout(150);

  // 3. Open Level 1 (4x4 Tutorial) & verify Push Play Screen (TabBar hidden, 1:1 Square Board)
  await page.click('.ol-level-card[data-level-id="1"]');
  await page.waitForSelector('#ol-board[data-level-id="1"]');
  await page.waitForTimeout(350);
  await assertAllTouchTargetsAtLeast44(page, 'play-4x4');

  // Dynamically read Level 1's real verified solution from SQLite
  const level1Solution = await page.evaluate(async () => {
    const row = await window.AppFactory.db.queryOne('SELECT solution_json FROM levels WHERE id = 1');
    return JSON.parse(row.solution_json);
  });
  assert(Array.isArray(level1Solution) && level1Solution.length === 4, `Invalid Level 1 solution: ${JSON.stringify(level1Solution)}`);

  const tabBarHidden = await page.evaluate(() => {
    const tb = document.querySelector('.af-tabbar');
    return tb ? getComputedStyle(tb).display === 'none' : true;
  });
  assert(tabBarHidden, 'Expected Tab Bar to be hidden on Play screen');

  const cellCountL1 = await page.locator('#ol-board .ol-cell').count();
  assert(cellCountL1 === 16, `Expected 16 cells on 4x4 Level 1, got ${cellCountL1}`);

  // Verify exact 1:1 square board & >= 16px safe separation between toolbar and play-banner AdSlot
  const playGeom = await page.evaluate(() => {
    const board = document.querySelector('#ol-board')?.getBoundingClientRect();
    const toolbar = document.querySelector('#ol-toolbar')?.getBoundingClientRect();
    const ad = document.querySelector('[data-ad-slot="play-banner"]')?.getBoundingClientRect();
    return {
      boardW: board ? Math.round(board.width) : 0,
      boardH: board ? Math.round(board.height) : 0,
      adGapPx: toolbar && ad ? Math.round(ad.top - toolbar.bottom) : -1
    };
  });
  assert(Math.abs(playGeom.boardW - playGeom.boardH) <= 1, `Board must be 1:1 square, got ${playGeom.boardW}x${playGeom.boardH}`);
  assert(playGeom.adGapPx >= 15, `Expected >= 16px safe gap between toolbar and play-banner, got ${playGeom.adGapPx}px`);

  // 4. Test Single-Tap X Toggle vs Double-Tap Fruit + Locked AUTO_X (0 Ghost Undo & 0 Unfair Mistake!)
  const cell00 = page.locator('.ol-cell[data-r="0"][data-c="0"]');
  const cell01 = page.locator('.ol-cell[data-r="0"][data-c="1"]');

  // Verify Live Fruit Harvest Tray shows 4 unplaced fruits initially
  const trayCount4 = await page.locator('#ol-fruit-tray .ol-tray-fruit').count();
  assert(trayCount4 === 4, `Expected 4 fruit badges in tray on 4x4, got ${trayCount4}`);
  const initialFoundCount = await page.locator('#ol-fruit-tray .ol-tray-fruit.is-found').count();
  assert(initialFoundCount === 0, `Expected 0 found fruits initially, got ${initialFoundCount}`);

  // Single tap on Empty -> Manual X
  await cell00.click();
  await page.waitForTimeout(380);
  assert(await cell00.evaluate((el) => el.classList.contains('is-x')), 'Single tap on empty should place manual X');

  // Single tap on Manual X (after pause) -> Clears back to Empty (MUST NOT turn into fruit!)
  await cell00.click();
  await page.waitForTimeout(380);
  const afterSecondSingleTap = await cell00.evaluate((el) => ({
    isX: el.classList.contains('is-x'),
    isFruit: el.classList.contains('is-fruit')
  }));
  assert(!afterSecondSingleTap.isX && !afterSecondSingleTap.isFruit, `Single tap on X must clear to empty: ${JSON.stringify(afterSecondSingleTap)}`);

  // Rapid Double-Tap on (0,0) -> Places Fruit!
  await cell00.click();
  await cell00.click();
  await page.waitForTimeout(60);
  assert(await cell00.evaluate((el) => el.classList.contains('is-fruit')), 'Double tap should place fruit');

  // Verify Live Fruit Harvest Tray marks that fruit as found
  const foundAfterFruit = await page.locator('#ol-fruit-tray .ol-tray-fruit.is-found').count();
  assert(foundAfterFruit === 1, `Expected 1 found fruit in tray after placing valid fruit, got ${foundAfterFruit}`);

  // Verify (0,1) is now AUTO_X with soft dot (.ol-auto-dot) and LOCKED!
  const autoDotPresent = await cell01.evaluate((el) => el.classList.contains('is-auto-x') && Boolean(el.querySelector('.ol-auto-dot')));
  assert(autoDotPresent, 'Expected (0,1) to show locked AUTO_X dot (.ol-auto-dot)');

  // Tap locked AUTO_X cell 3 times + rapid double-tap -> MUST stay locked, 0 Ghost Undo, 0 Unfair Mistake!
  await cell01.click();
  await page.waitForTimeout(80);
  await cell01.click();
  await cell01.click();
  await page.waitForTimeout(80);

  const lockedCheck = await page.evaluate(async () => {
    const statusBar = document.querySelector('#ol-status-bar');
    const c01 = document.querySelector('.ol-cell[data-r="0"][data-c="1"]');
    const row = await window.AppFactory.db.queryOne('SELECT mistakes_count FROM level_progress WHERE level_id = 1');
    return {
      stillAutoX: Boolean(c01?.classList.contains('is-auto-x') && !c01?.classList.contains('is-fruit')),
      hasLockedBanner: Boolean(statusBar?.classList.contains('is-locked')),
      mistakesCount: Number(row?.mistakes_count || 0)
    };
  });
  assert(lockedCheck.stillAutoX, 'AUTO_X cell must remain locked on tap/double-tap');
  assert(lockedCheck.hasLockedBanner, 'Expected locked warning cue when tapping AUTO_X cell');
  assert(lockedCheck.mistakesCount === 0, `Expected 0 unfair mistakes on AUTO_X taps, got ${lockedCheck.mistakesCount}`);

  // Verify 1 single Undo removes the fruit cleanly (proves ZERO ghost undo steps were added!)
  await page.click('#btn-tool-undo');
  await page.waitForTimeout(60);
  assert(await cell00.evaluate((el) => !el.classList.contains('is-fruit')), 'Single Undo must immediately remove fruit (0 ghost undo!)');

  // Verify Conflict Detection when Auto-X is toggled OFF
  await page.click('#btn-tool-autox');
  await page.waitForTimeout(80);
  await cell00.click();
  await cell00.click();
  await page.waitForTimeout(60);
  await cell01.click();
  await cell01.click();
  await page.waitForTimeout(60);

  const conflictStatus = await page.locator('#ol-status-bar').evaluate((el) => ({
    hasConflictClass: el.classList.contains('is-conflict'),
    text: el.textContent?.trim() || ''
  }));
  assert(
    conflictStatus.hasConflictClass && /same row/i.test(conflictStatus.text),
    `Expected "Same row" conflict alert with Auto-X off, got ${JSON.stringify(conflictStatus)}`
  );

  const conflictCellsCount = await page.locator('.ol-cell.is-conflict').count();
  assert(conflictCellsCount === 2, `Expected 2 highlighted conflict cells, got ${conflictCellsCount}`);

  const trayConflictCount = await page.locator('#ol-fruit-tray .ol-tray-fruit.is-conflict').count();
  assert(trayConflictCount >= 1, `Expected tray fruit to highlight conflict, got ${trayConflictCount}`);

  // Undo removes conflict; re-enable Auto-X
  await page.click('#btn-tool-undo');
  await page.waitForTimeout(60);
  assert((await page.locator('.ol-cell.is-conflict').count()) === 0, 'Expected 0 conflict cells after Undo');
  await page.click('#btn-tool-autox');
  await page.waitForTimeout(80);

  // Verify periodic 2s idle timer flush persists elapsed_seconds into SQLite without tapping
  await page.waitForTimeout(2300);
  const idleElapsed = await page.evaluate(async () => {
    const row = await window.AppFactory.db.queryOne('SELECT elapsed_seconds FROM level_progress WHERE level_id = 1');
    return Number(row?.elapsed_seconds || 0);
  });
  assert(idleElapsed >= 2, `Expected idle timer to persist >= 2s to SQLite, got ${idleElapsed}s`);

  // Test Human-Logic Smart Hint: highlights target + context zone/line, NO cryptic row/col coordinates!
  await page.click('#btn-tool-hint');
  await page.waitForTimeout(120);
  const hintCheck = await page.evaluate(() => ({
    badge: document.querySelector('#ol-hint-badge')?.textContent?.trim(),
    statusText: document.querySelector('#ol-status-text')?.textContent?.trim() || '',
    hintCellCount: document.querySelectorAll('.ol-cell.is-hint').length,
    contextCount: document.querySelectorAll('.ol-cell.is-hint-context').length
  }));
  assert(hintCheck.badge === '1', `Expected hint badge "1", got "${hintCheck.badge}"`);
  assert(hintCheck.hintCellCount === 1, `Expected 1 highlighted hint cell, got ${hintCheck.hintCellCount}`);
  assert(hintCheck.contextCount >= 1, `Expected region/row/col hint context highlight, got ${hintCheck.contextCount}`);
  assert(!/row \d+, col \d+/i.test(hintCheck.statusText), `Hint text should explain human logic, not raw row/col coords: "${hintCheck.statusText}"`);

  await page.click('#btn-tool-hint');
  await page.waitForTimeout(120);
  assert((await page.locator('#ol-hint-badge').textContent())?.trim() === '+1', 'Expected hint badge "+1"');

  await page.click('#btn-tool-hint');
  await page.waitForSelector('#btn-reward-unlock');
  const rewardCtaText = (await page.locator('#btn-reward-unlock').textContent())?.trim() || '';
  assert(/watch ad/i.test(rewardCtaText), `Expected transparent "Watch Ad" CTA disclosure, got "${rewardCtaText}"`);
  await page.click('#btn-reward-unlock');
  await page.waitForTimeout(180);

  // 5. Reset board via iOS Alert confirmation, then solve Level 1 cleanly using dynamic SQLite solution
  await page.click('#btn-tool-reset');
  await page.waitForSelector('.af-alert-btn.is-destructive');
  await page.click('.af-alert-btn.is-destructive');
  await page.waitForTimeout(150);

  for (let r = 0; r < level1Solution.length; r++) {
    const c = level1Solution[r];
    const target = page.locator(`.ol-cell[data-r="${r}"][data-c="${c}"]`);
    await target.click();
    await target.click();
    await page.waitForTimeout(45);
  }

  // Verify bottom buttons are STRICTLY LOCKED during Victory celebration & while Victory Sheet is open!
  await page.waitForSelector('#ol-victory-content', { timeout: 4000 });
  const victorySheetAudit = await page.evaluate(() => ({
    adCount: document.querySelectorAll('[data-ad-slot="victory-banner"]').length,
    hasShareBtn: Boolean(document.querySelector('#btn-victory-share')),
    solvedBarLocked: Boolean(document.querySelector('#ol-solved-bar')?.classList.contains('is-transition-locked')),
    solvedBtnsDisabled: Array.from(document.querySelectorAll('#ol-solved-bar button')).every((b) => b.disabled),
    adZoneLocked: Boolean(document.querySelector('.ol-play-ad-zone')?.classList.contains('is-transition-locked'))
  }));
  assert(victorySheetAudit.adCount === 0, 'Victory sheet must be AD-FREE (0 victory-banner slots)!');
  assert(victorySheetAudit.hasShareBtn, 'Expected Share Result Card button inside Victory Sheet');
  assert(
    victorySheetAudit.solvedBarLocked && victorySheetAudit.solvedBtnsDisabled && victorySheetAudit.adZoneLocked,
    `Bottom controls MUST stay locked while Victory Sheet is open: ${JSON.stringify(victorySheetAudit)}`
  );

  // Dismiss Victory Sheet -> after 280ms accidental-tap guard, #ol-solved-bar unlocks cleanly!
  await page.click('.af-sheet-header .af-nav-btn');
  await page.waitForTimeout(420);
  const solvedBarUnlocked = await page.evaluate(() => {
    const bar = document.querySelector('#ol-solved-bar');
    return Boolean(
      bar &&
      getComputedStyle(bar).display !== 'none' &&
      !bar.classList.contains('is-transition-locked') &&
      Array.from(bar.querySelectorAll('button')).every((b) => !b.disabled)
    );
  });
  assert(solvedBarUnlocked, 'Expected #ol-solved-bar to unlock cleanly after dismissing Victory Sheet');
  await assertAllTouchTargetsAtLeast44(page, 'play-solved-bar');

  // Verify 1st simple level (4x4) does NOT trigger transition interstitial (1 % 3 !== 0)
  const simpleCnt1 = await page.evaluate(async () => {
    const row = await window.AppFactory.db.queryOne("SELECT value FROM player_prefs WHERE key = 'simple_ad_counter'");
    return row?.value;
  });
  assert(simpleCnt1 === '1', `Expected simple_ad_counter='1' after Level 1, got "${simpleCnt1}"`);
  await page.click('#btn-solved-next');
  await page.waitForSelector('#ol-board[data-level-id="2"]');
  assert((await page.locator('#af-interstitial-overlay').count()) === 0, '1st simple level must NOT show interstitial ad');

  // Simulate 3rd simple level win (simple_ad_counter 2 -> 3) -> MUST show transition interstitial!
  await page.evaluate(async () => {
    await window.AppFactory.db.run("INSERT OR REPLACE INTO player_prefs (key, value, updated_at) VALUES ('simple_ad_counter', '2', datetime('now'))");
  });
  const level2Solution = await page.evaluate(async () => {
    const row = await window.AppFactory.db.queryOne('SELECT solution_json FROM levels WHERE id = 2');
    return JSON.parse(row.solution_json);
  });
  for (let r = 0; r < level2Solution.length; r++) {
    const target = page.locator(`.ol-cell[data-r="${r}"][data-c="${level2Solution[r]}"]`);
    await target.click();
    await target.click();
    await page.waitForTimeout(40);
  }
  await page.waitForSelector('#ol-victory-content', { timeout: 4000 });
  await page.click('#btn-victory-next');
  await page.waitForSelector('#af-interstitial-overlay', { timeout: 3000 });
  await page.click('#btn-interstitial-close');
  await page.waitForSelector('#ol-board[data-level-id="3"]');

  // Return to Levels and verify Level 1 & 2 completion persisted in real SQLite
  await page.click('.af-screen[data-screen="play"] .af-navbar-left .af-nav-btn');
  await page.waitForSelector('#levels-grid .ol-level-card[data-level-id="1"].is-completed');

  // 6. Test On-Device Endless Mode (6x6 AND flagship 10x10) launches fresh verified boards cleanly!
  await page.click('[data-endless-size="6"]');
  await page.waitForSelector('#ol-board[data-grid-size="6"]');
  await page.waitForTimeout(200);
  const endlessCells6 = await page.locator('#ol-board .ol-cell').count();
  assert(endlessCells6 === 36, `Expected 36 cells on Endless 6x6 board, got ${endlessCells6}`);
  await page.click('.af-screen[data-screen="play"] .af-navbar-left .af-nav-btn');
  await page.waitForSelector('#levels-grid');

  await page.click('[data-endless-size="10"]');
  await page.waitForSelector('#ol-board[data-grid-size="10"]');
  await page.waitForTimeout(200);
  const endlessCells10 = await page.locator('#ol-board .ol-cell').count();
  assert(endlessCells10 === 100, `Expected 100 cells on Endless 10x10 board, got ${endlessCells10}`);
  await page.click('.af-screen[data-screen="play"] .af-navbar-left .af-nav-btn');
  await page.waitForSelector('#levels-grid');

  // 7. Open Level 11 (Flagship 10x10 Master board) & verify 100 cells + Drag-to-Mark & Drag-Erase + gesture safety
  await page.click('.ol-level-card[data-level-id="11"]');
  await page.waitForSelector('#ol-board[data-level-id="11"]');
  await page.waitForTimeout(350);
  await assertAllTouchTargetsAtLeast44(page, 'play-10x10');

  const masterBoardMetrics = await page.evaluate(() => {
    const cells = document.querySelectorAll('#ol-board .ol-cell');
    const thickEdges = document.querySelectorAll('#ol-board .ol-edge-top, #ol-board .ol-edge-left');
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
    return {
      cellCount: cells.length,
      thickEdgeCount: thickEdges.length,
      overflowX
    };
  });
  assert(masterBoardMetrics.cellCount === 100, `Expected 100 cells on 10x10 Level 11, got ${masterBoardMetrics.cellCount}`);
  assert(masterBoardMetrics.thickEdgeCount > 20, `Expected >20 thick region borders on 10x10, got ${masterBoardMetrics.thickEdgeCount}`);
  assert(!masterBoardMetrics.overflowX, 'Detected horizontal overflow on 10x10 Level 11');

  // Test Drag-to-Mark X across 3 adjacent cells
  const box0 = await page.locator('.ol-cell[data-r="0"][data-c="0"]').boundingBox();
  const box2 = await page.locator('.ol-cell[data-r="0"][data-c="2"]').boundingBox();
  await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
  await page.mouse.down();
  await page.mouse.move(box0.x + box0.width * 1.5, box0.y + box0.height / 2);
  await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
  await page.mouse.up();
  await page.waitForTimeout(80);
  const dragMarkedCount = await page.locator('#ol-board .ol-cell.is-x').count();
  assert(dragMarkedCount === 3, `Expected 3 cells marked X via drag, got ${dragMarkedCount}`);

  // Verify pointercancel and slide-off-board release do NOT place stray marks
  const gestureSafety = await page.evaluate(() => {
    const c1 = document.querySelector('.ol-cell[data-r="1"][data-c="0"]');
    c1.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 91, button: 0 }));
    window.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 91 }));
    const cancelTouched = c1.classList.contains('is-x') || c1.classList.contains('is-fruit');

    const c2 = document.querySelector('.ol-cell[data-r="2"][data-c="0"]');
    c2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 92, button: 0 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 92, clientX: 4, clientY: 4 }));
    const slideOffTouched = c2.classList.contains('is-x') || c2.classList.contains('is-fruit');

    return { cancelTouched, slideOffTouched };
  });
  assert(!gestureSafety.cancelTouched, 'pointercancel should never trigger a cell tap');
  assert(!gestureSafety.slideOffTouched, 'Releasing pointer off-board should cancel tap');

  // Back to Levels, then switch to Stats tab
  await page.click('.af-screen[data-screen="play"] .af-navbar-left .af-nav-btn');
  await page.waitForTimeout(420);
  await page.click('[data-tab-route="stats"]');
  await page.waitForSelector('#stats-bento-grid');
  await assertAllTouchTargetsAtLeast44(page, 'stats');

  const solvedText = await page.locator('#stat-solved-value').textContent();
  assert(solvedText?.trim() === '2 / 30', `Expected "2 / 30" solved on Stats after completing Levels 1 & 2, got "${solvedText}"`);

  const hasTierBreakdown = (await page.locator('#stats-tier-breakdown .af-list-row').count()) >= 5;
  assert(hasTierBreakdown, 'Expected per-size Best Times tier breakdown on Stats screen');

  // 8. Test Real SQLite Preference Toggles (Auto-X, Music & Colorblind Markers)
  await page.locator('#pref-auto-x').click({ force: true });
  await page.locator('#pref-music-enabled').click({ force: true });
  await page.locator('#pref-colorblind-hints').click({ force: true });
  await page.waitForTimeout(180);
  const prefStored = await page.evaluate(async () => {
    const rowAuto = await window.AppFactory.db.queryOne("SELECT value FROM player_prefs WHERE key = 'auto_x'");
    const rowMusic = await window.AppFactory.db.queryOne("SELECT value FROM player_prefs WHERE key = 'music_enabled'");
    const rowCb = await window.AppFactory.db.queryOne("SELECT value FROM player_prefs WHERE key = 'colorblind_hints'");
    return { autoX: rowAuto?.value, music: rowMusic?.value, cb: rowCb?.value };
  });
  assert(
    prefStored.autoX === '0' && prefStored.music === '0' && prefStored.cb === '1',
    `Expected SQLite player_prefs auto_x='0', music_enabled='0', colorblind_hints='1', got ${JSON.stringify(prefStored)}`
  );

  // 9. Test Theme Toggle (Light -> Dark) & Language Switch (EN -> TR) + zero missing i18n keys
  await page.click('[data-theme-val="dark"]');
  await page.waitForTimeout(120);
  const activeTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  assert(activeTheme === 'dark', `Expected data-theme="dark", got "${activeTheme}"`);

  await page.click('[data-lang-val="tr"]');
  await page.waitForTimeout(200);
  const trTitle = await page.locator('.af-large-title').textContent();
  assert(trTitle?.trim() === 'İstatistik', `Expected Turkish title "İstatistik", got "${trTitle}"`);

  const trTabs = await page.locator('.af-tab-label').allTextContents();
  assert(
    trTabs.join('|') === 'Oyna|Seviyeler|İstatistik',
    `Expected Turkish tab labels "Oyna|Seviyeler|İstatistik", got "${trTabs.join('|')}"`
  );

  const missingKeys = await page.evaluate(() => Array.from(window.AppFactory.i18n.missingKeys));
  assert(missingKeys.length === 0, `Detected missing i18n keys: ${missingKeys.join(', ')}`);

  // 10. Test Daily Harvest 10x10 solve & streak persistence in real SQLite
  await page.click('[data-tab-route="home"]');
  await page.waitForSelector('#btn-play-daily');
  await page.click('#btn-play-daily');
  await page.waitForSelector('#ol-board[data-grid-size="10"]');
  await page.waitForTimeout(350);

  const dailySolution = await page.evaluate(async () => {
    const id = Number(document.querySelector('#ol-board')?.dataset.levelId);
    const row = await window.AppFactory.db.queryOne('SELECT solution_json FROM levels WHERE id = ?', [id]);
    return JSON.parse(row.solution_json);
  });
  for (let r = 0; r < dailySolution.length; r++) {
    const cell = page.locator(`.ol-cell[data-r="${r}"][data-c="${dailySolution[r]}"]`);
    await cell.click();
    await cell.click();
  }
  await page.waitForSelector('#ol-victory-content', { timeout: 5000 });
  await page.click('#btn-victory-home');
  // 10x10 (>= 6x6) MUST trigger transition interstitial on EVERY completion!
  await page.waitForSelector('#af-interstitial-overlay', { timeout: 3000 });
  await page.click('#btn-interstitial-close');
  await page.waitForSelector('#af-interstitial-overlay', { state: 'detached', timeout: 3000 });
  await page.waitForTimeout(250);
  await page.waitForSelector('#home-streak-pill');
  const dailyStreakText = (await page.locator('#home-streak-pill').textContent())?.trim() || '';
  assert(dailyStreakText.includes('1'), `Expected Daily Streak to increment to 1 after daily solve, got "${dailyStreakText}"`);

  // 11. Test Dev Blueprint AdSlot mode (vs Prod House Ad)
  await page.goto(`${appUrl}?lang=en&theme=light&adMode=dev&ephemeralDb=1`, {
    waitUntil: 'networkidle'
  });
  await page.waitForFunction(() => Boolean(window.AppFactory && window.AppFactory.ready));
  const devBlueprintAd = await page.locator('[data-ad-slot="home-inline"].af-ad-slot--dev').count();
  assert(devBlueprintAd === 1, 'Expected home-inline Dev Blueprint AdSlot in adMode=dev');

  // 12. Capture 4x4 Tutorial (Level 1) screenshots across the full 4-device matrix
  //     and verify strict 1:1 square board geometry (especially on iPhone SE 375x667!)
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const browser = page.context().browser();
  const tutorialScreenshots = [];

  for (const variant of TUTORIAL_MATRIX) {
    const ctx = await browser.newContext({
      viewport: { width: variant.width, height: variant.height },
      deviceScaleFactor: variant.dpr,
      colorScheme: variant.theme,
      isMobile: true,
      hasTouch: true
    });
    const tPage = await ctx.newPage();
    tPage.on('console', (msg) => {
      if (msg.type() === 'error') e2eConsoleErrors.push(`[tutorial:${variant.id}] ${msg.text()}`);
    });
    tPage.on('pageerror', (err) => e2ePageErrors.push(`[tutorial:${variant.id}] ${err.message}`));
    tPage.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
        e2eFailedReqs.push(`[tutorial:${variant.id}] ${res.status()} ${res.url()}`);
      }
    });

    const qs = new URLSearchParams({
      route: 'play',
      levelId: '1',
      theme: variant.theme,
      adMode: variant.adMode,
      lang: variant.lang,
      simSafeTop: String(variant.simSafeTop),
      simSafeBottom: String(variant.simSafeBottom),
      simChrome: String(variant.simChrome),
      ephemeralDb: '1'
    });
    await tPage.goto(`${appUrl}?${qs.toString()}`, { waitUntil: 'networkidle' });
    await tPage.waitForFunction(() => Boolean(window.AppFactory && window.AppFactory.ready));
    await tPage.waitForSelector('#ol-board[data-level-id="1"][data-grid-size="4"]');
    await tPage.waitForTimeout(250);

    // Dynamically place row 0's verified tutorial fruit so screenshot shows fruit + soft Auto-X dots!
    const demoCol = level1Solution[0];
    const demoCell = tPage.locator(`.ol-cell[data-r="0"][data-c="${demoCol}"]`);
    await demoCell.click();
    await demoCell.click();
    await tPage.waitForTimeout(260);

    await assertAllTouchTargetsAtLeast44(tPage, `tutorial-4x4:${variant.id}`);
    const diag = await tPage.evaluate(() => {
      const scrollBody = document.querySelector('.af-screen[data-screen="play"] .af-scroll-body');
      const board = document.querySelector('#ol-board')?.getBoundingClientRect();
      const toolbar = document.querySelector('#ol-toolbar')?.getBoundingClientRect();
      const ad = document.querySelector('[data-ad-slot="play-banner"]')?.getBoundingClientRect();
      const title = document.querySelector('.af-screen[data-screen="play"] .af-navbar-title')?.getBoundingClientRect();
      const leftSlot = document.querySelector('.af-screen[data-screen="play"] .af-navbar-left')?.getBoundingClientRect();
      const rightSlot = document.querySelector('.af-screen[data-screen="play"] .af-navbar-right')?.getBoundingClientRect();
      return {
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        verticalOverflowPx: scrollBody ? scrollBody.scrollHeight - scrollBody.clientHeight : 0,
        boardW: board ? Math.round(board.width) : 0,
        boardH: board ? Math.round(board.height) : 0,
        adGapPx: toolbar && ad ? Math.round(ad.top - toolbar.bottom) : -1,
        titleCenterOffsetPx: title ? Math.round((title.left + title.width / 2) - window.innerWidth / 2) : 0,
        titleOverlapLeft: title && leftSlot ? title.left < leftSlot.right - 1 : false,
        titleOverlapRight: title && rightSlot ? title.right > rightSlot.left + 1 : false,
        missingI18n: Array.from(window.AppFactory?.i18n?.missingKeys || [])
      };
    });
    assert(!diag.overflowX, `Horizontal overflow on tutorial 4x4 (${variant.id})`);
    assert(diag.verticalOverflowPx <= 1, `Vertical overflow (${diag.verticalOverflowPx}px) on tutorial 4x4 (${variant.id})`);
    assert(
      Math.abs(diag.boardW - diag.boardH) <= 1,
      `Board not 1:1 square on tutorial 4x4 (${variant.id}): ${diag.boardW}x${diag.boardH}`
    );
    assert(
      Math.abs(diag.titleCenterOffsetPx) <= 2 && !diag.titleOverlapLeft && !diag.titleOverlapRight,
      `Play navbar title centering/overlap issue (${variant.id}): ${JSON.stringify(diag)}`
    );
    assert(diag.adGapPx >= 15, `Toolbar-to-Ad gap too tight (${diag.adGapPx}px) on tutorial 4x4 (${variant.id})`);
    assert(diag.missingI18n.length === 0, `Missing i18n keys on tutorial 4x4 (${variant.id}): ${diag.missingI18n.join(', ')}`);

    const shotPath = path.join(SCREENSHOTS_DIR, `play-tutorial-4x4__${variant.id}.png`);
    await tPage.screenshot({ path: shotPath, fullPage: false });
    tutorialScreenshots.push(shotPath);
    await ctx.close();
  }

  assert(e2eConsoleErrors.length === 0, `Console errors during E2E: ${e2eConsoleErrors.join(' | ')}`);
  assert(e2ePageErrors.length === 0, `Page errors during E2E: ${e2ePageErrors.join(' | ')}`);
  assert(e2eFailedReqs.length === 0, `Failed HTTP requests during E2E: ${e2eFailedReqs.join(' | ')}`);

  return {
    ok: true,
    dbMode,
    totalCampaignCards,
    masterCards,
    conflictDetected: conflictStatus.text,
    dragMarkedCount,
    idleElapsed,
    level1SolvedPersisted: solvedText?.trim(),
    masterBoardCells: masterBoardMetrics.cellCount,
    dailyStreakText,
    activeTheme,
    trTitle: trTitle?.trim(),
    devBlueprintAd,
    tutorialScreenshotsCount: tutorialScreenshots.length,
    consoleErrors: e2eConsoleErrors.length
  };
}
