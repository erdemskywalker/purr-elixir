/* App Factory Core Engine — EN/TR Bilingual i18n Manager */

const ENGINE_DEFAULTS = {
  en: {
    'af.back': 'Back',
    'af.cancel': 'Cancel',
    'af.done': 'Done',
    'af.save': 'Save',
    'af.delete': 'Delete',
    'af.close': 'Close',
    'af.settings': 'Settings',
    'af.theme': 'Appearance',
    'af.theme_system': 'System',
    'af.theme_light': 'Light',
    'af.theme_dark': 'Dark',
    'af.language': 'Language',
    'af.sponsored': 'Sponsored',
    'af.ad_slot_label': 'AdMob Slot',
    'af.restore_purchases': 'Restore Purchases',
    'af.error_title': 'Something went wrong',
    'af.error_retry': 'Reload App'
  },
  tr: {
    'af.back': 'Geri',
    'af.cancel': 'İptal',
    'af.done': 'Bitti',
    'af.save': 'Kaydet',
    'af.delete': 'Sil',
    'af.close': 'Kapat',
    'af.settings': 'Ayarlar',
    'af.theme': 'Görünüm',
    'af.theme_system': 'Sistem',
    'af.theme_light': 'Açık',
    'af.theme_dark': 'Koyu',
    'af.language': 'Dil',
    'af.sponsored': 'Önerilen',
    'af.ad_slot_label': 'AdMob Alanı',
    'af.restore_purchases': 'Satın Alımları Geri Yükle',
    'af.error_title': 'Bir sorun oluştu',
    'af.error_retry': 'Yeniden Yükle'
  }
};

const STORAGE_KEY = 'af_lang';

class I18nManager {
  constructor() {
    this.lang = 'en';
    this.supported = ['en', 'tr'];
    this.dictionaries = {
      en: { ...ENGINE_DEFAULTS.en },
      tr: { ...ENGINE_DEFAULTS.tr }
    };
    this.listeners = new Set();
    this.missingKeys = new Set();
  }

  detectInitialLang() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('lang');
    if (fromQuery && this.supported.includes(fromQuery.toLowerCase())) {
      return fromQuery.toLowerCase();
    }
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && this.supported.includes(saved)) return saved;
    } catch { /* ignore */ }
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return this.supported.includes(nav) ? nav : 'en';
  }

  async init({ localesBase = './locales', supported = ['en', 'tr'] } = {}) {
    this.supported = supported;
    this.lang = this.detectInitialLang();
    await Promise.all(
      supported.map(async (code) => {
        try {
          const res = await fetch(`${localesBase}/${code}.json`);
          if (res.ok) {
            const json = await res.json();
            this.dictionaries[code] = { ...(ENGINE_DEFAULTS[code] || {}), ...json };
          }
        } catch (err) {
          console.warn(`[AppFactory i18n] Failed loading ${code}.json`, err);
        }
      })
    );
    document.documentElement.lang = this.lang;
    return this.lang;
  }

  setLang(code) {
    if (!this.supported.includes(code)) return;
    this.lang = code;
    document.documentElement.lang = code;
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch { /* ignore */ }
    this.hydrateDOM(document);
    this.listeners.forEach((fn) => fn(code));
  }

  getLang() {
    return this.lang;
  }

  t(key, params = {}) {
    const dict = this.dictionaries[this.lang] || this.dictionaries.en || {};
    let value = dict[key];
    if (value === undefined) {
      value = this.dictionaries.en?.[key];
    }
    if (value === undefined) {
      this.missingKeys.add(key);
      console.warn(`[AppFactory i18n] Missing translation key: "${key}" (${this.lang})`);
      return key;
    }
    return String(value).replace(/\{\{(\w+)\}\}/g, (_, k) =>
      params[k] !== undefined ? String(params[k]) : `{{${k}}}`
    );
  }

  hydrateDOM(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = this.t(key);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', this.t(key));
    });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', this.t(key));
    });
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const i18n = new I18nManager();
