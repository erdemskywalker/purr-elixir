# App Store Connect — App Privacy ("Nutrition Label") Guide

- **App Name:** Fruitopia: Fruit Puzzle
- **Bundle ID:** `com.erdem.fruitopia`
- **Privacy Policy URL:** `https://gaming.skyhancloud.com/fruitopia/privacy` *(alias: `https://gaming.skyhancloud.com/fruitopia/privacy-policy.html`)*
- **Support URL:** `https://gaming.skyhancloud.com/fruitopia/support` *(alias: `https://gaming.skyhancloud.com/fruitopia/support.html`)*
- **Last Audited:** 2026-11-25

---

## 1. Executive Summary (First-Party vs. Third-Party SDK)

1. **First-Party App Data (Fruitopia):** Collects **zero** personal data. All puzzle boards, campaign progress, daily streaks, solve times, and gameplay preferences live strictly in an on-device SQLite database (`fruitopia_db`) and are never transmitted to any developer server.
2. **Third-Party SDK Data (Google Mobile Ads / AdMob):** Because `@capacitor-community/admob` (Google Mobile Ads SDK) is embedded to display Banner, Inline, and optional Rewarded Hint ads, Apple requires declaring the data categories collected by the Google Mobile Ads SDK.

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
| **Usage Data** | **Product Interaction** *(ad taps, views, SDK launches)* | **YES** | Google AdMob SDK |
| **Usage Data** | **Advertising Data** *(ad impressions & ad performance)* | **YES** | Google AdMob SDK |
| **Diagnostics** | **Crash Data** | **YES** | Google AdMob SDK |
| **Diagnostics** | **Performance Data** *(ad load latency, launch metrics)* | **YES** | Google AdMob SDK |
| **Diagnostics** | **Other Diagnostic Data** *(SDK technical diagnostics)* | **YES** | Google AdMob SDK |

---

### Step B — Configure Each Selected Data Type

Use the exact table below for the three follow-up screens on every checked data type:

| Data Type | Purposes (Select All Listed) | Linked to User's Identity? | Used for Tracking? |
| :--- | :--- | :---: | :---: |
| **Coarse Location** | • Third-Party Advertising<br>• Analytics<br>• App Functionality *(fraud prevention)* | **No** | **No** *(or Yes if personalized ads use IP-derived region under AdMob mediation; check No if standard AdMob non-linked coarse geo)* |
| **Device ID** | • Third-Party Advertising<br>• Analytics<br>• Developer's Advertising or Marketing | **No** | **Yes** *(when user grants ATT permission for IDFA)* |
| **Product Interaction** | • Third-Party Advertising<br>• Analytics | **No** | **No** |
| **Advertising Data** | • Third-Party Advertising<br>• Analytics | **No** | **Yes** *(ad attribution / personalized ad delivery when ATT granted)* |
| **Crash Data** | • Analytics<br>• App Functionality | **No** | **No** |
| **Performance Data** | • Analytics<br>• App Functionality | **No** | **No** |
| **Other Diagnostic Data** | • Analytics<br>• App Functionality | **No** | **No** |

> [!IMPORTANT]
> **Why "Linked to User's Identity" is `No`:** Fruitopia has no user accounts, login, email collection, or user profiles. Neither the app nor the developer links AdMob telemetry to a real-world identity.
> **Why "Used for Tracking" is `Yes` on Device ID & Advertising Data:** Because the app includes `NSUserTrackingUsageDescription` (ATT) and requests permission to access IDFA for personalized AdMob advertising and SKAdNetwork attribution. Apple **rejects** apps that include an ATT prompt while declaring zero tracking data types, or vice versa.

---

## 3. Resulting Public App Store Privacy Summary

Once published, users on the App Store will see two transparent cards:

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
- **ATT Enforcement:** `core-engine/js/ad-manager.js` checks `AdMob.trackingAuthorizationStatus()` and invokes `AdMob.requestTrackingAuthorization()` only when status is `notDetermined`, followed by Google UMP consent (`requestConsentInfo()` / `showConsentForm()`) before `AdMob.initialize()`.
- **Non-Personalized Fallback:** If a user taps **"Ask App Not to Track"** in iOS ATT or declines personalized ads in Google UMP, AdMob serves only non-personalized/contextual ads (or local House Ad on no-fill) and IDFA is never accessed.
- **Privacy Manifest (`PrivacyInfo.xcprivacy`):** Ensure Google Mobile Ads SDK (`>= 11.x`) pulled via CocoaPods/SPM includes Google's official `PrivacyInfo.xcprivacy` bundle automatically during `npx cap sync ios` and Xcode Archive.
