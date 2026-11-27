/* App Factory Core Engine — Capacitor Native Bridge with Graceful Web Fallbacks */

function getCapacitor() {
  return typeof window !== 'undefined' ? window.Capacitor || null : null;
}

function getPlugin(name) {
  const cap = getCapacitor();
  return cap && cap.Plugins ? cap.Plugins[name] || null : null;
}

export const NativeBridge = {
  isNative() {
    const cap = getCapacitor();
    return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  },

  getPlatform() {
    const cap = getCapacitor();
    if (cap && typeof cap.getPlatform === 'function') return cap.getPlatform();
    return 'web';
  },

  haptics: {
    async impact(style = 'LIGHT') {
      const Haptics = getPlugin('Haptics');
      if (Haptics && typeof Haptics.impact === 'function') {
        try { await Haptics.impact({ style }); } catch { /* ignore */ }
      }
    },
    async selection() {
      const Haptics = getPlugin('Haptics');
      if (Haptics && typeof Haptics.selectionChanged === 'function') {
        try { await Haptics.selectionChanged(); } catch { /* ignore */ }
      }
    },
    async notification(type = 'SUCCESS') {
      const Haptics = getPlugin('Haptics');
      if (Haptics && typeof Haptics.notification === 'function') {
        try { await Haptics.notification({ type }); } catch { /* ignore */ }
      }
    }
  },

  async setStatusBarStyle(theme) {
    const StatusBar = getPlugin('StatusBar');
    if (!StatusBar || typeof StatusBar.setStyle !== 'function') return;
    try {
      await StatusBar.setStyle({ style: theme === 'dark' ? 'DARK' : 'LIGHT' });
    } catch { /* ignore */ }
  },

  async share({ title, text, url }) {
    const Share = getPlugin('Share');
    if (Share && typeof Share.share === 'function') {
      return Share.share({ title, text, url });
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      return navigator.share({ title, text, url });
    }
    const content = [title, text, url].filter(Boolean).join('\n');
    await this.copyText(content);
    return { fallback: 'clipboard' };
  },

  async copyText(text) {
    const Clipboard = getPlugin('Clipboard');
    if (Clipboard && typeof Clipboard.write === 'function') {
      await Clipboard.write({ string: String(text) });
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(String(text));
      return true;
    }
    return false;
  },

  openExternalUrl(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
