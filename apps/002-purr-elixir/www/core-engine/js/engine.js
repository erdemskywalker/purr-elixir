/* App Factory Core Engine — Master Bootstrapper & Theme/Error Controller */

import { NativeBridge } from './native-bridge.js';
import { i18n } from './i18n.js';
import { db } from './db-adapter.js';
import { adManager } from './ad-manager.js';
import { iapHook } from './iap-hook.js';
import { router } from './router.js';
import { apiClient } from './api-client.js';
import { createStore } from './store.js';

const THEME_KEY = 'af_theme';

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyThemePreference(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') {
    root.setAttribute('data-theme', mode);
    NativeBridge.setStatusBarStyle(mode);
  } else {
    root.removeAttribute('data-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    NativeBridge.setStatusBarStyle(prefersDark ? 'dark' : 'light');
  }
}

function initTheme(defaultTheme = 'system') {
  const q = new URLSearchParams(window.location.search).get('theme');
  if (q === 'light' || q === 'dark') {
    applyThemePreference(q);
    return q;
  }
  let saved = defaultTheme;
  try {
    saved = window.localStorage.getItem(THEME_KEY) || defaultTheme;
  } catch { /* ignore */ }
  applyThemePreference(saved);
  return saved;
}

function applyPlaywrightSimulationParams() {
  const params = new URLSearchParams(window.location.search);
  const simTop = params.get('simSafeTop');
  const simBottom = params.get('simSafeBottom');
  if (simTop) document.documentElement.style.setProperty('--sim-safe-top', `${Number(simTop)}px`);
  if (simBottom) document.documentElement.style.setProperty('--sim-safe-bottom', `${Number(simBottom)}px`);

  if (params.get('simChrome') === '1') {
    if (!document.querySelector('.af-sim-island') && Number(simTop || 0) >= 44) {
      const island = document.createElement('div');
      island.className = 'af-sim-island';
      document.body.appendChild(island);
    }
    if (!document.querySelector('.af-sim-home-indicator') && Number(simBottom || 0) >= 20) {
      const home = document.createElement('div');
      home.className = 'af-sim-home-indicator';
      document.body.appendChild(home);
    }
  }
}

function installErrorBoundary() {
  const showFatal = (err) => {
    console.error('[AppFactory ErrorBoundary]', err);
    const root = document.querySelector('#af-app');
    if (!root || root.dataset.afFatalShown === '1') return;
    root.dataset.afFatalShown = '1';
    root.innerHTML = `
      <div class="af-empty-state" style="margin:auto;">
        <div class="af-empty-icon">!</div>
        <h2 class="af-empty-title">${escapeHtml(i18n.t('af.error_title'))}</h2>
        <p class="af-empty-desc">${escapeHtml(err?.message || String(err))}</p>
        <button type="button" class="af-btn af-btn-primary" onclick="location.reload()">
          ${escapeHtml(i18n.t('af.error_retry'))}
        </button>
      </div>
    `;
  };
  window.addEventListener('error', (e) => showFatal(e.error || e.message));
  window.addEventListener('unhandledrejection', (e) => showFatal(e.reason));
}

export const AppFactory = {
  db,
  i18n,
  adManager,
  iapHook,
  router,
  apiClient,
  NativeBridge,
  createStore,
  escapeHtml,
  ready: false,
  theme: 'system',

  setTheme(mode) {
    this.theme = mode;
    try {
      window.localStorage.setItem(THEME_KEY, mode);
    } catch { /* ignore */ }
    applyThemePreference(mode);
  },

  getTheme() {
    return this.theme;
  },

  async boot(config = {}) {
    installErrorBoundary();
    applyPlaywrightSimulationParams();
    this.theme = initTheme(config.defaultTheme || 'system');

    const params = new URLSearchParams(window.location.search);
    const ephemeralDb = params.get('ephemeralDb') === '1';

    // 1. i18n
    await i18n.init(config.i18n || {});

    // 2. Real SQLite DB (zero mock data)
    if (config.database !== false) {
      await db.init({
        dbName: config.database?.dbName || `${config.appId || 'app'}_db`,
        schemaVersion: config.database?.schemaVersion || 1,
        tablesSqlPath: config.database?.tablesSqlPath || './database/tables.sql',
        seedSqlPath: config.database?.seedSqlPath || './database/seed.sql',
        vendorBase: config.database?.vendorBase || './core-engine/vendor',
        ephemeral: ephemeralDb
      });
    }

    // 3. Optional Backend PHP POST API
    if (config.api?.baseUrl) {
      apiClient.configure(config.api);
    }

    // 4. Optional IAP Hook (default off)
    iapHook.init(config.iap || { enabled: false });

    // 5. Dual-Mode AdMob & House Ad Manager
    await adManager.init({
      appId: config.appId || '',
      mode: config.ads?.mode || 'dev',
      adUnits: config.ads?.adUnits || {},
      catalogPath: config.ads?.catalogPath || './house-ads/catalog.json',
      suppressed: iapHook.isPro()
    });
    iapHook.onChange((isPro) => adManager.setSuppressed(isPro));

    // 6. Optional onBeforeRoute hook
    if (typeof config.onInit === 'function') {
      await config.onInit(this);
    }

    // 7. iOS Router & Initial Screen
    router.init({
      rootSelector: config.rootSelector || '#af-app',
      routes: config.routes || {},
      tabs: config.tabs || [],
      initialRoute: config.initialRoute || null
    });

    this.ready = true;
    window.AppFactory = this;
    window.dispatchEvent(new CustomEvent('af:ready', { detail: { appId: config.appId } }));
    return this;
  }
};
