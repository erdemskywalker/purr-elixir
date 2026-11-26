/* ============================================================================
 * Screen 4: PLAY — Full-Focus Crystal Elixir Apothecary Stage (hideTabBar: true)
 * - Zero scroll on iPhone SE (375x667) & Pro Max (430x932), even at 12-14 vials
 * - Live Talking Cat Bar (56px fixed height, CLS = 0) + combo pill + 12s nudge
 * - Smooth pouring tilt animation + glowing SVG liquid arc + cat-ear cork pop
 * - Unlimited Undo, 2 Free BFS Hints + Rewarded Opt-In (+1 Hint / +1 Flask)
 * - Ad-Free Victory Sheet with Customer Cat Delivery + Graduated Interstitials
 * ============================================================================ */

import { AppFactory, escapeHtml } from '../../../../core-engine/js/engine.js';
import {
  advanceSimpleAdCounter,
  clearLevelUndoHistory,
  completeLevel,
  DEFAULT_FREE_HINTS,
  getActiveCampaignLevel,
  getActiveCat,
  getAllPrefs,
  getCatCompanions,
  getDailyLevelForDate,
  getLevelById,
  getLevelUndoHistory,
  getTodayKey,
  MAX_EXTRA_FLASKS,
  recordEndlessRun,
  resetLevelProgress,
  saveLevelProgress,
  saveLevelUndoHistory,
  setPref
} from '../data/repository.js';
import {
  applyPour,
  canPour,
  cloneBottles,
  countSealedBottles,
  findBestHint,
  generateEndlessLevel,
  isBottleSealed,
  isDeadlocked,
  isSolved,
  topColor
} from '../elixir-engine.js';
import {
  getCatCorkSvg,
  getCatDialogue,
  getCatSvg,
  getSparkleBurstSvg,
  getVisitorDeliveryQuote,
  UI_ICONS
} from '../cats.js';
import { gameAudio } from '../audio.js';
import {
  gameHaptics,
  getElixirName,
  getLocalized,
  loadElixirCatalog,
  openRulesSheet,
  renderStarsHtml
} from '../ui-helpers.js';

const { i18n, adManager, NativeBridge } = AppFactory;

const CHEVRON_LEFT_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>`;

// Tracks last standard interstitial timestamp across plays for 45s pacing on fast 4-5 color shelves
let lastStandardTransitionAdAt = 0;

function computeShelfLayout(bottleCount) {
  if (bottleCount <= 5) {
    return { rows: [bottleCount], rowCount: 1, maxCols: bottleCount };
  }
  const top = Math.ceil(bottleCount / 2);
  const bottom = bottleCount - top;
  return { rows: [top, bottom], rowCount: 2, maxCols: Math.max(top, bottom) };
}

export async function renderPlay({ container, leftSlot, rightSlot, titleEl, params = {}, router }) {
  gameAudio.setMode('game');

  const isEndless = params.mode === 'endless';
  const isDaily = params.mode === 'daily';
  const dailyDayKey = isDaily ? params.dayKey || getTodayKey() : null;

  const [catalog, activeCat, allCats, prefs] = await Promise.all([
    loadElixirCatalog(),
    getActiveCat(),
    getCatCompanions(),
    getAllPrefs()
  ]);

  let level = null;
  if (isEndless) {
    const unlockedCats = allCats.filter((c) => c.is_unlocked);
    level = generateEndlessLevel(params.difficulty || 'easy', unlockedCats.length ? unlockedCats : allCats);
  } else if (isDaily) {
    if (params.levelId) {
      level = await getLevelById(Number(params.levelId), { dayKey: dailyDayKey });
    }
    if (!level) {
      const daily = await getDailyLevelForDate(dailyDayKey);
      level = daily?.level || null;
    }
  } else if (params.levelId) {
    level = await getLevelById(Number(params.levelId));
  }

  if (!level) {
    level = await getActiveCampaignLevel();
  }

  if (!level) {
    container.innerHTML = `
      <div class="af-empty-state">
        <div class="af-empty-icon">!</div>
        <h2 class="af-empty-title">${escapeHtml(i18n.t('af.error_title'))}</h2>
        <button type="button" id="btn-play-back-home" class="af-btn af-btn-primary">${escapeHtml(i18n.t('victory.btn_home'))}</button>
      </div>
    `;
    container.querySelector('#btn-play-back-home')?.addEventListener('click', () => router.switchTab('home'));
    return;
  }

  // If re-entering an already solved campaign/daily level, start fresh from initial_bottles
  const resumeInProgress =
    !isEndless &&
    level.status === 'in_progress' &&
    Array.isArray(level.bottles_state) &&
    level.bottles_state.length > 0 &&
    !isSolved(level.bottles_state);

  const initialBottles = cloneBottles(level.initial_bottles);
  let bottles = resumeInProgress ? cloneBottles(level.bottles_state) : cloneBottles(initialBottles);
  let movesCount = resumeInProgress ? Number(level.moves_count || 0) : 0;
  let extraFlasksUsed = resumeInProgress ? Number(level.extra_flasks_used || 0) : 0;
  let hintsUsed = resumeInProgress ? Number(level.hints_used || 0) : 0;
  let freeHintsLeft = resumeInProgress ? Number(level.free_hints_left ?? DEFAULT_FREE_HINTS) : DEFAULT_FREE_HINTS;
  let maxCombo = resumeInProgress ? Number(level.max_combo || 0) : 0;

  let selectedIdx = null;
  let activeHint = null; // { from, to }
  let combo = 0;
  let lastGoodPourAt = 0;
  let isAnimating = false;
  let isHintBusy = false;
  let isWon = false;
  let transitionAdHandled = false;
  let disposed = false;
  let lastVictoryResult = null;
  const undoStack = resumeInProgress && level.id != null
    ? await getLevelUndoHistory(level.id, { dayKey: dailyDayKey })
    : [];

  const catTalkEnabled = Boolean(prefs.cat_talk_enabled);
  const activeCatId = activeCat?.id || 'mochi';
  const activeCatTone = activeCat?.tone_key || 'cheerful';
  const lang = i18n.getLang();

  let idleTimer = null;
  let moodTimer = null;
  let postWinUnlockTimer = null;

  // Ensure Back button exists even on direct URL navigation (?route=play)
  if (leftSlot && leftSlot.childElementCount === 0) {
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'af-nav-btn';
    backBtn.setAttribute('aria-label', i18n.t('af.back'));
    backBtn.innerHTML = `${CHEVRON_LEFT_SVG}<span>${escapeHtml(i18n.t('af.back'))}</span>`;
    backBtn.addEventListener('click', () => {
      gameAudio.sfx.uiTap();
      router.switchTab('home');
    });
    leftSlot.appendChild(backBtn);
  }

  // Right Navbar Controls (Music & Rules — strict 44x44pt)
  const musicOn = gameAudio.isMusicEnabled();
  rightSlot.innerHTML = `
    <button type="button" id="btn-play-music" class="pe-icon-pill${musicOn ? ' is-on' : ''}" aria-label="${escapeHtml(i18n.t('home.music_toggle'))}" aria-pressed="${musicOn ? 'true' : 'false'}">
      ${musicOn ? UI_ICONS.musicOn : UI_ICONS.musicOff}
    </button>
    <button type="button" id="btn-play-rules" class="pe-icon-pill" aria-label="${escapeHtml(i18n.t('home.rules_open'))}">
      ${UI_ICONS.rules}
    </button>
  `;

  const mainTitleText = isEndless
    ? i18n.t('play.title_endless', { count: level.color_count })
    : isDaily
      ? i18n.t('play.title_daily', { count: level.color_count })
      : i18n.t('play.title_level', { id: level.id, count: level.color_count });

  titleEl.innerHTML = `
    <span id="pe-play-title-main" class="pe-play-title-main">${escapeHtml(mainTitleText)}</span>
    <span id="pe-play-title-sub" class="pe-play-title-sub"></span>
  `;

  function updateTitleSub() {
    const subEl = titleEl.querySelector('#pe-play-title-sub');
    if (!subEl) return;
    subEl.textContent = isEndless
      ? i18n.t('play.subtitle_endless', {
          moves: movesCount,
          sealed: countSealedBottles(bottles),
          total: level.color_count
        })
      : i18n.t('play.subtitle_moves', { moves: movesCount, par: level.par_moves });
  }

  const nextPostLabel = isEndless
    ? i18n.t('play.post_next_endless')
    : isDaily
      ? i18n.t('play.post_done')
      : i18n.t('play.post_next');

  const initialSpeech = catTalkEnabled
    ? getCatDialogue(activeCatId, 'level_start', { count: level.color_count })
    : i18n.t('play.quiet_status');

  // Build Screen DOM (Zero Scroll Budget)
  container.innerHTML = `
    <div id="pe-cat-stage" class="pe-cat-stage">
      <button type="button" id="btn-play-cat" class="pe-cat-avatar-btn" aria-label="${escapeHtml(i18n.t('home.cat_tap_aria', { cat: getLocalized(activeCat, 'name', lang) }))}">
        <span id="pe-cat-svg-host" class="pe-cat-avatar-svg">${getCatSvg(activeCatId, { mood: 'idle' })}</span>
      </button>
      <div id="pe-speech-bubble" class="pe-speech-bubble">
        <p id="pe-speech-text" class="pe-speech-text">${escapeHtml(initialSpeech)}</p>
        <span id="pe-combo-pill" class="pe-combo-pill" hidden></span>
      </div>
    </div>

    <div
      id="pe-shelf-stage"
      class="pe-shelf-stage"
      data-level-id="${level.id != null ? level.id : 'endless'}"
      data-mode="${isEndless ? 'endless' : isDaily ? 'daily' : 'campaign'}"
      data-color-count="${level.color_count}"
    ></div>

    <div id="pe-toolbar" class="pe-toolbar">
      <button type="button" id="btn-tool-undo" class="pe-tool-btn">
        <span class="pe-tool-icon">${UI_ICONS.undo}</span>
        <span class="pe-tool-label">${escapeHtml(i18n.t('play.tool_undo'))}</span>
      </button>
      <button type="button" id="btn-tool-flask" class="pe-tool-btn">
        <span id="pe-flask-badge" class="pe-tool-badge pe-tool-badge--ad">${escapeHtml(i18n.t('play.badge_ad'))}</span>
        <span class="pe-tool-icon">${UI_ICONS.addFlask}</span>
        <span class="pe-tool-label">${escapeHtml(i18n.t('play.tool_flask'))}</span>
      </button>
      <button type="button" id="btn-tool-hint" class="pe-tool-btn">
        <span id="pe-hint-badge" class="pe-tool-badge">${freeHintsLeft}</span>
        <span class="pe-tool-icon">${UI_ICONS.hint}</span>
        <span class="pe-tool-label">${escapeHtml(i18n.t('play.tool_hint'))}</span>
      </button>
      <button type="button" id="btn-tool-restart" class="pe-tool-btn">
        <span class="pe-tool-icon">${UI_ICONS.restart}</span>
        <span class="pe-tool-label">${escapeHtml(i18n.t('play.tool_restart'))}</span>
      </button>
    </div>

    <div id="pe-post-win-bar" class="pe-post-win-bar is-hidden">
      <button type="button" id="btn-post-replay" class="pe-btn-3d pe-btn-3d--porcelain" disabled>
        ${UI_ICONS.restart}
        <span>${escapeHtml(i18n.t('play.post_replay'))}</span>
      </button>
      <button type="button" id="btn-post-share" class="pe-btn-3d pe-btn-3d--porcelain" disabled>
        ${UI_ICONS.share}
        <span>${escapeHtml(i18n.t('play.post_share'))}</span>
      </button>
      <button type="button" id="btn-post-next" class="pe-btn-3d pe-btn-3d--violet" disabled>
        <span>${escapeHtml(nextPostLabel)}</span>
        ${UI_ICONS.next}
      </button>
    </div>

    <div class="pe-play-ad-zone">
      <div data-ad-slot="play-banner" data-ad-type="banner"></div>
    </div>
  `;

  const catBtnEl = container.querySelector('#btn-play-cat');
  const catSvgHost = container.querySelector('#pe-cat-svg-host');
  const speechBubbleEl = container.querySelector('#pe-speech-bubble');
  const speechTextEl = container.querySelector('#pe-speech-text');
  const comboPillEl = container.querySelector('#pe-combo-pill');
  const shelfStageEl = container.querySelector('#pe-shelf-stage');
  const toolbarEl = container.querySelector('#pe-toolbar');
  const postWinBarEl = container.querySelector('#pe-post-win-bar');
  const undoBtnEl = container.querySelector('#btn-tool-undo');
  const flaskBtnEl = container.querySelector('#btn-tool-flask');
  const flaskBadgeEl = container.querySelector('#pe-flask-badge');
  const hintBtnEl = container.querySelector('#btn-tool-hint');
  const hintBadgeEl = container.querySelector('#pe-hint-badge');
  const restartBtnEl = container.querySelector('#btn-tool-restart');

  // ==========================================================================
  // Cat Stage & Speech Bubble Controller (Fixed 56px Height -> Zero CLS)
  // ==========================================================================

  function setCatReaction({ text = null, mood = 'idle', style = 'normal', anim = null, showCombo = false } = {}) {
    if (disposed) return;
    if (text != null && speechTextEl) {
      const activeToast = document.querySelector('.af-toast.is-visible');
      if (activeToast) activeToast.classList.remove('is-visible');
      speechTextEl.textContent = text;
    }
    if (speechBubbleEl) {
      speechBubbleEl.classList.toggle('is-deadlock', style === 'deadlock');
      speechBubbleEl.classList.toggle('is-hint', style === 'hint');
    }
    if (comboPillEl) {
      if (showCombo && combo >= 2) {
        comboPillEl.textContent = i18n.t('play.combo_badge', { combo });
        comboPillEl.hidden = false;
      } else if (!showCombo) {
        comboPillEl.hidden = true;
      }
    }
    if (catSvgHost) {
      catSvgHost.innerHTML = getCatSvg(activeCatId, { mood });
    }
    if (catBtnEl) {
      catBtnEl.classList.remove('is-happy', 'is-thinking');
      if (anim) {
        // Trigger CSS keyframe replay cleanly
        void catBtnEl.offsetWidth;
        catBtnEl.classList.add(anim);
      }
    }

    clearTimeout(moodTimer);
    if (mood !== 'idle' && style !== 'deadlock') {
      moodTimer = setTimeout(() => {
        if (disposed) return;
        if (catSvgHost) catSvgHost.innerHTML = getCatSvg(activeCatId, { mood: 'idle' });
        catBtnEl?.classList.remove('is-happy', 'is-thinking');
      }, 1150);
    }
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (isWon || disposed) return;
    idleTimer = setTimeout(() => {
      if (disposed || isWon || isAnimating) return;
      if (!catTalkEnabled) return;
      setCatReaction({
        text: getCatDialogue(activeCatId, 'idle_nudge'),
        mood: 'thinking',
        anim: 'is-thinking'
      });
    }, 12000);
  }

  // ==========================================================================
  // Toolbar & Persistence Sync
  // ==========================================================================

  function getDeadlockSpeech({ isHint = false } = {}) {
    const canUndo = undoStack.length > 0;
    const canFlask = extraFlasksUsed < MAX_EXTRA_FLASKS;
    if (canUndo && canFlask) {
      if (catTalkEnabled) {
        return getCatDialogue(activeCatId, isHint ? 'hint_deadend' : 'deadlock');
      }
      return i18n.t(isHint ? 'play.quiet_hint_deadend' : 'play.quiet_deadlock');
    }
    if (!canUndo && canFlask) return i18n.t('play.deadlock_flask_or_restart');
    if (canUndo && !canFlask) return i18n.t('play.deadlock_undo_or_restart');
    return i18n.t('play.deadlock_restart_only');
  }

  function updateToolbar(deadlocked = false) {
    const canUndo = undoStack.length > 0;
    if (undoBtnEl) {
      undoBtnEl.disabled = isWon || !canUndo;
      undoBtnEl.classList.toggle('pe-tool-btn--highlight', deadlocked && canUndo);
    }

    const flaskMaxed = extraFlasksUsed >= MAX_EXTRA_FLASKS;
    if (flaskBtnEl) {
      flaskBtnEl.disabled = isWon || flaskMaxed;
      flaskBtnEl.classList.toggle('pe-tool-btn--highlight', deadlocked && !flaskMaxed);
    }
    if (flaskBadgeEl) {
      flaskBadgeEl.textContent = flaskMaxed ? i18n.t('play.badge_max') : i18n.t('play.badge_ad');
      flaskBadgeEl.classList.toggle('pe-tool-badge--ad', !flaskMaxed);
    }

    if (hintBtnEl) {
      hintBtnEl.disabled = isWon;
    }
    if (hintBadgeEl) {
      if (freeHintsLeft > 0) {
        hintBadgeEl.textContent = String(freeHintsLeft);
        hintBadgeEl.classList.remove('pe-tool-badge--ad');
      } else {
        hintBadgeEl.textContent = '+1';
        hintBadgeEl.classList.add('pe-tool-badge--ad');
      }
    }

    if (restartBtnEl) {
      restartBtnEl.disabled = isWon;
      restartBtnEl.classList.toggle('pe-tool-btn--highlight', deadlocked && (!canUndo || flaskMaxed));
    }
  }

  async function persistProgress(status = 'in_progress') {
    if (isEndless || level.id == null) return;
    try {
      await Promise.all([
        saveLevelProgress(level.id, {
          bottlesState: bottles,
          movesCount,
          extraFlasksUsed,
          hintsUsed,
          freeHintsLeft,
          maxCombo,
          status,
          dayKey: dailyDayKey
        }),
        saveLevelUndoHistory(level.id, undoStack, { dayKey: dailyDayKey })
      ]);
    } catch {
      /* keep live UI fluid */
    }
  }

  // ==========================================================================
  // Crystal Potion Shelf Renderer (Adaptive 1 or 2 Rows, 4..14 Bottles)
  // ==========================================================================

  function buildBottleAria(bottle, idx) {
    const num = idx + 1;
    if (bottle.length === 0) return i18n.t('play.bottle_aria_empty', { num });
    const top = topColor(bottle);
    const elixirName = getElixirName(catalog, top, lang);
    if (isBottleSealed(bottle)) {
      return i18n.t('play.bottle_aria_sealed', { num, elixir: elixirName });
    }
    return i18n.t('play.bottle_aria_layers', { num, elixir: elixirName, filled: bottle.length });
  }

  function renderShelf({ sealedJustNow = -1, spawnedFlaskIdx = -1 } = {}) {
    const layout = computeShelfLayout(bottles.length);
    shelfStageEl.setAttribute('data-rows', String(layout.rowCount));
    if (layout.maxCols >= 7) {
      shelfStageEl.setAttribute('data-max-cols', '7');
    } else if (layout.maxCols === 6) {
      shelfStageEl.setAttribute('data-max-cols', '6');
    } else {
      shelfStageEl.removeAttribute('data-max-cols');
    }

    let offset = 0;
    const rowsHtml = layout.rows
      .map((rowLen) => {
        let rowItems = '';
        for (let k = 0; k < rowLen; k++) {
          const idx = offset + k;
          const bottle = bottles[idx];
          const sealed = isBottleSealed(bottle);
          const classes = ['pe-bottle'];
          if (selectedIdx === idx) classes.push('is-selected');
          if (sealed) classes.push('is-sealed');
          if (activeHint?.from === idx) classes.push('is-hint-source');
          if (activeHint?.to === idx) classes.push('is-hint-target');
          if (spawnedFlaskIdx === idx) classes.push('is-extra-flask');

          let hintTagHtml = '';
          if (activeHint?.from === idx) {
            hintTagHtml = `<span class="pe-hint-tag pe-hint-tag--src">${escapeHtml(i18n.t('play.hint_tag_from'))}</span>`;
          } else if (activeHint?.to === idx) {
            hintTagHtml = `<span class="pe-hint-tag pe-hint-tag--dst">${escapeHtml(i18n.t('play.hint_tag_to'))}</span>`;
          }

          const sparkleHtml =
            sealedJustNow === idx ? `<div class="pe-sparkle-burst">${getSparkleBurstSvg()}</div>` : '';

          const layersHtml = bottle
            .map((colorId, layerIdx) => {
              const isTop = layerIdx === bottle.length - 1;
              const isSameBelow = layerIdx > 0 && Number(bottle[layerIdx - 1]) === Number(colorId);
              const elixir = catalog.find((e) => Number(e.elixir_id) === Number(colorId));
              const sym = elixir?.symbol || '✦';
              const layerCls = ['pe-layer'];
              if (isTop) layerCls.push('is-top-layer');
              if (isSameBelow) layerCls.push('is-same-below');
              return `<div class="${layerCls.join(' ')}" data-elixir="${Number(colorId)}"><span class="pe-layer-symbol">${escapeHtml(sym)}</span></div>`;
            })
            .join('');

          rowItems += `
            <button
              type="button"
              class="${classes.join(' ')}"
              data-bottle-index="${idx}"
              aria-label="${escapeHtml(buildBottleAria(bottle, idx))}"
              aria-pressed="${selectedIdx === idx ? 'true' : 'false'}"
            >
              ${hintTagHtml}
              ${sparkleHtml}
              <div class="pe-cork">${getCatCorkSvg()}</div>
              <div class="pe-bottle-rim"></div>
              <div class="pe-bottle-neck"></div>
              <div class="pe-bottle-body">
                <div class="pe-bottle-liquid">${layersHtml}</div>
              </div>
            </button>
          `;
        }
        offset += rowLen;
        return `<div class="pe-shelf-row">${rowItems}</div>`;
      })
      .join('');

    shelfStageEl.innerHTML = rowsHtml;

    shelfStageEl.querySelectorAll('.pe-bottle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-bottle-index'));
        handleBottleTap(idx);
      });
    });
  }

  function syncSelectionClasses() {
    shelfStageEl.querySelectorAll('.pe-bottle').forEach((btn) => {
      const idx = Number(btn.getAttribute('data-bottle-index'));
      const isSel = selectedIdx === idx;
      btn.classList.toggle('is-selected', isSel);
      btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
    });
  }

  function clearHintVisuals() {
    if (!activeHint) return;
    activeHint = null;
    shelfStageEl.querySelectorAll('.pe-bottle').forEach((btn) => {
      btn.classList.remove('is-hint-source', 'is-hint-target');
    });
    shelfStageEl.querySelectorAll('.pe-hint-tag').forEach((t) => t.remove());
    speechBubbleEl?.classList.remove('is-hint');
  }

  function shakeBottle(idx) {
    const el = shelfStageEl.querySelector(`.pe-bottle[data-bottle-index="${idx}"]`);
    if (!el) return;
    el.classList.remove('is-invalid');
    void el.offsetWidth;
    el.classList.add('is-invalid');
    setTimeout(() => el.classList.remove('is-invalid'), 340);
  }

  // ==========================================================================
  // Bottle Selection & Animated Pour Execution
  // ==========================================================================

  function handleBottleTap(idx) {
    if (isWon || isAnimating) return;
    resetIdleTimer();
    clearHintVisuals();

    const tapped = bottles[idx];
    if (!tapped) return;

    if (selectedIdx === null) {
      if (tapped.length === 0 || isBottleSealed(tapped)) {
        gameAudio.sfx.invalid();
        gameHaptics.impact('LIGHT');
        shakeBottle(idx);
        return;
      }
      selectedIdx = idx;
      gameAudio.sfx.select();
      gameHaptics.selection();
      syncSelectionClasses();
      return;
    }

    if (selectedIdx === idx) {
      selectedIdx = null;
      gameAudio.sfx.deselect();
      gameHaptics.selection();
      syncSelectionClasses();
      return;
    }

    if (canPour(bottles, selectedIdx, idx)) {
      performPour(selectedIdx, idx);
      return;
    }

    // Player-friendly switch: if target isn't pourable but is itself pickable, smoothly select it instead!
    if (tapped.length > 0 && !isBottleSealed(tapped)) {
      selectedIdx = idx;
      gameAudio.sfx.select();
      gameHaptics.selection();
      syncSelectionClasses();
      return;
    }

    // Otherwise invalid target feedback and clean deselect
    gameAudio.sfx.invalid();
    gameHaptics.impact('LIGHT');
    shakeBottle(idx);
    selectedIdx = null;
    syncSelectionClasses();
  }

  function animatePourArc(fromIdx, toIdx, colorId, pourCount = 1) {
    const srcEl = shelfStageEl.querySelector(`.pe-bottle[data-bottle-index="${fromIdx}"]`);
    const dstEl = shelfStageEl.querySelector(`.pe-bottle[data-bottle-index="${toIdx}"]`);
    if (!srcEl || !dstEl) return;

    // Measure exact resting rects without the lifted .is-selected transform offset
    const prevTransition = srcEl.style.transition;
    srcEl.style.transition = 'none';
    srcEl.classList.remove('is-selected');
    void srcEl.offsetWidth;

    const stageRect = shelfStageEl.getBoundingClientRect();
    const srcRect = srcEl.getBoundingClientRect();
    const dstRect = dstEl.getBoundingClientRect();
    const dstBodyEl = dstEl.querySelector('.pe-bottle-body');
    const dstBodyRect = dstBodyEl ? dstBodyEl.getBoundingClientRect() : dstRect;

    // Restore smooth transition for the pour tilt
    srcEl.style.transition = prevTransition;
    void srcEl.offsetWidth;

    // Bottle transform-origin is 50% 0% (exact top-mouth center):
    // Translating by (tx, ty) places the top-mouth center directly at (srcBaseX + tx, srcBaseY + ty).
    const srcBaseX = srcRect.left + srcRect.width / 2 - stageRect.left;
    const srcBaseY = srcRect.top - stageRect.top;
    const dstCx = dstRect.left + dstRect.width / 2 - stageRect.left;
    const dstTop = dstRect.top - stageRect.top;

    // Tilt away from the screen edge when pouring vertically in the same column,
    // otherwise swing the bottle body back toward the source side so the mouth faces the target.
    let goingRight;
    if (Math.abs(dstCx - srcBaseX) < 12) {
      goingRight = dstCx >= stageRect.width / 2;
    } else {
      goingRight = dstCx > srcBaseX;
    }

    const sign = goingRight ? 1 : -1;
    const tiltDeg = 78;
    const rad = (tiltDeg * Math.PI) / 180;
    const halfRim = (srcRect.width * 0.68) / 2;

    // Position the mouth pivot so the rotated pouring lip sits directly over dstCx, ~8px above dst rim
    const spoutOffsetX = sign * halfRim * Math.cos(rad);
    const spoutOffsetY = halfRim * Math.sin(rad);

    const targetSpoutX = dstCx;
    const targetSpoutY = Math.max(12, dstTop - 6);
    const mouthX = targetSpoutX - spoutOffsetX;
    const mouthY = targetSpoutY - spoutOffsetY;

    const tx = mouthX - srcBaseX;
    const ty = mouthY - srcBaseY;

    srcEl.style.setProperty('--pour-tx', `${tx.toFixed(1)}px`);
    srcEl.style.setProperty('--pour-ty', `${ty.toFixed(1)}px`);
    srcEl.style.setProperty('--pour-rot', `${sign * tiltDeg}deg`);
    srcEl.classList.add('is-pouring');
    dstEl.classList.add('is-receiving');

    // Compute destination liquid surface Y inside the target vessel
    const existingLayers = bottles[toIdx]?.length || 0;
    const liquidBottomY = dstBodyRect.bottom - stageRect.top - 4;
    const liquidInnerH = Math.max(16, dstBodyRect.height - 6);
    const endY = Math.max(
      dstTop + 14,
      liquidBottomY - (Math.min(3.6, existingLayers + 0.35) / 4) * liquidInnerH
    );

    const startX = targetSpoutX;
    const startY = targetSpoutY;
    const ctrlX = targetSpoutX + sign * 2;
    const ctrlY = startY + (endY - startY) * 0.45;
    const pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${dstCx.toFixed(1)} ${endY.toFixed(1)}`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'pe-pour-stream');
    svg.setAttribute('width', String(Math.max(1, Math.round(stageRect.width))));
    svg.setAttribute('height', String(Math.max(1, Math.round(stageRect.height))));
    svg.innerHTML = `
      <path class="pe-pour-stream-path" d="${pathD}" style="stroke: var(--elixir-solid-${Number(colorId)});" />
      <path class="pe-pour-stream-glint" d="${pathD}" />
    `;
    shelfStageEl.appendChild(svg);

    // Smooth visual drain on source layers and smooth rising fill on target layers
    const srcLayers = Array.from(srcEl.querySelectorAll('.pe-bottle-liquid .pe-layer'));
    const drainLayers = srcLayers.slice(-pourCount);
    const dstLiquidHost = dstEl.querySelector('.pe-bottle-liquid');
    const fillNodes = [];

    if (dstLiquidHost) {
      const elixir = catalog.find((e) => Number(e.elixir_id) === Number(colorId));
      const sym = elixir?.symbol || '✦';
      const hadSameBelow = existingLayers > 0 && Number(bottles[toIdx][existingLayers - 1]) === Number(colorId);
      for (let k = 0; k < pourCount; k++) {
        const div = document.createElement('div');
        div.className = `pe-layer pe-layer--filling${k === pourCount - 1 ? ' is-top-layer' : ''}${k > 0 || hadSameBelow ? ' is-same-below' : ''}`;
        div.setAttribute('data-elixir', String(Number(colorId)));
        div.innerHTML = `<span class="pe-layer-symbol">${escapeHtml(sym)}</span>`;
        dstLiquidHost.appendChild(div);
        fillNodes.push(div);
      }
    }

    setTimeout(() => {
      if (disposed) return;
      drainLayers.forEach((el) => el.classList.add('is-draining'));
      fillNodes.forEach((el) => el.classList.add('is-filled'));
    }, 55);
  }

  function performPour(fromIdx, toIdx) {
    const result = applyPour(bottles, fromIdx, toIdx);
    if (!result) return;

    undoStack.push({
      bottles: cloneBottles(bottles),
      movesCount,
      combo,
      maxCombo
    });

    isAnimating = true;
    selectedIdx = null;
    animatePourArc(fromIdx, toIdx, result.color, result.count);
    gameAudio.sfx.pour(result.count);
    gameHaptics.impact('LIGHT');

    setTimeout(async () => {
      if (disposed) return;

      bottles = result.bottles;
      movesCount += 1;

      const now = Date.now();
      if (result.sealedTarget || result.mergedIntoMatching) {
        if (combo === 0 || now - lastGoodPourAt <= 6500) {
          combo += 1;
        } else {
          combo = 1;
        }
        lastGoodPourAt = now;
        if (combo > maxCombo) maxCombo = combo;
      } else {
        combo = 0;
      }

      isAnimating = false;
      renderShelf({ sealedJustNow: result.sealedTarget ? toIdx : -1 });
      updateTitleSub();

      // Celebrate Bottle Seal! (Always update combo pill & happy animation even if speech bubbles are muted)
      if (result.sealedTarget) {
        gameAudio.sfx.corkPop();
        gameHaptics.notification('SUCCESS');
        const elixirName = getElixirName(catalog, result.color, lang);
        setCatReaction({
          text: catTalkEnabled ? getCatDialogue(activeCatId, 'bottle_sealed', { elixir: elixirName }) : null,
          mood: 'happy',
          anim: 'is-happy',
          showCombo: combo >= 2
        });
      } else if (combo >= 2) {
        gameAudio.sfx.combo(combo);
        setCatReaction({
          text: catTalkEnabled ? getCatDialogue(activeCatId, 'combo', { combo }) : null,
          mood: 'happy',
          anim: 'is-happy',
          showCombo: true
        });
      } else if (comboPillEl) {
        comboPillEl.hidden = true;
      }

      if (result.solved) {
        await handleVictory();
        return;
      }

      await persistProgress('in_progress');

      const deadlocked = isDeadlocked(bottles);
      updateToolbar(deadlocked);
      if (deadlocked) {
        gameAudio.sfx.deadlock();
        gameHaptics.notification('WARNING');
        setCatReaction({
          text: getDeadlockSpeech({ isHint: false }),
          mood: 'surprised',
          style: 'deadlock'
        });
      } else {
        resetIdleTimer();
      }
    }, 260);
  }

  // ==========================================================================
  // Toolbar Actions: Undo, +1 Empty Flask (Rewarded), Smart BFS Hint, Restart
  // ==========================================================================

  undoBtnEl?.addEventListener('click', async () => {
    if (isWon || isAnimating || undoStack.length === 0) return;
    clearHintVisuals();
    const prev = undoStack.pop();
    const currentBottleCount = bottles.length;
    bottles = prev.bottles;
    // Always preserve any rewarded "+1 Empty Flask" vials added after the snapshot
    while (bottles.length < currentBottleCount) {
      bottles.push([]);
    }
    movesCount = prev.movesCount;
    combo = prev.combo;
    maxCombo = prev.maxCombo;
    selectedIdx = null;

    gameAudio.sfx.undo();
    gameHaptics.selection();
    renderShelf();
    updateTitleSub();
    updateToolbar(false);
    setCatReaction({
      text: catTalkEnabled ? getCatDialogue(activeCatId, 'undo') : i18n.t('play.quiet_status'),
      mood: 'idle'
    });
    await persistProgress('in_progress');
    resetIdleTimer();
  });

  function openRewardOptInSheet({ title, desc, ctaLabel, icon, onGranted }) {
    router.openSheet({
      title,
      render: (body, close) => {
        body.innerHTML = `
          <div class="pe-reward-sheet">
            <div class="pe-reward-icon" aria-hidden="true">${icon}</div>
            <p class="pe-reward-desc">${escapeHtml(desc)}</p>
            <button type="button" id="btn-reward-confirm" class="pe-btn-3d pe-btn-3d--violet pe-btn-3d--block">
              ${escapeHtml(ctaLabel)}
            </button>
            <button type="button" id="btn-reward-cancel" class="af-btn af-btn-secondary af-btn-block">
              ${escapeHtml(i18n.t('play.reward_cancel'))}
            </button>
          </div>
        `;

        let busy = false;
        body.querySelector('#btn-reward-cancel')?.addEventListener('click', () => {
          gameAudio.sfx.uiTap();
          close();
        });

        body.querySelector('#btn-reward-confirm')?.addEventListener('click', async () => {
          if (busy) return;
          busy = true;
          const confirmBtn = body.querySelector('#btn-reward-confirm');
          if (confirmBtn) confirmBtn.disabled = true;
          gameHaptics.impact('MEDIUM');

          try {
            const res = await adManager.showRewardedHintAd();
            close();
            if (res && res.rewarded) {
              await onGranted();
            } else {
              router.showToast(i18n.t('play.reward_cancelled_toast'));
            }
          } catch {
            close();
            router.showToast(i18n.t('play.reward_cancelled_toast'));
          }
        });
      }
    });
  }

  flaskBtnEl?.addEventListener('click', () => {
    if (isWon || isAnimating) return;
    if (extraFlasksUsed >= MAX_EXTRA_FLASKS) {
      router.showToast(i18n.t('play.flask_max_toast'));
      return;
    }
    gameAudio.sfx.uiTap();
    openRewardOptInSheet({
      title: i18n.t('play.reward_flask_title'),
      desc: i18n.t('play.reward_flask_desc'),
      ctaLabel: i18n.t('play.reward_flask_cta'),
      icon: UI_ICONS.addFlask,
      onGranted: async () => {
        if (disposed || isWon) return;
        clearHintVisuals();
        selectedIdx = null;
        bottles.push([]);
        // Preserve the rewarded empty flask across any subsequent Undo of prior moves
        for (const snap of undoStack) {
          snap.bottles.push([]);
        }
        extraFlasksUsed += 1;
        const newIdx = bottles.length - 1;

        if (!isEndless && level.id != null) {
          await persistProgress('in_progress');
        }

        gameAudio.sfx.extraFlask();
        gameHaptics.notification('SUCCESS');
        renderShelf({ spawnedFlaskIdx: newIdx });
        updateToolbar(false);
        setCatReaction({
          text: catTalkEnabled ? getCatDialogue(activeCatId, 'extra_flask') : i18n.t('play.reward_flask_granted'),
          mood: 'happy',
          anim: 'is-happy'
        });
        router.showToast(i18n.t('play.reward_flask_granted'));
        resetIdleTimer();
      }
    });
  });

  async function executeSmartHint({ isFree }) {
    if (disposed || isWon || isHintBusy) return;
    isHintBusy = true;
    try {
      const hint = findBestHint(bottles);

      if (!hint.solvable || hint.deadEnd) {
        gameAudio.sfx.deadlock();
        gameHaptics.notification('WARNING');
        updateToolbar(true);
        setCatReaction({
          text: getDeadlockSpeech({ isHint: true }),
          mood: 'surprised',
          style: 'deadlock'
        });
        return;
      }

      if (hint.alreadySolved) return;

      hintsUsed += 1;
      if (isFree) {
        freeHintsLeft = Math.max(0, freeHintsLeft - 1);
      }

      if (!isEndless && level.id != null) {
        await persistProgress(movesCount > 0 || extraFlasksUsed > 0 ? 'in_progress' : 'not_started');
      }

      selectedIdx = null;
      activeHint = { from: hint.from, to: hint.to };
      renderShelf();
      updateToolbar(false);
      gameAudio.sfx.hint();
      gameHaptics.impact('MEDIUM');

      const elixirName = getElixirName(catalog, hint.color, lang);
      const paramsObj = { elixir: elixirName, from: hint.from + 1, to: hint.to + 1 };
      const eventName =
        hint.reason === 'seal' ? 'hint_seal' : hint.reason === 'merge' ? 'hint_merge' : 'hint_open';
      const speechLine = catTalkEnabled
        ? getCatDialogue(activeCatId, eventName, paramsObj)
        : i18n.t('play.quiet_hint', paramsObj);

      setCatReaction({
        text: speechLine,
        mood: 'thinking',
        style: 'hint',
        anim: 'is-thinking'
      });
      resetIdleTimer();
    } finally {
      isHintBusy = false;
    }
  }

  hintBtnEl?.addEventListener('click', async () => {
    if (isWon || isAnimating || isHintBusy) return;
    // If a hint is already highlighted for the unchanged board, re-pulse without charging a second hint
    if (activeHint) {
      gameAudio.sfx.hint();
      gameHaptics.selection();
      return;
    }
    // Never ask the player to watch a rewarded ad if the board is already deadlocked
    if (isDeadlocked(bottles)) {
      gameAudio.sfx.deadlock();
      gameHaptics.notification('WARNING');
      updateToolbar(true);
      setCatReaction({
        text: getDeadlockSpeech({ isHint: true }),
        mood: 'surprised',
        style: 'deadlock'
      });
      return;
    }
    if (freeHintsLeft > 0) {
      await executeSmartHint({ isFree: true });
      return;
    }

    gameAudio.sfx.uiTap();
    openRewardOptInSheet({
      title: i18n.t('play.reward_hint_title'),
      desc: i18n.t('play.reward_hint_desc'),
      ctaLabel: i18n.t('play.reward_hint_cta'),
      icon: UI_ICONS.hint,
      onGranted: async () => {
        if (disposed || isWon) return;
        freeHintsLeft += 1;
        if (!isEndless && level.id != null) {
          await persistProgress(movesCount > 0 || extraFlasksUsed > 0 ? 'in_progress' : 'not_started');
        }
        router.showToast(i18n.t('play.reward_hint_granted'));
        await executeSmartHint({ isFree: true });
      }
    });
  });

  async function doRestartShelf() {
    clearHintVisuals();
    selectedIdx = null;
    bottles = cloneBottles(initialBottles);
    movesCount = 0;
    extraFlasksUsed = 0;
    hintsUsed = 0;
    freeHintsLeft = DEFAULT_FREE_HINTS;
    combo = 0;
    maxCombo = 0;
    isWon = false;
    transitionAdHandled = false;
    lastVictoryResult = null;
    undoStack.length = 0;

    if (!isEndless && level.id != null) {
      await Promise.all([
        resetLevelProgress(level.id, { keepBest: true, dayKey: dailyDayKey }),
        clearLevelUndoHistory(level.id)
      ]);
    }

    toolbarEl?.classList.remove('is-hidden');
    postWinBarEl?.classList.add('is-hidden');
    renderShelf();
    updateTitleSub();
    updateToolbar(false);
    setCatReaction({
      text: catTalkEnabled ? getCatDialogue(activeCatId, 'restart') : i18n.t('play.quiet_status'),
      mood: 'idle'
    });
    resetIdleTimer();
  }

  restartBtnEl?.addEventListener('click', async () => {
    if (isWon || isAnimating) return;
    gameAudio.sfx.uiTap();
    const ok = await router.showAlert({
      title: i18n.t('play.restart_title'),
      message: i18n.t('play.restart_message'),
      confirmText: i18n.t('play.restart_confirm'),
      cancelText: i18n.t('af.cancel'),
      destructive: true
    });
    if (!ok) return;
    gameHaptics.impact('MEDIUM');
    await doRestartShelf();
  });

  // ==========================================================================
  // Victory Flow, Customer Cat Delivery Sheet (0 Ads!) & Graduated Interstitial
  // ==========================================================================

  async function maybeShowTransitionInterstitial() {
    if (transitionAdHandled) return;
    transitionAdHandled = true;

    if (!isEndless && !isDaily && level.tier === 'starter') {
      const { shouldShowAd } = await advanceSimpleAdCounter(3);
      if (shouldShowAd) {
        await adManager.showTransitionInterstitial({
          slotId: 'level-transition',
          cadenceLabel: i18n.t('play.ad_cadence_starter')
        });
      }
      return;
    }

    // Levels 6+, Daily & Endless: every transition with 45s pacing guard on fast <=5 color shelves
    const now = Date.now();
    if (level.color_count <= 5 && lastStandardTransitionAdAt > 0 && now - lastStandardTransitionAdAt < 45000) {
      return;
    }

    await adManager.showTransitionInterstitial({
      slotId: 'level-transition',
      cadenceLabel: i18n.t('play.ad_cadence_standard')
    });
    lastStandardTransitionAdAt = Date.now();
  }

  async function navigateNextAfterWin() {
    await maybeShowTransitionInterstitial();
    if (isEndless) {
      router.replaceTop('play', { mode: 'endless', difficulty: level.difficulty || 'easy' });
    } else if (isDaily || !lastVictoryResult?.nextLevel) {
      router.switchTab('home');
    } else {
      router.replaceTop('play', { levelId: lastVictoryResult.nextLevel.id });
    }
  }

  async function shareVictoryResult() {
    if (!lastVictoryResult) return;
    const starsStr = '★'.repeat(lastVictoryResult.stars) + '☆'.repeat(3 - lastVictoryResult.stars);
    const text = i18n.t('victory.share_text', {
      title: mainTitleText,
      moves: lastVictoryResult.movesCount,
      stars: starsStr
    });
    try {
      const res = await NativeBridge.share({ title: i18n.t('app.name'), text });
      if (res?.fallback === 'clipboard') {
        router.showToast(i18n.t('victory.share_copied'));
      }
    } catch {
      /* user cancelled share sheet */
    }
  }

  function setPostWinBarLocked(locked) {
    postWinBarEl?.querySelectorAll('button').forEach((btn) => {
      btn.disabled = locked;
    });
  }

  async function handleVictory() {
    isWon = true;
    clearTimeout(idleTimer);
    clearHintVisuals();

    // Immediately lock & hide gameplay toolbar, reveal locked post-win bar
    toolbarEl?.classList.add('is-hidden');
    toolbarEl?.querySelectorAll('button').forEach((b) => {
      b.disabled = true;
    });
    postWinBarEl?.classList.remove('is-hidden');
    setPostWinBarLocked(true);

    let result;
    if (isEndless) {
      result = await recordEndlessRun({
        difficulty: level.difficulty,
        colorCount: level.color_count,
        movesCount,
        bottlesSealed: level.color_count,
        hintsUsed,
        extraFlasksUsed,
        parMoves: level.par_moves,
        maxCombo,
        countBottlesSealed: true
      });
      result.parMoves = level.par_moves;
      result.visitorCat = level.visitor_cat || activeCat;
      result.newlyUnlockedCats = [];
    } else {
      result = await completeLevel(level.id, {
        bottlesState: bottles,
        movesCount,
        extraFlasksUsed,
        hintsUsed,
        freeHintsLeft,
        maxCombo,
        bottlesSealed: level.color_count,
        dayKey: dailyDayKey
      });
      await clearLevelUndoHistory(level.id);
    }

    // Keep post-win action bar label truthful on final Campaign Level 60 (no Level 61!)
    const postNextSpan = postWinBarEl?.querySelector('#btn-post-next span');
    if (postNextSpan) {
      postNextSpan.textContent = isEndless
        ? i18n.t('play.post_next_endless')
        : isDaily || !result.nextLevel
          ? i18n.t('play.post_done')
          : i18n.t('play.post_next');
    }

    lastVictoryResult = result;
    gameAudio.sfx.victory();
    gameHaptics.notification('SUCCESS');

    const visitor = result.visitorCat || level.visitor_cat || activeCat;
    const visitorId = visitor?.id || 'mochi';
    const visitorName = getLocalized(visitor, 'name', lang) || 'Mochi';
    const deliveryQuote = getVisitorDeliveryQuote(visitorId);

    const sheetTitle = isEndless
      ? i18n.t('victory.sheet_title_endless')
      : isDaily
        ? i18n.t('victory.sheet_title_daily')
        : i18n.t('victory.sheet_title');

    const primaryCtaText = isEndless
      ? i18n.t('victory.btn_next_endless')
      : isDaily || !result.nextLevel
        ? i18n.t('victory.btn_home')
        : i18n.t('victory.btn_next');

    const unlockBannerHtml =
      Array.isArray(result.newlyUnlockedCats) && result.newlyUnlockedCats.length > 0
        ? result.newlyUnlockedCats
            .map(
              (c) => `
                <div class="pe-cat-unlock-banner">
                  ${UI_ICONS.paw}
                  <span>${escapeHtml(i18n.t('victory.cat_unlocked', { cat: getLocalized(c, 'name', lang) }))}</span>
                </div>
              `
            )
            .join('')
        : '';

    // ZERO ADS inside Victory Sheet!
    router.openSheet({
      title: sheetTitle,
      onClose: () => {
        clearTimeout(postWinUnlockTimer);
        postWinUnlockTimer = setTimeout(() => {
          if (!disposed) setPostWinBarLocked(false);
        }, 260);
      },
      render: (body, close) => {
        body.innerHTML = `
          <div id="pe-victory-content" class="pe-victory-sheet">
            <div class="pe-victory-stars" aria-label="${result.stars} / 3">
              ${renderStarsHtml(result.stars, 3)}
            </div>

            <div class="pe-delivery-card">
              <div class="pe-delivery-cat">
                ${getCatSvg(visitorId, { mood: 'happy' })}
              </div>
              <div class="pe-delivery-copy">
                <div class="pe-delivery-kicker">${escapeHtml(i18n.t('victory.delivered_to', { cat: visitorName }))}</div>
                <p class="pe-delivery-quote">“${escapeHtml(deliveryQuote)}”</p>
              </div>
            </div>

            ${unlockBannerHtml}

            <div class="pe-victory-stats">
              <div class="pe-victory-stat">
                <div class="pe-victory-stat-val">${result.movesCount}</div>
                <div class="pe-victory-stat-lbl">${escapeHtml(i18n.t('victory.stat_moves'))}</div>
              </div>
              <div class="pe-victory-stat">
                <div class="pe-victory-stat-val">${result.parMoves ?? level.par_moves}</div>
                <div class="pe-victory-stat-lbl">${escapeHtml(i18n.t('victory.stat_par'))}</div>
              </div>
              <div class="pe-victory-stat">
                <div class="pe-victory-stat-val">×${Math.max(1, result.maxCombo || 1)}</div>
                <div class="pe-victory-stat-lbl">${escapeHtml(i18n.t('victory.stat_combo'))}</div>
              </div>
            </div>

            <div class="pe-victory-actions">
              <button type="button" id="btn-victory-next" class="pe-btn-3d pe-btn-3d--violet pe-btn-3d--block">
                <span>${escapeHtml(primaryCtaText)}</span>
                ${UI_ICONS.next}
              </button>
              <div class="pe-victory-row-actions">
                <button type="button" id="btn-victory-replay" class="pe-btn-3d pe-btn-3d--porcelain">
                  ${UI_ICONS.restart}
                  <span>${escapeHtml(i18n.t('victory.btn_replay'))}</span>
                </button>
                <button type="button" id="btn-victory-share" class="pe-btn-3d pe-btn-3d--porcelain">
                  ${UI_ICONS.share}
                  <span>${escapeHtml(i18n.t('victory.btn_share'))}</span>
                </button>
              </div>
            </div>
          </div>
        `;

        body.querySelector('#btn-victory-next')?.addEventListener('click', async () => {
          gameAudio.sfx.uiTap();
          close();
          await navigateNextAfterWin();
        });

        body.querySelector('#btn-victory-replay')?.addEventListener('click', async () => {
          gameAudio.sfx.uiTap();
          close();
          await doRestartShelf();
        });

        body.querySelector('#btn-victory-share')?.addEventListener('click', async () => {
          gameAudio.sfx.uiTap();
          await shareVictoryResult();
        });
      }
    });
  }

  // Post-Win Bar Actions (active after dismissing Victory Sheet)
  container.querySelector('#btn-post-replay')?.addEventListener('click', async () => {
    gameAudio.sfx.uiTap();
    await doRestartShelf();
  });
  container.querySelector('#btn-post-share')?.addEventListener('click', async () => {
    gameAudio.sfx.uiTap();
    await shareVictoryResult();
  });
  container.querySelector('#btn-post-next')?.addEventListener('click', async () => {
    gameAudio.sfx.uiTap();
    await navigateNextAfterWin();
  });

  // Cat Avatar Tap (Honors cat_talk_enabled — silent happy bounce + purr when speech bubbles are muted)
  catBtnEl?.addEventListener('click', () => {
    gameHaptics.selection();
    if (catTalkEnabled) {
      gameAudio.sfx.meow(activeCatTone);
      setCatReaction({
        text: getCatDialogue(activeCatId, 'pet'),
        mood: 'happy',
        anim: 'is-happy',
        showCombo: combo >= 2
      });
    } else {
      gameAudio.sfx.purr();
      setCatReaction({
        text: null,
        mood: 'happy',
        anim: 'is-happy',
        showCombo: combo >= 2
      });
    }
  });

  // Navbar Music & Rules Controls
  const playMusicBtn = rightSlot.querySelector('#btn-play-music');
  playMusicBtn?.addEventListener('click', async () => {
    const next = !gameAudio.isMusicEnabled();
    gameAudio.setMusicEnabled(next);
    gameHaptics.selection();
    playMusicBtn.classList.toggle('is-on', next);
    playMusicBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
    playMusicBtn.innerHTML = next ? UI_ICONS.musicOn : UI_ICONS.musicOff;
    try {
      await setPref('music_enabled', next);
    } catch { /* ignore */ }
  });

  rightSlot.querySelector('#btn-play-rules')?.addEventListener('click', () => {
    gameAudio.sfx.uiTap();
    gameHaptics.selection();
    openRulesSheet();
  });

  // Initial Paint (also detect deadlocked reloaded shelves immediately!)
  const initialDeadlock = isDeadlocked(bottles);
  renderShelf();
  updateTitleSub();
  updateToolbar(initialDeadlock);
  if (initialDeadlock) {
    setCatReaction({
      text: getDeadlockSpeech({ isHint: false }),
      mood: 'surprised',
      style: 'deadlock'
    });
  } else {
    resetIdleTimer();
  }

  return () => {
    disposed = true;
    clearTimeout(idleTimer);
    clearTimeout(moodTimer);
    clearTimeout(postWinUnlockTimer);
  };
}
