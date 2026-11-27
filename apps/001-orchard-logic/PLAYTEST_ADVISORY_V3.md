# Fruitopia — Impartial Playtest Review & Game Design Advisory (V3)

- **Reviewer Role:** Impartial Mobile Game Critic, Senior Game Designer & Player Experience Reviewer (First-Time Playthrough)
- **Target Build:** `Fruitopia` (`com.erdem.fruitopia`) — `/home/erdemskywalker/app-factory/apps/001-orchard-logic/www`
- **Live Test Environments:**
  - **iPhone 16 Pro Max (`430×932`, 2× DPR):** Light Mode (default) & Dark Mode — English (`en-US`)
  - **iPhone SE (`375×667`, 2× DPR):** Light Mode — Turkish (`tr-TR`)
- **Rubric Reference:** `playtest_rubric.json` (`pass_threshold: 85 / 100`, 5 official weighted categories totaling 100 pts + qualitative Brand & Game Feel verdict)
- **Runtime Stability:** `0` console errors, `0` uncaught page errors, `0px` horizontal overflow across all 10 tested screen/viewport combinations.

---

## 1. Executive Verdict & Impartial Score

### **Overall Score: `84 / 100`** *(Rubric Pass Threshold: `85 / 100` — Hairline below ship-ready due to 2 live visual bugs + store-asset leaks)*

> **Honest Critic Summary:**
> **Fruitopia is genuinely fun to play and feels dramatically closer to a real, crafted iOS puzzle game than a generic web wrapper.** Its core deduction loop (Queens / Star Battle with 10 bespoke SVG fruits), zero-spoiler Home preview, locked `•` Auto-`×` dots, single-step Undo, ascending pentatonic chimes, and `0.00px` square board geometry on both Pro Max and iPhone SE are **standout engineering**.
>
> However, playing it like a real first-time player uncovered **two undeniable live UI bugs** (a permanently stuck warning border on blocked cells, and toast pills floating directly over open modal sheets including the Victory Sheet stats), plus **leftover `"Orchard Logic"` brand leaks in `store-assets/`**, **empty/all-zero App Store screenshots**, and a **House Ad button pointing to generic `https://apps.apple.com`**. Fix those quick-hit polish items and Fruitopia jumps straight into the **`92+`** range; adopt the game-design recommendations below and it becomes a genuinely sticky, Top-Chart-capable daily puzzle habit.

### Score Breakdown (Official 5-Category Rubric + Qualitative Dimension #6)

| # | Category | Weight | Score | Key Strengths | Exact Deductions |
| :-: | :--- | :---: | :---: | :--- | :--- |
| 1 | **Fun, Puzzle Content & Replayability** (`fun_and_content`) | 25 | **22 / 25** | 90 mathematically unique pure-logic boards (`T4=0`), smooth par ramp (`30s→205s`), zero Home spoilers, `<60ms` 0%-fail Endless Arcade (`6×6`/`8×8`/`10×10`). | **`-1.5`** Endless `10×10` averages `32.4ms` vs `34ms` cap and routinely falls back to D4-transformed Daily 1–10 templates (and `6×6`/`8×8` reuse L5–L10). **`-1.5`** Flat 30-card level list lacks chapters, unlockable rewards, or interactive first-move onboarding. |
| 2 | **Controls, Gameplay Feel & Robustness** (`controls_and_robustness`) | 25 | **22 / 25** | Crisp single-tap `×`, rapid double-tap fruit, Drag-to-Mark & Drag-to-Erase `×`, zero ghost Undo on locked `•` cells, multi-reason conflict detection, full SQLite reload persistence (`cell` + timer + prefs), Solved Action Bar (no dead-end). | **`-2.0`** **Live Bug #1:** `clearLockedCue()` clears timeout without removing `.is-blocker-pulse` class, leaving a permanent brown tint/ring stuck on a cell even after Clear Board & Victory. **`-1.0`** No optional single-tap cycle or long-press fruit placement mode for Queens/Sudoku veterans. |
| 3 | **Visual Design, Apple HIG & Readability** (`visual_usability`) | 20 | **17 / 20** | Tactile 3D buttons & espresso-framed board, `0.00px` board squareness & navbar centering on SE & Pro Max, clean 10-fruit tray & Colorblind watermarks, crisp TR localization on 375px SE. | **`-1.5`** **Live Bug #2:** `.af-toast` renders above open `.af-sheet` dialogs at `bottom: 168px`, obscuring Rules chips, Rewarded Hint copy, and Victory Sheet stats. **`-1.0`** Dark Mode Lemon (`#544914`) vs Pineapple (`#403618`) and Peach (`#682842`) vs Strawberry/Cherry are too close when adjacent on `10×10`. **`-0.5`** Redundant KPIs on Home (`0/90` & `0d Streak` shown twice); flat `Play Again`/`Share` buttons next to 3D `Next Level`; tight TR `"SIRADAKİ"` + `"Hedef 00:30"` fit on SE. |
| 4 | **Audio, Feedback & Game Feel (Juice)** (`audio_and_juice`) | 15 | **13 / 15** | Studio-quality offline Web Audio engine: lookahead scheduler, true stereo ping-pong delay, 4-section evolving menu/game tracks, 0ms mute sync, 10-step ascending pentatonic fruit chimes, `.ol-pop-burst` sparkle, confetti & cascade victory wave. | **`-2.0`** Musical Fruit Parade on Home has no visible affordance (`home.fruit_parade_tip` exists in locales but is never rendered!); missing mid-solve micro-juice (no row/column/region completion shimmer, no combo momentum feedback, no tray pop animation). |
| 5 | **First Impression, Monetization & Store Readiness** (`store_and_retention`) | 15 | **10 / 15** | Gorgeous 3D Fruitopia icon, ad-free Victory Sheet (`0` ad slots), honest `"Watch Ad · +1 Smart Hint"` sheet, `16px` ad safety gap, branded Share Result Card (`🍏 Fruitopia`). | **`-2.5`** Leftover `"Orchard Logic"` / `com.erdem.orchardlogic` / `orchard_logic_db` leaks in `store-assets/privacy-label.md`; outdated UI labels in `apple-review-notes.md`; `"Daily Harvest"`/`"Orchard"` drift in ASO & screenshots; Turkish typo `"Fruitopia'in"` in `privacy-policy.html`. **`-2.0`** Hero Slide 1 shows an **empty** 10×10 board + House Ad; Slides 3 & 5 show all zeroes; TR 6.7" slides use 375px SE captures; House Ad `"Explore"` links to generic `https://apps.apple.com`; no "Remove Ads" IAP yet. |
| 6 | **Brand Identity & True Mobile Game Feel** *(Qualitative Advisory)* | *10* | **8.5 / 10** | Warm sunlit polka-dot canvas, glossy 3D icon, rounded display typography, physical 3D button lips, purple-gold Endless Arcade portal, candy-striped progress bar, and espresso lacquer board frame genuinely read as a **real mobile game** on Home, Levels, and Play. | Still feels slightly **"iOS utility app"** in three places: (a) the **Stats** screen's lower iOS grouped-table settings list, (b) standard flat iOS bottom sheets (`Rules`, `Victory`, `Rewarded Hint`) lacking festive game framing, and (c) the flat white `FRUITOPIA TIP` house-ad card at the bottom of Play breaking the board immersion. |
| | **TOTAL OFFICIAL RUBRIC SCORE** | **100** | **84 / 100** | *Passes stability, zero-mock-data, and geometry bars; needs bug & store-asset cleanup to cross 85+.* | **Critical Policy Check:** Zero data loss, crashes, ghost undo, or solution spoilers (`0` hard blockers). |

---

## 2. Brand & Game-Style UI Verdict

**Does Fruitopia now look and feel like a real mobile game?**
**YES — roughly 80–85% of the way there, and the transformation is immediately palpable.**

### Where Fruitopia Genuinely Shines Like a Top-Chart Puzzle Game
- **The 3D App Icon (`www/assets/app-logo.png` & `store-assets/app-icon-1024.png`):** Glossy 3D rounded fruit tiles (Green Apple, Strawberry, Lemon, Grape) with sparkle highlights on a vibrant coral-mango gradient. Instant shelf appeal on an iOS Home Screen.
- **Tactile Game Surfaces:** The sunlit dotted cream canvas (`#FBF3E4`), rounded `SF Pro Rounded` display font, chunky 3D lipped red CTA (`Play Level 1`), enchanted purple-gold **Endless Arcade** portal (`6×6` / `8×8` / `10×10`), color-coded Stage Medallions (`01..30`), and dark espresso wooden-lacquer board frame (`3.5px` + `5px` bottom lip) create unmistakable tactile craft.
- **Play Scene Focus & Geometry:** On both iPhone 16 Pro Max (`402×402`, `39.6px` cells) and iPhone SE (`344.84×344.84`, `33.9px` cells), the board is mathematically square (`0.00px` aspect delta), the 2-line navbar (`Level 11 · 10×10` / `00:00`) sits at `0.00px` horizontal offset, and the 3D keycap toolbar (`Undo`, `Auto ×`, `Hint`, `Clear`) feels wonderfully pressable.

### Where It Still Feels Slightly "iOS Utility App-Like"
1. **The Stats & Settings Tab (`www/screens/stats.js`):** The top Bento cards look game-like, but scrolling down into *Gameplay* and *Appearance & Language* abruptly transitions into a plain iOS Settings list (native gray toggles + standard segmented controls). Turning Settings into a compact gear-icon modal/drawer from the Home header while making Tab 3 a true **Trophy Room & Achievements / Calendar** screen would dramatically elevate perceived game identity.
2. **Modal Sheets (`Victory`, `Rules`, `Rewarded Hint`):** The core-engine iOS white bottom sheet with top-right text `"Close"` feels slightly clinical during **Victory** — a moment that should burst with warmth, animated star rays, and a celebratory fruit crest!
3. **Home Redundancy & Unannounced Toy:** Showing `★ 0 / 90` and `0d Streak` twice on the same screen feels like a dashboard widget layout rather than a tight game lobby, and the bottom Fruit Parade is an awesome hidden toy that gives zero visual hint it can be tapped.

---

## 3. Live Bugs, Old-Brand Leaks & Visual Friction Caught

### A. Live Gameplay & UI Bugs (Verified via Live Playwright + Screenshots)
1. **Stuck `.is-blocker-pulse` Ghost Ring After Clearing/Moving (`www/screens/play.js`, lines 459–465):**
   - **Repro:** Place a fruit → tap a locked `•` cell (culprit fruit pulses with amber/brown `.is-blocker-pulse`) → press Undo, make another move, Clear Board, or finish the level within `2.2s`.
   - **Cause:** `clearLockedCue()` runs `clearTimeout(lockedCueTimer)` without clearing `.is-blocker-pulse` from `cellEls`.
   - **Impact:** That cell retains a permanent dark amber tint & `2.5px` inset border for the entire remainder of the session—even on the empty cleared board and the completed victory board!
   - **Fix (1 line):** Inside `clearLockedCue()`, add `cellEls.forEach((el) => el.classList.remove('is-blocker-pulse'));`.
2. **Toast Overlaps Open Modal Sheets (`www/core-engine/js/router.js` & `www/theme.css`):**
   - **Repro:** Trigger any toast (e.g., `"Music on"`, `"Board cleared"`, or `"+1 Smart Hint unlocked!"`) and open a sheet within `2.2s`—most commonly when finishing a puzzle using a rewarded hint, which immediately fires the Victory Sheet!
   - **Observed Live:** `"+1 Smart Hint unlocked!"` floated directly over the middle `"Clashes"` stat card of the Victory Sheet; `"Board cleared"` covered the Rewarded Hint description; `"Music on"` covered the Peach/Kiwi chips in Rules.
   - **Fix:** Dismiss any active `.af-toast` inside `router.openSheet()`, AND ensure `.af-toast` either renders below `.af-sheet-backdrop` z-index or docks safely at the top safe-area when a sheet is open.
3. **Unlocalized & Undiscoverable Home Fruit Parade (`www/screens/home.js`, line 127 & lines 221–229):**
   - Each fruit button has hardcoded English `aria-label="Fruit ${cid + 1}"` instead of the localized catalog fruit name (`Strawberry` / `Çilek`).
   - `locales/en.json` (`"home.fruit_parade_tip": "Tap any fruit to chime"`) and `tr.json` (`"Tını için meyvelere dokun"`) are defined but **never rendered** in `home.js`.
4. **House Ad Fallback Links to Generic `https://apps.apple.com` (`www/house-ads/catalog.json`, line 24):**
   - Because `com.erdem.fruitopia` is filtered out as the current app, offline/web users see a `"FRUITOPIA TIP"` card inside Fruitopia whose `"Explore"` button launches generic `https://apps.apple.com`. Apple Reviewers frequently flag placeholder/generic store URLs under Guideline 2.1/2.3.

### B. Leftover `"Orchard Logic"` Brand Leaks & Store-Asset Drift
1. **`store-assets/privacy-label.md` (CRITICAL PRE-SUBMISSION FIX):**
   - Line 3: `App Name: Orchard Logic: Fruit Puzzle`
   - Line 4: `Bundle ID: com.erdem.orchardlogic` *(conflicts with `com.erdem.fruitopia`!)*
   - Line 5: `Privacy Policy URL: .../orchard-logic/privacy-policy.html`
   - Lines 12 & 53: References `Orchard Logic` and `orchard_logic_db` (live DB is `fruitopia_db`).
2. **`store-assets/apple-review-notes.md`:**
   - Outdated UI button/feature names that no longer match the live app: `"Start Level 1"` (live: `"Play Level 1"`), `"Harvest Complete"` & `"Share Harvest Card"` (live: `"Stage Cleared!"` & `"Share Result Card"`), `"Endless Orchard"` (live: `"Endless Arcade"`), `"Play Daily Puzzle"` / `"Daily Harvest"` (live: `"Play Daily Quest"` / `"Daily Quest"`), and `"Orchard Craft" (#FAF7F2)` palette note.
3. **`store-assets/privacy-policy.html`:**
   - Line 302 Turkish grammar typo: `"Fruitopia'in ücretsiz kalabilmesi"` → should be **`"Fruitopia'nın ücretsiz kalabilmesi"`**.
   - Lines 232/294 still mention `"Daily Harvest"` / `"Günlük Hasat"` and omit `endless_runs`, audio, and colorblind prefs from Section 2.
4. **`store-assets/aso-en.md`, `aso-tr.md`, `screenshots-config.json`, & Rendered Marketing Screenshots:**
   - Inconsistent feature naming (`"Daily Harvest"` / `"Günlük Hasat"` / `"Endless Orchard"` / `"Your Orchard, Anywhere"`) vs live UI (`"Daily Quest"` / `"Günlük Görev"` / `"Endless Arcade"` / `"Sonsuz Arena"`).
   - **Turkish 6.7" Screenshots (`store-assets/screenshots/tr/*_6.7inch.png`)** were built from `se-light-tr.png` (`375×667`), causing missing Dynamic Island framing and cropped Home content inside a 6.7" Pro Max frame!
   - **Slide 1 (`01_flagship-10x10`)** displays an **empty** 10×10 board with zero fruits placed and a visible bottom House Ad; Slides 3 & 5 show all zeroes (`0 / 90`, `0d`, `—`).
5. **Minor Internal / Thematic Echoes:**
   - `package.json` still lists `"name": "orchard-logic"` and `"description": "Orchard Logic — ..."`; console logs in `play.js`/`stats.js` still prefix `[OrchardLogic ...]`.
   - Campaign Levels 6 (`Orchard Gate`) & 19 (`Emerald Orchard`) and Daily 13–24 (`... Orchard`) still use the word "Orchard" (acceptable as fruit-garden theme flavor, though renaming to "Fruitopia / Grove / Canopy" keeps the brand 100% unified).

### C. Subtle Visual & Readability Friction
- **Dark Mode Adjacent Region Contrast (`www/theme.css`, lines 252–261):** On Level 11 Dark Mode (`10×10`), **Lemon (`#544914`)** and **Pineapple (`#403618`)** touch directly and look nearly identical in olive-brown luminance; **Peach (`#682842`)** also reads closer to burgundy-plum than warm apricot next to Strawberry (`#5E2028`) and Cherry (`#4E1A4E`).
- **Home HUD Chip Duplication (`www/screens/home.js`):** Both `#btn-hud-stars` and `#btn-hud-endless` route identically to the `Levels` tab, while `★ 0/90` and `0d Streak` are repeated inside the two cards immediately below.
- **iPhone SE TR Levels Card Tightness:** On `375px` width, Level 1's `"SIRADAKİ"` badge and `"Hedef 00:30"` sit within ~2px of each other.
- **Solved Bar Button Depth Mismatch:** `Play Again` and `Share` use flat fills next to the chunky 3D-lipped `Next Level` CTA.

---

## 4. Top 10 Actionable Game Design & Product Recommendations ("Tavsiyeler")

### Quick Wins (Immediate High-Impact Polish — ~1–2 Hours)

#### 1. Squash the 2 Live Visual Bugs & Upgrade `10×10` Dark/Light Color Separation
- Clear `.is-blocker-pulse` inside `clearLockedCue()` (`www/screens/play.js`) so no stuck warning border ever survives a move, undo, reset, or victory.
- Auto-dismiss active `.af-toast` inside `router.openSheet()` (`www/core-engine/js/router.js`) so Victory Sheet stats and Rewarded Hint descriptions are never obscured.
- Separate **Lemon** vs **Pineapple** and **Peach** in `theme.css` + `seed.sql` (e.g., Dark Mode: shift Lemon brighter warm gold `#665814`, shift Pineapple warmer bronze-amber `#523018` or crisp sage-gold, and shift Peach to dusty coral-terracotta `#6E352C` so it separates cleanly from Strawberry `#5E2028` and Cherry `#4E1A4E`). Give `Play Again` and `Share` in `.ol-solved-bar` matching `3px` tactile 3D lips.

#### 2. Eliminate Every Store-Asset Brand Leak & Fix the Offline House Ad Action
- Update `store-assets/privacy-label.md` (`Fruitopia`, `com.erdem.fruitopia`, `fruitopia_db`), align `apple-review-notes.md` & `aso-en/tr.md` terminology (`Daily Quest` / `Endless Arcade`), and fix `"Fruitopia'in"` → `"Fruitopia'nın"` in `privacy-policy.html`.
- For the offline/no-fill House Ad card (`www/house-ads/catalog.json` + `ad-manager.js`), **never point `"Explore"` to generic `https://apps.apple.com`**. Until you have a second published app in your catalog, route the in-house tip card directly to an in-app action (`router.push('play', { mode: 'daily' })` or `router.switchTab('levels')`)—or hide the ad slot cleanly on screenshots.

#### 3. Make Home Cleaner & Reveal the Hidden Musical Fruit Parade
- Render the already-localized `home.fruit_parade_tip` (`"Tap any fruit to chime"` / `"Tını için meyvelere dokun"`) as a subtle micro-caption right above or below the 10-fruit parade—and add a tiny musical note bounce (`♪`) floating upward when tapped! Localize each fruit's `aria-label` from `fruit_catalog`.
- Eliminate duplicate numbers on Home: keep `★ 0/90` and `0d Streak` exclusively in the top Trophy HUD Bar, and give each of the 3 HUD chips a distinct destination (`Stars → Levels`, `Streak → Daily Quest`, `Endless → directly launch or scroll/highlight Endless Arcade` or swap to `Best 10×10 → Stats Trophy Room`).

---

### Core Gameplay & Juice (Turn a Good Puzzle into an Addictive Loop)

#### 4. Add a 15-Second Interactive First-Move Spotlight + Optional "Tap Mode" Setting
- Right now Level 1 only shows a passive 1-line text hint (`"Tap: × toggle · Double-tap: Fruit"`). On a player's very first open of Level 1 (`tutorial_seen === false`), pulse the 2-cell Yellow Lemon region with a friendly floating coachmark: *"Only 2 squares here—tap once to rule out ×, or double-tap to plant a fruit!"* Mark `tutorial_seen = true` after their first placed fruit.
- Add a **`Placement Gesture`** setting in Gameplay (`Double-Tap for Fruit` default vs `Tap Cycle: Empty → × → Fruit` vs `Long-Press for Fruit`). Veterans of LinkedIn *Queens* and *Star Battle* have fierce muscle-memory preferences—supporting both modes immediately removes friction for half the genre's audience!

#### 5. Elevate Deduction Micro-Juice: Zone/Line Shimmers, Combo Momentum & Tactile Audio Transients
- **Row / Column / Zone Satisfied Shimmer:** The moment a fruit cleanly locks out a region or leaves only 1 open cell in another zone, play a subtle `240ms` pearlescent light sweep across that fruit's tray badge + bounce the tray icon (`scale 1.22 → 1.0`).
- **Flow / Momentum Chain:** Track consecutive valid fruit placements without clashes (`2×`, `3×`, `4×`...); subtly glow the board border warm gold and brighten the pentatonic chime harmonic at `5+` streak!
- **Studio Marimba Attack Transient (`audio.js`):** Layer a `12ms` bandpass-filtered white-noise wooden mallet click on `_playMarimbaVoice` and `sfx.placeFruit`—a tiny 10-line Web Audio tweak that makes synthetic triangle waves sound remarkably like real warm acoustic marimba & wooden tiles.

#### 6. Upgrade Endless `10×10` to Asynchronous Pre-Generation + Endless Streak Counter
- Live benchmarking revealed `10×10` Endless averages `32.4ms` against its `34ms` timeout, causing most `10×10` runs to fall back to D4 symmetries of Daily 1–10.
- **Solution:** Keep the instant `<1ms` template fallback as a safety net, **and** pre-generate 1–2 genuinely fresh `10×10` topologies asynchronously in the background (`setTimeout` chunked or an inline Web Worker with a `250ms` budget) while the player is browsing Levels or solving their current board—storing them in a 2-slot SQLite/memory cache!
- Pair Endless Mode with a **"Run Streak" badge** (`Endless Run #3 🔥`) and a **Best Endless Streak** stat so Endless feels like a true Arcade score-chasing mode rather than isolated one-off boards.

---

### Retention & Meta-Progression (Build a 30-Day Habit Loop)

#### 7. Transform the Flat 30-Level Grid into 5 Visual World Chapters + Star-Unlockable Board Themes
- Group Levels `01–30` under 5 distinct illustrated chapter headers (*Chapter 1: Sunlit Sprouts `4×4`*, *Chapter 2: Citrus Meadow `5×5–6×6`*, *Chapter 3: Berry Terraces `8×8`*, *Chapter 4: Golden Canopy `10×10`*, *Chapter 5: Grand Fruitopia `10×10`*) with per-chapter star counters (`12 / 15 ★`).
- Make earned stars **meaningful**: unlock cosmetic **Board Themes** strictly through skill—e.g., *Sunlit Cream* (Default), *Midnight Espresso* (Free), *Matcha Botanical* (unlock at `15 ★`), *Berry Sorbet* (unlock at `40 ★`), and *Royal Gold Lacquer* (unlock at `75 ★`). Zero paywall, massive motivation to replay 2-star levels for 3 stars!

#### 8. Build a Daily Quest Calendar Archive, Countdown Timer & Spoiler-Free Wordle-Style Share Grid
- Add a compact **Monthly Daily Calendar** inside a dedicated Daily Quest sheet (or Tab 3 Trophy Room): green checkmarks for cleared days, gold crown badges for 3-star perfect solves, and a live **"Next Daily Quest in `HH:MM:SS`"** countdown once today's board is solved.
- Let players unlock **missed Daily Quests from the last 7 days** by watching 1 optional Rewarded Video ad (or free for Fruitopia Plus owners)—this is the single highest-performing ethical retention + rewarded-ad loop in modern daily puzzle games (proven by *NYT Games*, *Nonogram.com*, and *Woodoku*).
- Upgrade the **Share Result Card** (`buildShareText()` in `play.js`) to include a compact **spoiler-free color-emoji progress block** (e.g., showing par medal, 0-mistake shield `🛡️`, streak flame, and fruit harvest row) so players actually want to paste it into WhatsApp/iMessage group chats!

---

### App Store & Monetization (Maximize CTR, Reviews & Sustainable Revenue)

#### 9. Re-Shoot App Store Screenshots for 2×–3× Higher Tap-Through Conversion
- **Slide 1 (Hero `10×10`):** Capture a **mid-solve action state** with 6 vibrant fruits placed, crisp manual `×` marks, subtle `•` Auto-dots, 6 glowing colored fruit icons in the tray, and **ZERO House Ad banner** at the bottom! Viewers must instantly see *fruits on a colorful puzzle board* in 0.5 seconds.
- **Slides 3, 4 & 5 (`Home`, `Levels`, `Stats`):** Use a dedicated screenshot-capture seed profile showing lively progress (`18 / 30 Cleared`, `★ 52 / 90`, `7d Streak`, `01:42` Best 10×10, green/amber/blue/coral progress bars filled) instead of empty zeroes (`0/30`, `0d`, `—`).
- **Fix Turkish 6.7" Captures:** Capture Turkish screenshots at real `430×932` Pro Max resolution (not `375×667` SE) and unify copy (`"GÜNÜN 10×10 GÖREVİ"` / `"HER YERDE ÇEVRİMDIŞI OYNA"`).

#### 10. Ship a Clean `$2.99` "Fruitopia Plus" Non-Consumable IAP + Apple Game Center + Smart Review Prompt
- **One-Time "Remove Ads" Pack (`$2.99` / `₺99.99`):** Pure-logic puzzle audiences (`Sudoku`, `Queens`, `Star Battle`) convert exceptionally well on a fair one-time non-consumable purchase that removes Banner/Interstitial ads forever and grants +1 extra free hint per board. Your `core-engine` already supports `iapHook` + `adManager.setSuppressed(true)` + `Restore Purchases`!
- **Apple Game Center (`GKLeaderboard`):** Add 2 lightweight native leaderboards (`Daily 10×10 Fastest Time` & `Total 3-Star Stages`)—zero server maintenance, native Apple prestige, and huge organic replay drive.
- **Happiness-Timed `SKStoreReviewController` Prompt:** Trigger Apple's native in-app rating prompt once—and ONLY once—right after a player earns their **3rd 3-star victory** or completes their **first Daily `10×10` Quest** (peak dopamine moment, never after a clash or hint!).

---

## 5. Verification Evidence Snapshot (Live Measurements)

| Test Check | Viewport / Locale | Measured Result | Verdict |
| :--- | :--- | :--- | :---: |
| First-Launch Theme & Brand | Pro Max `430×932` EN | `Light` (`#FBF3E4`), `Fruitopia`, 3D logo `256px` loaded | PASS |
| Zero Home Mini-Board Spoilers | Pro Max `430×932` EN | `16` cells, `0` revealed fruits when unstarted; `1` player fruit when in-progress | PASS |
| Home Musical Fruit Parade | Pro Max `430×932` EN | `10` fruits render; `.is-boing` triggers on click (`tip` missing in DOM) | PARTIAL |
| `10×10` Board Square Geometry | Pro Max EN / SE TR | `402×402` (`0px` diff) / `344.84×344.84` (`0px` diff); lip gap `11px > 5px` | PASS |
| Navbar Optical Centering | Pro Max EN / SE TR | `0.00px` center offset, `0` title clipping, `0` button overlap | PASS |
| Single-Tap `×` & Double-Tap Fruit | Pro Max `430×932` EN | `EMPTY → × → EMPTY`; double-tap → Fruit + `.ol-pop-burst` + `9` soft dots | PASS |
| Locked `AUTO_X` & Undo Integrity | Pro Max `430×932` EN | Locked cue + blocker pulse; `1` Undo removes fruit cleanly (0 ghost undo) | PASS |
| Blocker Pulse Cleanup on Move | Pro Max `430×932` EN | `.is-blocker-pulse` remained stuck on cell `0` after Reset & Victory | **FAIL (Bug #1)** |
| Toast vs Open Bottom Sheets | Pro Max `430×932` EN | Toast floated over Rules chips, Rewarded Hint copy, and Victory Sheet stats | **FAIL (Bug #2)** |
| Drag-to-Mark & Drag-to-Erase `×` | Pro Max `430×932` EN | Dragged 3 cells → `3` `×`; dragged back → `0` `×` | PASS |
| Multi-Reason Conflict Detection | Node + Live Play | `['region', 'diag']`, `['col', 'region']`, red cells + tray + banner | PASS |
| Smart Hint + Rewarded Hint Flow | Pro Max `430×932` EN | `2 → 1 → +1` gold badge → transparent `"Watch Ad · +1 Smart Hint"` sheet | PASS |
| Victory Sheet & Solved Action Bar | Pro Max `430×932` EN | `0` ad slots in Victory Sheet; `Fruitopia` Share Card; `Play Again / Share / Next` | PASS |
| SQLite Persistence & Reset All | Pro Max `430×932` EN | Reload kept Level 2 fruit & timer; Reset cleared `1/30 → 0/30` while keeping Dark + Colorblind prefs | PASS |
| Endless Generator Stress (`30×` each) | Chromium In-App | `6×6` avg `0.52ms` (`30/30`), `8×8` avg `8.53ms` (`30/30`), `10×10` avg `32.44ms` (`30/30`) | PASS *(10×10 mostly template fallback)* |
| Store Assets Brand Audit | `store-assets/*` | Old `Orchard Logic` / `com.erdem.orchardlogic` in `privacy-label.md`; outdated notes; TR typo; empty Slide 1 | **NEEDS FIX** |
