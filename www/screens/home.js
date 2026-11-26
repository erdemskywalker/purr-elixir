/* ============================================================================
 * Screen 1: HOME (Apothecary Shop Hub — Brand, Talking Cat, Live HUD,
 * 3D Campaign Hero with Mini Vial Preview, Daily Brew, Visiting Cats & AdSlot)
 * Zero Mock Data: 100% driven by real SQLite repository queries
 * ============================================================================ */

import { AppFactory, escapeHtml } from '../core-engine/js/engine.js';
import { getHomeDashboard, setActiveCat, setPref } from '../data/repository.js';
import { getBrandEmblemSvg, getCatDialogue, getCatSvg, UI_ICONS } from '../cats.js';
import { gameAudio } from '../audio.js';
import {
  gameHaptics,
  getLocalized,
  openCatDetailSheet,
  openRulesSheet,
  tierLabel
} from '../ui-helpers.js';

const { i18n } = AppFactory;

function renderMiniRackHtml(level) {
  const sourceBottles = (level?.bottles_state || level?.initial_bottles || []).filter(
    (b) => Array.isArray(b) && b.length > 0
  );
  const previewBottles = sourceBottles.slice(0, 4);

  return `
    <div class="pe-mini-rack" aria-hidden="true">
      ${previewBottles
        .map(
          (bottle) => `
            <div class="pe-mini-vial">
              ${bottle
                .map(
                  (colorId) =>
                    `<div class="pe-mini-vial-seg" style="background: var(--elixir-solid-${Number(colorId)});"></div>`
                )
                .join('')}
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

export async function renderHome({ container, router }) {
  gameAudio.setMode('menu');

  let dashboard;
  try {
    dashboard = await getHomeDashboard();
  } catch (err) {
    container.innerHTML = `
      <div class="af-empty-state">
        <div class="af-empty-icon">!</div>
        <h2 class="af-empty-title">${escapeHtml(i18n.t('home.load_error_title'))}</h2>
        <p class="af-empty-desc">${escapeHtml(err?.message || i18n.t('home.load_error_desc'))}</p>
        <button type="button" id="btn-home-retry" class="af-btn af-btn-primary">
          ${escapeHtml(i18n.t('home.retry'))}
        </button>
      </div>
    `;
    container.querySelector('#btn-home-retry')?.addEventListener('click', () => router.rerenderCurrent());
    return;
  }

  const lang = i18n.getLang();
  const { campaign, daily, activeCat, cats, hud, prefs } = dashboard;
  const activeLevel = campaign.activeLevel;
  const musicOn = gameAudio.isMusicEnabled();
  const catTalkEnabled = prefs?.cat_talk_enabled !== false;

  const catName = getLocalized(activeCat, 'name', lang);
  const catTitle = getLocalized(activeCat, 'title', lang);
  const catGreeting = catTalkEnabled
    ? getCatDialogue(activeCat?.id || 'mochi', 'home_greeting')
    : i18n.t('home.quiet_workshop_status', {
        completed: campaign.completedLevels,
        total: campaign.totalLevels,
        stars: hud.totalStars
      });

  const isAllDone = campaign.allCompleted;
  const levelTitle = activeLevel ? getLocalized(activeLevel, 'title', lang) : '';
  const heroPillText = isAllDone
    ? i18n.t('home.campaign_mastered_pill')
    : i18n.t('home.colors_pill', { count: activeLevel?.color_count || 3 });
  const heroTitleText = isAllDone
    ? i18n.t('home.campaign_mastered_title')
    : i18n.t('home.campaign_level_title', { id: activeLevel?.id || 1, title: levelTitle });
  const heroSubText = isAllDone
    ? i18n.t('home.campaign_mastered_sub', { total: campaign.totalLevels })
    : i18n.t('home.campaign_progress', {
        completed: campaign.completedLevels,
        total: campaign.totalLevels,
        tier: tierLabel(activeLevel?.tier)
      });
  const heroCtaText = isAllDone
    ? i18n.t('home.campaign_play_endless')
    : activeLevel && (activeLevel.status === 'in_progress' || campaign.completedLevels > 0)
      ? i18n.t('home.campaign_continue', { id: activeLevel.id })
      : i18n.t('home.campaign_start', { id: activeLevel?.id || 1 });

  const dailyLevel = daily?.level;
  const dailyTitle = dailyLevel ? getLocalized(dailyLevel, 'title', lang) : '';
  const dailyDone = Boolean(daily?.isCompletedToday);
  const dailyStreak = daily?.streak?.currentStreak || 0;
  const dailyPillHtml =
    dailyStreak > 0
      ? `<span class="pe-pill-icon pe-pill-icon--flame">${UI_ICONS.flame}</span><span>${escapeHtml(i18n.t('home.daily_streak_pill', { count: dailyStreak }))}</span>`
      : escapeHtml(i18n.t('home.daily_kicker', { num: daily?.dailyNumber || 1 }));

  const catsRailHtml = cats
    .map((cat) => {
      const name = getLocalized(cat, 'name', lang);
      const chipLabel = cat.is_unlocked ? name : i18n.t('home.cat_locked_short', { level: cat.unlock_level });
      const classes = ['pe-cat-chip'];
      if (cat.is_active) classes.push('is-active-cat');
      if (!cat.is_unlocked) classes.push('is-locked');
      return `
        <button type="button" class="${classes.join(' ')}" data-cat-id="${escapeHtml(cat.id)}" aria-label="${escapeHtml(name)}">
          <span class="pe-cat-chip-svg">${getCatSvg(cat.id, { mood: cat.is_active ? 'happy' : 'idle' })}</span>
          <span class="pe-cat-chip-label">${escapeHtml(chipLabel)}</span>
        </button>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="pe-brand-header">
      <div class="pe-brand-id">
        <div class="pe-brand-emblem"><img src="./assets/app-logo.png" alt="${escapeHtml(i18n.t('app.name'))}" width="52" height="52" /></div>
        <div class="pe-brand-copy">
          <h1 class="pe-brand-title">${escapeHtml(i18n.t('app.name'))}</h1>
          <p class="pe-brand-sub">${escapeHtml(i18n.t('app.tagline'))}</p>
        </div>
      </div>
      <div class="pe-brand-actions">
        <button type="button" id="btn-home-music" class="pe-icon-pill${musicOn ? ' is-on' : ''}" aria-label="${escapeHtml(i18n.t('home.music_toggle'))}" aria-pressed="${musicOn ? 'true' : 'false'}">
          ${musicOn ? UI_ICONS.musicOn : UI_ICONS.musicOff}
        </button>
        <button type="button" id="btn-home-rules" class="pe-icon-pill" aria-label="${escapeHtml(i18n.t('home.rules_open'))}">
          ${UI_ICONS.rules}
        </button>
      </div>
    </div>

    <button type="button" id="btn-home-cat" class="pe-home-cat-card" aria-label="${escapeHtml(i18n.t('home.cat_tap_aria', { cat: catName }))}">
      <div id="home-cat-avatar" class="pe-home-cat-avatar">
        ${getCatSvg(activeCat?.id || 'mochi', { mood: 'idle' })}
      </div>
      <div class="pe-home-cat-speech">
        <div class="pe-home-cat-name">
          <span>${escapeHtml(catName)}</span>
          <span aria-hidden="true">·</span>
          <span style="color: var(--label-secondary); font-weight: 700;">${escapeHtml(catTitle)}</span>
        </div>
        <p id="home-cat-line" class="pe-home-cat-line">${escapeHtml(catGreeting)}</p>
      </div>
    </button>

    <div id="home-hud-strip" class="pe-hud-strip">
      <div class="pe-hud-pill">
        <span id="hud-stars-val" class="pe-hud-val pe-hud-val--gold">${UI_ICONS.starFilled}<span>${hud.totalStars}</span></span>
        <span class="pe-hud-label">${escapeHtml(i18n.t('home.hud_stars'))}</span>
      </div>
      <div class="pe-hud-pill">
        <span id="hud-levels-val" class="pe-hud-val pe-hud-val--violet">${hud.solvedCampaignLevels} / ${hud.totalCampaignLevels}</span>
        <span class="pe-hud-label">${escapeHtml(i18n.t('home.hud_levels'))}</span>
      </div>
      <div class="pe-hud-pill">
        <span id="hud-cats-val" class="pe-hud-val pe-hud-val--mint">${hud.unlockedCatsCount} / ${hud.totalCatsCount}</span>
        <span class="pe-hud-label">${escapeHtml(i18n.t('home.hud_cats'))}</span>
      </div>
      <div class="pe-hud-pill">
        <span id="hud-streak-val" class="pe-hud-val pe-hud-val--flame"><span class="pe-hud-flame-icon">${UI_ICONS.flame}</span><span>${hud.currentStreak}</span></span>
        <span class="pe-hud-label">${escapeHtml(i18n.t('home.hud_streak'))}</span>
      </div>
    </div>

    <section id="card-campaign-hero" class="pe-campaign-hero">
      <div class="pe-campaign-top">
        <span class="pe-hero-kicker">${escapeHtml(i18n.t('home.campaign_kicker'))}</span>
        <span class="pe-hero-pill">${escapeHtml(heroPillText)}</span>
      </div>
      <div class="pe-campaign-body">
        ${renderMiniRackHtml(activeLevel)}
        <div class="pe-campaign-info">
          <h2 class="pe-campaign-title">${escapeHtml(heroTitleText)}</h2>
          <p id="home-campaign-progress" class="pe-campaign-sub">${escapeHtml(heroSubText)}</p>
          <div class="pe-progress-track">
            <div class="pe-progress-fill" style="width: ${campaign.completionPct}%;"></div>
          </div>
        </div>
      </div>
      <button type="button" id="btn-play-campaign" class="pe-btn-3d pe-btn-3d--hero pe-btn-3d--block">
        ${UI_ICONS.play}
        <span>${escapeHtml(heroCtaText)}</span>
      </button>
    </section>

    <section id="card-daily-brew" class="pe-daily-card">
      <div class="pe-daily-copy">
        <span id="home-streak-pill" class="pe-hero-pill">${dailyPillHtml}</span>
        <h3 class="pe-daily-title">${escapeHtml(i18n.t('home.daily_title'))}</h3>
        <p class="pe-daily-sub">${escapeHtml(i18n.t('home.daily_sub', { title: dailyTitle, count: dailyLevel?.color_count || 6 }))}</p>
      </div>
      <button type="button" id="btn-play-daily" class="pe-btn-3d pe-btn-3d--daily-cta pe-daily-cta">
        ${escapeHtml(dailyDone ? i18n.t('home.daily_done') : i18n.t('home.daily_cta'))}
      </button>
    </section>

    <section class="pe-cats-strip-card">
      <div class="pe-strip-head">
        <h3 class="pe-strip-title">${escapeHtml(i18n.t('home.cats_title'))}</h3>
        <span class="pe-strip-meta">${escapeHtml(i18n.t('home.cats_count', { unlocked: hud.unlockedCatsCount, total: hud.totalCatsCount }))}</span>
      </div>
      <div id="home-cats-rail" class="pe-cats-rail">${catsRailHtml}</div>
    </section>

    <div data-ad-slot="home-inline" data-ad-type="inline"></div>
  `;

  // Music toggle (0ms cross-screen sync via gameAudio.onChange)
  const musicBtn = container.querySelector('#btn-home-music');
  const syncMusicBtn = () => {
    if (!musicBtn) return;
    const isOn = gameAudio.isMusicEnabled();
    musicBtn.classList.toggle('is-on', isOn);
    musicBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    musicBtn.innerHTML = isOn ? UI_ICONS.musicOn : UI_ICONS.musicOff;
  };
  const unsubAudio = gameAudio.onChange(syncMusicBtn);
  musicBtn?.addEventListener('click', async () => {
    const next = !gameAudio.isMusicEnabled();
    gameAudio.setMusicEnabled(next);
    gameHaptics.selection();
    syncMusicBtn();
    try {
      await setPref('music_enabled', next);
    } catch { /* ignore */ }
  });

  // Rules sheet
  container.querySelector('#btn-home-rules')?.addEventListener('click', () => {
    gameAudio.sfx.uiTap();
    gameHaptics.selection();
    openRulesSheet();
  });

  // Interactive cat greeting ribbon (honors cat_talk_enabled consistently)
  let happyTimer = null;
  container.querySelector('#btn-home-cat')?.addEventListener('click', () => {
    const catId = activeCat?.id || 'mochi';
    gameHaptics.selection();
    const avatarEl = container.querySelector('#home-cat-avatar');
    const lineEl = container.querySelector('#home-cat-line');
    if (avatarEl) avatarEl.innerHTML = getCatSvg(catId, { mood: 'happy' });
    if (catTalkEnabled) {
      gameAudio.sfx.meow(activeCat?.tone_key || 'cheerful');
      if (lineEl) lineEl.textContent = getCatDialogue(catId, 'pet');
    } else {
      gameAudio.sfx.purr();
    }
    clearTimeout(happyTimer);
    happyTimer = setTimeout(() => {
      if (avatarEl) avatarEl.innerHTML = getCatSvg(catId, { mood: 'idle' });
    }, 1100);
  });

  // Launch campaign (or Endless if all 60 mastered)
  container.querySelector('#btn-play-campaign')?.addEventListener('click', () => {
    gameAudio.sfx.uiTap();
    gameHaptics.impact('MEDIUM');
    if (isAllDone) {
      router.push('play', { mode: 'endless', difficulty: 'medium' });
    } else if (activeLevel) {
      router.push('play', { levelId: activeLevel.id });
    }
  });

  // Launch Daily Brew
  container.querySelector('#btn-play-daily')?.addEventListener('click', () => {
    if (!dailyLevel) return;
    gameAudio.sfx.uiTap();
    gameHaptics.impact('MEDIUM');
    router.push('play', { mode: 'daily', levelId: dailyLevel.id, dayKey: daily.dayKey });
  });

  // Visiting cats quick rail
  container.querySelectorAll('#home-cats-rail .pe-cat-chip').forEach((chip) => {
    chip.addEventListener('click', async () => {
      const targetId = chip.getAttribute('data-cat-id');
      const cat = cats.find((c) => c.id === targetId);
      if (!cat) return;
      gameHaptics.selection();

      if (cat.is_unlocked && !cat.is_active) {
        try {
          await setActiveCat(cat.id);
          gameAudio.sfx.meow(cat.tone_key);
          router.showToast(i18n.t('home.cat_selected_toast', { cat: getLocalized(cat, 'name', lang) }));
          router.rerenderCurrent();
        } catch (err) {
          router.showToast(err?.message || i18n.t('af.error_title'));
        }
      } else {
        gameAudio.sfx.uiTap();
        openCatDetailSheet(cat, {
          onActivated: () => router.rerenderCurrent()
        });
      }
    });
  });

  return () => {
    clearTimeout(happyTimer);
    unsubAudio();
  };
}
