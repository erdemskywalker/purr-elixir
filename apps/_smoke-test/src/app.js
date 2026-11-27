import { AppFactory, escapeHtml } from '../../../core-engine/js/engine.js';

const { db, i18n, adManager, router, NativeBridge } = AppFactory;

const ICON_HOME = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg>`;
const ICON_SETTINGS = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

async function getAllChecks() {
  return db.query('SELECT * FROM engine_checks ORDER BY id ASC');
}

async function addCheck(note) {
  const code = `custom-${Date.now()}`;
  await db.run(
    'INSERT INTO engine_checks (code, title_en, title_tr, detail_en, detail_tr, is_verified) VALUES (?, ?, ?, ?, ?, 1)',
    [code, note, note, 'User inserted via real SQLite', 'Gerçek SQLite ile kullanıcı ekledi']
  );
}

async function toggleCheck(id, nextVal) {
  await db.run('UPDATE engine_checks SET is_verified = ? WHERE id = ?', [nextVal ? 1 : 0, id]);
}

async function renderHome({ container, rightSlot }) {
  const lang = i18n.getLang();
  const rows = await getAllChecks();
  const verified = rows.filter((r) => r.is_verified === 1).length;

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'af-nav-btn';
  addBtn.id = 'btn-open-add-sheet';
  addBtn.setAttribute('aria-label', i18n.t('home.add_btn'));
  addBtn.textContent = '+';
  addBtn.style.fontSize = '26px';
  addBtn.addEventListener('click', () => {
    router.openSheet({
      title: i18n.t('home.sheet_title'),
      render: (body, close) => {
        body.innerHTML = `
          <form id="smoke-add-form" style="display:flex;flex-direction:column;gap:14px;">
            <input id="smoke-note-input" class="af-input" type="text" required placeholder="${escapeHtml(i18n.t('home.input_placeholder'))}" />
            <button type="submit" class="af-btn af-btn-primary af-btn-block">${escapeHtml(i18n.t('af.save'))}</button>
          </form>
        `;
        body.querySelector('#smoke-add-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const val = body.querySelector('#smoke-note-input').value.trim();
          if (!val) return;
          await addCheck(val);
          NativeBridge.haptics.notification('SUCCESS');
          close();
          router.showToast(i18n.t('home.saved_toast'));
          await router.rerenderCurrent();
        });
      }
    });
  });
  rightSlot.appendChild(addBtn);

  const listHtml = rows
    .map((row) => {
      const title = lang === 'tr' ? row.title_tr : row.title_en;
      const detail = lang === 'tr' ? row.detail_tr : row.detail_en;
      return `
        <div class="af-list-row">
          <div class="af-list-row-main">
            <div class="af-list-row-title">${escapeHtml(title)}</div>
            <div class="af-list-row-sub">${escapeHtml(detail)}</div>
          </div>
          <label class="af-switch">
            <input type="checkbox" data-toggle-id="${row.id}" ${row.is_verified ? 'checked' : ''} />
            <span class="af-switch-track"><span class="af-switch-thumb"></span></span>
          </label>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="smoke-hero">
      <div class="smoke-hero-kicker">${escapeHtml(i18n.t('home.kicker'))}</div>
      <div class="smoke-hero-stat">${escapeHtml(i18n.t('home.stat_label', { verified, total: rows.length }))}</div>
      <p class="smoke-hero-desc">${escapeHtml(i18n.t('home.hero_desc'))}</p>
    </div>

    <div class="af-section-header">${escapeHtml(i18n.t('home.section_checks'))}</div>
    <div class="af-list-group">${listHtml}</div>

    <div data-ad-slot="home-inline-card" data-ad-type="inline"></div>
  `;

  container.querySelectorAll('input[data-toggle-id]').forEach((chk) => {
    chk.addEventListener('change', async () => {
      NativeBridge.haptics.selection();
      await toggleCheck(Number(chk.dataset.toggleId), chk.checked);
      await router.rerenderCurrent();
    });
  });
}

async function renderSettings({ container }) {
  const curTheme = AppFactory.getTheme();
  const curLang = i18n.getLang();

  container.innerHTML = `
    <div class="af-section-header">${escapeHtml(i18n.t('settings.section_prefs'))}</div>
    <div class="af-card" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--label-secondary);margin-bottom:8px;">${escapeHtml(i18n.t('af.theme'))}</div>
        <div class="af-segmented" id="theme-seg">
          <button type="button" class="af-segmented-btn ${curTheme === 'system' ? 'is-active' : ''}" data-theme-val="system">${escapeHtml(i18n.t('af.theme_system'))}</button>
          <button type="button" class="af-segmented-btn ${curTheme === 'light' ? 'is-active' : ''}" data-theme-val="light">${escapeHtml(i18n.t('af.theme_light'))}</button>
          <button type="button" class="af-segmented-btn ${curTheme === 'dark' ? 'is-active' : ''}" data-theme-val="dark">${escapeHtml(i18n.t('af.theme_dark'))}</button>
        </div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--label-secondary);margin-bottom:8px;">${escapeHtml(i18n.t('af.language'))}</div>
        <div class="af-segmented" id="lang-seg">
          <button type="button" class="af-segmented-btn ${curLang === 'en' ? 'is-active' : ''}" data-lang-val="en">English</button>
          <button type="button" class="af-segmented-btn ${curLang === 'tr' ? 'is-active' : ''}" data-lang-val="tr">Türkçe</button>
        </div>
      </div>
    </div>

    <div class="af-section-header">${escapeHtml(i18n.t('settings.section_engine'))}</div>
    <div class="af-list-group">
      <div class="af-list-row">
        <div class="af-list-row-main"><div class="af-list-row-title">${escapeHtml(i18n.t('settings.db_mode'))}</div></div>
        <div class="af-list-row-trailing"><span class="af-badge">${escapeHtml(db.mode)}</span></div>
      </div>
      <div class="af-list-row">
        <div class="af-list-row-main"><div class="af-list-row-title">${escapeHtml(i18n.t('settings.ad_mode'))}</div></div>
        <div class="af-list-row-trailing"><span class="af-badge">${escapeHtml(adManager.mode)}</span></div>
      </div>
    </div>

    <div data-ad-slot="settings-banner" data-ad-type="banner"></div>
  `;

  container.querySelectorAll('[data-theme-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      NativeBridge.haptics.selection();
      AppFactory.setTheme(btn.dataset.themeVal);
      router.rerenderCurrent();
    });
  });

  container.querySelectorAll('[data-lang-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      NativeBridge.haptics.selection();
      i18n.setLang(btn.dataset.langVal);
    });
  });
}

AppFactory.boot({
  appId: 'com.erdem.factorysmoke',
  database: { dbName: 'factory_smoke_db', schemaVersion: 1 },
  ads: { mode: 'dev' },
  tabs: [
    { route: 'home', labelKey: 'tab.home', iconSvg: ICON_HOME },
    { route: 'settings', labelKey: 'tab.settings', iconSvg: ICON_SETTINGS }
  ],
  routes: {
    home: { titleKey: 'home.title', render: renderHome },
    settings: { titleKey: 'settings.title', render: renderSettings }
  }
});
