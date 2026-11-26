/* ============================================================================
 * Screen 2: LEVELS (Endless Alchemy Portal + Difficulty Filters +
 * 60 Verified Campaign Level Medallions with Cat Unlock Tags & Inline AdSlot)
 * Zero Mock Data: All 60 campaign levels & endless stats read from SQLite
 * ============================================================================ */

import { AppFactory, escapeHtml } from '../../../../core-engine/js/engine.js';
import { getCampaignLevels, getCampaignSummary, getEndlessStats } from '../data/repository.js';
import { UI_ICONS } from '../cats.js';
import { gameAudio } from '../audio.js';
import { gameHaptics, getLocalized, renderStarsHtml } from '../ui-helpers.js';

const { i18n } = AppFactory;

const FILTERS = [
  { id: 'all', labelKey: 'levels.filter_all' },
  { id: 'easy', labelKey: 'levels.filter_easy' },
  { id: 'medium', labelKey: 'levels.filter_medium' },
  { id: 'master', labelKey: 'levels.filter_master' },
  { id: 'grandmaster', labelKey: 'levels.filter_grandmaster' }
];

const ENDLESS_BUTTONS = [
  { diff: 'easy', nameKey: 'levels.endless_easy', colors: 5 },
  { diff: 'medium', nameKey: 'levels.endless_medium', colors: 7 },
  { diff: 'master', nameKey: 'levels.endless_master', colors: 9 }
];

let activeFilter = 'all';

export async function renderLevels({ container, router }) {
  gameAudio.setMode('menu');

  let summary;
  let endlessStats;
  let initialLevels;
  try {
    [summary, endlessStats, initialLevels] = await Promise.all([
      getCampaignSummary(),
      getEndlessStats(),
      getCampaignLevels({ filter: activeFilter })
    ]);
  } catch (err) {
    container.innerHTML = `
      <div class="af-empty-state">
        <div class="af-empty-icon">!</div>
        <h2 class="af-empty-title">${escapeHtml(i18n.t('af.error_title'))}</h2>
        <p class="af-empty-desc">${escapeHtml(err?.message || '')}</p>
        <button type="button" id="btn-levels-retry" class="af-btn af-btn-primary">${escapeHtml(i18n.t('home.retry'))}</button>
      </div>
    `;
    container.querySelector('#btn-levels-retry')?.addEventListener('click', () => router.rerenderCurrent());
    return;
  }

  const lang = i18n.getLang();
  const currentLevelId = summary.activeLevel?.id || 1;
  const endlessBadge =
    endlessStats.totalRuns > 0
      ? i18n.t('levels.endless_record', { count: endlessStats.totalRuns })
      : i18n.t('levels.endless_infinity');

  const endlessButtonsHtml = ENDLESS_BUTTONS.map(
    (b) => `
      <button type="button" class="pe-endless-btn" data-endless-diff="${b.diff}">
        <span class="pe-endless-btn-name">${escapeHtml(i18n.t(b.nameKey))}</span>
        <span class="pe-endless-btn-sub">${escapeHtml(i18n.t('levels.endless_colors', { count: b.colors }))}</span>
      </button>
    `
  ).join('');

  const filterPillsHtml = FILTERS.map(
    (f) => `
      <button type="button" class="pe-filter-pill${activeFilter === f.id ? ' is-active' : ''}" data-filter-val="${f.id}">
        ${escapeHtml(i18n.t(f.labelKey))}
      </button>
    `
  ).join('');

  container.innerHTML = `
    <section id="card-endless-portal" class="pe-endless-portal">
      <div class="pe-endless-head">
        <h2 class="pe-endless-title">${escapeHtml(i18n.t('levels.endless_title'))}</h2>
        <span class="pe-hero-pill">${escapeHtml(endlessBadge)}</span>
      </div>
      <p class="pe-endless-desc">${escapeHtml(i18n.t('levels.endless_desc'))}</p>
      <div class="pe-endless-modes">${endlessButtonsHtml}</div>
    </section>

    <div class="pe-filter-scroll" role="tablist" aria-label="${escapeHtml(i18n.t('levels.title'))}">
      ${filterPillsHtml}
    </div>

    <div class="pe-campaign-summary">
      <span id="levels-filter-count" class="pe-tabular"></span>
      <span id="levels-filter-stars" class="pe-tabular"></span>
    </div>

    <div id="levels-grid" class="pe-levels-grid"></div>

    <div data-ad-slot="levels-inline" data-ad-type="inline"></div>
  `;

  const gridEl = container.querySelector('#levels-grid');
  const countEl = container.querySelector('#levels-filter-count');
  const starsEl = container.querySelector('#levels-filter-stars');

  function paintLevels(levels) {
    const completed = levels.filter((l) => l.is_completed).length;
    const totalStars = levels.reduce((acc, l) => acc + (Number(l.stars) || 0), 0);
    if (countEl) {
      countEl.textContent = i18n.t('levels.summary_solved', { completed, total: levels.length });
    }
    if (starsEl) {
      starsEl.textContent = i18n.t('levels.summary_stars', { stars: totalStars, max: levels.length * 3 });
    }

    if (levels.length === 0) {
      gridEl.className = '';
      gridEl.innerHTML = `
        <div class="af-empty-state">
          <div class="af-empty-icon">✦</div>
          <h3 class="af-empty-title">${escapeHtml(i18n.t('levels.empty_title'))}</h3>
          <p class="af-empty-desc">${escapeHtml(i18n.t('levels.empty_desc'))}</p>
          <button type="button" id="btn-levels-show-all" class="af-btn af-btn-primary">${escapeHtml(i18n.t('levels.show_all'))}</button>
        </div>
      `;
      gridEl.querySelector('#btn-levels-show-all')?.addEventListener('click', () => applyFilter('all'));
      return;
    }

    gridEl.className = 'pe-levels-grid';
    gridEl.innerHTML = levels
      .map((lvl) => {
        const classes = ['pe-level-tile'];
        if (lvl.id === currentLevelId) classes.push('is-current');
        if (lvl.is_completed) classes.push('is-completed');

        const title = getLocalized(lvl, 'title', lang);
        const catTagHtml = lvl.unlocks_cat
          ? `<span class="pe-level-cat-tag">${UI_ICONS.paw}<span>${escapeHtml(getLocalized(lvl.unlocks_cat, 'name', lang))}</span></span>`
          : '';
        const metaText =
          lvl.best_moves != null
            ? i18n.t('levels.tile_best', { moves: lvl.best_moves })
            : i18n.t('levels.tile_par', { par: lvl.par_moves });

        return `
          <button
            type="button"
            class="${classes.join(' ')}"
            data-level-id="${lvl.id}"
            aria-label="${escapeHtml(i18n.t('levels.tile_aria', { id: lvl.id, title, count: lvl.color_count }))}"
          >
            ${catTagHtml}
            <span class="pe-level-num">${lvl.id}</span>
            <span class="pe-level-colors">${escapeHtml(i18n.t('levels.tile_colors', { count: lvl.color_count }))}</span>
            ${renderStarsHtml(lvl.stars, 3)}
            <span class="pe-level-meta">${escapeHtml(metaText)}</span>
          </button>
        `;
      })
      .join('');

    gridEl.querySelectorAll('.pe-level-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        const id = Number(tile.getAttribute('data-level-id'));
        gameAudio.sfx.uiTap();
        gameHaptics.impact('LIGHT');
        router.push('play', { levelId: id });
      });
    });
  }

  async function applyFilter(nextFilter) {
    activeFilter = nextFilter;
    container.querySelectorAll('.pe-filter-pill').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-filter-val') === nextFilter);
    });
    const rows = await getCampaignLevels({ filter: nextFilter });
    paintLevels(rows);
  }

  // Paint initial SQLite rows
  paintLevels(initialLevels);

  // Filter pill listeners
  container.querySelectorAll('.pe-filter-pill').forEach((pill) => {
    pill.addEventListener('click', async () => {
      const val = pill.getAttribute('data-filter-val') || 'all';
      gameAudio.sfx.uiTap();
      gameHaptics.selection();
      await applyFilter(val);
    });
  });

  // Endless Alchemy quick launch buttons
  container.querySelectorAll('.pe-endless-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const difficulty = btn.getAttribute('data-endless-diff') || 'easy';
      gameAudio.sfx.uiTap();
      gameHaptics.impact('MEDIUM');
      router.push('play', { mode: 'endless', difficulty });
    });
  });
}
