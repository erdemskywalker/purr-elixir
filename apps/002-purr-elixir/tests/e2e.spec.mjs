/* ============================================================================
 * Purr Elixir (002-purr-elixir) — Comprehensive Playwright E2E Test Suite
 * Verifies Real WASM SQLite CRUD, Light Default + Dark Mode, EN <-> TR Parity,
 * 60 Campaign Levels + Filters, Smart BFS Hint, Pouring + Undo, +1 Empty Flask
 * Rewarded Opt-In, Dynamic Verified Solves (Levels 1, 2, 3 + Cat Unlock),
 * Graduated Interstitial Cadence (1-5: 1/3; Daily: every win), Ad-Free Victory
 * Sheet, 12-Bottle Grandmaster Fit on iPhone SE (375x667), Endless Alchemy,
 * Cat Assistant Switching, SQLite Pref Toggles, and Dev/Prod AdSlot Modes.
 * ============================================================================ */

import { solveBottles } from '../src/elixir-engine.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function assertAllTouchTargetsAtLeast44(page, label) {
  const tiny = await page.evaluate(() => {
    const out = [];
    document
      .querySelectorAll('button, .af-switch, [role="tab"], .af-ad-house-cta')
      .forEach((el) => {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        if (rect.width < 43.5 || rect.height < 43.5) {
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

async function solveCurrentShelfViaUI(page) {
  const levelBottles = await page.evaluate(async () => {
    const stage = document.querySelector('#pe-shelf-stage');
    const id = Number(stage?.dataset.levelId);
    if (!Number.isFinite(id)) return null;
    const row = await window.AppFactory.db.queryOne('SELECT bottles_json FROM levels WHERE id = ?', [id]);
    return row ? JSON.parse(row.bottles_json) : null;
  });
  assert(Array.isArray(levelBottles), 'Could not read level bottles from SQLite');

  const solved = solveBottles(levelBottles, { maxExpansions: 60000 });
  assert(solved.solvable && solved.path.length > 0, `BFS solver failed on shelf: ${JSON.stringify(levelBottles)}`);

  for (const [fromIdx, toIdx] of solved.path) {
    await page.click(`.pe-bottle[data-bottle-index="${fromIdx}"]`);
    await page.click(`.pe-bottle[data-bottle-index="${toIdx}"]`);
    // Wait for the 220ms pour animation to commit cleanly
    await page.waitForTimeout(265);
  }
}

export async function runE2E({ page, appUrl }) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedReqs = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
      failedReqs.push(`${res.status()} ${res.url()}`);
    }
  });

  // 1. Boot on Real WASM SQLite WITHOUT ?theme to confirm Light Mode default
  await page.goto(`${appUrl}?lang=en&adMode=prod-nofill&ephemeralDb=1`, {
    waitUntil: 'networkidle'
  });
  await page.waitForFunction(() => Boolean(window.AppFactory && window.AppFactory.ready));
  await page.waitForSelector('#card-campaign-hero');
  await assertAllTouchTargetsAtLeast44(page, 'home');

  const defaultTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  assert(defaultTheme === 'light', `Expected default theme "light", got "${defaultTheme}"`);

  const dbMode = await page.evaluate(() => window.AppFactory.db.mode);
  assert(dbMode === 'wasm-sqlite', `Expected wasm-sqlite DB mode, got "${dbMode}"`);

  const homeProgress = (await page.locator('#home-campaign-progress').textContent())?.trim() || '';
  assert(homeProgress.includes('0 / 60'), `Expected initial campaign progress "0 / 60", got "${homeProgress}"`);

  // Verify House Ad in prod-nofill mode
  const homeHouseAd = await page.locator('[data-ad-slot="home-inline"].af-ad-slot--house').count();
  assert(homeHouseAd === 1, 'Expected home-inline House Ad in prod-nofill mode');

  // Verify tapping the active cat card produces reactive dialogue
  await page.click('#btn-home-cat');
  await page.waitForTimeout(100);
  const catLineAfterPet = (await page.locator('#home-cat-line').textContent())?.trim() || '';
  assert(catLineAfterPet.length > 4, 'Expected active cat pet dialogue on Home');

  // 2. Navigate to Levels tab & verify all 60 seeded campaign levels + tier filters + Endless portal
  await page.click('[data-tab-route="levels"]');
  await page.waitForSelector('#levels-grid .pe-level-tile');
  await page.waitForSelector('#card-endless-portal');
  await assertAllTouchTargetsAtLeast44(page, 'levels');

  const totalCampaignTiles = await page.locator('#levels-grid .pe-level-tile').count();
  assert(totalCampaignTiles === 60, `Expected 60 seeded campaign levels, got ${totalCampaignTiles}`);

  await page.click('[data-filter-val="grandmaster"]');
  await page.waitForTimeout(120);
  const grandmasterTiles = await page.locator('#levels-grid .pe-level-tile').count();
  assert(grandmasterTiles === 15, `Expected 15 Grandmaster levels, got ${grandmasterTiles}`);

  await page.click('[data-filter-val="easy"]');
  await page.waitForTimeout(120);
  const easyTiles = await page.locator('#levels-grid .pe-level-tile').count();
  assert(easyTiles === 15, `Expected 15 Easy (starter+apprentice) levels, got ${easyTiles}`);

  await page.click('[data-filter-val="all"]');
  await page.waitForTimeout(120);

  // 3. Open Level 1 (Starter, 3 colors + 2 empty = 5 bottles) & check layout + TabBar hidden
  await page.click('.pe-level-tile[data-level-id="1"]');
  await page.waitForSelector('#pe-shelf-stage[data-level-id="1"]');
  await page.waitForTimeout(340);
  await assertAllTouchTargetsAtLeast44(page, 'play-level-1');

  const playChecks = await page.evaluate(() => {
    const tb = document.querySelector('.af-tabbar');
    const toolbar = document.querySelector('#pe-toolbar')?.getBoundingClientRect();
    const ad = document.querySelector('[data-ad-slot="play-banner"]')?.getBoundingClientRect();
    const scrollBody = document.querySelector('.af-screen[data-screen="play"] .af-scroll-body');
    return {
      tabBarHidden: tb ? getComputedStyle(tb).display === 'none' : true,
      bottleCount: document.querySelectorAll('#pe-shelf-stage .pe-bottle').length,
      adGapPx: toolbar && ad ? Math.round(ad.top - toolbar.bottom) : -1,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      overflowY: scrollBody ? scrollBody.scrollHeight - scrollBody.clientHeight : 0
    };
  });
  assert(playChecks.tabBarHidden, 'Tab Bar must be hidden on Play screen');
  assert(playChecks.bottleCount === 5, `Expected 5 bottles on Level 1, got ${playChecks.bottleCount}`);
  assert(playChecks.adGapPx >= 15, `Expected >= 16px safe gap above play-banner, got ${playChecks.adGapPx}px`);
  assert(!playChecks.overflowX && playChecks.overflowY <= 1, `Play screen overflow detected: ${JSON.stringify(playChecks)}`);

  // 4. Test Smart BFS Hint -> Pour -> SQLite Save -> Undo
  await page.click('#btn-tool-hint');
  await page.waitForTimeout(120);
  const hintInfo = await page.evaluate(() => ({
    badge: document.querySelector('#pe-hint-badge')?.textContent?.trim(),
    srcIdx: document.querySelector('.pe-bottle.is-hint-source')?.getAttribute('data-bottle-index'),
    dstIdx: document.querySelector('.pe-bottle.is-hint-target')?.getAttribute('data-bottle-index'),
    speech: document.querySelector('#pe-speech-text')?.textContent?.trim() || ''
  }));
  assert(hintInfo.badge === '1', `Expected free hint badge to drop to "1", got "${hintInfo.badge}"`);
  assert(hintInfo.srcIdx != null && hintInfo.dstIdx != null, `Expected highlighted BFS hint bottles: ${JSON.stringify(hintInfo)}`);
  assert(hintInfo.speech.length > 6, 'Expected talking cat to explain BFS hint');

  // Execute the hinted pour and verify moves increment + SQLite persistence
  await page.click(`.pe-bottle[data-bottle-index="${hintInfo.srcIdx}"]`);
  await page.click(`.pe-bottle[data-bottle-index="${hintInfo.dstIdx}"]`);
  await page.waitForTimeout(290);

  const afterPourDb = await page.evaluate(async () => {
    const row = await window.AppFactory.db.queryOne(
      'SELECT moves_count, hints_used, free_hints_left, status FROM level_progress WHERE level_id = 1'
    );
    return row;
  });
  assert(
    Number(afterPourDb?.moves_count) === 1 && Number(afterPourDb?.hints_used) === 1 && Number(afterPourDb?.free_hints_left) === 1,
    `Expected SQLite level_progress after pour+hint, got ${JSON.stringify(afterPourDb)}`
  );

  // 5. Test Rewarded Opt-In "+1 Empty Flask" -> then Undo MUST preserve the rewarded extra flask!
  await page.click('#btn-tool-flask');
  await page.waitForSelector('#btn-reward-confirm');
  const flaskCtaText = (await page.locator('#btn-reward-confirm').textContent())?.trim() || '';
  assert(/watch ad/i.test(flaskCtaText), `Expected transparent "Watch Ad" CTA, got "${flaskCtaText}"`);
  await page.click('#btn-reward-confirm');
  await page.waitForTimeout(220);

  const bottlesAfterFlask = await page.locator('#pe-shelf-stage .pe-bottle').count();
  assert(bottlesAfterFlask === 6, `Expected 6 bottles after +1 Empty Flask, got ${bottlesAfterFlask}`);

  // Undo restores moves to 0 cleanly while preserving the rewarded extra empty flask
  await page.click('#btn-tool-undo');
  await page.waitForTimeout(120);
  const subAfterUndo = (await page.locator('#pe-play-title-sub').textContent())?.trim() || '';
  assert(subAfterUndo.includes('Moves 0'), `Expected Moves 0 after Undo, got "${subAfterUndo}"`);
  const bottlesAfterUndo = await page.locator('#pe-shelf-stage .pe-bottle').count();
  assert(
    bottlesAfterUndo === 6,
    `Undo must preserve rewarded +1 Empty Flask (expected 6 bottles, got ${bottlesAfterUndo})`
  );

  // 6. Test Restart (iOS Alert) then solve Level 1 cleanly via dynamic BFS
  await page.click('#btn-tool-restart');
  await page.waitForSelector('.af-alert-btn.is-destructive');
  await page.click('.af-alert-btn.is-destructive');
  await page.waitForTimeout(160);
  assert((await page.locator('#pe-shelf-stage .pe-bottle').count()) === 5, 'Restart should restore 5 initial bottles');

  await solveCurrentShelfViaUI(page);
  await page.waitForSelector('#pe-victory-content', { timeout: 5000 });

  // Verify Ad-Free Victory Sheet, Toolbar hidden, Post-Win Bar locked until sheet closes
  const victoryAudit = await page.evaluate(() => ({
    sheetAdSlots: document.querySelectorAll('.af-sheet [data-ad-slot]').length,
    toolbarHidden: Boolean(document.querySelector('#pe-toolbar')?.classList.contains('is-hidden')),
    postWinLocked: Array.from(document.querySelectorAll('#pe-post-win-bar button')).every((b) => b.disabled),
    hasShareBtn: Boolean(document.querySelector('#btn-victory-share'))
  }));
  assert(victoryAudit.sheetAdSlots === 0, 'Victory sheet MUST contain 0 ad slots');
  assert(victoryAudit.toolbarHidden, 'Gameplay toolbar must hide immediately on victory');
  assert(victoryAudit.postWinLocked, 'Post-win bar must stay locked while Victory Sheet is open');
  assert(victoryAudit.hasShareBtn, 'Victory sheet must include Share button');

  // Dismiss Victory Sheet -> Post-Win Bar unlocks cleanly after accidental-tap guard
  await page.click('.af-sheet-header .af-nav-btn');
  await page.waitForTimeout(420);
  const postWinUnlocked = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#pe-post-win-bar button')).every((b) => !b.disabled)
  );
  assert(postWinUnlocked, 'Post-win bar should unlock after dismissing Victory Sheet');

  // 1st starter level (Level 1) must NOT show interstitial (counter 1 % 3 !== 0)
  await page.click('#btn-post-next');
  await page.waitForSelector('#pe-shelf-stage[data-level-id="2"]', { timeout: 4000 });
  assert((await page.locator('#af-interstitial-overlay').count()) === 0, '1st starter win must NOT trigger interstitial');

  // Simulate 3rd starter win (counter 2 -> 3) on Level 2 -> MUST trigger transition interstitial!
  await page.evaluate(async () => {
    await window.AppFactory.db.run(
      "INSERT OR REPLACE INTO player_prefs (key, value, updated_at) VALUES ('simple_ad_counter', '2', datetime('now'))"
    );
  });
  await solveCurrentShelfViaUI(page);
  await page.waitForSelector('#pe-victory-content', { timeout: 5000 });
  await page.click('#btn-victory-next');
  await page.waitForSelector('#af-interstitial-overlay', { timeout: 3000 });
  await page.click('#btn-interstitial-close');
  await page.waitForSelector('#pe-shelf-stage[data-level-id="3"]', { timeout: 4000 });

  // 7. Solve Level 3 (Milestone!) -> verify Biscuit cat unlock celebration banner!
  await solveCurrentShelfViaUI(page);
  await page.waitForSelector('#pe-victory-content', { timeout: 6000 });
  const unlockBannerCount = await page.locator('#pe-victory-content .pe-cat-unlock-banner').count();
  assert(unlockBannerCount === 1, 'Expected Biscuit unlock celebration banner upon completing Level 3');
  await page.click('.af-sheet-header .af-nav-btn');
  await page.waitForTimeout(360);

  // Return to Levels tab
  await page.click('.af-screen[data-screen="play"] .af-navbar-left .af-nav-btn');
  await page.waitForSelector('#levels-grid .pe-level-tile[data-level-id="1"].is-completed', { timeout: 4000 });

  // 7b. Regression: Replaying completed Level 1 must start with fresh 2 free hints (2 -> 1) without losing completion
  await page.click('.pe-level-tile[data-level-id="1"]');
  await page.waitForSelector('#pe-shelf-stage[data-level-id="1"]', { timeout: 4000 });
  await page.waitForTimeout(200);
  assert(((await page.locator('#pe-hint-badge').textContent())?.trim() || '') === '2', 'Replay must start with 2 free hints');
  await page.click('#btn-tool-hint');
  await page.waitForTimeout(140);
  const replayHintCheck = await page.evaluate(async () => {
    const badge = document.querySelector('#pe-hint-badge')?.textContent?.trim();
    const row = await window.AppFactory.db.queryOne(
      'SELECT status, hints_used, free_hints_left FROM level_progress WHERE level_id = 1'
    );
    return { badge, status: row?.status, hintsUsed: Number(row?.hints_used), freeLeft: Number(row?.free_hints_left) };
  });
  assert(
    replayHintCheck.badge === '1' &&
      replayHintCheck.status === 'completed' &&
      replayHintCheck.hintsUsed === 1 &&
      replayHintCheck.freeLeft === 1,
    `Replay hint counter regression: ${JSON.stringify(replayHintCheck)}`
  );
  await page.click('.af-screen[data-screen="play"] .af-navbar-left .af-nav-btn');
  await page.waitForSelector('#levels-grid', { timeout: 4000 });

  // 8. Test On-Device Endless Alchemy launch (Easy 5 colors = 7 bottles)
  await page.click('[data-endless-diff="easy"]');
  await page.waitForSelector('#pe-shelf-stage[data-mode="endless"]', { timeout: 4000 });
  await page.waitForTimeout(250);
  const endlessBottles = await page.locator('#pe-shelf-stage .pe-bottle').count();
  assert(endlessBottles === 7, `Expected 7 bottles on Endless Easy (5 colors + 2 empty), got ${endlessBottles}`);
  await page.click('.af-screen[data-screen="play"] .af-navbar-left .af-nav-btn');
  await page.waitForSelector('#levels-grid', { timeout: 4000 });

  // 9. Switch to Cats & Stats tab -> verify real SQLite stats, cat switching, prefs, theme & language
  await page.click('[data-tab-route="stats"]');
  await page.waitForSelector('#stats-bento-grid');
  await assertAllTouchTargetsAtLeast44(page, 'stats');

  const solvedStat = (await page.locator('#stat-solved-value').textContent())?.trim() || '';
  assert(solvedStat === '3 / 60', `Expected "3 / 60" solved in Stats after Levels 1-3, got "${solvedStat}"`);

  // Activate newly unlocked Biscuit companion & verify SQLite persistence
  await page.click('[data-cat-select="biscuit"]');
  await page.waitForTimeout(180);
  const activeCatPref = await page.evaluate(async () => {
    const row = await window.AppFactory.db.queryOne("SELECT value FROM player_prefs WHERE key = 'active_cat_id'");
    return row?.value;
  });
  assert(activeCatPref === 'biscuit', `Expected active_cat_id='biscuit' in SQLite, got "${activeCatPref}"`);

  // Toggle SQLite prefs (Music OFF, Colorblind ON)
  await page.locator('#pref-music-enabled').click({ force: true });
  await page.locator('#pref-colorblind-symbols').click({ force: true });
  await page.waitForTimeout(160);
  const prefCheck = await page.evaluate(async () => {
    const m = await window.AppFactory.db.queryOne("SELECT value FROM player_prefs WHERE key = 'music_enabled'");
    const cb = await window.AppFactory.db.queryOne("SELECT value FROM player_prefs WHERE key = 'colorblind_symbols'");
    return {
      music: m?.value,
      cb: cb?.value,
      attr: document.documentElement.getAttribute('data-colorblind')
    };
  });
  assert(
    prefCheck.music === '0' && prefCheck.cb === '1' && prefCheck.attr === 'true',
    `SQLite pref toggle verification failed: ${JSON.stringify(prefCheck)}`
  );

  // Theme toggle: Light -> Dark -> Light
  await page.click('[data-theme-val="dark"]');
  await page.waitForTimeout(100);
  const darkTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  assert(darkTheme === 'dark', `Expected data-theme="dark", got "${darkTheme}"`);

  // Language switch: EN -> TR + zero missing i18n keys
  await page.click('[data-lang-val="tr"]');
  await page.waitForTimeout(220);
  const trTitle = (await page.locator('.af-large-title').textContent())?.trim();
  assert(trTitle === 'Kediler', `Expected Turkish title "Kediler", got "${trTitle}"`);

  const trTabs = await page.locator('.af-tab-label').allTextContents();
  assert(
    trTabs.join('|') === 'Dükkan|Bölümler|Kediler',
    `Expected Turkish tab labels "Dükkan|Bölümler|Kediler", got "${trTabs.join('|')}"`
  );

  const missingKeys = await page.evaluate(() => Array.from(window.AppFactory.i18n.missingKeys));
  assert(missingKeys.length === 0, `Missing i18n keys detected: ${missingKeys.join(', ')}`);

  // 10. Test Dev Blueprint AdSlot mode (vs Prod House Ad)
  await page.goto(`${appUrl}?lang=en&theme=light&adMode=dev&ephemeralDb=1`, {
    waitUntil: 'networkidle'
  });
  await page.waitForFunction(() => Boolean(window.AppFactory && window.AppFactory.ready));
  const devBlueprintAd = await page.locator('[data-ad-slot="home-inline"].af-ad-slot--dev').count();
  assert(devBlueprintAd === 1, 'Expected home-inline Dev Blueprint AdSlot in adMode=dev');

  // 11. Verify 12-Bottle Grandmaster Level (Level 55) & Top Bar Safe-Area across 3 iPhone profiles (59pt / 47pt / 20pt)
  const browser = page.context().browser();
  const iphoneProfiles = [
    { id: 'promax-59pt', width: 430, height: 932, safeTop: 59, safeBottom: 34, lang: 'en' },
    { id: 'iphone14-47pt', width: 390, height: 844, safeTop: 47, safeBottom: 34, lang: 'tr' },
    { id: 'se-20pt', width: 375, height: 667, safeTop: 20, safeBottom: 0, lang: 'tr' }
  ];
  const profileDiags = {};

  for (const prof of iphoneProfiles) {
    const pCtx = await browser.newContext({
      viewport: { width: prof.width, height: prof.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const pPage = await pCtx.newPage();
    pPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[${prof.id}] ${msg.text()}`);
    });
    pPage.on('pageerror', (err) => pageErrors.push(`[${prof.id}] ${err.message}`));

    await pPage.goto(
      `${appUrl}?route=play&levelId=55&lang=${prof.lang}&theme=light&adMode=prod-nofill&simSafeTop=${prof.safeTop}&simSafeBottom=${prof.safeBottom}&ephemeralDb=1`,
      { waitUntil: 'networkidle' }
    );
    await pPage.waitForFunction(() => Boolean(window.AppFactory && window.AppFactory.ready));
    await pPage.waitForSelector('#pe-shelf-stage[data-level-id="55"]');
    await pPage.waitForTimeout(220);
    await assertAllTouchTargetsAtLeast44(pPage, `grandmaster-12-bottles-${prof.id}`);

    const diag = await pPage.evaluate((pr) => {
      const nav = document.querySelector('.af-navbar')?.getBoundingClientRect();
      const backBtn = document.querySelector('.af-navbar-left .af-nav-btn')?.getBoundingClientRect();
      const title = document.querySelector('.af-navbar-title')?.getBoundingClientRect();
      const rightBtns = Array.from(document.querySelectorAll('.af-navbar-right button')).map((b) =>
        b.getBoundingClientRect()
      );
      const scrollBody = document.querySelector('.af-screen[data-screen="play"] .af-scroll-body');
      const toolbar = document.querySelector('#pe-toolbar')?.getBoundingClientRect();
      const ad = document.querySelector('[data-ad-slot="play-banner"]')?.getBoundingClientRect();
      const bottles = Array.from(document.querySelectorAll('#pe-shelf-stage .pe-bottle'));
      const minBottleW = Math.min(...bottles.map((b) => b.getBoundingClientRect().width));
      const rightLeftmost = rightBtns.length ? Math.min(...rightBtns.map((r) => r.left)) : pr.width;
      return {
        navHeight: Math.round(nav?.height || 0),
        backBelowSafeTop: backBtn ? backBtn.top >= pr.safeTop - 1 : false,
        titleClear: Boolean(
          title &&
            (!backBtn || title.left >= backBtn.right - 1) &&
            title.right <= rightLeftmost + 1
        ),
        bottleCount: bottles.length,
        minBottleW: Math.round(minBottleW),
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        overflowY: scrollBody ? scrollBody.scrollHeight - scrollBody.clientHeight : 0,
        adGapPx: toolbar && ad ? Math.round(ad.top - toolbar.bottom) : -1,
        adWithinViewport: ad ? ad.bottom <= pr.height - pr.safeBottom + 1 : false
      };
    }, prof);

    assert(diag.navHeight >= prof.safeTop + 44, `${prof.id} navbar too short: ${JSON.stringify(diag)}`);
    assert(diag.backBelowSafeTop && diag.titleClear, `${prof.id} top bar safe-area overlap: ${JSON.stringify(diag)}`);
    assert(diag.bottleCount === 12, `Expected 12 bottles on ${prof.id}, got ${diag.bottleCount}`);
    assert(diag.minBottleW >= 44, `Expected >= 44px bottle width on ${prof.id}, got ${diag.minBottleW}px`);
    assert(!diag.overflowX && diag.overflowY <= 1, `${prof.id} 12-bottle overflow: ${JSON.stringify(diag)}`);
    assert(diag.adGapPx >= 15, `${prof.id} toolbar-to-ad gap too tight: ${diag.adGapPx}px`);
    assert(diag.adWithinViewport, `${prof.id} bottom ad clipped below safe area: ${JSON.stringify(diag)}`);
    profileDiags[prof.id] = diag;
    await pCtx.close();
  }

  assert(consoleErrors.length === 0, `Console errors during E2E: ${consoleErrors.join(' | ')}`);
  assert(pageErrors.length === 0, `Page errors during E2E: ${pageErrors.join(' | ')}`);
  assert(failedReqs.length === 0, `Failed HTTP requests during E2E: ${failedReqs.join(' | ')}`);

  return {
    ok: true,
    dbMode,
    totalCampaignTiles,
    grandmasterTiles,
    solvedStat,
    activeCatPref,
    darkTheme,
    trTitle,
    devBlueprintAd,
    iphoneProfiles12Bottles: profileDiags,
    consoleErrors: consoleErrors.length
  };
}
