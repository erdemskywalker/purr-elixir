/* ============================================================================
 * Purr Elixir — Shared UI Formatters, Preference Sync, Haptics & Modal Sheets
 * Zero mock data: Elixir catalog & cat companion sheets read live SQLite data
 * ============================================================================ */

import { AppFactory, escapeHtml } from '../../../core-engine/js/engine.js';
import { getAllPrefs, getElixirCatalog, setActiveCat } from './data/repository.js';
import { getCatSvg, UI_ICONS } from './cats.js';
import { gameAudio } from './audio.js';

const { NativeBridge, i18n, router } = AppFactory;

let hapticsEnabledCache = true;
let elixirCatalogCache = null;

export async function syncAppPrefs() {
  try {
    const prefs = await getAllPrefs();
    hapticsEnabledCache = Boolean(prefs.haptics_enabled);
    setColorblindLocal(Boolean(prefs.colorblind_symbols));
    gameAudio.init({
      musicEnabled: Boolean(prefs.music_enabled),
      sfxEnabled: Boolean(prefs.sfx_enabled)
    });
    return prefs;
  } catch {
    hapticsEnabledCache = true;
    setColorblindLocal(false);
    gameAudio.init({ musicEnabled: true, sfxEnabled: true });
    return null;
  }
}

export function setHapticsEnabledLocal(enabled) {
  hapticsEnabledCache = Boolean(enabled);
}

export function setColorblindLocal(enabled) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-colorblind', enabled ? 'true' : 'false');
  }
}

export const gameHaptics = {
  impact(style = 'LIGHT') {
    if (!hapticsEnabledCache) return;
    NativeBridge.haptics.impact(style);
  },
  selection() {
    if (!hapticsEnabledCache) return;
    NativeBridge.haptics.selection();
  },
  notification(type = 'SUCCESS') {
    if (!hapticsEnabledCache) return;
    NativeBridge.haptics.notification(type);
  }
};

export function getLocalized(obj, baseField = 'name', lang = i18n.getLang()) {
  if (!obj) return '';
  return lang === 'tr' ? obj[`${baseField}_tr`] || obj[`${baseField}_en`] || '' : obj[`${baseField}_en`] || obj[`${baseField}_tr`] || '';
}

export function tierLabel(tier) {
  return i18n.t(`tier.${tier || 'starter'}`);
}

export function renderStarsHtml(stars = 0, max = 3) {
  const count = Math.max(0, Math.min(max, Number(stars) || 0));
  let html = '<span class="pe-stars" aria-hidden="true">';
  for (let i = 1; i <= max; i++) {
    html += `<span class="${i <= count ? 'pe-star-on' : 'pe-star-off'}">${UI_ICONS.starFilled}</span>`;
  }
  html += '</span>';
  return html;
}

export async function loadElixirCatalog() {
  if (elixirCatalogCache && elixirCatalogCache.length > 0) return elixirCatalogCache;
  elixirCatalogCache = await getElixirCatalog();
  return elixirCatalogCache;
}

export function getElixirName(catalog, elixirId, lang = i18n.getLang()) {
  const row = (catalog || []).find((e) => Number(e.elixir_id) === Number(elixirId));
  return row ? getLocalized(row, 'name', lang) : '';
}

export async function openRulesSheet() {
  const catalog = await loadElixirCatalog();
  const lang = i18n.getLang();

  router.openSheet({
    title: i18n.t('rules.sheet_title'),
    render: (body) => {
      const chips = catalog
        .map((e) => {
          const name = getLocalized(e, 'name', lang);
          return `
            <div class="pe-elixir-chip">
              <span class="pe-elixir-swatch" style="background: var(--elixir-solid-${Number(e.elixir_id)});">${escapeHtml(e.symbol)}</span>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(name)}</span>
            </div>
          `;
        })
        .join('');

      body.innerHTML = `
        <div class="pe-rules-list">
          <div class="pe-rule-item">
            <span class="pe-rule-num">1</span>
            <span class="pe-rule-text">${escapeHtml(i18n.t('rules.step_1'))}</span>
          </div>
          <div class="pe-rule-item">
            <span class="pe-rule-num">2</span>
            <span class="pe-rule-text">${escapeHtml(i18n.t('rules.step_2'))}</span>
          </div>
          <div class="pe-rule-item">
            <span class="pe-rule-num">3</span>
            <span class="pe-rule-text">${escapeHtml(i18n.t('rules.step_3'))}</span>
          </div>
        </div>
        <div class="af-section-header" style="margin-inline: 2px;">${escapeHtml(i18n.t('rules.legend_title'))}</div>
        <div class="pe-elixir-legend">${chips}</div>
      `;
    }
  });
}

export function openCatDetailSheet(cat, { onActivated = null } = {}) {
  if (!cat) return;
  const lang = i18n.getLang();
  const catName = getLocalized(cat, 'name', lang);
  const catTitle = getLocalized(cat, 'title', lang);
  const catPersonality = getLocalized(cat, 'personality', lang);
  const favName = getLocalized(cat.favorite_elixir, 'name', lang);

  router.openSheet({
    title: `${catName} · ${catTitle}`,
    render: (body, close) => {
      const actionHtml = cat.is_active
        ? `<button type="button" class="pe-btn-3d pe-btn-3d--porcelain pe-btn-3d--block" disabled>${escapeHtml(i18n.t('stats.cat_active'))}</button>`
        : cat.is_unlocked
          ? `<button type="button" id="btn-sheet-select-cat" class="pe-btn-3d pe-btn-3d--violet pe-btn-3d--block">${escapeHtml(i18n.t('stats.cat_select'))}</button>`
          : `<div class="pe-privacy-note" style="width:100%;margin-bottom:0;text-align:center;">${escapeHtml(i18n.t('stats.cat_unlock_hint', { level: cat.unlock_level, cat: catName }))}</div>`;

      body.innerHTML = `
        <div class="pe-reward-sheet">
          <div class="pe-cat-portrait" style="width:76px;height:76px;border-radius:22px;">
            ${getCatSvg(cat.id, { mood: cat.is_unlocked ? 'happy' : 'idle' })}
          </div>
          <p class="pe-reward-desc">${escapeHtml(catPersonality)}</p>
          <div class="pe-cat-fav" style="padding:5px 12px;font-size:12.5px;">
            <span class="pe-cat-fav-dot" style="background:${escapeHtml(cat.favorite_elixir?.hex_color || cat.accent_hex)};"></span>
            <span>${escapeHtml(i18n.t('stats.cat_fav_label'))}: <strong>${escapeHtml(favName)}</strong></span>
          </div>
          <div style="width:100%;margin-top:6px;">${actionHtml}</div>
        </div>
      `;

      body.querySelector('#btn-sheet-select-cat')?.addEventListener('click', async () => {
        try {
          await setActiveCat(cat.id);
          gameAudio.sfx.meow(cat.tone_key);
          gameHaptics.notification('SUCCESS');
          close();
          router.showToast(i18n.t('home.cat_selected_toast', { cat: catName }));
          if (typeof onActivated === 'function') onActivated(cat);
        } catch (err) {
          router.showToast(err?.message || i18n.t('af.error_title'));
        }
      });
    }
  });
}
