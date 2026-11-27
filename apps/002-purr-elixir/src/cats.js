/* ============================================================================
 * Purr Elixir — 6 Handcrafted Animated Cat SVG Portraits, Crystal Cork,
 * Brand Emblem, UI Icons & Bilingual Reactive Dialogue Dispatcher
 * (All visible copy flows strictly through i18n EN/TR locale JSON keys)
 * ============================================================================ */

import { i18n } from '../../../core-engine/js/i18n.js';

// ============================================================================
// 1. Apple HIG Crisp SVG UI Icons
// ============================================================================

export const UI_ICONS = Object.freeze({
  tabShop: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6"/><path d="M10 3v5.4a2 2 0 0 1-.45 1.26L5.5 14.7A3.8 3.8 0 0 0 8.45 21h7.1a3.8 3.8 0 0 0 2.95-6.3l-4.05-5.04A2 2 0 0 1 14 8.4V3"/><path d="M7.5 15.5h9"/></svg>`,
  tabLevels: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>`,
  tabCats: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 10V5l3.5 2.5A7.4 7.4 0 0 1 12 6.8c1.25 0 2.45.25 3.5.7L19 5v5a7 7 0 1 1-14 0Z"/><circle cx="9.5" cy="12.5" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="12.5" r="1" fill="currentColor" stroke="none"/><path d="M10.5 15.5c.8.6 2.2.6 3 0"/></svg>`,
  musicOn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  musicOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v9"/><circle cx="6" cy="18" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
  rules: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.7"/><circle cx="12" cy="17.2" r="1" fill="currentColor" stroke="none"/></svg>`,
  undo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>`,
  addFlask: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3h6"/><path d="M9 3v5l-3.5 5.5A3.2 3.2 0 0 0 8.2 19h5.6a3.2 3.2 0 0 0 2.7-5.5L13 8V3"/><path d="M19 6v6"/><path d="M16 9h6"/></svg>`,
  hint: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6.5 6.5 0 0 0-4 11.6c.7.6 1 1.4 1 2.4h6c0-1 .3-1.8 1-2.4A6.5 6.5 0 0 0 12 3Z"/></svg>`,
  restart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`,
  share: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/></svg>`,
  play: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 4.8a1.4 1.4 0 0 1 2.1-1.2l11.6 7.2a1.4 1.4 0 0 1 0 2.4L8.6 20.4a1.4 1.4 0 0 1-2.1-1.2V4.8Z"/></svg>`,
  next: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`,
  starFilled: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.4l2.92 6.08 6.68.92-4.86 4.66 1.18 6.64L12 17.52 6.08 20.7l1.18-6.64L2.4 9.4l6.68-.92L12 2.4Z"/></svg>`,
  lock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  paw: `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="6.2" cy="9.5" r="2.3"/><circle cx="10.2" cy="6.2" r="2.4"/><circle cx="14.8" cy="6.2" r="2.4"/><circle cx="18.6" cy="9.7" r="2.2"/><path d="M12.3 11.2c-3.1 0-5.8 2.6-5.8 5.2 0 1.8 1.4 3.1 3.3 3.1 1 0 1.7-.4 2.5-.4s1.5.4 2.5.4c1.9 0 3.3-1.3 3.3-3.1 0-2.6-2.7-5.2-5.8-5.2Z"/></svg>`,
  flame: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.8 2.3c.4 2.9-1.2 4.8-2.6 6.4-1.3 1.5-2.5 3-2.5 5.1 0 2.5 1.9 4.5 4.4 4.5 2.7 0 4.6-2 4.6-4.8 0-2.1-1-3.9-2.2-5.4.1 1.6-.6 2.8-1.7 3.5.3-2.6-.1-5.8 0-9.3Z"/><path d="M12.2 21.5c-4.3 0-7.5-3.2-7.5-7.4 0-3.2 1.8-5.8 3.6-7.8.4-.4 1.1-.1 1 .5-.2 1.1.1 2.1.8 2.8.8-2.4 2.1-5 2.6-7.3.1-.5.8-.7 1.2-.3 3.2 3 5.8 6.8 5.8 11.6 0 4.6-3.2 7.9-7.5 7.9Z"/></svg>`
});

// ============================================================================
// 2. Signature Brand Emblem, Cat-Ear Crystal Cork & Seal Sparkle Burst
// ============================================================================

export function getBrandEmblemSvg() {
  return `
    <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true">
      <defs>
        <linearGradient id="pe-emb-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8B5CF6"/>
          <stop offset="58%" stop-color="#6D28D9"/>
          <stop offset="100%" stop-color="#0D9488"/>
        </linearGradient>
        <linearGradient id="pe-emb-liq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FDE68A"/>
          <stop offset="52%" stop-color="#F43F88"/>
          <stop offset="100%" stop-color="#A78BFA"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#pe-emb-bg)"/>
      <!-- Cat-Ear Stopper -->
      <path d="M25 14 L23 7 L29.5 11.5 L34.5 11.5 L41 7 L39 14 Z" fill="#FDE68A" stroke="#78350F" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- Crystal Bottle Neck & Rim -->
      <rect x="24" y="13.5" width="16" height="4" rx="2" fill="#FFFFFF" opacity="0.92"/>
      <rect x="27" y="17.5" width="10" height="6" fill="rgba(255,255,255,0.34)" stroke="#FFFFFF" stroke-width="1.6"/>
      <!-- Glowing Potion Flask Body -->
      <path d="M27 23.5 L17.5 34.5 C15 37.5 15.5 49 23 52.5 L41 52.5 C48.5 49 49 37.5 46.5 34.5 L37 23.5 Z" fill="rgba(255,255,255,0.22)" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M19.5 37 C23 35.2 28 38.5 33 36.8 C38 35.1 42 36.2 44.8 37.2 C46.4 42.5 44.5 48.2 40 50.5 L24 50.5 C19.5 48.2 17.8 42.5 19.5 37 Z" fill="url(#pe-emb-liq)"/>
      <!-- Cute Cat Face Reflection Inside Flask -->
      <circle cx="27.5" cy="43" r="1.8" fill="#1E1633"/>
      <circle cx="36.5" cy="43" r="1.8" fill="#1E1633"/>
      <path d="M30 45.4 Q32 47.4 34 45.4" fill="none" stroke="#1E1633" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Specular Glass Highlight & Stars -->
      <path d="M21 33 Q19 39 21 45" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.82"/>
      <path d="M51 15 L52.4 18.2 L55.6 19.6 L52.4 21 L51 24.2 L49.6 21 L46.4 19.6 L49.6 18.2 Z" fill="#FEF08A"/>
      <circle cx="14" cy="21" r="2" fill="#99F6E4"/>
    </svg>
  `;
}

export function getCatCorkSvg() {
  return `
    <svg viewBox="0 0 34 24" width="30" height="22" aria-hidden="true">
      <path d="M7 11 L4 2 L12.5 7.5 Q17 6.5 21.5 7.5 L30 2 L27 11 L25.5 22 Q17 23.5 8.5 22 Z" fill="#E9B87A" stroke="#8C5C2A" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M7.5 6 L10.5 8.5 L8.2 10.5 Z" fill="#F9A8D4" opacity="0.85"/>
      <path d="M26.5 6 L23.5 8.5 L25.8 10.5 Z" fill="#F9A8D4" opacity="0.85"/>
      <circle cx="13.5" cy="14" r="1.3" fill="#5B3715"/>
      <circle cx="20.5" cy="14" r="1.3" fill="#5B3715"/>
      <path d="M15.2 16.5 Q17 18.2 18.8 16.5" fill="none" stroke="#5B3715" stroke-width="1.3" stroke-linecap="round"/>
    </svg>
  `;
}

export function getSparkleBurstSvg() {
  return `
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <path d="M32 4 L35 15 L46 18 L35 21 L32 32 L29 21 L18 18 L29 15 Z" fill="#FBBF24"/>
      <path d="M12 24 L14 29 L19 31 L14 33 L12 38 L10 33 L5 31 L10 29 Z" fill="#A78BFA"/>
      <path d="M52 22 L54 27 L59 29 L54 31 L52 36 L50 31 L45 29 L50 27 Z" fill="#2DD4BF"/>
      <circle cx="20" cy="12" r="2.6" fill="#F43F88"/>
      <circle cx="46" cy="11" r="2.4" fill="#38BDF8"/>
      <circle cx="32" cy="44" r="2.2" fill="#FDE68A"/>
    </svg>
  `;
}

// ============================================================================
// 3. 6 Distinct Handcrafted Animated Cat SVG Portraits
// ============================================================================

const CAT_PALETTES = Object.freeze({
  mochi: {
    coat: '#EFE7FF',
    shade: '#D9CBFA',
    earInner: '#F9A8D4',
    stroke: '#4C1D95',
    eye: '#4C1D95',
    blush: '#F472B6',
    collar: '#7C3AED',
    gem: '#FDE68A',
    pattern: 'lavender'
  },
  biscuit: {
    coat: '#FDE6C4',
    shade: '#F5C17B',
    earInner: '#FDA4AF',
    stroke: '#78350F',
    eye: '#78350F',
    blush: '#FB923C',
    collar: '#F59E0B',
    gem: '#FEF08A',
    pattern: 'tabby'
  },
  luna: {
    coat: '#334155',
    shade: '#1E293B',
    earInner: '#93C5FD',
    stroke: '#0F172A',
    eye: '#38BDF8',
    blush: '#F472B6',
    collar: '#0284C7',
    gem: '#BAE6FD',
    pattern: 'tuxedo'
  },
  cloud: {
    coat: '#E6F9F6',
    shade: '#C6EFE9',
    earInner: '#FBCFE8',
    stroke: '#115E59',
    eye: '#0F766E',
    blush: '#F9A8D4',
    collar: '#0D9488',
    gem: '#99F6E4',
    pattern: 'persian'
  },
  matcha: {
    coat: '#FEF3C7',
    shade: '#F5DF9B',
    earInner: '#FDBA74',
    stroke: '#365314',
    eye: '#15803D',
    blush: '#FB923C',
    collar: '#16A34A',
    gem: '#BBF7D0',
    pattern: 'calico'
  },
  cleo: {
    coat: '#FFF1F7',
    shade: '#FBD4E5',
    earInner: '#F472B6',
    stroke: '#831843',
    eye: '#E11D6D',
    blush: '#FB7185',
    collar: '#E11D6D',
    gem: '#FBBF24',
    pattern: 'royal'
  }
});

function renderCatPattern(p) {
  switch (p.pattern) {
    case 'tabby':
      return `
        <path d="M27 18 L29 24 M32 17 L32 24 M37 18 L35 24" stroke="#D97706" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M14 34 L19 35 M50 34 L45 35" stroke="#D97706" stroke-width="2.2" stroke-linecap="round"/>
      `;
    case 'tuxedo':
      return `
        <path d="M22 40 Q32 34 42 40 Q43 52 32 54 Q21 52 22 40 Z" fill="#F8FAFC"/>
        <path d="M32 22 L33.5 25 L36.5 26.2 L33.5 27.4 L32 30.4 L30.5 27.4 L27.5 26.2 L30.5 25 Z" fill="#93C5FD" opacity="0.9"/>
      `;
    case 'persian':
      return `
        <circle cx="15" cy="39" r="6" fill="${p.coat}" stroke="${p.stroke}" stroke-width="1.6"/>
        <circle cx="49" cy="39" r="6" fill="${p.coat}" stroke="${p.stroke}" stroke-width="1.6"/>
        <path d="M26 17 Q32 12 38 17" fill="${p.coat}" stroke="${p.stroke}" stroke-width="1.6" stroke-linecap="round"/>
      `;
    case 'calico':
      return `
        <path d="M14 26 Q23 19 29 27 Q23 34 15 32 Z" fill="#F97316" opacity="0.85"/>
        <path d="M40 23 Q48 24 50 33 Q42 35 38 29 Z" fill="#3F6212" opacity="0.72"/>
      `;
    case 'royal':
      return `
        <path d="M23 18 L25 9 L30 14 L32 7.5 L34 14 L39 9 L41 18 Z" fill="#FBBF24" stroke="#9A4406" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="32" cy="14.5" r="1.8" fill="#E11D6D"/>
      `;
    default: // lavender Mochi
      return `
        <path d="M29 21 L32 18.5 L35 21 L32 23.5 Z" fill="#A78BFA" opacity="0.75"/>
      `;
  }
}

function renderCatEyes(p, mood) {
  if (mood === 'happy') {
    return `
      <path d="M21 35 Q24.5 30.5 28 35" fill="none" stroke="${p.stroke}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M36 35 Q39.5 30.5 43 35" fill="none" stroke="${p.stroke}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M52 17 L53.4 20 L56.4 21.4 L53.4 22.8 L52 25.8 L50.6 22.8 L47.6 21.4 L50.6 20 Z" fill="#FBBF24"/>
    `;
  }
  if (mood === 'surprised') {
    return `
      <circle cx="24.5" cy="34.5" r="4.2" fill="#FFFFFF" stroke="${p.stroke}" stroke-width="1.6"/>
      <circle cx="39.5" cy="34.5" r="4.2" fill="#FFFFFF" stroke="${p.stroke}" stroke-width="1.6"/>
      <circle cx="24.5" cy="34.5" r="2.2" fill="${p.eye}"/>
      <circle cx="39.5" cy="34.5" r="2.2" fill="${p.eye}"/>
    `;
  }
  if (mood === 'thinking') {
    return `
      <circle cx="24.5" cy="34.5" r="3.4" fill="${p.eye}"/>
      <circle cx="39.5" cy="33.5" r="3.4" fill="${p.eye}"/>
      <circle cx="23.5" cy="33.2" r="1.2" fill="#FFFFFF"/>
      <circle cx="38.5" cy="32.2" r="1.2" fill="#FFFFFF"/>
      <path d="M36 28.5 Q40 27 43.5 29" fill="none" stroke="${p.stroke}" stroke-width="1.8" stroke-linecap="round"/>
    `;
  }
  // Idle bright expressive eyes
  return `
    <circle cx="24.5" cy="34.5" r="3.6" fill="${p.eye}"/>
    <circle cx="39.5" cy="34.5" r="3.6" fill="${p.eye}"/>
    <circle cx="23.3" cy="33.1" r="1.35" fill="#FFFFFF"/>
    <circle cx="38.3" cy="33.1" r="1.35" fill="#FFFFFF"/>
    <circle cx="25.7" cy="35.8" r="0.7" fill="#FFFFFF" opacity="0.8"/>
    <circle cx="40.7" cy="35.8" r="0.7" fill="#FFFFFF" opacity="0.8"/>
  `;
}

function renderCatMouth(p, mood) {
  const nose = `<polygon points="32,39.5 29.8,37.4 34.2,37.4" fill="${p.blush}"/>`;
  if (mood === 'happy') {
    return `
      ${nose}
      <path d="M27.5 41.2 Q30 44.2 32 41.4 Q34 44.2 36.5 41.2" fill="none" stroke="${p.stroke}" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="32" cy="43.8" rx="2.4" ry="1.8" fill="#FB7185"/>
    `;
  }
  if (mood === 'surprised') {
    return `
      ${nose}
      <circle cx="32" cy="43" r="2.4" fill="#FB7185" stroke="${p.stroke}" stroke-width="1.4"/>
    `;
  }
  return `
    ${nose}
    <path d="M28 41.4 Q30.2 43.6 32 41.4 Q33.8 43.6 36 41.4" fill="none" stroke="${p.stroke}" stroke-width="1.75" stroke-linecap="round"/>
  `;
}

export function getCatSvg(catId = 'mochi', { mood = 'idle', className = '' } = {}) {
  const key = catId in CAT_PALETTES ? catId : 'mochi';
  const p = CAT_PALETTES[key];
  const cls = className ? ` class="${className}"` : '';

  return `
    <svg viewBox="0 0 64 64"${cls} width="48" height="48" aria-hidden="true">
      <!-- Ears -->
      <path d="M15 28 L12 11 L26 19 Z" fill="${p.coat}" stroke="${p.stroke}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M49 28 L52 11 L38 19 Z" fill="${p.coat}" stroke="${p.stroke}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M16.5 24 L15 15 L23 20 Z" fill="${p.earInner}"/>
      <path d="M47.5 24 L49 15 L41 20 Z" fill="${p.earInner}"/>
      <!-- Head -->
      <ellipse cx="32" cy="35" rx="21" ry="18.5" fill="${p.coat}" stroke="${p.stroke}" stroke-width="2"/>
      <!-- Soft Cheek Shade -->
      <path d="M13 38 Q32 54 51 38 Q48 52 32 53 Q16 52 13 38 Z" fill="${p.shade}" opacity="0.45"/>
      <!-- Distinct Breed Markings / Crown -->
      ${renderCatPattern(p)}
      <!-- Rosy Cheeks -->
      <ellipse cx="18.5" cy="39.5" rx="3.4" ry="2" fill="${p.blush}" opacity="0.45"/>
      <ellipse cx="45.5" cy="39.5" rx="3.4" ry="2" fill="${p.blush}" opacity="0.45"/>
      <!-- Whiskers -->
      <path d="M8 37 L15 38 M8.5 41.5 L15.5 41" stroke="${p.stroke}" stroke-width="1.4" stroke-linecap="round" opacity="0.65"/>
      <path d="M56 37 L49 38 M55.5 41.5 L48.5 41" stroke="${p.stroke}" stroke-width="1.4" stroke-linecap="round" opacity="0.65"/>
      <!-- Eyes & Mouth -->
      ${renderCatEyes(p, mood)}
      ${renderCatMouth(p, mood)}
      <!-- Apothecary Collar & Charm -->
      <path d="M19 50.5 Q32 56.5 45 50.5" fill="none" stroke="${p.collar}" stroke-width="4.4" stroke-linecap="round"/>
      <circle cx="32" cy="54.2" r="3.4" fill="${p.gem}" stroke="${p.stroke}" stroke-width="1.4"/>
    </svg>
  `;
}

// ============================================================================
// 4. Reactive Bilingual Cat Dialogue Dispatcher (100% Locale-Backed)
// ============================================================================

const KNOWN_CATS = new Set(['mochi', 'biscuit', 'luna', 'cloud', 'matcha', 'cleo']);

function safeCatId(catId) {
  return KNOWN_CATS.has(catId) ? catId : 'mochi';
}

let dialogueCounter = 0;

function pickVariant(keys) {
  dialogueCounter = (dialogueCounter + 1) % 1000;
  return keys[dialogueCounter % keys.length];
}

export function getCatDialogue(catId, event, params = {}) {
  const id = safeCatId(catId);
  let key;
  switch (event) {
    case 'home_greeting':
      key = pickVariant([`cat.${id}.greet_1`, `cat.${id}.greet_2`]);
      break;
    case 'level_start':
      key = pickVariant([`cat.${id}.start_1`, `cat.${id}.start_2`]);
      break;
    case 'bottle_sealed':
      key = pickVariant([`cat.${id}.seal_1`, `cat.${id}.seal_2`]);
      break;
    case 'combo':
      key = `cat.${id}.combo_1`;
      break;
    case 'undo':
      key = `cat.${id}.undo_1`;
      break;
    case 'restart':
      key = `cat.${id}.restart_1`;
      break;
    case 'idle_nudge':
      key = `cat.${id}.nudge_1`;
      break;
    case 'deadlock':
      key = `cat.${id}.deadlock_1`;
      break;
    case 'hint_seal':
      key = `cat.${id}.hint_seal`;
      break;
    case 'hint_merge':
      key = `cat.${id}.hint_merge`;
      break;
    case 'hint_open':
      key = `cat.${id}.hint_open`;
      break;
    case 'hint_deadend':
      key = `cat.${id}.hint_deadend`;
      break;
    case 'extra_flask':
      key = `cat.${id}.flask_1`;
      break;
    case 'pet':
      key = pickVariant([`cat.${id}.pet_1`, `cat.${id}.pet_2`]);
      break;
    default:
      key = `cat.${id}.greet_1`;
  }
  return i18n.t(key, params);
}

export function getVisitorDeliveryQuote(catId) {
  const id = safeCatId(catId);
  return i18n.t(`cat.${id}.delivery`);
}
