/* ============================================================================
 * Orchard Logic — Screen 4: Play (Full-Focus Puzzle Scene v2 — 95+ Polish)
 * - Single-Tap X Toggle · Rapid Double-Tap Fruit · Locked AUTO_X (0 Ghost Undo!)
 * - Soft Dot (•) Auto-X vs Bold Manual X · Colorblind Corner Fruit Watermarks
 * - 5s + visibilitychange/pagehide SQLite Timer Persistence
 * - Multi-Conflict Explanation · Solved-State Action Bar (Replay / Next / Share)
 * - Botanical Confetti Burst + Cascade Victory Wave + Shareable Emoji Card
 * - Ad-Free Victory Sheet · Transparent "Watch Ad · +1 Hint" Disclosure
 * - Supports Campaign (30), Daily Harvest (60), & Endless Mode (6x6/8x8/10x10)
 * ============================================================================ */

import { AppFactory, escapeHtml } from '../../../../core-engine/js/engine.js';
import {
  CELL_EMPTY,
  CELL_X,
  CELL_FRUIT,
  CELL_AUTO_X,
  DEFAULT_FREE_HINTS,
  getTodayKey,
  getLevelById,
  getDailyLevelForDate,
  getActiveCampaignLevel,
  getAllPrefs,
  getPref,
  setPref,
  saveBoardProgress,
  completeLevel,
  recordEndlessRun,
  resetLevelProgress,
  consumeHint,
  grantRewardedHint,
  recordMistake
} from '../data/repository.js';
import { generateEndlessPuzzle } from '../endless-generator.js';
import { getFruitSvg, X_MARK_SVG, AUTO_DOT_SVG, UI_ICONS } from '../fruits.js';
import { gameAudio } from '../audio.js';
import {
  recomputeAutoX,
  analyzeBoard,
  findBlockingFruits,
  nextSingleTapState,
  computeSmartHint
} from '../game-logic.js';
import {
  formatDuration,
  loadFruitCatalog,
  getFruitName,
  openRulesSheet,
  gameHaptics
} from '../ui-helpers.js';

const { i18n, NativeBridge, adManager } = AppFactory;

const DEFAULT_DIRECT_PLAY_LEVEL_ID = 11;
const DOUBLE_TAP_MS = 340;
const FRUIT_EMOJIS = ['🍓', '🍇', '🍋', '🍏', '🍊', '🫐', '🍑', '🥝', '🍒', '🍍'];

/**
 * Lightweight Canvas Botanical Confetti Burst over the solved board (zero dependencies)
 */
function launchVictoryConfetti(hostEl) {
  if (!hostEl) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'ol-confetti-canvas';
  canvas.width = hostEl.clientWidth * 2;
  canvas.height = hostEl.clientHeight * 2;
  hostEl.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(2, 2);

  const W = hostEl.clientWidth;
  const H = hostEl.clientHeight;
  const colors = ['#E11D48', '#22C55E', '#FACC15', '#7C3AED', '#F97316', '#2563EB', '#10B981', '#FB7185'];
  const particles = Array.from({ length: 48 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.65;
    const speed = 3.2 + Math.random() * 5.6;
    return {
      x: W / 2 + (Math.random() - 0.5) * W * 0.45,
      y: H * 0.46 + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: 4 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.24,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1
    };
  });

  let frame = 0;
  function tick() {
    frame++;
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.16;
      p.vx *= 0.99;
      p.rot += p.vrot;
      p.life -= 0.015;
      if (p.life > 0 && p.y < H + 20) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65, 2);
        ctx.fill();
        ctx.restore();
      }
    }
    if (alive && frame < 95) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(tick);
}

export async function renderPlay({ container, leftSlot, rightSlot, titleEl, params = {}, router }) {
  gameAudio.setMode('game');

  if (leftSlot && leftSlot.childElementCount === 0) {
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'af-nav-btn';
    backBtn.setAttribute('aria-label', i18n.t('af.back'));
    backBtn.innerHTML = `${UI_ICONS.back}<span>${escapeHtml(i18n.t('af.back'))}</span>`;
    backBtn.addEventListener('click', () => {
      gameAudio.sfx.uiTap();
      gameHaptics.impact('LIGHT');
      router.switchTab('home');
    });
    leftSlot.appendChild(backBtn);
  }

  const isDailyMode = params.mode === 'daily';
  const isEndlessMode = params.mode === 'endless';
  let dayKey = params.dayKey || null;
  let level = null;

  const [prefs, fruitCatalog] = await Promise.all([getAllPrefs(), loadFruitCatalog()]);

  if (isEndlessMode) {
    try {
      level = params.endlessLevel || generateEndlessPuzzle(Number(params.gridSize) || 10);
    } catch (err) {
      console.error('[OrchardLogic Endless Init]', err);
      level = null;
    }
  } else if (isDailyMode) {
    const daily = await getDailyLevelForDate(dayKey || getTodayKey());
    if (daily) {
      level = daily.level;
      dayKey = daily.dayKey;
    }
  } else if (params.levelId != null && String(params.levelId).trim() !== '') {
    level = await getLevelById(Number(params.levelId));
  } else {
    level = (await getLevelById(DEFAULT_DIRECT_PLAY_LEVEL_ID)) || (await getActiveCampaignLevel());
  }

  if (!level) {
    container.innerHTML = `
      <div class="af-empty-state" style="margin:auto;">
        <div class="af-empty-icon">!</div>
        <h2 class="af-empty-title">${escapeHtml(i18n.t('play.error_not_found'))}</h2>
        <button type="button" id="btn-play-go-home" class="af-btn af-btn-primary">${escapeHtml(i18n.t('play.victory_home'))}</button>
      </div>
    `;
    container.querySelector('#btn-play-go-home')?.addEventListener('click', () => router.switchTab('home'));
    return () => {
      gameAudio.setMode('menu');
    };
  }

  const n = Number(level.grid_size);
  const regions = level.regions;
  const solution = level.solution;
  const isDaily = Boolean(level.is_daily || isDailyMode);
  const isEndless = Boolean(level.is_endless || isEndlessMode);
  if (isDaily && !dayKey) dayKey = getTodayKey();

  // Compute top-leftmost anchor cell for each region (for optional colorblind corner watermark)
  const regionAnchorCells = new Set();
  const seenAnchorRegs = new Set();
  for (let i = 0; i < regions.length; i++) {
    if (!seenAnchorRegs.has(regions[i])) {
      seenAnchorRegs.add(regions[i]);
      regionAnchorCells.add(i);
    }
  }

  // Navbar Centered 2-Line Title + Timer Subtitle + Right Music/Help Icons (0px optical offset on SE & Pro Max!)
  titleEl.textContent = isEndless
    ? i18n.t('play.title_endless', { size: n })
    : isDaily
      ? i18n.t('play.title_daily', { size: n })
      : i18n.t('play.title_level', { num: level.id, size: n });

  const timerPill = document.createElement('span');
  timerPill.className = 'ol-timer-pill ol-tabular';
  timerPill.id = 'ol-timer';

  const navCenter = document.createElement('div');
  navCenter.className = 'ol-nav-center';
  if (titleEl.parentNode) {
    titleEl.parentNode.insertBefore(navCenter, titleEl);
    navCenter.append(titleEl, timerPill);
  }

  const musicBtn = document.createElement('button');
  musicBtn.type = 'button';
  musicBtn.className = `af-nav-btn ol-help-btn ol-music-nav-btn${gameAudio.isMusicEnabled() ? ' is-music-on' : ''}`;
  musicBtn.id = 'btn-play-music';

  function syncPlayMusicBtn(isOn) {
    musicBtn.classList.toggle('is-music-on', isOn);
    musicBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    musicBtn.setAttribute('aria-label', i18n.t(isOn ? 'home.music_on_aria' : 'home.music_off_aria'));
    musicBtn.innerHTML = isOn ? UI_ICONS.musicOn : UI_ICONS.musicOff;
  }
  syncPlayMusicBtn(gameAudio.isMusicEnabled());
  const unsubAudio = gameAudio.onChange(({ music }) => syncPlayMusicBtn(music));

  musicBtn.addEventListener('click', async () => {
    const next = !gameAudio.isMusicEnabled();
    gameAudio.setMusicEnabled(next);
    gameAudio.sfx.uiTap();
    gameHaptics.selection();
    router.showToast(i18n.t(next ? 'home.music_on_toast' : 'home.music_off_toast'));
    try {
      await setPref('music_enabled', next);
    } catch { /* ignore */ }
  });

  const helpBtn = document.createElement('button');
  helpBtn.type = 'button';
  helpBtn.className = 'af-nav-btn ol-help-btn';
  helpBtn.id = 'btn-play-help';
  helpBtn.setAttribute('aria-label', i18n.t('home.rules_btn_aria'));
  helpBtn.innerHTML = UI_ICONS.help;
  helpBtn.addEventListener('click', () => {
    gameAudio.sfx.uiTap();
    gameHaptics.selection();
    openRulesSheet();
  });
  rightSlot.append(musicBtn, helpBtn);

  // Live Play Session State
  let autoXEnabled = Boolean(prefs.auto_x);
  const highlightConflicts = Boolean(prefs.highlight_conflicts);
  const colorblindHints = Boolean(prefs.colorblind_hints);
  let boardState = recomputeAutoX([...level.board_state], regions, n, autoXEnabled);
  let elapsedSeconds = Number(level.elapsed_seconds || 0);
  let hintsUsed = Number(level.hints_used || 0);
  let freeHintsLeft = Number(level.free_hints_left ?? DEFAULT_FREE_HINTS);
  let mistakesCount = Number(level.mistakes_count || 0);
  const undoStack = [];
  let activeHintCell = null;
  let activeHintContextCells = new Set();
  let activeHintElimCells = new Set();
  let activeHintMessage = null;
  let lockedCueMessage = null;
  let hintClearTimer = null;
  let lockedCueTimer = null;
  let regionPeekTimer = null;
  let victoryTimeout = null;
  let unlockSolvedBarTimer = null;
  let isDisposed = false;
  let hasModified = false;
  let lastSavedElapsed = elapsedSeconds;
  let lastVictoryResult = null;
  let isVictoryLocked = false;
  let shouldShowTransitionAd = false;
  let transitionAdCadenceLabel = '';
  let transitionAdShownForWin = false;

  // Double-tap state
  let lastTapIdx = -1;
  let lastTapAt = 0;
  let lastTapWasFruitRemoval = false;

  const initialAnalysis = analyzeBoard(boardState, regions, n);
  let hadConflictPreviously = initialAnalysis.conflictIndices.size > 0;
  let isSolved = Boolean(initialAnalysis.isSolved);

  timerPill.textContent = formatDuration(
    isSolved && elapsedSeconds === 0 && level.best_seconds != null
      ? level.best_seconds
      : elapsedSeconds
  );

  // Build Live Fruit Harvest Tray (0..N-1)
  const trayItemsMarkup = [];
  for (let reg = 0; reg < n; reg++) {
    trayItemsMarkup.push(
      `<span class="ol-tray-fruit" data-tray-region="${reg}" data-region="${reg}" role="img" tabindex="0">
        ${getFruitSvg(reg, 'ol-tray-fruit-svg')}
        <span class="ol-tray-check" aria-hidden="true">${UI_ICONS.checkMini}</span>
      </span>`
    );
  }

  // Build N x N board cells
  const cellsMarkup = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const idx = r * n + c;
      const reg = regions[idx];
      const edgeTop = r > 0 && regions[(r - 1) * n + c] !== reg ? ' ol-edge-top' : '';
      const edgeLeft = c > 0 && regions[r * n + (c - 1)] !== reg ? ' ol-edge-left' : '';
      const anchor = regionAnchorCells.has(idx) ? ' ol-region-anchor' : '';
      cellsMarkup.push(
        `<button type="button" class="ol-cell${edgeTop}${edgeLeft}${anchor}" data-idx="${idx}" data-r="${r}" data-c="${c}" data-region="${reg}"></button>`
      );
    }
  }

  container.innerHTML = `
    <div class="ol-hud-stack">
      <div
        class="ol-fruit-tray"
        id="ol-fruit-tray"
        data-grid-size="${n}"
        aria-label="${escapeHtml(i18n.t('play.tray_aria'))}"
      >${trayItemsMarkup.join('')}</div>

      <div class="ol-status-bar ol-status-bar--cue" id="ol-status-bar" role="status" aria-live="polite">
        <span class="ol-status-text" id="ol-status-text"></span>
      </div>
    </div>

    <div class="ol-board-stage" id="ol-board-stage">
      <div
        class="ol-board${colorblindHints ? ' is-colorblind' : ''}"
        id="ol-board"
        style="--grid-n: ${n};"
        role="grid"
        data-level-id="${level.id}"
        data-grid-size="${n}"
      >${cellsMarkup.join('')}</div>
    </div>

    <div class="ol-solved-bar" id="ol-solved-bar" style="display: none;">
      <button type="button" class="af-btn af-btn-secondary ol-solved-btn" id="btn-solved-replay">
        ${UI_ICONS.replay}
        <span>${escapeHtml(i18n.t('play.victory_replay'))}</span>
      </button>
      <button type="button" class="af-btn af-btn-tinted ol-solved-btn" id="btn-solved-share">
        ${UI_ICONS.share}
        <span>${escapeHtml(i18n.t('play.share_btn'))}</span>
      </button>
      <button type="button" class="af-btn af-btn-primary ol-solved-btn" id="btn-solved-next">
        ${UI_ICONS.playSolid}
        <span>${escapeHtml(i18n.t(isEndless ? 'play.victory_next_endless' : 'play.victory_next'))}</span>
      </button>
    </div>

    <div class="ol-toolbar" id="ol-toolbar">
      <button type="button" class="ol-tool-btn ol-tool-btn--undo" id="btn-tool-undo" disabled>
        <span class="ol-tool-icon">${UI_ICONS.undo}</span>
        <span class="ol-tool-label">${escapeHtml(i18n.t('play.tool_undo'))}</span>
      </button>
      <button type="button" class="ol-tool-btn ol-tool-btn--autox${autoXEnabled ? ' is-active' : ''}" id="btn-tool-autox" aria-pressed="${autoXEnabled ? 'true' : 'false'}">
        <span class="ol-tool-icon">${UI_ICONS.autoX}</span>
        <span class="ol-tool-label">${escapeHtml(i18n.t('play.tool_autox'))}</span>
      </button>
      <button type="button" class="ol-tool-btn ol-tool-btn--hint" id="btn-tool-hint">
        <span class="ol-hint-count${freeHintsLeft === 0 ? ' is-reward' : ''}" id="ol-hint-badge">${freeHintsLeft > 0 ? freeHintsLeft : '+1'}</span>
        <span class="ol-tool-icon">${UI_ICONS.hint}</span>
        <span class="ol-tool-label">${escapeHtml(i18n.t('play.tool_hint'))}</span>
      </button>
      <button type="button" class="ol-tool-btn ol-tool-btn--clear" id="btn-tool-reset">
        <span class="ol-tool-icon">${UI_ICONS.reset}</span>
        <span class="ol-tool-label">${escapeHtml(i18n.t('play.tool_clear'))}</span>
      </button>
    </div>

    <div class="ol-play-ad-zone">
      <div data-ad-slot="play-banner" data-ad-type="banner"></div>
    </div>
  `;

  const boardStageEl = container.querySelector('#ol-board-stage');
  const boardEl = container.querySelector('#ol-board');
  const fruitTrayEl = container.querySelector('#ol-fruit-tray');
  const trayEls = Array.from(fruitTrayEl.querySelectorAll('.ol-tray-fruit'));
  const statusBarEl = container.querySelector('#ol-status-bar');
  const statusTextEl = container.querySelector('#ol-status-text');
  const solvedBarEl = container.querySelector('#ol-solved-bar');
  const toolbarEl = container.querySelector('#ol-toolbar');
  const undoBtn = container.querySelector('#btn-tool-undo');
  const autoXBtn = container.querySelector('#btn-tool-autox');
  const hintBtn = container.querySelector('#btn-tool-hint');
  const hintBadgeEl = container.querySelector('#ol-hint-badge');
  const resetBtn = container.querySelector('#btn-tool-reset');
  const cellEls = Array.from(boardEl.querySelectorAll('.ol-cell'));

  function pulseRegionOnBoard(targetReg) {
    gameAudio.sfx.uiTap();
    gameHaptics.selection();
    cellEls.forEach((el) => {
      el.classList.toggle('is-region-peek', Number(el.dataset.region) === targetReg);
    });
    if (regionPeekTimer) clearTimeout(regionPeekTimer);
    regionPeekTimer = setTimeout(() => {
      cellEls.forEach((el) => el.classList.remove('is-region-peek'));
    }, 850);
  }

  trayEls.forEach((badge) => {
    const reg = Number(badge.dataset.trayRegion);
    badge.addEventListener('click', () => pulseRegionOnBoard(reg));
    badge.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        pulseRegionOnBoard(reg);
      }
    });
  });

  // Serialized SQLite persistence queue (skipped for ephemeral endless boards until solved)
  let persistChain = Promise.resolve();
  function queueSaveBoard(statusOverride = null) {
    if (isEndless) return persistChain;
    const snapshot = [...boardState];
    const snapElapsed = elapsedSeconds;
    const snapHints = hintsUsed;
    const snapFree = freeHintsLeft;
    const snapMistakes = mistakesCount;
    lastSavedElapsed = snapElapsed;
    const nextStatus = statusOverride || (isSolved ? 'completed' : 'in_progress');
    persistChain = persistChain
      .then(() =>
        saveBoardProgress(level.id, {
          boardState: snapshot,
          elapsedSeconds: snapElapsed,
          hintsUsed: snapHints,
          freeHintsLeft: snapFree,
          mistakesCount: snapMistakes,
          status: nextStatus,
          dayKey
        })
      )
      .catch((err) => console.error('[OrchardLogic Save]', err));
    return persistChain;
  }

  function clearActiveHintCue() {
    activeHintCell = null;
    activeHintContextCells = new Set();
    activeHintElimCells = new Set();
    activeHintMessage = null;
    if (hintClearTimer) {
      clearTimeout(hintClearTimer);
      hintClearTimer = null;
    }
  }

  function clearLockedCue() {
    lockedCueMessage = null;
    if (lockedCueTimer) {
      clearTimeout(lockedCueTimer);
      lockedCueTimer = null;
    }
    cellEls.forEach((el) => el.classList.remove('is-blocker-pulse'));
  }

  function formatRuleLabel(reason) {
    if (reason === 'row') return i18n.t('play.reason_row');
    if (reason === 'col') return i18n.t('play.reason_col');
    if (reason === 'region') return i18n.t('play.reason_region');
    if (reason === 'diag') return i18n.t('play.reason_diag');
    return '';
  }

  // Shows ALL violated rules together (e.g. "Rule clash: Same row · Same column")
  function getConflictMessage(reasons) {
    if (!reasons || reasons.length === 0) return i18n.t('play.conflict_generic');
    const labels = reasons.map(formatRuleLabel).filter(Boolean);
    if (labels.length === 0) return i18n.t('play.conflict_generic');
    return i18n.t('play.conflict_prefix', { reasons: labels.join(' · ') });
  }

  function buildShareText(result) {
    const header = isEndless
      ? `🍏 Fruitopia · ${i18n.t('play.title_endless', { size: n })}`
      : isDaily
        ? `🍏 Fruitopia · ${i18n.t('play.title_daily', { size: n })}`
        : `🍏 Fruitopia · ${i18n.t('play.title_level', { num: level.id, size: n })}`;
    const earnedStars = Math.max(1, Math.min(3, Number(result?.stars || level.stars || 3)));
    const starStr = '★'.repeat(earnedStars) + '☆'.repeat(3 - earnedStars);
    const sec =
      result?.elapsedSeconds ??
      (isSolved && level.best_seconds != null ? level.best_seconds : elapsedSeconds);
    const streakPart =
      result?.isDaily && result?.dailyStreak?.currentStreak
        ? ` · 🔥 ${i18n.t('home.streak_days', { count: result.dailyStreak.currentStreak })}`
        : '';
    const emojiRow1 = FRUIT_EMOJIS.slice(0, Math.min(5, n)).join('');
    const emojiRow2 = n > 5 ? '\n' + FRUIT_EMOJIS.slice(5, n).join('') : '';
    return `${header}\n⏱ ${formatDuration(sec)} · ${starStr}${streakPart}\n${emojiRow1}${emojiRow2}`;
  }

  async function shareResult(result) {
    gameAudio.sfx.uiTap();
    gameHaptics.selection();
    const text = buildShareText(result);
    try {
      const res = await NativeBridge.share({ title: i18n.t('app.name'), text });
      if (res?.fallback === 'clipboard') {
        router.showToast(i18n.t('play.share_copied'));
      }
    } catch {
      await NativeBridge.copyText(text);
      router.showToast(i18n.t('play.share_copied'));
    }
  }

  function syncHintBadge() {
    if (freeHintsLeft > 0) {
      hintBadgeEl.textContent = String(freeHintsLeft);
      hintBadgeEl.classList.remove('is-reward');
    } else {
      hintBadgeEl.textContent = '+1';
      hintBadgeEl.classList.add('is-reward');
    }
  }

  function renderBoardDOM() {
    const analysis = analyzeBoard(boardState, regions, n);
    const lang = i18n.getLang();

    for (let i = 0; i < cellEls.length; i++) {
      const el = cellEls[i];
      const val = boardState[i];
      const reg = regions[i];
      const r = Math.floor(i / n);
      const c = i % n;
      const isConflict = highlightConflicts && analysis.conflictIndices.has(i);
      const isHint = activeHintCell === i;
      const isHintCtx = !isHint && activeHintContextCells.has(i);
      const isHintElim = !isHint && !isHintCtx && activeHintElimCells.has(i);

      el.classList.toggle('is-x', val === CELL_X);
      el.classList.toggle('is-auto-x', val === CELL_AUTO_X);
      el.classList.toggle('is-fruit', val === CELL_FRUIT);
      el.classList.toggle('is-conflict', isConflict);
      el.classList.toggle('is-hint', isHint);
      el.classList.toggle('is-hint-context', isHintCtx);
      el.classList.toggle('is-hint-elim', isHintElim);
      el.classList.toggle('is-victory', isSolved && val === CELL_FRUIT);
      if (isSolved && val === CELL_FRUIT) {
        el.style.setProperty('--victory-delay', `${r * 55}ms`);
      }

      const prevKind = el.dataset.renderedKind || 'empty';
      const showWatermark = colorblindHints && val !== CELL_FRUIT && regionAnchorCells.has(i);
      const baseKind =
        val === CELL_FRUIT
          ? `fruit-${reg}`
          : val === CELL_X
            ? 'x-manual'
            : val === CELL_AUTO_X
              ? 'x-auto'
              : 'empty';
      const nextKind = showWatermark ? `${baseKind}+wm-${reg}` : baseKind;

      if (prevKind !== nextKind) {
        el.dataset.renderedKind = nextKind;
        const wmHtml = showWatermark ? getFruitSvg(reg, 'ol-watermark-svg') : '';
        if (val === CELL_FRUIT) {
          el.innerHTML = getFruitSvg(reg, 'ol-fruit-svg');
        } else if (val === CELL_X) {
          el.innerHTML = `${wmHtml}${X_MARK_SVG}`;
        } else if (val === CELL_AUTO_X) {
          el.innerHTML = `${wmHtml}${AUTO_DOT_SVG}`;
        } else {
          el.innerHTML = wmHtml;
        }
      }

      const fruitName = getFruitName(fruitCatalog, reg, lang);
      const ariaKey =
        val === CELL_FRUIT
          ? 'play.cell_aria_fruit'
          : val === CELL_X || val === CELL_AUTO_X
            ? 'play.cell_aria_x'
            : 'play.cell_aria_empty';
      el.setAttribute('aria-label', i18n.t(ariaKey, { row: r + 1, col: c + 1, fruit: fruitName }));
    }

    // Update Live Color-Changing Fruit Harvest Tray
    for (let reg = 0; reg < trayEls.length; reg++) {
      const badge = trayEls[reg];
      const st = analysis.regionStatus?.get(reg) || { placed: false, count: 0, hasConflict: false };
      const isConflict = highlightConflicts && st.hasConflict;
      const isFound = st.placed && !isConflict;
      badge.classList.toggle('is-found', isFound);
      badge.classList.toggle('is-conflict', isConflict);

      const fruitName = getFruitName(fruitCatalog, reg, lang);
      badge.setAttribute(
        'aria-label',
        i18n.t(st.placed ? 'play.tray_found_aria' : 'play.tray_missing_aria', { fruit: fruitName })
      );
    }

    // Update compact cue strip below tray (CLS = 0)
    statusBarEl.classList.remove('is-conflict', 'is-hint', 'is-success', 'is-locked');
    if (isSolved) {
      statusBarEl.classList.add('is-success');
      statusTextEl.textContent = i18n.t('play.status_solved');
    } else if (highlightConflicts && analysis.conflictIndices.size > 0) {
      statusBarEl.classList.add('is-conflict');
      statusTextEl.textContent = getConflictMessage(analysis.reasons);
    } else if (activeHintMessage) {
      statusBarEl.classList.add('is-hint');
      statusTextEl.textContent = activeHintMessage;
    } else if (lockedCueMessage) {
      statusBarEl.classList.add('is-locked');
      statusTextEl.textContent = lockedCueMessage;
    } else {
      statusTextEl.textContent =
        n === 4 ? i18n.t('play.tutorial_tip') : i18n.t('play.control_hint_short');
    }

    // Lock bottom controls & bottom banner during level-end celebration & while Victory Sheet is open (prevents accidental taps!)
    boardEl.classList.toggle('is-board-locked', isSolved || isVictoryLocked);
    const playAdZoneEl = container.querySelector('.ol-play-ad-zone');
    if (playAdZoneEl) playAdZoneEl.classList.toggle('is-transition-locked', isVictoryLocked);
    const solvedBtns = Array.from(solvedBarEl.querySelectorAll('button'));
    const toolBtns = Array.from(toolbarEl.querySelectorAll('button'));

    if (isVictoryLocked) {
      toolbarEl.style.display = 'none';
      solvedBarEl.style.display = 'grid';
      solvedBarEl.classList.add('is-transition-locked');
      solvedBtns.forEach((b) => { b.disabled = true; });
      toolBtns.forEach((b) => { b.disabled = true; });
    } else if (isSolved) {
      toolbarEl.style.display = 'none';
      solvedBarEl.style.display = 'grid';
      solvedBarEl.classList.remove('is-transition-locked');
      solvedBtns.forEach((b) => { b.disabled = false; });
      toolBtns.forEach((b) => { b.disabled = true; });
    } else {
      toolbarEl.style.display = 'grid';
      solvedBarEl.style.display = 'none';
      solvedBarEl.classList.remove('is-transition-locked');
      solvedBtns.forEach((b) => { b.disabled = true; });
      toolBtns.forEach((b) => { b.disabled = false; });
      undoBtn.disabled = undoStack.length === 0;
      hintBtn.disabled = false;
    }

    autoXBtn.classList.toggle('is-active', autoXEnabled);
    autoXBtn.setAttribute('aria-pressed', autoXEnabled ? 'true' : 'false');
    syncHintBadge();

    return analysis;
  }

  async function doCleanBoardReset() {
    lastTapIdx = -1;
    clearActiveHintCue();
    clearLockedCue();
    undoStack.length = 0;
    isSolved = false;
    isVictoryLocked = false;
    shouldShowTransitionAd = false;
    transitionAdShownForWin = false;
    hadConflictPreviously = false;
    elapsedSeconds = 0;
    lastSavedElapsed = 0;
    hintsUsed = 0;
    freeHintsLeft = DEFAULT_FREE_HINTS;
    mistakesCount = 0;
    hasModified = false;
    boardState = new Array(n * n).fill(CELL_EMPTY);

    await persistChain;
    if (!isEndless) {
      await resetLevelProgress(level.id, { keepBest: true, dayKey });
    }
    timerPill.textContent = formatDuration(0);
    startTimer();
    renderBoardDOM();
    gameAudio.sfx.clearCell();
  }

  /**
   * Level Transition Interstitial Policy:
   * - 6x6 and above (6x6, 8x8, 10x10, Daily, Endless): Show interstitial on EVERY transition.
   * - Simple levels (< 6x6, i.e. 4x4 & 5x5): Show interstitial once every 3 completions.
   */
  async function maybeShowLevelTransitionAd() {
    if (!shouldShowTransitionAd || transitionAdShownForWin) return;
    transitionAdShownForWin = true;
    await adManager.showTransitionInterstitial({
      slotId: n >= 6 ? 'transition-6plus' : 'transition-simple-3',
      cadenceLabel: transitionAdCadenceLabel
    });
  }

  async function goNextAfterSolved() {
    if (isVictoryLocked && !document.querySelector('#ol-victory-content')) return;
    gameAudio.sfx.uiTap();
    gameHaptics.impact('LIGHT');
    await maybeShowLevelTransitionAd();
    if (isDisposed) return;
    if (isEndless) {
      try {
        const fresh = generateEndlessPuzzle(n);
        router.replaceTop('play', { mode: 'endless', endlessLevel: fresh });
      } catch (err) {
        console.error('[Fruitopia Endless Next]', err);
        router.showToast(i18n.t('play.error_not_found'));
        router.switchTab('levels');
      }
      return;
    }
    const nextId = lastVictoryResult?.nextLevel?.id || (!isDaily && level.id < 30 ? level.id + 1 : null);
    if (nextId) {
      router.replaceTop('play', { levelId: nextId });
    } else {
      router.switchTab('levels');
    }
  }

  container.querySelector('#btn-solved-replay')?.addEventListener('click', async () => {
    if (isVictoryLocked) return;
    gameAudio.sfx.uiTap();
    await doCleanBoardReset();
    router.showToast(i18n.t('play.reset_toast'));
  });
  container.querySelector('#btn-solved-share')?.addEventListener('click', () => {
    if (isVictoryLocked) return;
    shareResult(lastVictoryResult);
  });
  container.querySelector('#btn-solved-next')?.addEventListener('click', () => {
    if (isVictoryLocked) return;
    goNextAfterSolved();
  });

  async function handleVictory() {
    isSolved = true;
    isVictoryLocked = true;
    transitionAdShownForWin = false;
    clearActiveHintCue();
    clearLockedCue();
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    const finalSeconds = Math.max(1, elapsedSeconds);
    elapsedSeconds = finalSeconds;
    timerPill.textContent = formatDuration(finalSeconds);
    gameAudio.sfx.victory();
    gameHaptics.notification('SUCCESS');
    renderBoardDOM();
    launchVictoryConfetti(boardStageEl);

    // Evaluate interstitial cadence right upon win (persisted in SQLite for <6x6)
    // - 8x8 & 10x10 (incl. Daily & Endless): EVERY transition.
    // - 6x6: EVERY transition, with a gentle 45s pacing floor if another ad just played on back-to-back speedruns.
    // - Simple (<6x6, 4x4 & 5x5): Once every 3 completions.
    if (n >= 8) {
      shouldShowTransitionAd = true;
      transitionAdCadenceLabel = i18n.t('play.ad_cadence_standard');
    } else if (n >= 6) {
      const sinceLastAd = Date.now() - (adManager.lastInterstitialAt || 0);
      shouldShowTransitionAd = adManager.lastInterstitialAt === 0 || sinceLastAd >= 45000;
      transitionAdCadenceLabel = i18n.t('play.ad_cadence_standard');
    } else {
      try {
        const rawCnt = await getPref('simple_ad_counter', '0');
        const nextCnt = (Math.max(0, parseInt(rawCnt, 10) || 0)) + 1;
        await setPref('simple_ad_counter', String(nextCnt));
        shouldShowTransitionAd = nextCnt % 3 === 0;
        transitionAdCadenceLabel = i18n.t('play.ad_cadence_simple');
      } catch {
        shouldShowTransitionAd = false;
      }
    }

    await persistChain;
    const result = isEndless
      ? await recordEndlessRun({
          gridSize: n,
          elapsedSeconds: finalSeconds,
          hintsUsed,
          mistakesCount,
          parSeconds: level.par_seconds
        })
      : await completeLevel(level.id, {
          boardState,
          elapsedSeconds: finalSeconds,
          hintsUsed,
          freeHintsLeft,
          mistakesCount,
          dayKey
        });

    lastVictoryResult = result;
    if (isDisposed) return;

    victoryTimeout = setTimeout(() => {
      if (isDisposed) return;
      openVictorySheet(result);
    }, 620);
  }

  function openVictorySheet(result) {
    const titleText = result.isEndless
      ? i18n.t('play.victory_title_endless', { size: n })
      : result.isDaily
        ? i18n.t('play.victory_title_daily')
        : i18n.t('play.victory_title_level', { num: level.id });

    let subText = i18n.t('play.victory_sub_default');
    if (result.isDaily && result.dailyStreak) {
      subText = i18n.t('play.victory_sub_daily', { streak: result.dailyStreak.currentStreak });
    } else if (result.isNewBest) {
      subText = i18n.t('play.victory_sub_newbest');
    }

    const starsMarkup = [1, 2, 3]
      .map(
        (idx) =>
          `<span class="ol-victory-star${idx <= result.stars ? '' : ' is-dim'}" style="animation-delay: ${(idx - 1) * 90}ms;">${UI_ICONS.starBig}</span>`
      )
      .join('');

    const primaryActionHtml = result.isEndless
      ? `<button type="button" id="btn-victory-next" class="af-btn af-btn-primary af-btn-block">${UI_ICONS.infinity}<span>${escapeHtml(i18n.t('play.victory_next_endless'))}</span></button>`
      : result.nextLevel
        ? `<button type="button" id="btn-victory-next" class="af-btn af-btn-primary af-btn-block">${UI_ICONS.playSolid}<span>${escapeHtml(i18n.t('play.victory_next'))}</span></button>`
        : `<button type="button" id="btn-victory-levels-primary" class="af-btn af-btn-primary af-btn-block">${escapeHtml(i18n.t('play.victory_levels'))}</button>`;

    const secondaryActionHtml =
      result.nextLevel || result.isEndless
        ? `<button type="button" id="btn-victory-levels" class="af-btn af-btn-secondary af-btn-block">${escapeHtml(i18n.t('play.victory_levels'))}</button>`
        : `<button type="button" id="btn-victory-home" class="af-btn af-btn-secondary af-btn-block">${escapeHtml(i18n.t('play.victory_home'))}</button>`;

    let navigatingFromVictory = false;

    // AD-FREE Victory Celebration Sheet — bottom buttons stay locked while open!
    router.openSheet({
      title: i18n.t('play.victory_sheet_title'),
      onClose: () => {
        if (isDisposed || navigatingFromVictory) return;
        // Brief accidental-tap shield before unlocking bottom solved bar
        if (unlockSolvedBarTimer) clearTimeout(unlockSolvedBarTimer);
        unlockSolvedBarTimer = setTimeout(() => {
          if (isDisposed) return;
          isVictoryLocked = false;
          renderBoardDOM();
        }, 280);
      },
      render: (body, close) => {
        body.innerHTML = `
          <div class="ol-victory-header" id="ol-victory-content">
            <div class="ol-victory-stars" aria-label="${result.stars} / 3">${starsMarkup}</div>
            <h3 class="ol-victory-title">${escapeHtml(titleText)}</h3>
            <p class="ol-victory-sub">${escapeHtml(subText)}</p>
          </div>

          <div class="ol-victory-stats">
            <div class="ol-victory-stat">
              <div class="ol-victory-stat-val">${escapeHtml(formatDuration(result.elapsedSeconds))}</div>
              <div class="ol-victory-stat-lbl">${escapeHtml(i18n.t('play.victory_stat_time'))}</div>
            </div>
            <div class="ol-victory-stat">
              <div class="ol-victory-stat-val">${result.mistakesCount}</div>
              <div class="ol-victory-stat-lbl">${escapeHtml(i18n.t('play.victory_stat_mistakes'))}</div>
            </div>
            <div class="ol-victory-stat">
              <div class="ol-victory-stat-val">${result.hintsUsed}</div>
              <div class="ol-victory-stat-lbl">${escapeHtml(i18n.t('play.victory_stat_hints'))}</div>
            </div>
          </div>

          <div class="ol-victory-actions">
            ${primaryActionHtml}
            <button type="button" id="btn-victory-share" class="af-btn af-btn-tinted af-btn-block">
              ${UI_ICONS.share}
              <span>${escapeHtml(i18n.t('play.share_result_btn'))}</span>
            </button>
            ${secondaryActionHtml}
          </div>
        `;

        body.querySelector('#btn-victory-next')?.addEventListener('click', async () => {
          navigatingFromVictory = true;
          close();
          await goNextAfterSolved();
        });

        body.querySelector('#btn-victory-share')?.addEventListener('click', () => shareResult(result));

        body.querySelector('#btn-victory-levels-primary')?.addEventListener('click', async () => {
          navigatingFromVictory = true;
          gameAudio.sfx.uiTap();
          gameHaptics.selection();
          close();
          await maybeShowLevelTransitionAd();
          if (!isDisposed) router.switchTab('levels');
        });

        body.querySelector('#btn-victory-levels')?.addEventListener('click', async () => {
          navigatingFromVictory = true;
          gameAudio.sfx.uiTap();
          gameHaptics.selection();
          close();
          await maybeShowLevelTransitionAd();
          if (!isDisposed) router.switchTab('levels');
        });

        body.querySelector('#btn-victory-home')?.addEventListener('click', async () => {
          navigatingFromVictory = true;
          gameAudio.sfx.uiTap();
          gameHaptics.selection();
          close();
          await maybeShowLevelTransitionAd();
          if (!isDisposed) router.switchTab('home');
        });
      }
    });
  }

  /**
   * Locked AUTO_X Feedback (0 Ghost Undo, 0 Unfair Mistake!)
   */
  function notifyLockedAutoX(idx) {
    const { blockers, reasons } = findBlockingFruits(boardState, regions, n, idx);
    gameAudio.sfx.locked();
    gameHaptics.selection();

    blockers.forEach((bIdx) => {
      const el = cellEls[bIdx];
      if (!el) return;
      el.classList.remove('is-blocker-pulse');
      void el.offsetWidth;
      el.classList.add('is-blocker-pulse');
    });

    const reasonText = reasons.map(formatRuleLabel).filter(Boolean).join(' · ');
    lockedCueMessage = reasonText
      ? i18n.t('play.locked_cell_reason', { reasons: reasonText })
      : i18n.t('play.locked_cell_generic');

    if (lockedCueTimer) clearTimeout(lockedCueTimer);
    lockedCueTimer = setTimeout(() => {
      lockedCueMessage = null;
      cellEls.forEach((el) => el.classList.remove('is-blocker-pulse'));
      if (!isDisposed) renderBoardDOM();
    }, 2200);

    renderBoardDOM();
  }

  /**
   * Single Tap vs Rapid Double-Tap Logic:
   * - AUTO_X cell             -> Locked! Pulses blocking fruit, ZERO undo pollution, ZERO unfair mistake.
   * - Single tap on EMPTY     -> MANUAL_X (0ms instant)
   * - Single tap on MANUAL_X  -> EMPTY (clears X; never accidentally places fruit!)
   * - Single tap on FRUIT     -> EMPTY (clears fruit)
   * - Rapid double tap (<= 340ms on same non-locked, non-fruit cell) -> Places CELL_FRUIT!
   */
  function applyCellTap(idx) {
    if (isSolved) return;
    clearActiveHintCue();

    const prevVal = boardState[idx];

    // Strict Lock on AUTO_X cells (fixes BOTH Ghost Undo & Unfair Mistake bugs!)
    if (prevVal === CELL_AUTO_X) {
      lastTapIdx = -1;
      lastTapAt = 0;
      notifyLockedAutoX(idx);
      return;
    }

    clearLockedCue();
    const now = Date.now();
    const isDoubleTap =
      idx === lastTapIdx &&
      !lastTapWasFruitRemoval &&
      now - lastTapAt <= DOUBLE_TAP_MS;

    let nextVal;
    if (isDoubleTap) {
      lastTapIdx = -1;
      lastTapAt = 0;
      lastTapWasFruitRemoval = false;
      nextVal = CELL_FRUIT;
      if (undoStack.length === 0) undoStack.push([...boardState]);
    } else {
      nextVal = nextSingleTapState(prevVal);
      if (prevVal === CELL_FRUIT) {
        lastTapIdx = -1;
        lastTapAt = 0;
        lastTapWasFruitRemoval = true;
      } else {
        lastTapIdx = idx;
        lastTapAt = now;
        lastTapWasFruitRemoval = false;
      }
      undoStack.push([...boardState]);
    }

    boardState[idx] = nextVal;
    boardState = recomputeAutoX(boardState, regions, n, autoXEnabled);
    hasModified = true;

    const analysis = renderBoardDOM();
    const hasConflictNow = analysis.conflictIndices.size > 0;

    if (nextVal === CELL_FRUIT) {
      if (analysis.conflictIndices.has(idx)) {
        mistakesCount += 1;
        gameAudio.sfx.conflict();
        gameHaptics.notification('ERROR');
        if (!isEndless) {
          persistChain = persistChain
            .then(() => recordMistake(level.id, { dayKey }))
            .catch(() => { /* ignore */ });
        }
      } else {
        gameAudio.sfx.placeFruit(analysis.fruitCount, n);
        gameHaptics.impact('MEDIUM');
        // Juicy floating sparkle burst right on valid fruit placement
        const targetCell = cellEls[idx];
        if (targetCell && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
          const burst = document.createElement('span');
          burst.className = 'ol-pop-burst';
          burst.setAttribute('aria-hidden', 'true');
          targetCell.appendChild(burst);
          setTimeout(() => burst.remove(), 460);
        }
      }
    } else if (nextVal === CELL_X) {
      gameAudio.sfx.markX();
      gameHaptics.selection();
    } else {
      if (hadConflictPreviously && !hasConflictNow) {
        gameAudio.sfx.conflictResolved();
      } else {
        gameAudio.sfx.clearCell();
      }
      gameHaptics.selection();
    }

    hadConflictPreviously = hasConflictNow;

    if (analysis.isSolved) {
      handleVictory();
    } else {
      queueSaveBoard('in_progress');
    }
  }

  // Pointer-based Tap + Drag-to-Mark X (safe around Fruits & AUTO_X)
  let dragState = null;
  let handledByPointerUpAt = 0;

  function clearDragHighlights() {
    boardEl.querySelectorAll('.ol-cell.is-dragging').forEach((el) => el.classList.remove('is-dragging'));
  }

  function onBoardPointerDown(e) {
    if (isSolved || e.button === 2) return;
    const cell = e.target.closest('.ol-cell');
    if (!cell || !boardEl.contains(cell)) return;

    const idx = Number(cell.dataset.idx);
    const startVal = boardState[idx];
    dragState = {
      pointerId: e.pointerId,
      startIdx: idx,
      allowDrag: startVal === CELL_EMPTY || startVal === CELL_X,
      hasDragged: false,
      dragMode: null,
      visited: new Set([idx]),
      snapshot: [...boardState],
      changed: false
    };
  }

  function onWindowPointerMove(e) {
    if (!dragState || !dragState.allowDrag || e.pointerId !== dragState.pointerId || isSolved) return;
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('.ol-cell');
    if (!hit || !boardEl.contains(hit)) return;

    const idx = Number(hit.dataset.idx);
    if (dragState.visited.has(idx)) return;

    if (!dragState.hasDragged) {
      dragState.hasDragged = true;
      lastTapIdx = -1;
      clearActiveHintCue();
      clearLockedCue();

      const startVal = dragState.snapshot[dragState.startIdx];
      dragState.dragMode = startVal === CELL_X ? 'erase_x' : 'add_x';

      if (dragState.dragMode === 'add_x' && boardState[dragState.startIdx] === CELL_EMPTY) {
        boardState[dragState.startIdx] = CELL_X;
        dragState.changed = true;
      } else if (dragState.dragMode === 'erase_x' && boardState[dragState.startIdx] === CELL_X) {
        boardState[dragState.startIdx] = CELL_EMPTY;
        dragState.changed = true;
      }
      cellEls[dragState.startIdx]?.classList.add('is-dragging');
      if (dragState.changed) {
        if (dragState.dragMode === 'erase_x') gameAudio.sfx.clearCell();
        else gameAudio.sfx.markX();
        gameHaptics.selection();
        renderBoardDOM();
      }
    }

    dragState.visited.add(idx);
    hit.classList.add('is-dragging');

    if (dragState.dragMode === 'add_x' && boardState[idx] === CELL_EMPTY) {
      boardState[idx] = CELL_X;
      dragState.changed = true;
      gameAudio.sfx.markX();
      gameHaptics.selection();
      renderBoardDOM();
    } else if (dragState.dragMode === 'erase_x' && boardState[idx] === CELL_X) {
      boardState[idx] = CELL_EMPTY;
      dragState.changed = true;
      gameAudio.sfx.clearCell();
      gameHaptics.selection();
      renderBoardDOM();
    }
  }

  function onWindowPointerUp(e) {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    const finished = dragState;
    dragState = null;
    clearDragHighlights();
    handledByPointerUpAt = Date.now();

    if (!finished.hasDragged) {
      const hasCoords = Number.isFinite(e.clientX) && Number.isFinite(e.clientY) && (e.clientX !== 0 || e.clientY !== 0);
      if (hasCoords) {
        const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('.ol-cell');
        if (!hit || Number(hit.dataset.idx) !== finished.startIdx) return;
      }
      applyCellTap(finished.startIdx);
    } else if (finished.changed) {
      undoStack.push(finished.snapshot);
      hasModified = true;
      renderBoardDOM();
      queueSaveBoard('in_progress');
    }
  }

  function onWindowPointerCancel(e) {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    const finished = dragState;
    dragState = null;
    clearDragHighlights();
    handledByPointerUpAt = Date.now();

    if (finished.hasDragged && finished.changed) {
      undoStack.push(finished.snapshot);
      hasModified = true;
      renderBoardDOM();
      queueSaveBoard('in_progress');
    }
  }

  boardEl.addEventListener('click', (e) => {
    if (e.detail > 0 && Date.now() - handledByPointerUpAt < 350) return;
    if (Date.now() - handledByPointerUpAt < 120) return;
    const cell = e.target.closest('.ol-cell');
    if (!cell || !boardEl.contains(cell)) return;
    applyCellTap(Number(cell.dataset.idx));
  });

  boardEl.addEventListener('pointerdown', onBoardPointerDown);
  window.addEventListener('pointermove', onWindowPointerMove);
  window.addEventListener('pointerup', onWindowPointerUp);
  window.addEventListener('pointercancel', onWindowPointerCancel);

  // Toolbar 1: Unlimited Undo
  undoBtn.addEventListener('click', () => {
    if (undoStack.length === 0 || isSolved) return;
    lastTapIdx = -1;
    clearActiveHintCue();
    clearLockedCue();
    const prev = undoStack.pop();
    boardState = recomputeAutoX(prev, regions, n, autoXEnabled);
    hasModified = true;
    gameAudio.sfx.undo();
    gameHaptics.selection();
    const analysis = renderBoardDOM();
    hadConflictPreviously = analysis.conflictIndices.size > 0;
    queueSaveBoard('in_progress');
  });

  // Toolbar 2: Auto-X Toggle
  autoXBtn.addEventListener('click', async () => {
    autoXEnabled = !autoXEnabled;
    clearLockedCue();
    boardState = recomputeAutoX(boardState, regions, n, autoXEnabled);
    gameAudio.sfx.uiTap();
    gameHaptics.selection();
    renderBoardDOM();
    router.showToast(i18n.t(autoXEnabled ? 'play.autox_on_toast' : 'play.autox_off_toast'));
    try {
      await setPref('auto_x', autoXEnabled);
    } catch { /* ignore */ }
    if (!isSolved && hasModified) queueSaveBoard('in_progress');
  });

  // Toolbar 3: Smart Hint (2 Free + Transparent "Watch Ad · +1 Hint")
  async function executeSmartHint({ isFree }) {
    const hint = computeSmartHint(boardState, regions, solution, n);
    if (hint.action === 'none') {
      router.showToast(i18n.t('play.hint_none'));
      return;
    }

    lastTapIdx = -1;
    clearLockedCue();
    undoStack.push([...boardState]);
    if (hint.action === 'remove_wrong') {
      boardState[hint.index] = CELL_X;
    } else if (hint.action === 'place_fruit') {
      boardState[hint.index] = CELL_FRUIT;
    }
    boardState = recomputeAutoX(boardState, regions, n, autoXEnabled);
    hasModified = true;

    if (isEndless) {
      hintsUsed += 1;
      if (isFree && freeHintsLeft > 0) freeHintsLeft -= 1;
    } else {
      const counters = await consumeHint(level.id, { isFree, dayKey });
      hintsUsed = counters.hintsUsed;
      freeHintsLeft = counters.freeHintsLeft;
    }

    const fruitName = getFruitName(fruitCatalog, hint.colorId, i18n.getLang());
    activeHintCell = hint.index;
    activeHintContextCells = new Set(Array.isArray(hint.contextIndices) ? hint.contextIndices : []);
    activeHintElimCells = new Set(Array.isArray(hint.eliminatedIndices) ? hint.eliminatedIndices : []);

    const reasonKeyMap = {
      wrong_fruit: 'play.hint_removed',
      wrong_x: 'play.hint_wrong_x',
      only_in_region: 'play.hint_only_region',
      only_in_row: 'play.hint_only_row',
      only_in_col: 'play.hint_only_col',
      line_lock_row: 'play.hint_line_row',
      line_lock_col: 'play.hint_line_col',
      narrow_region: 'play.hint_narrow_region'
    };
    const msgKey = reasonKeyMap[hint.reason] || (hint.action === 'remove_wrong' ? 'play.hint_removed' : 'play.hint_placed');
    activeHintMessage = i18n.t(msgKey, { fruit: fruitName });

    if (hintClearTimer) clearTimeout(hintClearTimer);
    hintClearTimer = setTimeout(() => {
      activeHintCell = null;
      activeHintContextCells = new Set();
      activeHintElimCells = new Set();
      activeHintMessage = null;
      if (!isDisposed) renderBoardDOM();
    }, 4500);

    gameAudio.sfx.hint();
    gameHaptics.impact('MEDIUM');
    const analysis = renderBoardDOM();

    if (analysis.isSolved) {
      handleVictory();
    } else {
      queueSaveBoard('in_progress');
    }
  }

  function openRewardedHintSheet() {
    router.openSheet({
      title: i18n.t('play.reward_sheet_title'),
      render: (body, close) => {
        body.innerHTML = `
          <div class="af-card" style="margin-bottom: var(--space-4);">
            <p style="margin: 0; font-size: var(--text-subhead); color: var(--label-secondary); line-height: 1.5;">
              ${escapeHtml(i18n.t('play.reward_desc'))}
            </p>
          </div>
          <div class="ol-victory-actions">
            <button type="button" id="btn-reward-unlock" class="af-btn af-btn-primary af-btn-block">
              ${UI_ICONS.videoAd}
              <span>${escapeHtml(i18n.t('play.reward_cta'))}</span>
            </button>
            <button type="button" id="btn-reward-cancel" class="af-btn af-btn-secondary af-btn-block">
              ${escapeHtml(i18n.t('af.cancel'))}
            </button>
          </div>
        `;

        body.querySelector('#btn-reward-cancel')?.addEventListener('click', () => close());
        body.querySelector('#btn-reward-unlock')?.addEventListener('click', async (ev) => {
          const btn = ev.currentTarget;
          btn.disabled = true;
          gameAudio.sfx.uiTap();
          gameHaptics.impact('MEDIUM');
          const adResult = await adManager.showRewardedHintAd();
          if (adResult?.cancelled) {
            btn.disabled = false;
            close();
            return;
          }

          if (isEndless) {
            freeHintsLeft += 1;
          } else {
            const updated = await grantRewardedHint(level.id, 1, { dayKey });
            freeHintsLeft = updated.freeHintsLeft;
          }
          syncHintBadge();
          close();
          router.showToast(i18n.t('play.reward_unlocked_toast'));
          if (!isSolved) {
            await executeSmartHint({ isFree: true });
          }
        });
      }
    });
  }

  hintBtn.addEventListener('click', async () => {
    if (isSolved) return;
    if (freeHintsLeft > 0) {
      await executeSmartHint({ isFree: true });
    } else {
      gameAudio.sfx.uiTap();
      openRewardedHintSheet();
    }
  });

  // Toolbar 4: Reset / Clear Board
  resetBtn.addEventListener('click', async () => {
    gameAudio.sfx.uiTap();
    const confirmed = await router.showAlert({
      title: i18n.t('play.reset_title'),
      message: i18n.t('play.reset_message'),
      confirmText: i18n.t('play.reset_confirm'),
      cancelText: i18n.t('af.cancel'),
      destructive: true
    });
    if (!confirmed) return;
    await doCleanBoardReset();
    router.showToast(i18n.t('play.reset_toast'));
  });

  // 1-second stopwatch + 2-second idle SQLite flush + immediate pagehide/visibilitychange flush!
  let timerId = null;
  function flushElapsedNow() {
    if (isDisposed || isSolved || isEndless) return;
    if (elapsedSeconds > lastSavedElapsed && (hasModified || level.status === 'in_progress')) {
      queueSaveBoard('in_progress');
    }
  }

  function onVisibilityOrHide() {
    if (document.visibilityState === 'hidden') {
      flushElapsedNow();
    }
  }

  window.addEventListener('pagehide', flushElapsedNow);
  document.addEventListener('visibilitychange', onVisibilityOrHide);

  function startTimer() {
    if (timerId) clearInterval(timerId);
    if (isSolved) return;
    timerId = setInterval(() => {
      if (isDisposed || isSolved || document.visibilityState === 'hidden') return;
      elapsedSeconds += 1;
      timerPill.textContent = formatDuration(elapsedSeconds);
      if (elapsedSeconds - lastSavedElapsed >= 2 && (hasModified || level.status === 'in_progress')) {
        queueSaveBoard('in_progress');
      }
    }, 1000);
  }

  renderBoardDOM();
  startTimer();

  return () => {
    isDisposed = true;
    unsubAudio();
    gameAudio.setMode('menu');
    window.removeEventListener('pagehide', flushElapsedNow);
    document.removeEventListener('visibilitychange', onVisibilityOrHide);
    if (timerId) clearInterval(timerId);
    if (hintClearTimer) clearTimeout(hintClearTimer);
    if (lockedCueTimer) clearTimeout(lockedCueTimer);
    if (regionPeekTimer) clearTimeout(regionPeekTimer);
    if (victoryTimeout) clearTimeout(victoryTimeout);
    if (unlockSolvedBarTimer) clearTimeout(unlockSolvedBarTimer);
    boardEl.removeEventListener('pointerdown', onBoardPointerDown);
    window.removeEventListener('pointermove', onWindowPointerMove);
    window.removeEventListener('pointerup', onWindowPointerUp);
    window.removeEventListener('pointercancel', onWindowPointerCancel);
    if (!isSolved && !isEndless && (hasModified || (level.status === 'in_progress' && elapsedSeconds > lastSavedElapsed))) {
      queueSaveBoard('in_progress');
    }
  };
}
