/* ============================================================================
 * Orchard Logic — 10 Custom Crisp Inline SVG Fruits & UI Icons
 * Zero external icon dependencies; every fruit has a unique silhouette & palette
 * crafted for crystal clarity from 4x4 up to 10x10 on iPhone SE (375px).
 * ============================================================================ */

const FRUIT_SVGS = {
  // 0: Strawberry (Coral Red)
  0: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 28.5C11 26.8 6.5 21 6.5 14.8C6.5 10.6 9.5 8.5 16 8.5C22.5 8.5 25.5 10.6 25.5 14.8C25.5 21 21 26.8 16 28.5Z" fill="#E11D48" stroke="#881337" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 9.2L11.5 6.8C10.2 6.1 9.5 7.7 10.8 8.9L13.5 10.4L16 11.4L18.5 10.4L21.2 8.9C22.5 7.7 21.8 6.1 20.5 6.8L16 9.2Z" fill="#22C55E" stroke="#15803D" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M16 8.5V4.8" stroke="#15803D" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="14.5" r="1.15" fill="#FEF08A"/>
    <circle cx="16" cy="16" r="1.15" fill="#FEF08A"/>
    <circle cx="20" cy="14.5" r="1.15" fill="#FEF08A"/>
    <circle cx="13.5" cy="19.8" r="1.15" fill="#FEF08A"/>
    <circle cx="18.5" cy="19.8" r="1.15" fill="#FEF08A"/>
    <circle cx="16" cy="23.8" r="1.1" fill="#FEF08A"/>
  </svg>`,

  // 1: Grape (Plum Violet)
  1: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 9.5V5.2C16 4.4 17 3.8 18.2 4" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
    <path d="M16.2 7.5C19 5.5 22.8 5.8 23.8 8.5C21 9.6 18.2 9.4 16.2 7.5Z" fill="#22C55E" stroke="#15803D" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="11.4" cy="13.2" r="4.1" fill="#7C3AED" stroke="#4C1D95" stroke-width="1.5"/>
    <circle cx="20.6" cy="13.2" r="4.1" fill="#7C3AED" stroke="#4C1D95" stroke-width="1.5"/>
    <circle cx="16" cy="12.5" r="4.2" fill="#8B5CF6" stroke="#4C1D95" stroke-width="1.5"/>
    <circle cx="13" cy="19.2" r="4.1" fill="#7C3AED" stroke="#4C1D95" stroke-width="1.5"/>
    <circle cx="19" cy="19.2" r="4.1" fill="#8B5CF6" stroke="#4C1D95" stroke-width="1.5"/>
    <circle cx="16" cy="24.5" r="3.9" fill="#6D28D9" stroke="#4C1D95" stroke-width="1.5"/>
    <circle cx="14.7" cy="11.2" r="1.1" fill="#DDD6FE"/>
    <circle cx="17.8" cy="18" r="1" fill="#DDD6FE"/>
    <circle cx="14.9" cy="23.5" r="0.9" fill="#DDD6FE"/>
  </svg>`,

  // 2: Lemon (Sun Lemon)
  2: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M23.5 8.5C24.8 7.2 26.8 7.2 26.5 9.2C26.2 11 27.6 15.8 23.2 20.6C18.8 25.4 12.6 26.8 9.2 25.4C7.4 26.2 5.6 25.6 6.2 23.6C6.9 21.3 6.2 15.8 10.6 11C15 6.2 21 7.6 23.5 8.5Z" fill="#FACC15" stroke="#A16207" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M11.8 13.6C13.6 11.4 16.6 10.3 19.2 10.5" stroke="#FEF9C3" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M22.2 8.2C22.4 5.2 25.2 3.8 27.4 4.8C26.6 7.4 24.4 8.6 22.2 8.2Z" fill="#22C55E" stroke="#15803D" stroke-width="1.3" stroke-linejoin="round"/>
  </svg>`,

  // 3: Green Apple (Orchard Green)
  3: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 10.8C13.8 8.4 9.2 8.8 7.4 12.2C5.4 16 6.8 23.2 11.2 26.6C13 28 14.8 27.8 16 26.8C17.2 27.8 19 28 20.8 26.6C25.2 23.2 26.6 16 24.6 12.2C22.8 8.8 18.2 8.4 16 10.8Z" fill="#22C55E" stroke="#14532D" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 10.8C16 7.8 17.2 5.5 19.2 4.5" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
    <path d="M16.4 8.2C14.2 5.2 10.4 4.8 9.2 7.2C11.4 8.8 14.2 9.2 16.4 8.2Z" fill="#4ADE80" stroke="#15803D" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M10.4 14.2C9.6 16 9.6 18.6 10.6 20.6" stroke="#DCFCE7" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // 4: Orange (Tangerine)
  4: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="18" r="10.2" fill="#F97316" stroke="#9A3412" stroke-width="1.6"/>
    <path d="M16 8.2V5" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
    <path d="M16.2 7.4C18.6 4.4 23 4.4 24.2 7.2C21.6 8.8 18.6 8.8 16.2 7.4Z" fill="#22C55E" stroke="#15803D" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M10.4 14.2C11.4 12.2 13.4 11 15.6 10.8" stroke="#FFEDD5" stroke-width="2.1" stroke-linecap="round"/>
    <circle cx="20.6" cy="21.5" r="0.95" fill="#C2410C"/>
    <circle cx="18.2" cy="23.6" r="0.95" fill="#C2410C"/>
    <circle cx="22" cy="18.5" r="0.95" fill="#C2410C"/>
  </svg>`,

  // 5: Blueberry (Berry Blue)
  5: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="21.5" cy="13.5" r="6" fill="#1D4ED8" stroke="#1E3A8A" stroke-width="1.5"/>
    <circle cx="13.8" cy="18.5" r="8.8" fill="#2563EB" stroke="#1E3A8A" stroke-width="1.6"/>
    <path d="M10.8 11.4L12.6 12.8L14 10.8L15.4 12.8L17.2 11.4L16.3 13.8H11.7L10.8 11.4Z" fill="#1E3A8A"/>
    <path d="M8.8 17.8C8.8 15.8 9.8 14.2 11.4 13.4" stroke="#93C5FD" stroke-width="2.1" stroke-linecap="round"/>
    <circle cx="22.8" cy="11.4" r="1.4" fill="#60A5FA"/>
  </svg>`,

  // 6: Peach (Blossom Peach)
  6: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 10.2C12.2 7.5 6.8 9.8 6.8 15.5C6.8 21.8 12.4 26.2 16 28C19.6 26.2 25.2 21.8 25.2 15.5C25.2 9.8 19.8 7.5 16 10.2Z" fill="#FB7185" stroke="#9D174D" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 10.2C18.5 12.5 18.8 18 16 24.5" stroke="#BE185D" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M11 13.6C10.2 15.4 10.3 17.6 11.4 19.4" stroke="#FFE4E6" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 9.8V5.5" stroke="#78350F" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M16.2 7.6C18.8 4.8 22.8 5 23.6 7.8C21 9.2 18.4 9 16.2 7.6Z" fill="#22C55E" stroke="#15803D" stroke-width="1.3" stroke-linejoin="round"/>
  </svg>`,

  // 7: Kiwi (Sliced Kiwi Wheel)
  7: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="11.5" fill="#92400E" stroke="#451A03" stroke-width="1.5"/>
    <circle cx="16" cy="16" r="9.4" fill="#10B981"/>
    <ellipse cx="16" cy="16" rx="3.4" ry="4.1" fill="#ECFDF5"/>
    <circle cx="16" cy="9.5" r="1.15" fill="#1C1917"/>
    <circle cx="16" cy="22.5" r="1.15" fill="#1C1917"/>
    <circle cx="10.2" cy="16" r="1.15" fill="#1C1917"/>
    <circle cx="21.8" cy="16" r="1.15" fill="#1C1917"/>
    <circle cx="11.8" cy="11.4" r="1.1" fill="#1C1917"/>
    <circle cx="20.2" cy="11.4" r="1.1" fill="#1C1917"/>
    <circle cx="11.8" cy="20.6" r="1.1" fill="#1C1917"/>
    <circle cx="20.2" cy="20.6" r="1.1" fill="#1C1917"/>
  </svg>`,

  // 8: Cherry (Ruby Twin Cherries)
  8: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M11 17.5C11.5 11.5 15.5 7 20.5 5.2" stroke="#15803D" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M21.8 18.2C20.8 12.6 20.4 8.8 20.5 5.2" stroke="#15803D" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M20.5 5.6C23.5 4.2 26.8 5.8 26.8 8.4C24.2 9 21.8 8 20.5 5.6Z" fill="#22C55E" stroke="#15803D" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="10.6" cy="21.6" r="5.4" fill="#BE123C" stroke="#6B0B24" stroke-width="1.6"/>
    <circle cx="21.4" cy="22.2" r="5.4" fill="#E11D48" stroke="#6B0B24" stroke-width="1.6"/>
    <circle cx="8.9" cy="19.8" r="1.35" fill="#FFE4E6"/>
    <circle cx="19.7" cy="20.4" r="1.35" fill="#FFE4E6"/>
  </svg>`,

  // 9: Pineapple (Golden Amber)
  9: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 11.2L13 4.2L16 6.8L19 4.2L16 11.2Z" fill="#16A34A" stroke="#14532D" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M14.5 11.4L9.2 6.8L13.6 8.5L14.5 11.4Z" fill="#22C55E" stroke="#14532D" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M17.5 11.4L22.8 6.8L18.4 8.5L17.5 11.4Z" fill="#22C55E" stroke="#14532D" stroke-width="1.2" stroke-linejoin="round"/>
    <rect x="8.8" y="10.8" width="14.4" height="17.2" rx="7.2" fill="#F59E0B" stroke="#92400E" stroke-width="1.6"/>
    <path d="M11 14.5L21 24.5M14.5 11.8L22.2 19.5M9.8 19.5L17.5 27.2" stroke="#B45309" stroke-width="1.25" stroke-linecap="round"/>
    <path d="M21 14.5L11 24.5M17.5 11.8L9.8 19.5M22.2 19.5L14.5 27.2" stroke="#B45309" stroke-width="1.25" stroke-linecap="round"/>
  </svg>`
};

export function getFruitSvg(colorId, className = 'ol-fruit-svg') {
  const id = Number(colorId);
  const raw = FRUIT_SVGS[id] || FRUIT_SVGS[0];
  return raw.replace('<svg ', `<svg class="${className}" `);
}

export const X_MARK_SVG = `<svg class="ol-x-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>`;

export const AUTO_DOT_SVG = `<svg class="ol-auto-dot" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="4.2"></circle></svg>`;

export const UI_ICONS = {
  tabPlay: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>`,
  tabLevels: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg>`,
  tabStats: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,

  back: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
  help: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"></circle><path d="M9.4 9.4a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.3-2.6 3.7"></path><circle cx="12" cy="17.3" r="0.8" fill="currentColor" stroke="none"></circle></svg>`,
  musicOn: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
  musicOff: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v9"></path><circle cx="6" cy="18" r="3"></circle><line x1="2" y1="2" x2="22" y2="22"></line></svg>`,
  playSolid: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.8c0-1.1 1.2-1.8 2.2-1.2l11.2 7.2c.9.6.9 1.8 0 2.4L9.2 20.4C8.2 21 7 20.3 7 19.2V4.8z"></path></svg>`,
  checkMini: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  calendar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="3"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  videoAd: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3"></rect><polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none"></polygon></svg>`,
  share: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>`,
  settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  infinity: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"></path></svg>`,
  replay: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,

  undo: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"></path><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>`,
  autoX: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z"></path><line x1="16" y1="16" x2="21" y2="21"></line><line x1="21" y1="16" x2="16" y2="21"></line></svg>`,
  hint: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3h6c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2z"></path></svg>`,
  reset: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`,

  flame: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.7 2.4c.3 2.5-1.1 4.2-2.4 5.5-1.2 1.2-2.3 2.5-2.3 4.6 0 2.3 1.7 4 4 4 2.4 0 4.2-1.9 4.2-4.4 0-1.5-.6-2.9-1.6-4.2 2.9 1.4 4.9 4.3 4.9 7.6 0 4.4-3.4 7.5-7.6 7.5S4.5 19.9 4.5 15.5c0-3.3 1.7-6.1 4.3-8.6 1.5-1.4 2.9-2.8 3.9-4.5z"></path></svg>`,
  starFilled: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.4l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.2l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.4z"></path></svg>`,
  starBig: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.4l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.2l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.4z"></path></svg>`,
  trophy: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4a2 2 0 0 1-2-2V5h4"></path><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"></path><path d="M6 4h12v6a6 6 0 0 1-12 0V4z"></path><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>`,
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15.5 14"></polyline></svg>`,
  checkCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"></path><polyline points="22 4 12 14 9 11"></polyline></svg>`,
  zap: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,

  ruleRow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"></line><circle cx="12" cy="12" r="3" fill="currentColor"></circle></svg>`,
  ruleCol: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="4" x2="12" y2="20"></line><circle cx="12" cy="12" r="3" fill="currentColor"></circle></svg>`,
  ruleRegion: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h8v6h8v8H4z"></path><circle cx="9" cy="14" r="2.2" fill="currentColor"></circle></svg>`,
  ruleDiag: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="6.2" height="6.2" rx="1.5" fill="currentColor" fill-opacity="0.16"></rect><rect x="15.8" y="15.8" width="6.2" height="6.2" rx="1.5" fill="currentColor" fill-opacity="0.16"></rect><path d="M9.7 9.7L14.3 14.3M14.3 9.7L9.7 14.3" stroke-width="2.3"></path></svg>`
};
