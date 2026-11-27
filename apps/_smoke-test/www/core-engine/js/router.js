/* App Factory Core Engine — iOS Native Navigation Router, Sheets, Alerts & Toasts */

import { NativeBridge } from './native-bridge.js';
import { i18n } from './i18n.js';
import { adManager } from './ad-manager.js';

const CHEVRON_LEFT_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>`;

class IOSRouter {
  constructor() {
    this.rootEl = null;
    this.viewportEl = null;
    this.tabbarEl = null;
    this.routes = new Map();
    this.tabs = [];
    this.activeTab = null;
    this.stack = [];
    this.activeSheet = null;
    this.toastTimer = null;
  }

  init({ rootSelector = '#af-app', routes = {}, tabs = [], initialRoute = null } = {}) {
    this.rootEl = document.querySelector(rootSelector);
    if (!this.rootEl) throw new Error(`App root ${rootSelector} not found`);

    this.routes = new Map(Object.entries(routes));
    this.tabs = tabs;

    this.rootEl.innerHTML = '';
    this.viewportEl = document.createElement('main');
    this.viewportEl.className = 'af-viewport';
    this.rootEl.appendChild(this.viewportEl);

    if (this.tabs.length > 0) {
      this.rootEl.classList.add('af-has-tabbar');
      this.tabbarEl = this._buildTabBar(this.tabs);
      this.rootEl.appendChild(this.tabbarEl);
    }

    this._bindSwipeBack();
    i18n.onChange(() => this.rerenderCurrent());

    const queryRoute = new URLSearchParams(window.location.search).get('route');
    const startRoute =
      (queryRoute && this.routes.has(queryRoute) && queryRoute) ||
      initialRoute ||
      this.tabs[0]?.route ||
      this.routes.keys().next().value;

    if (this.tabs.some((t) => t.route === startRoute)) {
      this.switchTab(startRoute, { silent: true });
    } else if (startRoute) {
      this.replace(startRoute);
    }
  }

  _buildTabBar(tabs) {
    const nav = document.createElement('nav');
    nav.className = 'af-tabbar';
    nav.setAttribute('aria-label', 'Main Navigation');

    tabs.forEach((tab) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'af-tab-item';
      btn.setAttribute('data-tab-route', tab.route);

      const iconWrap = document.createElement('span');
      iconWrap.className = 'af-tab-icon';
      iconWrap.innerHTML = tab.iconSvg || '';

      const label = document.createElement('span');
      label.className = 'af-tab-label';
      if (tab.labelKey) {
        label.setAttribute('data-i18n', tab.labelKey);
        label.textContent = i18n.t(tab.labelKey);
      } else {
        label.textContent = tab.label || tab.route;
      }

      btn.append(iconWrap, label);
      btn.addEventListener('click', () => this.switchTab(tab.route));
      nav.appendChild(btn);
    });
    return nav;
  }

  _updateTabHighlight(route) {
    if (!this.tabbarEl) return;
    this.tabbarEl.querySelectorAll('.af-tab-item').forEach((btn) => {
      const active = btn.getAttribute('data-tab-route') === route;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  _bindSwipeBack() {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    this.viewportEl.addEventListener('touchstart', (e) => {
      if (this.stack.length <= 1 || e.touches.length !== 1) return;
      const t = e.touches[0];
      if (t.clientX <= 26) {
        startX = t.clientX;
        startY = t.clientY;
        tracking = true;
      }
    }, { passive: true });

    this.viewportEl.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > 75 && dy < 60) {
        this.pop();
      }
    }, { passive: true });
  }

  async _mountScreen(routeName, params = {}, { animate = 'none', isRoot = false } = {}) {
    const def = this.routes.get(routeName);
    if (!def) throw new Error(`Unknown route: ${routeName}`);

    const screenEl = document.createElement('section');
    screenEl.className = 'af-screen';
    screenEl.setAttribute('data-screen', routeName);

    const titleText = def.titleKey ? i18n.t(def.titleKey) : (def.title || '');
    const useLargeTitle = def.largeTitle !== false && isRoot;

    // Navigation Bar
    const navbar = document.createElement('header');
    navbar.className = `af-navbar${useLargeTitle ? '' : ' is-inline-title'}`;

    const navInner = document.createElement('div');
    navInner.className = 'af-navbar-inner';

    const leftSlot = document.createElement('div');
    leftSlot.className = 'af-navbar-left';
    if (!isRoot && this.stack.length >= 1) {
      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'af-nav-btn';
      backBtn.setAttribute('aria-label', i18n.t('af.back'));
      backBtn.innerHTML = `${CHEVRON_LEFT_SVG}<span>${i18n.t('af.back')}</span>`;
      backBtn.addEventListener('click', () => this.pop());
      leftSlot.appendChild(backBtn);
    }

    const titleEl = document.createElement('h2');
    titleEl.className = 'af-navbar-title';
    titleEl.textContent = titleText;

    const rightSlot = document.createElement('div');
    rightSlot.className = 'af-navbar-right';

    navInner.append(leftSlot, titleEl, rightSlot);
    navbar.appendChild(navInner);

    // Scroll Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'af-scroll-body';

    if (useLargeTitle && titleText) {
      const h1 = document.createElement('h1');
      h1.className = 'af-large-title';
      h1.textContent = titleText;
      bodyEl.appendChild(h1);
    }

    const contentHost = document.createElement('div');
    contentHost.className = 'af-screen-content';
    bodyEl.appendChild(contentHost);

    bodyEl.addEventListener('scroll', () => {
      navbar.classList.toggle('is-scrolled', bodyEl.scrollTop > 28);
    }, { passive: true });

    screenEl.append(navbar, bodyEl);

    // Let screen module populate content + optional navbar right actions
    const cleanup = await def.render({
      container: contentHost,
      rightSlot,
      titleEl,
      params,
      router: this,
      i18n
    });

    i18n.hydrateDOM(screenEl);
    adManager.mountSlots(screenEl);

    const prevEntry = this.stack[this.stack.length - 1];

    if (animate === 'push') {
      screenEl.classList.add('af-enter-from-right');
      this.viewportEl.appendChild(screenEl);
      screenEl.getBoundingClientRect(); // force layout
      requestAnimationFrame(() => {
        screenEl.classList.remove('af-enter-from-right');
        if (prevEntry) prevEntry.el.classList.add('af-leave-to-left');
      });
    } else {
      this.viewportEl.appendChild(screenEl);
    }

    return { routeName, params, el: screenEl, cleanup: typeof cleanup === 'function' ? cleanup : null };
  }

  async switchTab(routeName, { silent = false } = {}) {
    if (this.activeTab === routeName && this.stack.length === 1) return;
    if (!silent) NativeBridge.haptics.selection();
    this._clearStack();
    this.activeTab = routeName;
    this._updateTabHighlight(routeName);
    const entry = await this._mountScreen(routeName, {}, { animate: 'none', isRoot: true });
    this.stack = [entry];
  }

  async replace(routeName, params = {}) {
    this._clearStack();
    const entry = await this._mountScreen(routeName, params, { animate: 'none', isRoot: true });
    this.stack = [entry];
  }

  async push(routeName, params = {}) {
    NativeBridge.haptics.impact('LIGHT');
    const entry = await this._mountScreen(routeName, params, { animate: 'push', isRoot: false });
    this.stack.push(entry);
  }

  pop() {
    if (this.stack.length <= 1) return;
    NativeBridge.haptics.impact('LIGHT');
    const top = this.stack.pop();
    const prev = this.stack[this.stack.length - 1];
    if (prev) prev.el.classList.remove('af-leave-to-left');
    top.el.classList.add('af-leave-to-right');
    setTimeout(() => {
      if (top.cleanup) try { top.cleanup(); } catch { /* ignore */ }
      top.el.remove();
    }, 310);
  }

  async rerenderCurrent() {
    if (this.tabbarEl) i18n.hydrateDOM(this.tabbarEl);
    const top = this.stack[this.stack.length - 1];
    if (!top) return;
    const isRoot = this.stack.length === 1;
    const oldEl = top.el;
    if (top.cleanup) try { top.cleanup(); } catch { /* ignore */ }
    const fresh = await this._mountScreen(top.routeName, top.params, { animate: 'none', isRoot });
    oldEl.remove();
    this.stack[this.stack.length - 1] = fresh;
  }

  _clearStack() {
    this.stack.forEach((entry) => {
      if (entry.cleanup) try { entry.cleanup(); } catch { /* ignore */ }
      entry.el.remove();
    });
    this.stack = [];
  }

  openSheet({ title = '', render }) {
    this.closeSheet();
    NativeBridge.haptics.impact('LIGHT');

    const backdrop = document.createElement('div');
    backdrop.className = 'af-sheet-backdrop';
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeSheet();
    });

    const sheet = document.createElement('div');
    sheet.className = 'af-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');

    const grabber = document.createElement('div');
    grabber.className = 'af-sheet-grabber';

    const header = document.createElement('div');
    header.className = 'af-sheet-header';

    const h3 = document.createElement('h3');
    h3.className = 'af-sheet-title';
    h3.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'af-nav-btn';
    closeBtn.textContent = i18n.t('af.close');
    closeBtn.addEventListener('click', () => this.closeSheet());

    header.append(h3, closeBtn);

    const body = document.createElement('div');
    body.className = 'af-sheet-body';

    sheet.append(grabber, header, body);
    backdrop.appendChild(sheet);
    document.body.appendChild(backdrop);

    if (typeof render === 'function') render(body, () => this.closeSheet());
    i18n.hydrateDOM(sheet);
    adManager.mountSlots(sheet);

    requestAnimationFrame(() => backdrop.classList.add('is-open'));
    this.activeSheet = backdrop;
  }

  closeSheet() {
    if (!this.activeSheet) return;
    const el = this.activeSheet;
    this.activeSheet = null;
    el.classList.remove('is-open');
    setTimeout(() => el.remove(), 300);
  }

  showAlert({ title = '', message = '', confirmText, cancelText, destructive = false }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'af-alert-backdrop';

      const dialog = document.createElement('div');
      dialog.className = 'af-alert';
      dialog.setAttribute('role', 'alertdialog');

      const body = document.createElement('div');
      body.className = 'af-alert-body';

      const h3 = document.createElement('h3');
      h3.className = 'af-alert-title';
      h3.textContent = title;

      const p = document.createElement('p');
      p.className = 'af-alert-message';
      p.textContent = message;

      body.append(h3, p);

      const actions = document.createElement('div');
      actions.className = 'af-alert-actions';

      const finish = (val) => {
        backdrop.remove();
        resolve(val);
      };

      if (cancelText !== null) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'af-alert-btn';
        cancelBtn.textContent = cancelText || i18n.t('af.cancel');
        cancelBtn.addEventListener('click', () => finish(false));
        actions.appendChild(cancelBtn);
      }

      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = `af-alert-btn${destructive ? ' is-destructive' : ''}`;
      okBtn.textContent = confirmText || i18n.t('af.done');
      okBtn.addEventListener('click', () => {
        NativeBridge.haptics.impact('MEDIUM');
        finish(true);
      });
      actions.appendChild(okBtn);

      dialog.append(body, actions);
      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);
    });
  }

  showToast(message, durationMs = 2200) {
    let toast = document.querySelector('.af-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'af-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), durationMs);
  }
}

export const router = new IOSRouter();
