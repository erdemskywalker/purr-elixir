/* ============================================================================
 * Fruitopia — Screen 2: Levels (Arcade Stage Select Map + Endless Portal)
 * Real SQLite filtering (All / 4-6x / 8x8 / 10x10), Collectible Stage Tiles
 * with Prominent Number Medallions & 3-Star Trophies, Endless Arcade & Inline Ad
 * ============================================================================ */

import { AppFactory, escapeHtml } from '../core-engine/js/engine.js';
import { getCampaignLevels, getActiveCampaignLevel } from '../data/repository.js';
import { generateEndlessPuzzle } from '../endless-generator.js';
import { UI_ICONS } from '../fruits.js';
import { gameAudio } from '../audio.js';
import { formatDuration, tierLabel, renderStarsHtml, gameHaptics } from '../ui-helpers.js';

const { i18n } = AppFactory;

let activeFilter = 'all';

const FILTERS = [
  { id: 'all', key: 'levels.filter_all' },
  { id: '4-6', key: 'levels.filter_small' },
  { id: '8x8', key: 'levels.filter_8' },
  { id: '10x10', key: 'levels.filter_10' }
];

function renderGridSkeleton() {
  return `
    <div class="ol-levels-grid">
      ${Array.from({ length: 6 }, () => '<div class="ol-skeleton" style="height: 122px;"></div>').join('')}
    </div>
  `;
}

export async function renderLevels({ container, router }) {
  gameAudio.setMode('menu');
  container.innerHTML = `
    <section class="ol-endless-card" id="card-endless-mode">
      <div class="ol-endless-head">
        <div class="ol-endless-icon">${UI_ICONS.infinity}</div>
        <div class="ol-endless-copy">
          <div class="ol-endless-title">${escapeHtml(i18n.t('levels.endless_title'))}</div>
          <div class="ol-endless-sub">${escapeHtml(i18n.t('levels.endless_sub'))}</div>
        </div>
      </div>
      <div class="ol-endless-actions">
        <button type="button" class="ol-endless-btn" data-endless-size="6">6×6</button>
        <button type="button" class="ol-endless-btn" data-endless-size="8">8×8</button>
        <button type="button" class="ol-endless-btn is-primary" data-endless-size="10">10×10</button>
      </div>
    </section>

    <div class="ol-filter-bar">
      <div class="af-segmented" id="levels-filter-seg" role="tablist">
        ${FILTERS.map(
          (f) => `
            <button
              type="button"
              role="tab"
              aria-selected="${activeFilter === f.id ? 'true' : 'false'}"
              class="af-segmented-btn${activeFilter === f.id ? ' is-active' : ''}"
              data-filter-val="${f.id}"
            >${escapeHtml(i18n.t(f.key))}</button>
          `
        ).join('')}
      </div>
    </div>

    <div id="levels-list-host">${renderGridSkeleton()}</div>

    <div data-ad-slot="levels-inline" data-ad-type="inline"></div>
  `;

  // Bind Endless Mode buttons (generates fresh verified unique-solution puzzle on-device!)
  container.querySelectorAll('[data-endless-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = Number(btn.getAttribute('data-endless-size')) || 10;
      gameAudio.sfx.uiTap();
      gameHaptics.impact('LIGHT');
      try {
        const endlessLevel = generateEndlessPuzzle(size);
        router.push('play', { mode: 'endless', endlessLevel });
      } catch (err) {
        console.error('[Fruitopia Endless]', err);
        router.showToast(i18n.t('play.error_not_found'));
      }
    });
  });

  const host = container.querySelector('#levels-list-host');

  async function loadAndRenderGrid() {
    try {
      const [levels, activeLevel] = await Promise.all([
        getCampaignLevels({ filter: activeFilter }),
        getActiveCampaignLevel()
      ]);

      const lang = i18n.getLang();
      const solvedCount = levels.filter((l) => l.is_completed).length;
      const starsTotal = levels.reduce((sum, l) => sum + (Number(l.stars) || 0), 0);

      if (levels.length === 0) {
        host.innerHTML = `
          <div class="af-empty-state">
            <h2 class="af-empty-title">${escapeHtml(i18n.t('levels.empty_title'))}</h2>
            <p class="af-empty-desc">${escapeHtml(i18n.t('levels.empty_desc'))}</p>
            <button type="button" id="btn-levels-show-all" class="af-btn af-btn-primary">
              ${escapeHtml(i18n.t('levels.show_all'))}
            </button>
          </div>
        `;
        host.querySelector('#btn-levels-show-all')?.addEventListener('click', () => {
          activeFilter = 'all';
          syncFilterButtons();
          loadAndRenderGrid();
        });
        return;
      }

      const cardsHtml = levels
        .map((lvl) => {
          const isNext = activeLevel && activeLevel.id === lvl.id && !lvl.is_completed;
          const statusClass = lvl.is_completed
            ? 'is-completed'
            : lvl.status === 'in_progress'
              ? 'is-in-progress'
              : isNext
                ? 'is-next'
                : '';

          const titleText = lang === 'tr' ? lvl.title_tr : lvl.title_en;
          const subtitle = titleText || tierLabel(lvl.tier);
          const stageNumStr = String(lvl.id).padStart(2, '0');

          let bottomLeft = '';
          let bottomRight = '';

          if (lvl.is_completed) {
            bottomLeft = renderStarsHtml(lvl.stars);
            bottomRight = `<span class="ol-level-time">${escapeHtml(formatDuration(lvl.best_seconds))}</span>`;
          } else if (lvl.status === 'in_progress') {
            bottomLeft = `<span class="ol-status-pill ol-status-pill--progress">${escapeHtml(i18n.t('levels.status_progress'))}</span>`;
            bottomRight = `<span class="ol-level-time">${escapeHtml(formatDuration(lvl.elapsed_seconds))}</span>`;
          } else if (isNext) {
            bottomLeft = `<span class="ol-status-pill ol-status-pill--next">${escapeHtml(i18n.t('levels.badge_next'))}</span>`;
            bottomRight = `<span class="ol-level-time">${escapeHtml(i18n.t('levels.par_label', { time: formatDuration(lvl.par_seconds) }))}</span>`;
          } else {
            bottomLeft = renderStarsHtml(0);
            bottomRight = `<span class="ol-level-time">${escapeHtml(i18n.t('levels.par_label', { time: formatDuration(lvl.par_seconds) }))}</span>`;
          }

          return `
            <button
              type="button"
              class="ol-level-card ol-level-card--${escapeHtml(lvl.tier)} ${statusClass}"
              data-level-id="${lvl.id}"
              data-grid-size="${lvl.grid_size}"
            >
              <div class="ol-level-top">
                <span class="ol-stage-medallion ol-stage-medallion--${escapeHtml(lvl.tier)}">${stageNumStr}</span>
                <span class="ol-size-badge ol-size-badge--${escapeHtml(lvl.tier)}">${lvl.grid_size}×${lvl.grid_size}</span>
              </div>
              <div class="ol-level-meta">
                <div class="ol-level-num">${escapeHtml(subtitle)}</div>
                <div class="ol-level-tier">${escapeHtml(i18n.t('levels.level_label', { num: lvl.id }))}</div>
              </div>
              <div class="ol-level-bottom">
                ${bottomLeft}
                ${bottomRight}
              </div>
            </button>
          `;
        })
        .join('');

      host.innerHTML = `
        <div class="ol-campaign-strip" id="levels-summary-strip">
          <span>${escapeHtml(i18n.t('levels.summary', { solved: solvedCount, total: levels.length, stars: starsTotal }))}</span>
          <span class="ol-star-rule-pill">${escapeHtml(i18n.t('levels.star_criteria'))}</span>
        </div>
        <div class="ol-levels-grid" id="levels-grid">${cardsHtml}</div>
      `;

      host.querySelectorAll('.ol-level-card').forEach((card) => {
        card.addEventListener('click', () => {
          const levelId = Number(card.getAttribute('data-level-id'));
          gameAudio.sfx.uiTap();
          gameHaptics.impact('LIGHT');
          router.push('play', { levelId });
        });
      });
    } catch (err) {
      console.error('[Fruitopia Levels]', err);
      host.innerHTML = `
        <div class="af-empty-state">
          <div class="af-empty-icon">!</div>
          <h2 class="af-empty-title">${escapeHtml(i18n.t('levels.error_title'))}</h2>
          <p class="af-empty-desc">${escapeHtml(err?.message || '')}</p>
          <button type="button" id="btn-levels-reload" class="af-btn af-btn-primary">${escapeHtml(i18n.t('levels.reload'))}</button>
        </div>
      `;
      host.querySelector('#btn-levels-reload')?.addEventListener('click', () => loadAndRenderGrid());
    }
  }

  function syncFilterButtons() {
    container.querySelectorAll('[data-filter-val]').forEach((btn) => {
      const selected = btn.getAttribute('data-filter-val') === activeFilter;
      btn.classList.toggle('is-active', selected);
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  }

  container.querySelectorAll('[data-filter-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-filter-val');
      if (!next || next === activeFilter) return;
      gameAudio.sfx.uiTap();
      gameHaptics.selection();
      activeFilter = next;
      syncFilterButtons();
      loadAndRenderGrid();
    });
  });

  await loadAndRenderGrid();
}
