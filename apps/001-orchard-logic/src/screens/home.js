/* ============================================================================
 * Fruitopia — Screen 1: Home (Tactile Arcade Game Hub, Zero Solution Spoilers)
 * Features Glossy Game Emblem, Live Trophy/Currency HUD Bar, 3D Stage Portal
 * Showcase, Daily 10x10 Quest Card, Interactive Musical Fruit Parade & AdSlot
 * ============================================================================ */

import { AppFactory, escapeHtml } from '../../../../core-engine/js/engine.js';
import {
  CELL_FRUIT,
  getDailyLevelForDate,
  getCampaignSummary,
  getStatsSummary,
  setPref
} from '../data/repository.js';
import { getFruitSvg, UI_ICONS } from '../fruits.js';
import { gameAudio } from '../audio.js';
import {
  formatDuration,
  tierLabel,
  loadFruitCatalog,
  getFruitName,
  openRulesSheet,
  gameHaptics
} from '../ui-helpers.js';

const { i18n } = AppFactory;

function renderSkeleton() {
  return `
    <div class="ol-skeleton" style="height: 60px; margin-bottom: var(--space-3);"></div>
    <div class="ol-skeleton" style="height: 44px; margin-bottom: var(--space-3);"></div>
    <div class="ol-skeleton" style="height: 220px; margin-bottom: var(--space-4);"></div>
    <div class="ol-skeleton" style="height: 146px;"></div>
  `;
}

/**
 * Spoiler-free miniature board preview:
 * - If the player has an in-progress board, renders ONLY the player's own placed fruits.
 * - If not started, renders the clean watercolor color patchwork ONLY (NEVER reveals solution!).
 */
function renderMiniBoardPreview(level) {
  if (!level || !Array.isArray(level.regions)) return '';
  const n = Number(level.grid_size);
  const regions = level.regions;
  const board = Array.isArray(level.board_state) ? level.board_state : [];
  const showPlayerFruits = level.status === 'in_progress' && board.length === n * n;

  const cells = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const idx = r * n + c;
      const reg = regions[idx];
      const edgeTop = r > 0 && regions[(r - 1) * n + c] !== reg ? ' ol-edge-top' : '';
      const edgeLeft = c > 0 && regions[r * n + (c - 1)] !== reg ? ' ol-edge-left' : '';
      const fruitHtml =
        showPlayerFruits && board[idx] === CELL_FRUIT
          ? getFruitSvg(reg, 'ol-mini-fruit')
          : '';
      cells.push(`<span class="ol-mini-cell${edgeTop}${edgeLeft}" data-region="${reg}">${fruitHtml}</span>`);
    }
  }

  return `<div class="ol-mini-board" style="--grid-n: ${n};" aria-hidden="true">${cells.join('')}</div>`;
}

export async function renderHome({ container, router }) {
  gameAudio.setMode('menu');
  container.innerHTML = renderSkeleton();

  let unsubAudio = null;

  try {
    const [daily, campaign, stats, fruitCatalog] = await Promise.all([
      getDailyLevelForDate(),
      getCampaignSummary(),
      getStatsSummary(),
      loadFruitCatalog()
    ]);

    const lang = i18n.getLang();
    const streakCount = daily?.streak?.currentStreak || 0;
    const streakLabel =
      streakCount > 0
        ? i18n.t('home.streak_days', { count: streakCount })
        : i18n.t('home.streak_zero');

    const dailyCompleted = Boolean(daily?.isCompletedToday);
    const dailySub = dailyCompleted
      ? i18n.t('home.daily_sub_done', { time: formatDuration(daily.completion?.elapsed_seconds) })
      : i18n.t('home.daily_sub_open');
    const dailyCta = dailyCompleted
      ? i18n.t('home.daily_cta_view')
      : i18n.t('home.daily_cta_play');

    const active = campaign.activeLevel;
    const activeTier = active ? tierLabel(active.tier) : '';
    const activeSubTitle = active ? (lang === 'tr' ? active.title_tr : active.title_en) : '';

    let campaignTitle = '';
    let campaignSub = '';
    let campaignCta = '';
    let badgeHtml = '';
    let miniBoardHtml = '';

    if (campaign.allCompleted) {
      campaignTitle = i18n.t('home.campaign_all_done_title');
      campaignSub = i18n.t('home.campaign_all_done_sub', { total: campaign.totalLevels });
      campaignCta = i18n.t('home.campaign_cta_replay');
      badgeHtml = `<span class="ol-size-badge ol-size-badge--master">★ ${campaign.totalStars}</span>`;
      miniBoardHtml = renderMiniBoardPreview(daily?.level);
    } else if (active) {
      campaignTitle = i18n.t('home.campaign_level_title', {
        num: active.id,
        tier: activeTier
      });
      campaignSub = activeSubTitle;
      campaignCta =
        active.status === 'in_progress'
          ? i18n.t('home.campaign_cta_continue', { num: active.id })
          : i18n.t('home.campaign_cta_start', { num: active.id });
      badgeHtml = `<span class="ol-size-badge ol-size-badge--${escapeHtml(active.tier)}">${active.grid_size}×${active.grid_size}</span>`;
      miniBoardHtml = renderMiniBoardPreview(active);
    }

    const musicOn = gameAudio.isMusicEnabled();
    const fruitRibbonHtml = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map((cid) => {
        const fname = getFruitName(fruitCatalog, cid, lang) || `Fruit ${cid + 1}`;
        return `<span class="ol-ribbon-fruit" data-ribbon-fruit="${cid}" style="background: var(--reg-${cid});" role="img" aria-label="${escapeHtml(fname)}">${getFruitSvg(cid, 'ol-ribbon-fruit-svg')}</span>`;
      })
      .join('');

    container.innerHTML = `
      <header class="ol-brand-header">
        <div class="ol-brand-id">
          <div class="ol-brand-logo-wrap">
            <img src="./assets/app-logo.png" alt="${escapeHtml(i18n.t('app.name'))}" class="ol-brand-logo" width="54" height="54" />
          </div>
          <div class="ol-brand-copy">
            <h1 class="ol-brand-title">${escapeHtml(i18n.t('home.title'))}</h1>
            <p class="ol-brand-sub">${escapeHtml(i18n.t('home.brand_sub'))}</p>
          </div>
        </div>
        <div class="ol-brand-actions">
          <button
            type="button"
            id="btn-home-music"
            class="ol-icon-pill${musicOn ? ' is-music-on' : ''}"
            aria-label="${escapeHtml(i18n.t(musicOn ? 'home.music_on_aria' : 'home.music_off_aria'))}"
            aria-pressed="${musicOn ? 'true' : 'false'}"
          >
            ${musicOn ? UI_ICONS.musicOn : UI_ICONS.musicOff}
          </button>
          <button
            type="button"
            id="btn-home-rules"
            class="ol-icon-pill"
            aria-label="${escapeHtml(i18n.t('home.rules_btn_aria'))}"
          >
            ${UI_ICONS.help}
          </button>
        </div>
      </header>

      <div class="ol-game-hud-bar" id="home-game-hud">
        <button type="button" class="ol-hud-chip ol-hud-chip--stars" id="btn-hud-stars">
          <span class="ol-hud-chip-icon">${UI_ICONS.starFilled}</span>
          <span class="ol-tabular">${escapeHtml(i18n.t('home.hud_stars', { stars: campaign.totalStars, max: campaign.maxStars }))}</span>
        </button>
        <button type="button" class="ol-hud-chip ol-hud-chip--cleared" id="btn-hud-cleared">
          <span class="ol-hud-chip-icon">${UI_ICONS.checkCircle}</span>
          <span class="ol-tabular">${escapeHtml(i18n.t('home.hud_cleared', { completed: campaign.completedLevels, total: campaign.totalLevels }))}</span>
        </button>
        <button type="button" class="ol-hud-chip ol-hud-chip--endless" id="btn-hud-endless">
          <span class="ol-hud-chip-icon">${UI_ICONS.infinity}</span>
          <span class="ol-tabular">${escapeHtml(i18n.t('home.hud_endless', { count: stats.solvedEndlessCount || 0 }))}</span>
        </button>
      </div>

      <section class="ol-play-showcase" id="card-continue-campaign">
        <div class="ol-showcase-main">
          ${miniBoardHtml}
          <div class="ol-showcase-info">
            <div class="ol-showcase-top">
              <span class="ol-continue-kicker">${escapeHtml(i18n.t('home.campaign_kicker'))}</span>
              ${badgeHtml}
            </div>
            <h2 class="ol-showcase-title">${escapeHtml(campaignTitle)}</h2>
            <p class="ol-showcase-sub">${escapeHtml(campaignSub)}</p>
            <div class="ol-progress-wrap" style="margin-top: 8px;">
              <div class="ol-progress-row">
                <span id="home-campaign-progress">${escapeHtml(i18n.t('home.campaign_progress', { completed: campaign.completedLevels, total: campaign.totalLevels }))}</span>
                <span>${escapeHtml(i18n.t('home.campaign_stars', { stars: campaign.totalStars, max: campaign.maxStars }))}</span>
              </div>
              <div class="ol-progress-track" role="progressbar" aria-valuenow="${campaign.completionPct}" aria-valuemin="0" aria-valuemax="100">
                <div class="ol-progress-fill" style="width: ${campaign.completionPct}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <button type="button" id="btn-continue-campaign" class="af-btn af-btn-primary af-btn-block ol-play-cta">
          ${UI_ICONS.playSolid}
          <span>${escapeHtml(campaignCta)}</span>
        </button>
      </section>

      <article class="ol-daily-hero ol-daily-banner" id="card-daily-hero">
        <div class="ol-hero-top">
          <span class="ol-hero-kicker">${UI_ICONS.calendar}<span>${escapeHtml(i18n.t('home.daily_kicker'))}</span></span>
          <span class="ol-streak-pill" id="home-streak-pill">${UI_ICONS.flame}<span>${escapeHtml(streakLabel)}</span></span>
        </div>
        <h2 class="ol-hero-title">${escapeHtml(i18n.t('home.daily_title'))}</h2>
        <p class="ol-hero-sub">${escapeHtml(dailySub)}</p>
        <div class="ol-hero-footer">
          <button type="button" id="btn-play-daily" class="ol-hero-cta">
            ${UI_ICONS.playSolid}
            <span>${escapeHtml(dailyCta)}</span>
          </button>
        </div>
      </article>

      <section class="ol-orchard-strip">
        <div class="ol-parade-head">
          <span class="ol-parade-tip">♪ ${escapeHtml(i18n.t('home.fruit_parade_tip'))}</span>
        </div>
        <div class="ol-fruit-ribbon" id="home-fruit-parade">${fruitRibbonHtml}</div>
        <div class="ol-rules-compact">
          <div class="ol-rule-pill">${UI_ICONS.ruleRow}<span>${escapeHtml(i18n.t('rule.row_title'))}</span></div>
          <div class="ol-rule-pill">${UI_ICONS.ruleCol}<span>${escapeHtml(i18n.t('rule.col_title'))}</span></div>
          <div class="ol-rule-pill">${UI_ICONS.ruleRegion}<span>${escapeHtml(i18n.t('rule.region_title'))}</span></div>
          <div class="ol-rule-pill">${UI_ICONS.ruleDiag}<span>${escapeHtml(i18n.t('rule.diag_title'))}</span></div>
        </div>
      </section>

      <div data-ad-slot="home-inline" data-ad-type="inline"></div>
    `;

    AppFactory.adManager.mountSlots(container);

    const musicBtn = container.querySelector('#btn-home-music');
    function syncMusicButton(isOn) {
      if (!musicBtn) return;
      musicBtn.classList.toggle('is-music-on', isOn);
      musicBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      musicBtn.setAttribute('aria-label', i18n.t(isOn ? 'home.music_on_aria' : 'home.music_off_aria'));
      musicBtn.innerHTML = isOn ? UI_ICONS.musicOn : UI_ICONS.musicOff;
    }

    // 0ms live sync whenever music changes in Play or Stats
    unsubAudio = gameAudio.onChange(({ music }) => syncMusicButton(music));

    if (musicBtn) {
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
    }

    container.querySelector('#btn-home-rules')?.addEventListener('click', () => {
      gameAudio.sfx.uiTap();
      gameHaptics.selection();
      openRulesSheet();
    });

    // Interactive HUD Bar shortcuts (3 distinct destinations: Levels / Trophy Stats / Endless)
    container.querySelector('#btn-hud-stars')?.addEventListener('click', () => {
      gameAudio.sfx.uiTap();
      router.switchTab('levels');
    });
    container.querySelector('#btn-hud-cleared')?.addEventListener('click', () => {
      gameAudio.sfx.uiTap();
      router.switchTab('stats');
    });
    container.querySelector('#btn-hud-endless')?.addEventListener('click', () => {
      gameAudio.sfx.uiTap();
      router.switchTab('levels');
    });

    // Interactive Musical Toy Fruit Parade (tap any fruit to bounce + play pentatonic chime!)
    container.querySelectorAll('[data-ribbon-fruit]').forEach((el) => {
      el.addEventListener('click', () => {
        const cid = Number(el.getAttribute('data-ribbon-fruit')) || 0;
        el.classList.remove('is-boing');
        void el.offsetWidth;
        el.classList.add('is-boing');
        gameAudio.sfx.placeFruit(cid + 1, 10);
        gameHaptics.selection();
      });
    });

    const dailyBtn = container.querySelector('#btn-play-daily');
    if (dailyBtn && daily?.level) {
      dailyBtn.addEventListener('click', () => {
        gameAudio.sfx.uiTap();
        gameHaptics.impact('LIGHT');
        router.push('play', {
          levelId: daily.level.id,
          mode: 'daily',
          dayKey: daily.dayKey
        });
      });
    }

    const continueBtn = container.querySelector('#btn-continue-campaign');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        gameAudio.sfx.uiTap();
        gameHaptics.impact('LIGHT');
        if (campaign.allCompleted) {
          router.switchTab('levels');
        } else if (active) {
          router.push('play', { levelId: active.id });
        }
      });
    }
  } catch (err) {
    console.error('[Fruitopia Home]', err);
    container.innerHTML = `
      <div class="af-empty-state">
        <div class="af-empty-icon">!</div>
        <h2 class="af-empty-title">${escapeHtml(i18n.t('home.error_title'))}</h2>
        <p class="af-empty-desc">${escapeHtml(err?.message || '')}</p>
        <button type="button" id="btn-home-retry" class="af-btn af-btn-primary">${escapeHtml(i18n.t('home.error_retry'))}</button>
      </div>
    `;
    container.querySelector('#btn-home-retry')?.addEventListener('click', () => router.rerenderCurrent());
  }

  return () => {
    if (unsubAudio) unsubAudio();
  };
}
