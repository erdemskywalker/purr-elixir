# App Store Connect — App Privacy ("Nutrition Label") Guide

- **App Name:** Purr Elixir: Cat Potion Sort
- **Bundle ID:** `com.erdem.purrelixir`
- **SQLite Database (Local-Only):** `purr_elixir_db`
- **Privacy Policy URL:** `https://gaming.skyhancloud.com/purr-elixir/privacy` *(alias: `https://gaming.skyhancloud.com/purr-elixir/privacy-policy.html`)*
- **Support URL:** `https://gaming.skyhancloud.com/purr-elixir/support` *(alias: `https://gaming.skyhancloud.com/purr-elixir/support.html`)*
- **Last Audited:** 2026-11-26

---

## 1. Executive Summary (First-Party vs. Third-Party SDK)

1. **First-Party App Data (Purr Elixir):** Collects **zero** personal data. All 120 crystal potion levels, active bottle states, persisted undo history, star ratings, unlocked visitor cats, daily brew streaks, endless runs, and accessibility/audio preferences live strictly inside your device's local SQLite database (`purr_elixir_db`) and are never transmitted to any developer server.
2. **Third-Party SDK Data (Google Mobile Ads / AdMob):** Because `@capacitor-community/admob` (Google Mobile Ads SDK) is embedded to display Banner, Inline, graduated Interstitial, and opt-in Rewarded Interstitial ads (`+1 Empty Flask` / `+1 Smart Hint`), Apple requires declaring the data categories collected by the Google Mobile Ads SDK.

Therefore, in App Store Connect → **App Privacy → Get Started**, select:
> **"Yes, we collect data from this app"** *(specifically via third-party advertising SDK: Google AdMob)*.

---

## 2. Exact App Store Connect Checkboxes to Select

### Step A — Select Data Types

Check **ONLY** the following 4 groups (leave Contact Info, Health & Fitness, Financial Info, Sensitive Info, Contacts, User Content, Browsing History, Search History, Purchases, and Precise Location **UNCHECKED**):

| Category | Specific Data Type | Check? | Source |
| :--- | :--- | :---: | :--- |
| **Location** | **Coarse Location** *(approximate IP-based region)* | **YES** | Google AdMob SDK |
| **Identifiers** | **Device ID** *(IDFA if ATT granted; IDFV / app-set ID)* | **YES** | Google AdMob SDK |
| **Usage Data** | **Product Interaction** *(ad impressions, ad taps, SDK launches)* | **YES** | Google AdMob SDK |
| **Usage Data** | **Advertising Data** *(ad views, clicks, and conversion attribution)* | **YES** | Google AdMob SDK |
| **Diagnostics** | **Crash Data** | **YES** | Google AdMob SDK |
| **Diagnostics** | **Performance Data** *(ad load latency & stability metrics)* | **YES** | Google AdMob SDK |
| **Diagnostics** | **Other Diagnostic Data** *(SDK technical diagnostics)* | **YES** | Google AdMob SDK |

---

### Step B — Configure Each Selected Data Type

Use the exact table below for the three follow-up screens on every checked data type:

| Data Type | Purposes (Select All Listed) | Linked to User's Identity? | Used for Tracking? |
| :--- | :--- | :---: | :---: |
| **Coarse Location** | • Third-Party Advertising<br>• Analytics<br>• App Functionality *(fraud prevention)* | **No** | **No** *(standard non-linked IP region for ad serving & fraud prevention)* |
| **Device ID** | • Third-Party Advertising<br>• Analytics<br>• Developer's Advertising or Marketing | **No** | **Yes** *(when user grants iOS ATT permission for IDFA)* |
| **Product Interaction** | • Third-Party Advertising<br>• Analytics | **No** | **No** |
| **Advertising Data** | • Third-Party Advertising<br>• Analytics | **No** | **Yes** *(ad attribution / personalized ad delivery when ATT granted)* |
| **Crash Data** | • Analytics<br>• App Functionality | **No** | **No** |
| **Performance Data** | • Analytics<br>• App Functionality | **No** | **No** |
| **Other Diagnostic Data** | • Analytics<br>• App Functionality | **No** | **No** |

> [!IMPORTANT]
> **Why "Linked to User's Identity" is `No`:** Purr Elixir has zero user accounts, logins, emails, or cloud profiles. Neither the app nor the developer links AdMob telemetry to any user identity.
> **Why "Used for Tracking" is `Yes` on `Device ID` & `Advertising Data`:** Because the app declares `NSUserTrackingUsageDescription` (ATT) and requests optional permission to access IDFA for personalized AdMob delivery and SKAdNetwork attribution. Apple **rejects** builds that include an ATT prompt while declaring zero tracking data types, or vice versa.

---

## 3. Resulting Public App Store Privacy Summary

Once published, users viewing Purr Elixir on the App Store will see two transparent cards:

1. **Data Used to Track You**
   - Identifiers (`Device ID`)
   - Usage Data (`Advertising Data`)
2. **Data Not Linked to You**
   - Location (`Coarse Location`)
   - Identifiers (`Device ID`)
   - Usage Data (`Product Interaction`, `Advertising Data`)
   - Diagnostics (`Crash Data`, `Performance Data`, `Other Diagnostic Data`)

---

## 4. Reference Compliance Notes

- **ATT & UMP Sequence (`core-engine/js/ad-manager.js`):** On native iOS production launch, `AdManager.requestConsentIfNeeded()` checks `AdMob.trackingAuthorizationStatus()` and prompts `AdMob.requestTrackingAuthorization()` only when `notDetermined`, initializes `AdMob.initialize()`, and then requests Google UMP consent (`requestConsentInfo()` / `showConsentForm()`) for EEA/UK users—each wrapped in isolated `try/catch` guards so declining or playing offline never blocks gameplay.
- **Non-Personalized Fallback:** If a player taps **"Ask App Not to Track"** in iOS ATT or declines personalized ads in UMP, IDFA is never accessed and AdMob serves only non-personalized/contextual ads (or a clean local House Ad card when offline/no-fill).
- **Local-Only Reset:** Players can wipe all local game progress anytime via **Cats Tab → Reset All Progress** (which clears `level_progress`, `level_undo_history`, `daily_completions`, `endless_runs`, and progress counters in `purr_elixir_db` while preserving display/audio preferences), or delete all data completely by uninstalling the app.
- **Privacy Manifest (`PrivacyInfo.xcprivacy`):** Ensure Google Mobile Ads SDK (`>= 11.x`) pulled via CocoaPods/SPM bundles Google's official `PrivacyInfo.xcprivacy` during `npx cap sync ios` and Xcode Archive.
