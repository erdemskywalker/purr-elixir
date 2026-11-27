/* ============================================================================
 * Orchard Logic — Shared UI Formatters, Haptics Wrapper & Rules/Fruit Sheet
 * ============================================================================ */

import { AppFactory, escapeHtml } from './core-engine/js/engine.js';
import { getAllPrefs, getFruitCatalog } from './data/repository.js';
import { getFruitSvg, UI_ICONS } from './fruits.js';

const { NativeBridge, i18n, router } = AppFactory;

let hapticsEnabledCache = true;
let fruitCatalogCache = null;

export async function syncHapticsPref() {
  try {
    const prefs = await getAllPrefs();
    hapticsEnabledCache = Boolean(prefs.haptics_enabled);
  } catch {
    hapticsEnabledCache = true;
  }
  return hapticsEnabledCache;
}

export function setHapticsEnabledLocal(enabled) {
  hapticsEnabledCache = Boolean(enabled);
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

export function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return '—';
  const total = Math.max(0, Math.floor(Number(seconds)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function tierLabel(tier) {
  return i18n.t(`tier.${tier || 'master'}`);
}

export function renderStarsHtml(stars = 0, max = 3) {
  const count = Math.max(0, Math.min(max, Number(stars) || 0));
  let html = '<span class="ol-stars" aria-hidden="true">';
  for (let i = 1; i <= max; i++) {
    html += `<span class="${i <= count ? '' : 'ol-star-empty'}">${UI_ICONS.starFilled}</span>`;
  }
  html += '</span>';
  return html;
}

export async function loadFruitCatalog() {
  if (fruitCatalogCache && fruitCatalogCache.length > 0) return fruitCatalogCache;
  fruitCatalogCache = await getFruitCatalog();
  return fruitCatalogCache;
}

export function getFruitName(catalog, colorId, lang = i18n.getLang()) {
  const row = catalog.find((f) => Number(f.color_id) === Number(colorId));
  if (!row) return '';
  return lang === 'tr' ? row.name_tr : row.name_en;
}

export function renderQuickRulesGridHtml() {
  return `
    <div class="ol-rules-grid">
      <div class="ol-rule-tile">
        <div class="ol-rule-icon">${UI_ICONS.ruleRow}</div>
        <div class="ol-rule-copy">
          <p class="ol-rule-title">${escapeHtml(i18n.t('rule.row_title'))}</p>
          <p class="ol-rule-desc">${escapeHtml(i18n.t('rule.row_desc'))}</p>
        </div>
      </div>
      <div class="ol-rule-tile">
        <div class="ol-rule-icon">${UI_ICONS.ruleCol}</div>
        <div class="ol-rule-copy">
          <p class="ol-rule-title">${escapeHtml(i18n.t('rule.col_title'))}</p>
          <p class="ol-rule-desc">${escapeHtml(i18n.t('rule.col_desc'))}</p>
        </div>
      </div>
      <div class="ol-rule-tile">
        <div class="ol-rule-icon">${UI_ICONS.ruleRegion}</div>
        <div class="ol-rule-copy">
          <p class="ol-rule-title">${escapeHtml(i18n.t('rule.region_title'))}</p>
          <p class="ol-rule-desc">${escapeHtml(i18n.t('rule.region_desc'))}</p>
        </div>
      </div>
      <div class="ol-rule-tile">
        <div class="ol-rule-icon">${UI_ICONS.ruleDiag}</div>
        <div class="ol-rule-copy">
          <p class="ol-rule-title">${escapeHtml(i18n.t('rule.diag_title'))}</p>
          <p class="ol-rule-desc">${escapeHtml(i18n.t('rule.diag_desc'))}</p>
        </div>
      </div>
    </div>
  `;
}

export async function openRulesSheet() {
  const catalog = await loadFruitCatalog();
  const lang = i18n.getLang();

  router.openSheet({
    title: i18n.t('play.help_sheet_title'),
    render: (body) => {
      const fruitChips = catalog
        .map((f) => {
          const name = lang === 'tr' ? f.name_tr : f.name_en;
          return `
            <div class="ol-fruit-chip" style="background: var(--reg-${Number(f.color_id)});">
              <span class="ol-fruit-chip-icon">${getFruitSvg(f.color_id, 'ol-fruit-chip-icon')}</span>
              <span class="ol-fruit-chip-name">${escapeHtml(name)}</span>
            </div>
          `;
        })
        .join('');

      body.innerHTML = `
        ${renderQuickRulesGridHtml()}
        <div class="af-section-header" style="margin-inline: 2px;">${escapeHtml(i18n.t('play.help_controls_title'))}</div>
        <div class="af-card" style="margin-bottom: var(--space-3); padding: 12px 14px;">
          <p style="margin: 0; font-size: var(--text-subhead); color: var(--label-secondary); line-height: 1.45;">
            ${escapeHtml(i18n.t('play.help_controls_desc'))}
          </p>
        </div>
        <div class="af-section-header" style="margin-inline: 2px;">${escapeHtml(i18n.t('play.help_fruits_title'))}</div>
        <div class="ol-fruit-legend">${fruitChips}</div>
      `;
    }
  });
}
