# App Store Review Notes — Purr Elixir (`v1.0.0`)

- **App Name:** Purr Elixir: Cat Potion Sort
- **Bundle ID:** `com.erdem.purrelixir`
- **Version:** `1.0.0`
- **Demo Account / Login Required:** **No** (The app requires zero account creation, sign-in, or personal profile.)

---

## 1. Copy-Paste Notes for App Store Connect ("Notes" Field)

```text
Thank you for reviewing Purr Elixir: Cat Potion Sort!

ACCOUNT & 100% OFFLINE FUNCTIONALITY
• No sign-in, registration, or demo account is required.
• Purr Elixir is 100% offline-first: all 120 mathematically verified solvable crystal potion puzzles (60 graded campaign levels from 3 to 10 colors + 60 rotating Daily Brew orders), an on-device Endless Alchemy generator (Easy 5-Color, Medium 7-Color, Master 9-Color), 6 unlockable talking cat companions, player progress, persisted undo snapshots, daily streaks, and settings are bundled locally and stored in an on-device SQLite database (purr_elixir_db).

HOW TO TEST THE CORE GAMEPLAY (1–2 MINUTES)
1. Launch the app to the Shop tab ("Home"):
   - Tap Mochi (the talking cat card beneath the header) to trigger a happy reaction, purr/meow SFX, and cozy potion dialogue.
   - Inspect the live HUD strip (Stars, Levels, Cats, Streak), the 3D Campaign card with mini vial preview, the Daily Special Order card, and the Visiting Cats rail.
2. Tap "Start Level 1" to open the full-focus Play stage:
   - Tap any filled crystal vial to lift it, then tap an empty vial or another vial with a matching top elixir color to pour with smooth tilt animation and a glowing liquid arc.
   - Single-color vials cannot be poured into empty vials (intentional player-friendly guard explained in the "?" Apothecary Guide).
   - Fill any vial with 4 matching units to seal it with a cat-ear crystal cork, sparkle burst, cork-pop chime, combo badge, and live cat commentary.
   - Test the top navbar Music toggle and "?" Apothecary Guide sheet, and the 4-button bottom toolbar:
     • Undo (unlimited, persisted to local SQLite even across app restarts)
     • +1 Flask (opens a transparent opt-in sheet for a rewarded ad to add +1 empty crystal vial, max 2 per shelf)
     • Hint (2 free optimal Smart Hints per shelf showing glowing From → To badges + cat tip; after 2 free hints, offers an opt-in rewarded ad for +1 Smart Hint)
     • Restart (with confirmation alert)
   - Completing all colors saves stars and sealed vials to SQLite, opens the ad-free Order Complete Victory Sheet with Visitor Cat delivery & Share card, and reveals the post-win action bar (Replay / Share / Next Level).
3. Tap the "Levels" tab to test the Endless Alchemy generator (Easy 5 / Medium 7 / Master 9 Colors), filter all 60 campaign levels by difficulty tier (All / Easy / Medium / Master / Grandmaster), and see cat unlock milestone badges (Biscuit at Level 3, Luna at Level 8, Cloud at Level 15, Matcha at Level 25, Cleo at Level 40).
4. Tap "Brew" on the Daily Special Order card (Shop tab) to play today's rotating 60-day Daily Brew puzzle and track your Daily Streak.
5. Tap the "Cats" tab to view all 6 Visiting Cats (and switch your active talking assistant once Biscuit unlocks at Level 3), inspect live SQLite Apothecary Statistics (Levels Solved, Daily Streak, Vials Sealed, Endless Runs), toggle Music, Pour & Meow SFX, Haptic Feedback, Cat Speech Bubbles, and Colorblind Symbols (crisp monochrome white emblems on all 10 elixirs), switch Appearance (Light [default] / Dark / System) or Language (English / Türkçe) immediately, and test "Reset All Progress" (with confirmation alert).

ADVERTISING, ATT, UMP & HOUSE AD SAFETY
• Purr Elixir is completely free with no In-App Purchases or subscriptions in v1.0.0.
• Ads are served via Google Mobile Ads (AdMob):
  - Non-intrusive fixed-height Banner / Inline slots (CLS = 0, >=16pt clearance below the Play toolbar, automatically hidden whenever a modal or Victory Sheet opens and resumed when closed).
  - Graduated level-transition Interstitial ads: shown once every 3 completions for Starter Levels 1–5 (tracked in SQLite player_prefs.simple_ad_counter), and between transitions on Levels 6+, Daily Brew, and Endless runs (with a 45-second pacing floor on fast 4–5 color levels). Interstitials never interrupt active gameplay.
  - Strictly opt-in Rewarded Interstitial ads (prepareRewardInterstitialAd / showRewardInterstitialAd) ONLY when the player explicitly taps "Watch Ad · +1 Empty Flask" or "Watch Ad · +1 Smart Hint" inside the transparent confirmation sheet. Dismissing a rewarded ad early grants zero reward and never freezes the app.
• Victory celebration sheets contain zero ads.
• On iOS launch in production, the app requests iOS App Tracking Transparency (ATT) permission (NSUserTrackingUsageDescription), initializes the Google Mobile Ads SDK, and checks Google UMP consent (for EEA/UK users).
• Whether the user allows or declines tracking, all 120 puzzles, Endless Alchemy, all 6 cats, and every core feature remain 100% playable.
• No-Fill / Offline Safety: When offline or when AdMob returns no-fill, ad containers keep their exact reserved height and display a clean, localized indie House Ad card (never an empty gray box or broken layout). Rewarded ads gracefully notify the player if unavailable offline without blocking gameplay.
```

---

## 2. Internal Pre-Submission Verification Checklist (For Developer)

| Review Guideline | Verification Status | Implementation Reference |
| :--- | :---: | :--- |
| **Guideline 2.1 (App Completeness)** | Verified | Zero mock data, zero placeholders, 120/120 puzzles A*/BFS verified solvable (`database/seed.sql`), plus `<1ms` on-device Endless Alchemy generator. Visual Critic **96/100 PASS**, Independent Playtest Fun Critic **97/100 PASS**, **0 critical bugs**. |
| **Guideline 2.3 (Accurate Metadata)** | Verified | 20 EN & TR framed App Store screenshots (`6.7"` & `6.5"`) captured from real populated app runs (`store-assets/screenshots/`). ASO, Privacy Label, and Review Notes accurately match live behavior. |
| **Guideline 4.2 (Minimum Functionality)** | Verified | 100% self-contained offline Capacitor `www/` bundle (no remote `server.url`), native haptics, real SQLite v2 persistence (including `level_undo_history`), custom pouring physics & SVG liquid arcs, 6 talking cats, 4-section procedural Web Audio soundtrack, 60-day Daily Brew, and Endless Alchemy. |
| **Guideline 4.3 (Design Differentiation)** | Verified | Distinct "Sunlit Lavender & Porcelain Apothecary" visual system (`#F3EEFF` / `#7C3AED` / `#0D9488`, Twilight Crystal `#151126` Dark Mode, glowing crystal vials & cat-ear corks) completely differentiated from sibling apps. |
| **Guideline 5.1.1 & 5.1.2 (Privacy & ATT)** | Verified | ATT prompt, AdMob init, and UMP consent orchestrated safely in `core-engine/js/ad-manager.js`. On-device local-only SQLite privacy notice visible in the Cats tab; responsive bilingual `privacy-policy.html` & `support.html` included. |
| **AdMob Placement Policy** | Verified | Fixed 78px Play banner with strict 16px safe buffer below toolbar; zero ads on launch splash or Victory Sheet; interstitials strictly between completed shelves; rewarded `+1 Empty Flask` and `+1 Smart Hint` are 100% opt-in with transparent confirmation sheets. |

---

## 3. Contact Details for App Store Connect Review Form

Fill these fields in App Store Connect → **App Review Information → Contact Information**:
- **First Name / Last Name:** Erdem *(add legal surname in App Store Connect)*
- **Phone Number:** *(enter active developer phone number)*
- **Email Address:** `erdem@skyhancloud.com`
