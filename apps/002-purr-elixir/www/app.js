/* ============================================================================
 * Purr Elixir (002-purr-elixir) — Main Application Bootstrapper
 * Pure Vanilla HTML/CSS/JS + Capacitor Core Engine + Real SQLite (Zero Mock)
 * Light Mode Default ("Sunlit Lavender & Porcelain") + Dark Mode ("Twilight Crystal")
 * ============================================================================ */

import { AppFactory } from './core-engine/js/engine.js';
import { UI_ICONS } from './cats.js';
import { syncAppPrefs } from './ui-helpers.js';
import { renderHome } from './screens/home.js';
import { renderLevels } from './screens/levels.js';
import { renderStats } from './screens/stats.js';
import { renderPlay } from './screens/play.js';

AppFactory.boot({
  appId: 'com.erdem.purrelixir',
  defaultTheme: 'light',
  database: {
    dbName: 'purr_elixir_db',
    schemaVersion: 2,
    tablesSqlPath: './database/tables.sql',
    seedSqlPath: './database/seed.sql'
  },
  ads: {
    mode: 'prod',
    adUnits: {
      banner: 'ca-app-pub-6869171029580230/5718825879',
      interstitial: 'ca-app-pub-6869171029580230/9466499196',
      rewardedInterstitial: 'ca-app-pub-6869171029580230/2246484722',
      rewarded: ''
    }
  },
  iap: {
    enabled: false
  },
  onInit: async () => {
    await syncAppPrefs();
  },
  tabs: [
    { route: 'home', labelKey: 'tab.home', iconSvg: UI_ICONS.tabShop },
    { route: 'levels', labelKey: 'tab.levels', iconSvg: UI_ICONS.tabLevels },
    { route: 'stats', labelKey: 'tab.stats', iconSvg: UI_ICONS.tabCats }
  ],
  routes: {
    home: { titleKey: 'home.title', largeTitle: false, render: renderHome },
    levels: { titleKey: 'levels.title', render: renderLevels },
    stats: { titleKey: 'stats.title', render: renderStats },
    play: {
      titleKey: 'app.name',
      largeTitle: false,
      hideTabBar: true,
      render: renderPlay
    }
  }
});
