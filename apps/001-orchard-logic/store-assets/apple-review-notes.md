# App Store Review Notes — Fruitopia (`v1.0.0`)

- **App Name:** Fruitopia: Fruit Puzzle
- **Bundle ID:** `com.erdem.fruitopia`
- **Version:** `1.0.0`
- **Demo Account / Login Required:** **No** (The app requires no account, sign-in, or personal profile.)

---

## 1. Copy-Paste Notes for App Store Connect ("Notes" Field)

```text
Thank you for reviewing Fruitopia!

ACCOUNT & OFFLINE FUNCTIONALITY
• No sign-in or demo account is required.
• Fruitopia is 100% offline-first: all 90 mathematically verified pure-logic single-solution puzzles (30 graded campaign levels from 4×4 to 10×10 + 60 rotating Daily Quest 10×10 boards), an on-device Endless Arcade generator (6×6, 8×8, 10×10), player progress, daily streaks, and preferences are bundled locally and persisted in an on-device SQLite database.

HOW TO TEST THE CORE GAMEPLAY (1–2 MINUTES)
1. Launch the app to the Play tab ("Home").
2. Tap "Play Level 1" to open the 4×4 Tutorial board:
   - Single-tap any open square to toggle a manual × mark; double-tap rapidly on an open square to place that color region's illustrated fruit; single-tap a placed fruit to clear it.
   - Drag your finger across empty squares to quickly mark × (or drag across manual × marks to erase).
   - Soft circular dots (•) indicate locked squares automatically eliminated by an active fruit; tapping a locked square pulses the blocking fruit without counting as an error.
   - Watch the live Fruit Harvest Tray above the board: each fruit lights up in color with a check badge as you place it validly (tap any fruit icon to pulse its region on the board).
   - Toggle Auto × off and place two fruits in the same row, column, color region, or diagonally adjacent cells to see the red conflict highlight and exact rule-clash explanation.
   - Use the top navbar music button to toggle the calm offline soundtrack, and the bottom toolbar to test Undo, Auto × toggle, Smart Hint (2 free hints per puzzle), and Clear (with confirmation alert).
   - Completing all 4 fruits triggers botanical confetti, saves stars/time to SQLite, opens the ad-free Stage Cleared sheet (with Share Result Card), and reveals the solved action bar (Play Again / Share / Next Level).
3. Tap the "Levels" tab to test the Endless Arcade generator (6×6 / 8×8 / 10×10), filter all 30 campaign levels by size (All / 4–6× / 8×8 / 10×10), and open Level 11 (10×10) to experience the flagship 10-fruit puzzle grid.
4. Tap "Play Daily Quest" on the Play tab to test today's Daily Quest 10×10 board (60-day rotating pool).
5. Tap the "Stats" tab to inspect live SQLite stats (solved levels, daily & longest streak, best 10×10, endless solved, and best times by size), toggle Gameplay, Accessibility (Colorblind Fruit Markers) & Audio preferences, test "Reset All Progress" (with confirmation alert), and switch Appearance (System / Light / Dark — defaults to Light) or Language (English / Türkçe) immediately.

ADVERTISING, ATT, UMP & HOUSE AD FALLBACK
• Fruitopia is free with no In-App Purchases or subscriptions in v1.0.0.
• Ads are served via Google Mobile Ads (AdMob): non-intrusive bottom Banner / Inline cards (with >=16pt spacing from interactive controls), level-transition interstitial ads (shown on every transition for 6×6+ stages with a 45-second pacing floor on 6×6, and once every 3 completions for 4×4/5×5 starter stages — never during active solving), and an optional user-initiated Rewarded Interstitial ad only if a player chooses "Watch Ad · +1 Smart Hint" after using both free hints on a puzzle.
• Victory celebration sheets contain zero ads.
• On iOS launch in production, the app requests iOS App Tracking Transparency (ATT) permission (NSUserTrackingUsageDescription) and Google UMP consent (in EEA/UK regions) before initializing AdMob.
• Regardless of whether the user allows or declines tracking, all 90 puzzles, Endless Mode, and all core features remain 100% accessible.
• No-Fill / Offline Safety: When offline or if an AdMob unit has no fill, ad containers reserve a fixed height (zero layout shift) and display a clean, localized indie House Ad card—never an empty gray box or broken frame. Similarly, if a Rewarded Ad cannot fill offline during review, tapping "Watch Ad · +1 Smart Hint" degrades gracefully without blocking the user.
```

---

## 2. Internal Pre-Submission Verification Checklist (For Developer)

| Review Guideline | Verification Status | Implementation Reference |
| :--- | :---: | :--- |
| **Guideline 2.1 (App Completeness)** | Verified | Zero mock data, zero placeholder text, all 90 puzzles mathematically verified (`solutionCount === 1`, 100% pure human logic), plus 0%-fail on-device Endless Mode (`6×6`, `8×8`, `10×10`). |
| **Guideline 2.3 (Accurate Metadata)** | Verified | EN & TR screenshots generated directly from real app captures (`store-assets/screenshots/`). `aso-en.md`, `aso-tr.md`, and `apple-review-notes.md` match live controls & monetization honestly. |
| **Guideline 4.2 (Minimum Functionality)** | Verified | 100% self-contained offline Capacitor `www/` bundle (no remote `server.url`), native haptics, local SQLite persistence, custom 10-fruit vector graphics, drag gestures, evolving procedural Web Audio soundtrack, 60-day daily engine, and on-device Endless generator. |
| **Guideline 4.3 (Design Differentiation)** | Verified | Bespoke "Juice & Craft Arcade" game visual system (`#FBF3E4` Sunlit Cream / `#171311` Twilight Orchard + `#D9383E` Berry Coral, 3D arcade buttons & wood-framed board) distinct from sibling factory apps. |
| **Guideline 5.1.1 & 5.1.2 (Privacy & ATT)** | Verified | ATT prompt & UMP consent precede AdMob initialization (`core-engine/js/ad-manager.js`). Local-only storage notice displayed in Stats tab; Privacy Policy & Support HTML pages provided. |
| **AdMob Placement Policy** | Verified | 16px safe buffer above `#play-banner`; zero ads shown on launch splash or Victory Sheet; interstitials disabled during active solving; rewarded hint is strictly opt-in with transparent `"Watch Ad · +1 Smart Hint"` CTA. |

---

## 3. Contact Details for App Store Connect Review Form

Fill these fields in App Store Connect → **App Review Information → Contact Information**:
- **First Name / Last Name:** Erdem *(add legal surname in App Store Connect)*
- **Phone Number:** *(enter active developer phone number)*
- **Email Address:** `erdem@skyhancloud.com`
