/* ============================================================================
 * Screen 3: STATS & CATS (6 Visiting Cats Collection + 4-Tile Bento Summary +
 * SQLite Game & Accessibility Preferences + Appearance/Language + Reset + Ad)
 * Zero Mock Data: Every stat, cat unlock, and toggle persists in real SQLite
 * ============================================================================ */

import { AppFactory, escapeHtml } from '../../../../core-engine/js/engine.js';
import {
  getAllPrefs,
  getCatCompanions,
  getStatsSummary,
  resetAllProgress,
  setActiveCat,
  setPref
} from '../data/repository.js';
import { getCatSvg, UI_ICONS } from '../cats.js';
import { gameAudio } from '../audio.js';
import {
  gameHaptics,
  getLocalized,
  openCatDetailSheet,
  setColorblindLocal,
  setHapticsEnabledLocal
} from '../ui-helpers.js';

const { i18n, iapHook } = AppFactory;

function renderSwitchRow({ id, title, sub, checked }) {
  return `
    <div class="af-list-row">
      <div class="af-list-row-main">
        <div class="af-list-row-title">${escapeHtml(title)}</div>
        <div class="af-list-row-sub">${escapeHtml(sub)}</div>
      </div>
      <div class="af-list-row-trailing">
        <label class="af-switch">
          <input type="checkbox" id="${escapeHtml(id)}"${checked ? ' checked' : ''} aria-label="${escapeHtml(title)}" />
          <span class="af-switch-track"><span class="af-switch-thumb"></span></span>
        </label>
      </div>
    </div>
  `;
}

export async function renderStats({ container, router }) {
  gameAudio.setMode('menu');

  let cats;
  let stats;
  let prefs;
  try {
    [cats, stats, prefs] = await Promise.all([
      getCatCompanions(),
      getStatsSummary(),
      getAllPrefs()
    ]);
  } catch (err) {
    container.innerHTML = `
      <div class="af-empty-state">
        <div class="af-empty-icon">!</div>
        <h2 class="af-empty-title">${escapeHtml(i18n.t('af.error_title'))}</h2>
        <p class="af-empty-desc">${escapeHtml(err?.message || '')}</p>
        <button type="button" id="btn-stats-retry" class="af-btn af-btn-primary">${escapeHtml(i18n.t('home.retry'))}</button>
      </div>
    `;
    container.querySelector('#btn-stats-retry')?.addEventListener('click', () => router.rerenderCurrent());
    return;
  }

  const lang = i18n.getLang();
  const currentTheme = AppFactory.getTheme();

  const catsGridHtml = cats
    .map((cat) => {
      const name = getLocalized(cat, 'name', lang);
      const role = getLocalized(cat, 'title', lang);
      const favName = getLocalized(cat.favorite_elixir, 'name', lang);
      const cardCls = ['pe-cat-card'];
      if (cat.is_active) cardCls.push('is-active-cat');
      if (!cat.is_unlocked) cardCls.push('is-locked');

      let btnHtml;
      if (cat.is_active) {
        btnHtml = `<button type="button" class="pe-cat-action-btn pe-cat-action-btn--active" data-cat-select="${escapeHtml(cat.id)}">${escapeHtml(i18n.t('stats.cat_active'))}</button>`;
      } else if (cat.is_unlocked) {
        btnHtml = `<button type="button" class="pe-cat-action-btn pe-cat-action-btn--select" data-cat-select="${escapeHtml(cat.id)}">${escapeHtml(i18n.t('stats.cat_select'))}</button>`;
      } else {
        btnHtml = `<button type="button" class="pe-cat-action-btn pe-cat-action-btn--locked" disabled>${UI_ICONS.lock}<span>${escapeHtml(i18n.t('stats.cat_locked', { level: cat.unlock_level }))}</span></button>`;
      }

      return `
        <article class="${cardCls.join(' ')}" data-cat-id="${escapeHtml(cat.id)}">
          <div class="pe-cat-portrait" data-cat-detail="${escapeHtml(cat.id)}">
            ${getCatSvg(cat.id, { mood: cat.is_active ? 'happy' : 'idle' })}
          </div>
          <h3 class="pe-cat-name">${escapeHtml(name)}</h3>
          <p class="pe-cat-role">${escapeHtml(role)}</p>
          <div class="pe-cat-fav">
            <span class="pe-cat-fav-dot" style="background: ${escapeHtml(cat.favorite_elixir?.hex_color || cat.accent_hex)};"></span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(favName)}</span>
          </div>
          ${btnHtml}
        </article>
      `;
    })
    .join('');

  const restoreIapHtml = iapHook?.enabled
    ? `
      <div class="af-list-group">
        <button type="button" id="btn-restore-purchases" class="af-list-row is-interactive">
          <div class="af-list-row-main">
            <div class="af-list-row-title" style="color: var(--accent-ink); font-weight: 700;">${escapeHtml(i18n.t('af.restore_purchases'))}</div>
          </div>
        </button>
      </div>
    `
    : '';

  container.innerHTML = `
    <div class="af-section-header">${escapeHtml(i18n.t('stats.section_cats'))}</div>
    <section id="stats-cats-grid" class="pe-cats-grid">${catsGridHtml}</section>

    <div class="af-section-header">${escapeHtml(i18n.t('stats.section_stats'))}</div>
    <section id="stats-bento-grid" class="pe-bento-grid">
      <div class="pe-bento-tile">
        <span class="pe-bento-label">${escapeHtml(i18n.t('stats.bento_solved'))}</span>
        <span id="stat-solved-value" class="pe-bento-value">${stats.solvedCampaignLevels} / ${stats.totalCampaignLevels}</span>
        <span class="pe-bento-sub">${escapeHtml(i18n.t('stats.bento_stars_sub', { stars: stats.totalStars, max: stats.maxStars }))}</span>
      </div>
      <div class="pe-bento-tile">
        <span class="pe-bento-label">${escapeHtml(i18n.t('stats.bento_streak'))}</span>
        <span id="stat-streak-value" class="pe-bento-value">${escapeHtml(i18n.t('stats.bento_streak_val', { count: stats.currentStreak }))}</span>
        <span class="pe-bento-sub">${escapeHtml(i18n.t('stats.bento_streak_best', { count: stats.longestStreak }))}</span>
      </div>
      <div class="pe-bento-tile">
        <span class="pe-bento-label">${escapeHtml(i18n.t('stats.bento_sealed'))}</span>
        <span id="stat-sealed-value" class="pe-bento-value">${stats.totalBottlesSealed}</span>
        <span class="pe-bento-sub">${escapeHtml(i18n.t('stats.bento_combo_sub', { combo: stats.bestCombo || 0 }))}</span>
      </div>
      <div class="pe-bento-tile">
        <span class="pe-bento-label">${escapeHtml(i18n.t('stats.bento_endless'))}</span>
        <span id="stat-endless-value" class="pe-bento-value">${stats.solvedEndlessCount > 0 ? stats.solvedEndlessCount : '—'}</span>
        <span class="pe-bento-sub">${escapeHtml(i18n.t('stats.bento_total_sub', { total: stats.totalSolved }))}</span>
      </div>
    </section>

    <div class="af-section-header">${escapeHtml(i18n.t('stats.section_prefs'))}</div>
    <div class="af-list-group">
      ${renderSwitchRow({
        id: 'pref-music-enabled',
        title: i18n.t('stats.pref_music'),
        sub: i18n.t('stats.pref_music_sub'),
        checked: prefs.music_enabled
      })}
      ${renderSwitchRow({
        id: 'pref-sfx-enabled',
        title: i18n.t('stats.pref_sfx'),
        sub: i18n.t('stats.pref_sfx_sub'),
        checked: prefs.sfx_enabled
      })}
      ${renderSwitchRow({
        id: 'pref-haptics-enabled',
        title: i18n.t('stats.pref_haptics'),
        sub: i18n.t('stats.pref_haptics_sub'),
        checked: prefs.haptics_enabled
      })}
      ${renderSwitchRow({
        id: 'pref-cat-talk-enabled',
        title: i18n.t('stats.pref_cat_talk'),
        sub: i18n.t('stats.pref_cat_talk_sub'),
        checked: prefs.cat_talk_enabled
      })}
      ${renderSwitchRow({
        id: 'pref-colorblind-symbols',
        title: i18n.t('stats.pref_colorblind'),
        sub: i18n.t('stats.pref_colorblind_sub'),
        checked: prefs.colorblind_symbols
      })}
    </div>

    <div class="af-section-header">${escapeHtml(i18n.t('stats.section_display'))}</div>
    <div class="af-list-group">
      <div class="pe-setting-stack">
        <span class="pe-setting-stack-label">${escapeHtml(i18n.t('stats.theme_label'))}</span>
        <div class="af-segmented" role="radiogroup" aria-label="${escapeHtml(i18n.t('stats.theme_label'))}">
          <button type="button" class="af-segmented-btn${currentTheme === 'light' ? ' is-active' : ''}" data-theme-val="light">${escapeHtml(i18n.t('af.theme_light'))}</button>
          <button type="button" class="af-segmented-btn${currentTheme === 'dark' ? ' is-active' : ''}" data-theme-val="dark">${escapeHtml(i18n.t('af.theme_dark'))}</button>
          <button type="button" class="af-segmented-btn${currentTheme === 'system' ? ' is-active' : ''}" data-theme-val="system">${escapeHtml(i18n.t('af.theme_system'))}</button>
        </div>
      </div>
      <div class="pe-setting-stack">
        <span class="pe-setting-stack-label">${escapeHtml(i18n.t('stats.lang_label'))}</span>
        <div class="af-segmented" role="radiogroup" aria-label="${escapeHtml(i18n.t('stats.lang_label'))}">
          <button type="button" class="af-segmented-btn${lang === 'en' ? ' is-active' : ''}" data-lang-val="en">${escapeHtml(i18n.t('stats.lang_en'))}</button>
          <button type="button" class="af-segmented-btn${lang === 'tr' ? ' is-active' : ''}" data-lang-val="tr">${escapeHtml(i18n.t('stats.lang_tr'))}</button>
        </div>
      </div>
    </div>

    ${restoreIapHtml}

    <div class="pe-privacy-note">${escapeHtml(i18n.t('stats.privacy_note'))}</div>

    <button type="button" id="btn-reset-progress" class="af-btn af-btn-destructive af-btn-block">
      ${escapeHtml(i18n.t('stats.reset_btn'))}
    </button>

    <div data-ad-slot="stats-banner" data-ad-type="banner"></div>
  `;

  // Cat companion activation & detail sheet
  container.querySelectorAll('[data-cat-select]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const catId = btn.getAttribute('data-cat-select');
      const cat = cats.find((c) => c.id === catId);
      if (!cat || !cat.is_unlocked) return;
      if (cat.is_active) {
        gameAudio.sfx.meow(cat.tone_key);
        openCatDetailSheet(cat);
        return;
      }
      try {
        await setActiveCat(cat.id);
        gameAudio.sfx.meow(cat.tone_key);
        gameHaptics.notification('SUCCESS');
        router.showToast(i18n.t('home.cat_selected_toast', { cat: getLocalized(cat, 'name', lang) }));
        router.rerenderCurrent();
      } catch (err) {
        router.showToast(err?.message || i18n.t('af.error_title'));
      }
    });
  });

  container.querySelectorAll('[data-cat-detail]').forEach((el) => {
    el.addEventListener('click', () => {
      const catId = el.getAttribute('data-cat-detail');
      const cat = cats.find((c) => c.id === catId);
      if (!cat) return;
      gameAudio.sfx.uiTap();
      openCatDetailSheet(cat, { onActivated: () => router.rerenderCurrent() });
    });
  });

  // SQLite preference toggle bindings
  const bindPrefToggle = (selector, prefKey, onSideEffect) => {
    const input = container.querySelector(selector);
    input?.addEventListener('change', async () => {
      const val = Boolean(input.checked);
      gameHaptics.selection();
      try {
        await setPref(prefKey, val);
        if (typeof onSideEffect === 'function') onSideEffect(val);
      } catch (err) {
        input.checked = !val;
        router.showToast(err?.message || i18n.t('af.error_title'));
      }
    });
  };

  bindPrefToggle('#pref-music-enabled', 'music_enabled', (val) => gameAudio.setMusicEnabled(val));
  bindPrefToggle('#pref-sfx-enabled', 'sfx_enabled', (val) => {
    gameAudio.setSfxEnabled(val);
    if (val) gameAudio.sfx.uiTap();
  });
  bindPrefToggle('#pref-haptics-enabled', 'haptics_enabled', (val) => setHapticsEnabledLocal(val));
  bindPrefToggle('#pref-cat-talk-enabled', 'cat_talk_enabled');
  bindPrefToggle('#pref-colorblind-symbols', 'colorblind_symbols', (val) => setColorblindLocal(val));

  // Theme segmented selector (Light / Dark / System)
  container.querySelectorAll('[data-theme-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-theme-val') || 'light';
      AppFactory.setTheme(mode);
      gameAudio.sfx.uiTap();
      gameHaptics.selection();
      container.querySelectorAll('[data-theme-val]').forEach((b) => {
        b.classList.toggle('is-active', b.getAttribute('data-theme-val') === mode);
      });
    });
  });

  // Language segmented selector (EN / TR)
  container.querySelectorAll('[data-lang-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextLang = btn.getAttribute('data-lang-val') || 'en';
      if (nextLang === i18n.getLang()) return;
      gameAudio.sfx.uiTap();
      gameHaptics.selection();
      i18n.setLang(nextLang);
    });
  });

  // Optional IAP restore
  container.querySelector('#btn-restore-purchases')?.addEventListener('click', async () => {
    gameHaptics.selection();
    try {
      await iapHook.restore();
      router.showToast(i18n.t('stats.restore_done'));
    } catch (err) {
      router.showToast(err?.message || i18n.t('af.error_title'));
    }
  });

  // Confirmed Reset All Progress
  container.querySelector('#btn-reset-progress')?.addEventListener('click', async () => {
    gameAudio.sfx.uiTap();
    const ok = await router.showAlert({
      title: i18n.t('stats.reset_title'),
      message: i18n.t('stats.reset_message'),
      confirmText: i18n.t('stats.reset_confirm'),
      cancelText: i18n.t('af.cancel'),
      destructive: true
    });
    if (!ok) return;
    try {
      await resetAllProgress();
      gameHaptics.notification('WARNING');
      router.showToast(i18n.t('stats.reset_done'));
      router.rerenderCurrent();
    } catch (err) {
      router.showToast(err?.message || i18n.t('af.error_title'));
    }
  });
}
