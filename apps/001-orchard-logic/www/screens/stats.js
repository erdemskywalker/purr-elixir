/* ============================================================================
 * Orchard Logic — Screen 3: Stats & Settings
 * Surfaces Real SQLite Bento Stats, Per-Grid-Size Best Times (tierBreakdown),
 * Longest Streak, Endless Count, Gameplay/Audio/Colorblind Prefs, Theme/Lang
 * & Confirmed Progress Reset
 * ============================================================================ */

import { AppFactory, escapeHtml } from '../core-engine/js/engine.js';
import {
  getStatsSummary,
  getAllPrefs,
  setPref,
  resetAllProgress
} from '../data/repository.js';
import { UI_ICONS } from '../fruits.js';
import { gameAudio } from '../audio.js';
import { formatDuration, tierLabel, gameHaptics, setHapticsEnabledLocal } from '../ui-helpers.js';

const { i18n, iapHook } = AppFactory;

export async function renderStats({ container, router }) {
  gameAudio.setMode('menu');
  let stats = {
    solvedCampaignLevels: 0,
    totalCampaignLevels: 30,
    solvedEndlessCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    best10x10Seconds: null,
    tierBreakdown: []
  };
  let prefs = {
    auto_x: true,
    highlight_conflicts: true,
    haptics_enabled: true,
    music_enabled: true,
    sfx_enabled: true,
    colorblind_hints: false
  };

  try {
    const [loadedStats, loadedPrefs] = await Promise.all([
      getStatsSummary(),
      getAllPrefs()
    ]);
    stats = loadedStats;
    prefs = loadedPrefs;
  } catch (err) {
    console.error('[OrchardLogic Stats]', err);
  }

  const curTheme = AppFactory.getTheme();
  const curLang = i18n.getLang();

  const tierRowsHtml = (stats.tierBreakdown || [])
    .map((t) => {
      const pct = t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0;
      return `
        <div class="af-list-row ol-tier-row">
          <div class="af-list-row-main">
            <div class="ol-tier-row-head">
              <span class="af-list-row-title">${escapeHtml(tierLabel(t.tier))}</span>
              <span class="ol-size-badge ol-size-badge--${escapeHtml(t.tier)}">${t.grid_size}×${t.grid_size}</span>
            </div>
            <div class="af-list-row-sub">${escapeHtml(i18n.t('stats.tier_progress', { done: t.completed, total: t.total, stars: t.stars }))}</div>
            <div class="ol-mini-bar"><span class="ol-mini-bar-fill ol-mini-bar-fill--${escapeHtml(t.tier)}" style="width: ${pct}%;"></span></div>
          </div>
          <div class="af-list-row-trailing">
            <span class="ol-level-time ol-tier-best-pill">${escapeHtml(formatDuration(t.best_seconds))}</span>
          </div>
        </div>
      `;
    })
    .join('');

  const restorePurchasesRow = iapHook.enabled
    ? `
      <button type="button" class="af-list-row is-interactive" id="btn-restore-purchases">
        <div class="af-list-row-main">
          <div class="af-list-row-title" style="color: var(--accent-ink);">${escapeHtml(i18n.t('af.restore_purchases'))}</div>
        </div>
      </button>
    `
    : '';

  container.innerHTML = `
    <div class="ol-bento-grid" id="stats-bento-grid">
      <div class="ol-bento-card">
        <div class="ol-bento-icon ol-bento-icon--success">${UI_ICONS.checkCircle}</div>
        <div class="ol-bento-value" id="stat-solved-value">${stats.solvedCampaignLevels} / ${stats.totalCampaignLevels}</div>
        <div class="ol-bento-label">${escapeHtml(i18n.t('stats.bento_solved'))}</div>
      </div>

      <div class="ol-bento-card">
        <div class="ol-bento-icon ol-bento-icon--warning">${UI_ICONS.flame}</div>
        <div class="ol-bento-value" id="stat-streak-value">${escapeHtml(i18n.t('stats.streak_value', { count: stats.currentStreak }))}</div>
        <div class="ol-bento-label">${escapeHtml(i18n.t('stats.bento_streak_best', { best: stats.longestStreak || 0 }))}</div>
      </div>

      <div class="ol-bento-card">
        <div class="ol-bento-icon ol-bento-icon--gold">${UI_ICONS.trophy}</div>
        <div class="ol-bento-value" id="stat-best10-value">${escapeHtml(formatDuration(stats.best10x10Seconds))}</div>
        <div class="ol-bento-label">${escapeHtml(i18n.t('stats.bento_best10'))}</div>
      </div>

      <div class="ol-bento-card">
        <div class="ol-bento-icon">${UI_ICONS.infinity}</div>
        <div class="ol-bento-value" id="stat-endless-value">${stats.solvedEndlessCount || 0}</div>
        <div class="ol-bento-label">${escapeHtml(i18n.t('stats.bento_endless'))}</div>
      </div>
    </div>

    ${
      tierRowsHtml
        ? `
          <div class="af-section-header">${escapeHtml(i18n.t('stats.section_tiers'))}</div>
          <div class="af-list-group" id="stats-tier-breakdown">${tierRowsHtml}</div>
        `
        : ''
    }

    <div class="af-section-header">${escapeHtml(i18n.t('stats.section_gameplay'))}</div>
    <div class="af-list-group">
      <div class="af-list-row ol-setting-row">
        <div class="af-list-row-main">
          <div class="af-list-row-title">${escapeHtml(i18n.t('stats.pref_autox_title'))}</div>
          <div class="af-list-row-sub">${escapeHtml(i18n.t('stats.pref_autox_sub'))}</div>
        </div>
        <label class="af-switch">
          <input type="checkbox" id="pref-auto-x" data-pref-key="auto_x" ${prefs.auto_x ? 'checked' : ''} aria-label="${escapeHtml(i18n.t('stats.pref_autox_title'))}" />
          <span class="af-switch-track"><span class="af-switch-thumb"></span></span>
        </label>
      </div>

      <div class="af-list-row ol-setting-row">
        <div class="af-list-row-main">
          <div class="af-list-row-title">${escapeHtml(i18n.t('stats.pref_conflict_title'))}</div>
          <div class="af-list-row-sub">${escapeHtml(i18n.t('stats.pref_conflict_sub'))}</div>
        </div>
        <label class="af-switch">
          <input type="checkbox" id="pref-highlight-conflicts" data-pref-key="highlight_conflicts" ${prefs.highlight_conflicts ? 'checked' : ''} aria-label="${escapeHtml(i18n.t('stats.pref_conflict_title'))}" />
          <span class="af-switch-track"><span class="af-switch-thumb"></span></span>
        </label>
      </div>

      <div class="af-list-row ol-setting-row">
        <div class="af-list-row-main">
          <div class="af-list-row-title">${escapeHtml(i18n.t('stats.pref_colorblind_title'))}</div>
          <div class="af-list-row-sub">${escapeHtml(i18n.t('stats.pref_colorblind_sub'))}</div>
        </div>
        <label class="af-switch">
          <input type="checkbox" id="pref-colorblind-hints" data-pref-key="colorblind_hints" ${prefs.colorblind_hints ? 'checked' : ''} aria-label="${escapeHtml(i18n.t('stats.pref_colorblind_title'))}" />
          <span class="af-switch-track"><span class="af-switch-thumb"></span></span>
        </label>
      </div>

      <div class="af-list-row ol-setting-row">
        <div class="af-list-row-main">
          <div class="af-list-row-title">${escapeHtml(i18n.t('stats.pref_haptics_title'))}</div>
          <div class="af-list-row-sub">${escapeHtml(i18n.t('stats.pref_haptics_sub'))}</div>
        </div>
        <label class="af-switch">
          <input type="checkbox" id="pref-haptics-enabled" data-pref-key="haptics_enabled" ${prefs.haptics_enabled ? 'checked' : ''} aria-label="${escapeHtml(i18n.t('stats.pref_haptics_title'))}" />
          <span class="af-switch-track"><span class="af-switch-thumb"></span></span>
        </label>
      </div>

      <div class="af-list-row ol-setting-row">
        <div class="af-list-row-main">
          <div class="af-list-row-title">${escapeHtml(i18n.t('stats.pref_music_title'))}</div>
          <div class="af-list-row-sub">${escapeHtml(i18n.t('stats.pref_music_sub'))}</div>
        </div>
        <label class="af-switch">
          <input type="checkbox" id="pref-music-enabled" data-pref-key="music_enabled" ${prefs.music_enabled ? 'checked' : ''} aria-label="${escapeHtml(i18n.t('stats.pref_music_title'))}" />
          <span class="af-switch-track"><span class="af-switch-thumb"></span></span>
        </label>
      </div>

      <div class="af-list-row ol-setting-row">
        <div class="af-list-row-main">
          <div class="af-list-row-title">${escapeHtml(i18n.t('stats.pref_sfx_title'))}</div>
          <div class="af-list-row-sub">${escapeHtml(i18n.t('stats.pref_sfx_sub'))}</div>
        </div>
        <label class="af-switch">
          <input type="checkbox" id="pref-sfx-enabled" data-pref-key="sfx_enabled" ${prefs.sfx_enabled ? 'checked' : ''} aria-label="${escapeHtml(i18n.t('stats.pref_sfx_title'))}" />
          <span class="af-switch-track"><span class="af-switch-thumb"></span></span>
        </label>
      </div>
    </div>

    <div class="af-section-header">${escapeHtml(i18n.t('stats.section_appearance'))}</div>
    <div class="af-list-group">
      <div class="ol-setting-stack">
        <div class="af-list-row-title">${escapeHtml(i18n.t('af.theme'))}</div>
        <div class="af-segmented" id="theme-seg">
          <button type="button" class="af-segmented-btn${curTheme === 'system' ? ' is-active' : ''}" data-theme-val="system">${escapeHtml(i18n.t('af.theme_system'))}</button>
          <button type="button" class="af-segmented-btn${curTheme === 'light' ? ' is-active' : ''}" data-theme-val="light">${escapeHtml(i18n.t('af.theme_light'))}</button>
          <button type="button" class="af-segmented-btn${curTheme === 'dark' ? ' is-active' : ''}" data-theme-val="dark">${escapeHtml(i18n.t('af.theme_dark'))}</button>
        </div>
      </div>

      <div class="ol-setting-stack">
        <div class="af-list-row-title">${escapeHtml(i18n.t('af.language'))}</div>
        <div class="af-segmented" id="lang-seg">
          <button type="button" class="af-segmented-btn${curLang === 'en' ? ' is-active' : ''}" data-lang-val="en">${escapeHtml(i18n.t('stats.lang_en'))}</button>
          <button type="button" class="af-segmented-btn${curLang === 'tr' ? ' is-active' : ''}" data-lang-val="tr">${escapeHtml(i18n.t('stats.lang_tr'))}</button>
        </div>
      </div>

      ${restorePurchasesRow}

      <button type="button" class="af-list-row is-interactive" id="btn-reset-all-progress">
        <div class="af-list-row-main">
          <div class="af-list-row-title" style="color: var(--color-danger);">${escapeHtml(i18n.t('stats.reset_all_btn'))}</div>
        </div>
      </button>
    </div>

    <p class="ol-privacy-note" id="stats-privacy-note">${escapeHtml(i18n.t('stats.privacy_note'))}</p>

    <div data-ad-slot="stats-banner" data-ad-type="banner"></div>
  `;

  container.querySelectorAll('input[data-pref-key]').forEach((input) => {
    input.addEventListener('change', async () => {
      const key = input.getAttribute('data-pref-key');
      const checked = input.checked;
      if (key === 'haptics_enabled') setHapticsEnabledLocal(checked);
      else if (key === 'music_enabled') gameAudio.setMusicEnabled(checked);
      else if (key === 'sfx_enabled') gameAudio.setSfxEnabled(checked);

      gameAudio.sfx.uiTap();
      gameHaptics.selection();
      try {
        await setPref(key, checked);
      } catch (err) {
        console.error('[OrchardLogic Pref Save]', err);
        input.checked = !checked;
        if (key === 'haptics_enabled') setHapticsEnabledLocal(!checked);
        if (key === 'music_enabled') gameAudio.setMusicEnabled(!checked);
        if (key === 'sfx_enabled') gameAudio.setSfxEnabled(!checked);
        router.showToast(i18n.t('stats.pref_save_error'));
      }
    });
  });

  container.querySelectorAll('[data-theme-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-theme-val');
      if (!mode) return;
      gameAudio.sfx.uiTap();
      gameHaptics.selection();
      AppFactory.setTheme(mode);
      container.querySelectorAll('[data-theme-val]').forEach((b) => {
        b.classList.toggle('is-active', b.getAttribute('data-theme-val') === mode);
      });
    });
  });

  container.querySelectorAll('[data-lang-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-lang-val');
      if (!code || code === i18n.getLang()) return;
      gameAudio.sfx.uiTap();
      gameHaptics.selection();
      i18n.setLang(code);
    });
  });

  container.querySelector('#btn-restore-purchases')?.addEventListener('click', async () => {
    gameAudio.sfx.uiTap();
    gameHaptics.selection();
    router.showToast(i18n.t('stats.restore_toast'));
    await iapHook.restorePurchases();
  });

  container.querySelector('#btn-reset-all-progress')?.addEventListener('click', async () => {
    gameAudio.sfx.uiTap();
    const ok = await router.showAlert({
      title: i18n.t('stats.reset_all_title'),
      message: i18n.t('stats.reset_all_msg'),
      confirmText: i18n.t('stats.reset_all_confirm'),
      cancelText: i18n.t('af.cancel'),
      destructive: true
    });
    if (!ok) return;
    await resetAllProgress();
    gameAudio.sfx.clearCell();
    router.showToast(i18n.t('stats.reset_all_toast'));
    await router.rerenderCurrent();
  });
}
