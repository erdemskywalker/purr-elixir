/* App Factory Core Engine — Optional In-App Purchase (IAP) Hook
 * Disabled by default for fast daily AdMob launches.
 * Enable per-app in boot config when "Remove Ads / Pro" is desired.
 */

const STORAGE_PRO_KEY = 'af_pro_entitlement';

class IapHook {
  constructor() {
    this.enabled = false;
    this.productIds = [];
    this.pro = false;
    this.listeners = new Set();
  }

  init({ enabled = false, productIds = [] } = {}) {
    this.enabled = Boolean(enabled);
    this.productIds = productIds;
    if (!this.enabled) {
      this.pro = false;
      return;
    }
    try {
      this.pro = window.localStorage.getItem(STORAGE_PRO_KEY) === '1';
    } catch {
      this.pro = false;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  isPro() {
    return this.enabled && this.pro;
  }

  _setPro(flag) {
    this.pro = Boolean(flag);
    try {
      window.localStorage.setItem(STORAGE_PRO_KEY, this.pro ? '1' : '0');
    } catch { /* ignore */ }
    this.listeners.forEach((fn) => fn(this.pro));
  }

  async purchase(productId) {
    if (!this.enabled) throw new Error('IAP is disabled for this app');
    const Purchases = window.Capacitor?.Plugins?.Purchases || window.Capacitor?.Plugins?.NativePurchases;
    if (!Purchases) {
      throw new Error('StoreKit plugin is only available in native iOS/Android builds');
    }
    const result = await Purchases.purchaseProduct({ productIdentifier: productId });
    if (result?.active || result?.transactionId) {
      this._setPro(true);
      return true;
    }
    return false;
  }

  async restorePurchases() {
    if (!this.enabled) return false;
    const Purchases = window.Capacitor?.Plugins?.Purchases || window.Capacitor?.Plugins?.NativePurchases;
    if (!Purchases || typeof Purchases.restorePurchases !== 'function') return false;
    const res = await Purchases.restorePurchases();
    const restored = Boolean(res?.active || (res?.entitlements && Object.keys(res.entitlements).length > 0));
    this._setPro(restored);
    return restored;
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const iapHook = new IapHook();
