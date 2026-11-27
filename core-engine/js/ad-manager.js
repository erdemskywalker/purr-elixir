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
    this.adUnits = { banner: '', interstitial: '', rewardedInterstitial: '', rewarded: '' };
    this.catalog = { fallbackDefault: SAFE_DEFAULT_AD, apps: [] };
    this.consentCompleted = false;
    this._initPromise = null;
    this._bannerListenersAttached = false;
    this._activeBannerEl = null;
    this.bootTime = Date.now();
    this.lastInterstitialAt = 0;
    this.interstitialCooldownMs = 180000; // 3 min Apple/UX-safe cooldown
    this.suppressed = false;
    this.nativeBannerActive = false;
    this.nativeBannerHiddenForModal = false;
    this.nativeBannerMargin = -1;
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
    catalogPath = '../../../house-ads/catalog.json',
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
    if (this.suppressed) {
      this.removeNativeBanner();
    }
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
    if (this._initPromise) return this._initPromise;
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) return;

    this._initPromise = (async () => {
      // 1. iOS App Tracking Transparency (ATT) — isolated try/catch so decline/error never blocks SDK init
      try {
        if (typeof AdMob.trackingAuthorizationStatus === 'function') {
          const status = await AdMob.trackingAuthorizationStatus();
          if (status?.status === 'notDetermined' && typeof AdMob.requestTrackingAuthorization === 'function') {
            await AdMob.requestTrackingAuthorization();
          }
        }
      } catch (err) {
        console.warn('[AppFactory AdManager] ATT step skipped:', err);
      }

      // 2. Initialize AdMob SDK FIRST (sets native executor.plugin references in iOS AdMobPlugin.swift,
      //    including consentExecutor, bannerExecutor, interstitialExecutor & rewardInterstitialExecutor!)
      try {
        if (typeof AdMob.initialize === 'function') {
          await AdMob.initialize({ initializeForTesting: false });
        }
        this.consentCompleted = true;
      } catch (err) {
        console.warn('[AppFactory AdManager] AdMob.initialize failed:', err);
      }

      // 3. Google UMP (GDPR/EEA Consent) — isolated try/catch so non-EEA/offline never blocks ads
      try {
        if (typeof AdMob.requestConsentInfo === 'function') {
          const info = await AdMob.requestConsentInfo();
          if (info?.isConsentFormAvailable && info?.status === 'REQUIRED' && typeof AdMob.showConsentForm === 'function') {
            await AdMob.showConsentForm();
          }
        }
      } catch (err) {
        console.warn('[AppFactory AdManager] UMP consent skipped:', err);
      }

      this._attachBannerListeners(AdMob);
    })();

    try {
      await this._initPromise;
    } finally {
      this._initPromise = null;
    }
  }

  _setNativeBannerHeightCss(px) {
    try {
      document.documentElement?.style?.setProperty('--af-native-banner-height', `${Math.max(0, Number(px) || 0)}px`);
    } catch {
      /* ignore */
    }
  }

  _attachBannerListeners(AdMob) {
    if (this._bannerListenersAttached || typeof AdMob.addListener !== 'function') return;
    this._bannerListenersAttached = true;

    AdMob.addListener('bannerAdLoaded', () => {
      this.nativeBannerActive = true;
      if (this._activeBannerEl) {
        this._activeBannerEl.classList.remove('af-ad-slot--house');
        this._activeBannerEl.classList.add('af-ad-slot--live');
      }
    });

    AdMob.addListener('bannerAdFailedToLoad', () => {
      this.nativeBannerActive = false;
      this._setNativeBannerHeightCss(0);
      if (this._activeBannerEl) {
        this._activeBannerEl.classList.remove('af-ad-slot--live');
        this._activeBannerEl.classList.add('af-ad-slot--house');
      }
    });

    AdMob.addListener('bannerAdSizeChanged', (size) => {
      const h = Number(size?.height || 0);
      this._setNativeBannerHeightCss(h > 0 ? h + 8 : 0);
    });
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
      if (ad.url && ad.url.startsWith('app://')) {
        const targetTab = ad.url.replace('app://', '').trim();
        window.AppFactory?.router?.switchTab?.(targetTab);
      } else if (ad.url) {
        NativeBridge.openExternalUrl(ad.url);
      }
    });

    el.append(icon, body, cta);
  }

  async _tryShowNativeBanner(el) {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob || !this.adUnits.banner) return;
    await this.requestConsentIfNeeded();
    this._activeBannerEl = el;
    const tabBarEl = document.getElementById('af-tabbar');
    const tabBarVisible = Boolean(tabBarEl && !tabBarEl.classList.contains('is-hidden'));
    const margin = tabBarVisible ? 56 : 0;

    if (this.nativeBannerActive && this.nativeBannerMargin !== margin) {
      try {
        if (typeof AdMob.removeBanner === 'function') await AdMob.removeBanner();
      } catch {
        /* ignore banner removal race */
      }
      this.nativeBannerActive = false;
    }

    await AdMob.showBanner({
      adId: this.adUnits.banner,
      adSize: 'ADAPTIVE_BANNER',
      position: 'BOTTOM_CENTER',
      margin,
      isTesting: false
    });
    this.nativeBannerActive = true;
    this.nativeBannerHiddenForModal = false;
    this.nativeBannerMargin = margin;
    // If plugin does not emit bannerAdLoaded (e.g. headless contract test), mark live cleanly
    if (typeof AdMob.addListener !== 'function') {
      el.classList.remove('af-ad-slot--house');
      el.classList.add('af-ad-slot--live');
    }
  }

  async hideNativeBanner() {
    if (!this.nativeBannerActive || !NativeBridge.isNative()) return;
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob || typeof AdMob.hideBanner !== 'function') return;
    try {
      await AdMob.hideBanner();
      this.nativeBannerHiddenForModal = true;
      this._setNativeBannerHeightCss(0);
    } catch {
      /* ignore */
    }
  }

  async resumeNativeBanner() {
    if (!this.nativeBannerActive || !this.nativeBannerHiddenForModal || this.suppressed || !NativeBridge.isNative()) {
      return;
    }
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob || typeof AdMob.resumeBanner !== 'function') return;
    try {
      await AdMob.resumeBanner();
      this.nativeBannerHiddenForModal = false;
    } catch {
      /* ignore */
    }
  }

  async removeNativeBanner() {
    if (!this.nativeBannerActive || !NativeBridge.isNative()) return;
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    this.nativeBannerActive = false;
    this.nativeBannerHiddenForModal = false;
    this.nativeBannerMargin = -1;
    this._setNativeBannerHeightCss(0);
    if (!AdMob || typeof AdMob.removeBanner !== 'function') return;
    try {
      await AdMob.removeBanner();
    } catch {
      /* ignore */
    }
  }

  /**
   * Helper: Present a native AdMob Interstitial and wait until it is actually dismissed
   * (iOS AdInterstitialExecutor resolves showInterstitial on present, not on dismiss).
   */
  async _presentAndAwaitInterstitial(AdMob) {
    if (typeof AdMob.addListener !== 'function') {
      await AdMob.showInterstitial();
      return;
    }
    const handles = [];
    let resolved = false;
    let resolveDismiss = null;
    const dismissedPromise = new Promise((resolve) => {
      resolveDismiss = () => {
        if (resolved) return;
        resolved = true;
        resolve();
      };
    });

    try {
      handles.push(await AdMob.addListener('interstitialAdDismissed', resolveDismiss));
      handles.push(await AdMob.addListener('interstitialAdFailedToShow', resolveDismiss));
    } catch {
      /* ignore listener errors */
    }

    const safetyTimer = setTimeout(resolveDismiss, 25000);
    try {
      await AdMob.showInterstitial();
      await dismissedPromise;
    } finally {
      clearTimeout(safetyTimer);
      for (const h of handles) {
        try { await h?.remove?.(); } catch { /* ignore */ }
      }
    }
  }

  /**
   * Rewarded Hint Ad (supports both AdMob Rewarded Interstitial and Rewarded Video):
   * Uses `prepareRewardInterstitialAd` / `showRewardInterstitialAd` when `adUnits.rewardedInterstitial`
   * is configured (required by Google AdMob for Rewarded Interstitial units), and falls back to
   * `prepareRewardVideoAd` / `showRewardVideoAd` when `adUnits.rewarded` is configured.
   * Properly listens for early dismiss / failed-to-show so the UI can NEVER hang.
   */
  async showRewardedHintAd() {
    if (this.mode !== 'prod' || !NativeBridge.isNative()) {
      return { shown: false, rewarded: true, fallback: true };
    }
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) return { shown: false, rewarded: true, fallback: true };

    await this.requestConsentIfNeeded();

    const useRewardedInterstitial = Boolean(
      this.adUnits.rewardedInterstitial && typeof AdMob.prepareRewardInterstitialAd === 'function'
    );
    const useRewardedVideo = Boolean(
      !useRewardedInterstitial && this.adUnits.rewarded && typeof AdMob.prepareRewardVideoAd === 'function'
    );

    if (!useRewardedInterstitial && !useRewardedVideo) {
      return { shown: false, rewarded: true, fallback: true };
    }

    const format = useRewardedInterstitial ? 'rewarded_interstitial' : 'rewarded_video';
    const dismissedEvent = useRewardedInterstitial
      ? 'onRewardedInterstitialAdDismissed'
      : 'onRewardedVideoAdDismissed';
    const failedEvent = useRewardedInterstitial
      ? 'onRewardedInterstitialAdFailedToShow'
      : 'onRewardedVideoAdFailedToShow';
    const rewardEvent = useRewardedInterstitial
      ? 'onRewardedInterstitialAdReward'
      : 'onRewardedVideoAdReward';

    try {
      if (useRewardedInterstitial) {
        await AdMob.prepareRewardInterstitialAd({
          adId: this.adUnits.rewardedInterstitial,
          isTesting: false
        });
      } else {
        await AdMob.prepareRewardVideoAd({
          adId: this.adUnits.rewarded,
          isTesting: false
        });
      }
    } catch (err) {
      console.warn('[AppFactory AdManager] Rewarded ad failed to prepare (offline/no-fill):', err);
      return { shown: false, rewarded: true, fallback: true };
    }

    // Ad loaded — present and settle cleanly whether user earns reward OR dismisses early
    if (typeof AdMob.addListener !== 'function') {
      try {
        const reward = useRewardedInterstitial
          ? await AdMob.showRewardInterstitialAd()
          : await AdMob.showRewardVideoAd();
        return { shown: true, rewarded: true, format, reward };
      } catch {
        return { shown: false, rewarded: true, fallback: true };
      }
    }

    const handles = [];
    let earnedReward = null;
    let done = false;
    let settle = null;

    const resultPromise = new Promise((resolve) => {
      settle = (payload) => {
        if (done) return;
        done = true;
        resolve(payload);
      };
    });

    try {
      handles.push(
        await AdMob.addListener(rewardEvent, (r) => {
          earnedReward = r || { type: 'hint', amount: 1 };
        })
      );
      handles.push(
        await AdMob.addListener(dismissedEvent, () => {
          if (earnedReward) {
            settle({ shown: true, rewarded: true, format, reward: earnedReward });
          } else {
            settle({ shown: true, rewarded: false, cancelled: true, format });
          }
        })
      );
      handles.push(
        await AdMob.addListener(failedEvent, () => {
          settle({ shown: false, rewarded: true, fallback: true, format });
        })
      );
    } catch {
      /* ignore listener errors */
    }

    const safetyTimer = setTimeout(() => {
      settle({ shown: true, rewarded: Boolean(earnedReward), cancelled: !earnedReward, format, reward: earnedReward });
    }, 90000);

    try {
      const showPromise = useRewardedInterstitial
        ? AdMob.showRewardInterstitialAd()
        : AdMob.showRewardVideoAd();
      showPromise
        .then((r) => {
          if (r) earnedReward = r;
          settle({ shown: true, rewarded: true, format, reward: earnedReward || { type: 'hint', amount: 1 } });
        })
        .catch(() => {
          settle({ shown: false, rewarded: true, fallback: true, format });
        });

      return await resultPromise;
    } finally {
      clearTimeout(safetyTimer);
      for (const h of handles) {
        try { await h?.remove?.(); } catch { /* ignore */ }
      }
    }
  }

  async showInterstitialAtNaturalBreak() {
    if (this.suppressed || this.mode !== 'prod' || !NativeBridge.isNative()) return false;
    const now = Date.now();
    // Never show within first 60s of session or within cooldown
    if (now - this.bootTime < 60000) return false;
    if (now - this.lastInterstitialAt < this.interstitialCooldownMs) return false;

    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob || !this.adUnits.interstitial) return false;
    await this.requestConsentIfNeeded();
    try {
      await AdMob.prepareInterstitial({ adId: this.adUnits.interstitial, isTesting: false });
      await this.hideNativeBanner();
      await this._presentAndAwaitInterstitial(AdMob);
      await this.resumeNativeBanner();
      this.lastInterstitialAt = Date.now();
      return true;
    } catch {
      await this.resumeNativeBanner();
      return false;
    }
  }

  /**
   * Level-Transition Interstitial Ad (explicit cadence controlled by the game):
   * - Native iOS/Android (prod): Displays real AdMob Interstitial; falls back to
   *   Apple-safe House Interstitial overlay on no-fill/offline so placement stays visible.
   * - Web / Dev / Prod-NoFill preview: Shows clean dismissible Interstitial overlay
   *   (dashed AdMob Blueprint in dev mode; branded House Interstitial in prod/prod-nofill).
   */
  async showTransitionInterstitial({ slotId = 'level-transition', cadenceLabel = '' } = {}) {
    if (this.suppressed) return false;

    if (this.mode === 'prod' && NativeBridge.isNative()) {
      const AdMob = window.Capacitor?.Plugins?.AdMob;
      if (AdMob && this.adUnits.interstitial) {
        await this.requestConsentIfNeeded();
        try {
          await AdMob.prepareInterstitial({ adId: this.adUnits.interstitial, isTesting: false });
          await this.hideNativeBanner();
          await this._presentAndAwaitInterstitial(AdMob);
          this.lastInterstitialAt = Date.now();
          return true;
        } catch {
          await this.resumeNativeBanner();
          /* Fall through to localized House Interstitial overlay on no-fill/offline */
        }
      }
    }

    await this._showWebInterstitialOverlay({ slotId, cadenceLabel });
    this.lastInterstitialAt = Date.now();
    return true;
  }

  _showWebInterstitialOverlay({ slotId = 'level-transition', cadenceLabel = '' } = {}) {
    return new Promise((resolve) => {
      document.querySelector('#af-interstitial-overlay')?.remove();

      const lang = i18n.getLang();
      const isTr = lang === 'tr';
      const ad = this.pickHouseAd(slotId);
      const pickText = (obj) => (typeof obj === 'string' ? obj : obj?.[lang] || obj?.en || '');

      const overlay = document.createElement('div');
      overlay.id = 'af-interstitial-overlay';
      overlay.className = `af-interstitial-overlay${this.mode === 'dev' ? ' is-dev' : ''}`;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', isTr ? 'Geçiş Reklamı' : 'Interstitial Ad');

      const adTagText = this.mode === 'dev'
        ? `ADMOB INTERSTITIAL · #${slotId}`
        : isTr
          ? 'REKLAM · ADMOB GEÇİŞ'
          : 'AD · ADMOB INTERSTITIAL';
      const continueText = isTr ? 'Devam Et' : 'Continue';
      const closeAria = isTr ? 'Reklamı kapat' : 'Close ad';

      const cardBodyHtml =
        this.mode === 'dev'
          ? `
            <div class="af-interstitial-dev-box">
              <span class="af-ad-dev-pill">${adTagText}</span>
              <div class="af-interstitial-dev-size">FULLSCREEN INTERSTITIAL · 320×480</div>
              ${cadenceLabel ? `<div class="af-interstitial-dev-meta">${cadenceLabel}</div>` : ''}
            </div>
          `
          : `
            <div class="af-interstitial-icon" style="background: ${ad.accentColor || '#1B7A3B'};">${ad.iconSymbol || '🍏'}</div>
            <div class="af-interstitial-badge">${pickText(ad.badge) || (isTr ? 'SPONSORLU' : 'SPONSORED')}</div>
            <h3 class="af-interstitial-title">${pickText(ad.title)}</h3>
            <p class="af-interstitial-sub">${pickText(ad.subtitle)}</p>
            ${cadenceLabel ? `<div class="af-interstitial-cadence">${cadenceLabel}</div>` : ''}
          `;

      overlay.innerHTML = `
        <div class="af-interstitial-card">
          <div class="af-interstitial-topbar">
            <span class="af-interstitial-tag">${adTagText}</span>
            <button type="button" id="btn-interstitial-x" class="af-interstitial-x" aria-label="${closeAria}">✕</button>
          </div>
          <div class="af-interstitial-body">${cardBodyHtml}</div>
          <div class="af-interstitial-footer">
            <button type="button" id="btn-interstitial-close" class="af-btn af-btn-primary af-btn-block">${continueText}</button>
          </div>
        </div>
      `;

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        NativeBridge.haptics.selection();
        overlay.classList.remove('is-open');
        setTimeout(() => {
          overlay.remove();
          resolve(true);
        }, 160);
      };

      overlay.querySelector('#btn-interstitial-close')?.addEventListener('click', finish);
      overlay.querySelector('#btn-interstitial-x')?.addEventListener('click', finish);

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('is-open'));
    });
  }
}

export const adManager = new AdManager();
