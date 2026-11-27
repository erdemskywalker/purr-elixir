/* App Factory Core Engine — Dual-Mode AdMob & House Ad Manager (CLS = 0)
 * Modes:
 * - dev:         Explicit dashed AdMob Blueprint slot (design & review visibility)
 * - prod-nofill: Forces Apple-safe House Ad fallback (for Visual Critic QA)
 * - prod:        Real @capacitor-community/admob on iOS/Android; graceful House Ad on no-fill/offline
 */

import { NativeBridge } from './native-bridge.js';
import { i18n } from './i18n.js';

const TYPE_DIMENSIONS = {
  banner: { label: 'Banner 320×50', height: 62 },
  inline: { label: 'Inline Card 320×92', height: 92 },
  native: { label: 'Native Card 320×92', height: 92 },
  mrec: { label: 'Medium Rect 300×250', height: 250 }
};

const SAFE_DEFAULT_AD = {
  id: 'af-default',
  badge: { en: 'Recommended', tr: 'Önerilen' },
  title: { en: 'Discover More Offline Utilities', tr: 'Diğer Çevrimdışı Araçlarımızı Keşfet' },
  subtitle: { en: 'Fast, privacy-first indie iOS apps.', tr: 'Hızlı, gizlilik odaklı bağımsız iOS uygulamaları.' },
  cta: { en: 'View', tr: 'İncele' },
  accentColor: '#007AFF',
  iconSymbol: '✦',
  url: 'https://apps.apple.com'
};

class AdManager {
  constructor() {
    this.mode = 'dev';
    this.appId = '';
    this.adUnits = { banner: '', interstitial: '', rewarded: '' };
    this.catalog = { fallbackDefault: SAFE_DEFAULT_AD, apps: [] };
    this.consentCompleted = false;
    this.bootTime = Date.now();
    this.lastInterstitialAt = 0;
    this.interstitialCooldownMs = 180000; // 3 min Apple/UX-safe cooldown
    this.suppressed = false;
  }

  resolveInitialMode(defaultMode = 'dev') {
    const q = new URLSearchParams(window.location.search).get('adMode');
    if (q && ['dev', 'prod', 'prod-nofill'].includes(q)) return q;
    if (NativeBridge.isNative()) return 'prod';
    return defaultMode;
  }

  async init({
    appId = '',
    mode = 'dev',
    adUnits = {},
    catalogPath = './house-ads/catalog.json',
    interstitialCooldownMs = 180000,
    suppressed = false
  } = {}) {
    this.appId = appId;
    this.mode = this.resolveInitialMode(mode);
    this.adUnits = { ...this.adUnits, ...adUnits };
    this.interstitialCooldownMs = interstitialCooldownMs;
    this.suppressed = suppressed;

    try {
      const res = await fetch(catalogPath);
      if (res.ok) this.catalog = await res.json();
    } catch {
      this.catalog = { fallbackDefault: SAFE_DEFAULT_AD, apps: [] };
    }

    if (this.mode === 'prod' && NativeBridge.isNative() && !this.suppressed) {
      await this.requestConsentIfNeeded();
    }
  }

  setSuppressed(isProUser) {
    this.suppressed = Boolean(isProUser);
    document.querySelectorAll('[data-ad-slot]').forEach((el) => {
      if (this.suppressed) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
        this.renderSlot(el);
      }
    });
  }

  async requestConsentIfNeeded() {
    if (this.consentCompleted) return;
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) return;
    try {
      // 1. iOS App Tracking Transparency (ATT)
      if (typeof AdMob.trackingAuthorizationStatus === 'function') {
        const status = await AdMob.trackingAuthorizationStatus();
        if (status?.status === 'notDetermined' && typeof AdMob.requestTrackingAuthorization === 'function') {
          await AdMob.requestTrackingAuthorization();
        }
      }
      // 2. Google UMP (GDPR/EEA Consent)
      if (typeof AdMob.requestConsentInfo === 'function') {
        const info = await AdMob.requestConsentInfo();
        if (info?.isConsentFormAvailable && info?.status === 'REQUIRED' && typeof AdMob.showConsentForm === 'function') {
          await AdMob.showConsentForm();
        }
      }
      // 3. Initialize AdMob SDK
      if (typeof AdMob.initialize === 'function') {
        await AdMob.initialize({ initializeForTesting: false });
      }
      this.consentCompleted = true;
    } catch (err) {
      console.warn('[AppFactory AdManager] Consent/Init skipped:', err);
    }
  }

  pickHouseAd(slotKey = '') {
    const eligible = (this.catalog.apps || []).filter((a) => a.id && a.id !== this.appId);
    if (eligible.length === 0) {
      return this.catalog.fallbackDefault || SAFE_DEFAULT_AD;
    }
    let hash = 0;
    for (let i = 0; i < slotKey.length; i++) hash = (hash * 31 + slotKey.charCodeAt(i)) >>> 0;
    return eligible[hash % eligible.length];
  }

  mountSlots(root = document) {
    const slots = root.querySelectorAll('[data-ad-slot]');
    slots.forEach((el) => this.renderSlot(el));
  }

  renderSlot(el) {
    if (this.suppressed) {
      el.style.display = 'none';
      return;
    }

    const slotId = el.getAttribute('data-ad-slot') || 'default-slot';
    const adType = el.getAttribute('data-ad-type') || 'banner';
    const spec = TYPE_DIMENSIONS[adType] || TYPE_DIMENSIONS.banner;

    el.className = 'af-ad-slot';
    el.setAttribute('data-ad-type', adType);
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', i18n.t('af.sponsored'));
    el.innerHTML = '';

    if (this.mode === 'dev') {
      this._renderDevBlueprint(el, slotId, adType, spec);
      return;
    }

    if (this.mode === 'prod' && NativeBridge.isNative() && window.Capacitor?.Plugins?.AdMob && this.adUnits.banner) {
      // Reserve fixed slot height immediately and render House Ad underneath as zero-flicker no-fill safety
      this._renderHouseAd(el, slotId);
      this._tryShowNativeBanner(el, slotId).catch(() => {
        /* House Ad already visible — zero blank space, CLS = 0 */
      });
      return;
    }

    // prod-nofill or web preview without native AdMob: Apple-safe House Ad
    this._renderHouseAd(el, slotId);
  }

  _renderDevBlueprint(el, slotId, adType, spec) {
    el.classList.add('af-ad-slot--dev');
    const pill = document.createElement('span');
    pill.className = 'af-ad-dev-pill';
    pill.textContent = `${i18n.t('af.ad_slot_label')} • ${adType.toUpperCase()}`;

    const meta = document.createElement('span');
    meta.className = 'af-ad-dev-meta';
    meta.textContent = `${spec.label} · #${slotId}`;

    el.append(pill, meta);
  }

  _renderHouseAd(el, slotId) {
    const lang = i18n.getLang();
    const ad = this.pickHouseAd(slotId);
    const pickText = (obj) => (typeof obj === 'string' ? obj : obj?.[lang] || obj?.en || '');

    el.classList.add('af-ad-slot--house');

    const icon = document.createElement('div');
    icon.className = 'af-ad-house-icon';
    icon.style.background = ad.accentColor || 'var(--accent)';
    icon.textContent = ad.iconSymbol || '✦';

    const body = document.createElement('div');
    body.className = 'af-ad-house-body';

    const top = document.createElement('div');
    top.className = 'af-ad-house-top';

    const badge = document.createElement('span');
    badge.className = 'af-ad-house-badge';
    badge.textContent = pickText(ad.badge) || i18n.t('af.sponsored');

    const title = document.createElement('span');
    title.className = 'af-ad-house-title';
    title.textContent = pickText(ad.title);

    top.append(badge, title);

    const sub = document.createElement('div');
    sub.className = 'af-ad-house-sub';
    sub.textContent = pickText(ad.subtitle);

    body.append(top, sub);

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'af-ad-house-cta';
    cta.textContent = pickText(ad.cta) || 'View';
    cta.addEventListener('click', () => {
      NativeBridge.haptics.selection();
      if (ad.url) NativeBridge.openExternalUrl(ad.url);
    });

    el.append(icon, body, cta);
  }

  async _tryShowNativeBanner(el) {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob || !this.adUnits.banner) return;
    await AdMob.showBanner({
      adId: this.adUnits.banner,
      adSize: 'ADAPTIVE_BANNER',
      position: 'BOTTOM_CENTER',
      margin: 56,
      isTesting: false
    });
    el.classList.remove('af-ad-slot--house');
    el.classList.add('af-ad-slot--live');
  }

  async showInterstitialAtNaturalBreak() {
    if (this.suppressed || this.mode !== 'prod' || !NativeBridge.isNative()) return false;
    const now = Date.now();
    // Never show within first 60s of session or within cooldown
    if (now - this.bootTime < 60000) return false;
    if (now - this.lastInterstitialAt < this.interstitialCooldownMs) return false;

    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob || !this.adUnits.interstitial) return false;
    try {
      await AdMob.prepareInterstitial({ adId: this.adUnits.interstitial, isTesting: false });
      await AdMob.showInterstitial();
      this.lastInterstitialAt = Date.now();
      return true;
    } catch {
      return false;
    }
  }
}

export const adManager = new AdManager();
