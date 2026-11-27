/* ============================================================================
 * Fruitopia (001-orchard-logic) — Main Application Bootstrapper
 * Vanilla HTML/CSS/JS + Capacitor Core Engine + Real SQLite (Zero Mock Data)
 * Light Mode Default + Offline Web Audio Music & SFX
 * ============================================================================ */

import { AppFactory } from '../../../core-engine/js/engine.js';
import { UI_ICONS } from './fruits.js';
import { syncHapticsPref } from './ui-helpers.js';
import { getAllPrefs } from './data/repository.js';
import { gameAudio } from './audio.js';
import { renderHome } from './screens/home.js';
import { renderLevels } from './screens/levels.js';
import { renderStats } from './screens/stats.js';
import { renderPlay } from './screens/play.js';

AppFactory.boot({
  appId: 'com.erdem.fruitopia',
  defaultTheme: 'light',
  database: {
    dbName: 'fruitopia_db',
    schemaVersion: 2,
    tablesSqlPath: '../database/tables.sql',
    seedSqlPath: '../database/seed.sql'
  },
  ads: {
    mode: 'prod',
    adUnits: {
      banner: 'ca-app-pub-6869171029580230/6966485058',
      interstitial: 'ca-app-pub-6869171029580230/5864709262',
      rewardedInterstitial: 'ca-app-pub-6869171029580230/2092985214',
      rewarded: ''
    }
  },
  iap: {
    enabled: false
  },
  onInit: async () => {
    await syncHapticsPref();
    try {
      const prefs = await getAllPrefs();
      gameAudio.init({
        musicEnabled: prefs.music_enabled,
        sfxEnabled: prefs.sfx_enabled
      });
    } catch {
      gameAudio.init({ musicEnabled: true, sfxEnabled: true });
    }
  },
  tabs: [
    { route: 'home', labelKey: 'tab.home', iconSvg: UI_ICONS.tabPlay },
    { route: 'levels', labelKey: 'tab.levels', iconSvg: UI_ICONS.tabLevels },
    { route: 'stats', labelKey: 'tab.stats', iconSvg: UI_ICONS.tabStats }
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
