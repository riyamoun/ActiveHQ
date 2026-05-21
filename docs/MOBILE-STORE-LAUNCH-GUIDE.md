# ActiveHQ — Play Store & App Store Launch Guide

Your app is a **React PWA** on `activehq.fit`. Store listing uses **Capacitor**: the same web app runs inside native Android/iOS shells (required by Google and Apple).

---

## Overview

| Store | Account cost | Review time | What you submit |
|-------|--------------|-------------|-----------------|
| **Google Play** | $25 one-time (Developer account) | 1–7 days (often 1–3) | AAB file + listing + privacy policy URL |
| **Apple App Store** | $99/year (Apple Developer Program) | 1–3 days (can be longer) | IPA via Xcode + listing + privacy policy URL |

**Code in this repo:** `frontend/` Capacitor (`android/`, `ios/`), build with `npm run build:mobile` then `npm run mobile:sync`.

---

## Phase 0 — Prerequisites (do first)

### Accounts
1. [Google Play Console](https://play.google.com/console) — pay $25, verify identity.
2. [Apple Developer](https://developer.apple.com/programs/) — enroll as **Organization** or **Individual** ($99/year).

### Legal URLs (must be public)
- Privacy: `https://activehq.fit/privacy`
- Terms: `https://activehq.fit/terms`
- Support email: e.g. `support@activehq.fit` (use a real inbox)

### Brand assets
Run from `frontend/`:

```bash
npm run generate:icons
```

See `store-assets/README.md` for screenshot sizes and App Store 1024×1024 icon.

### Machines
- **Android:** Windows/Mac/Linux + [Android Studio](https://developer.android.com/studio)
- **iOS:** **Mac with Xcode** (required; cannot build IPA on Windows alone)

---

## Phase 1 — Prepare the mobile build (developers)

```bash
cd frontend
npm install
cp .env.mobile.example .env.mobile   # edit API URL if needed
npm run generate:icons
npm run mobile:sync
```

| Script | Purpose |
|--------|---------|
| `npm run build:mobile` | Production web build with API URL for native |
| `npm run mobile:sync` | Build + copy `dist/` into Android/iOS projects |
| `npm run mobile:android` | Open Android Studio |
| `npm run mobile:ios` | Open Xcode (Mac only) |

**App ID (bundle):** `com.activehq.app` — set in `capacitor.config.ts`; change only before first store upload.

---

## Phase 2 — Google Play Store

### 2.1 Create the app
1. Play Console → **Create app**
2. Name: **ActiveHQ**
3. Default language: English (India) or English (US)
4. App / Game: **App**
5. Free or paid: **Free** (subscriptions can be added later)

### 2.2 Store listing
- **Short description** (80 chars): Gym management + AI coach for Indian gyms.
- **Full description** (4000 chars): Use marketing copy from website; mention members, payments, UPI, biometric, WhatsApp.
- **App icon:** 512×512 PNG (`store-assets/play-store-icon-512.png` after generate)
- **Feature graphic:** 1024×500 PNG
- **Screenshots:** min 2 phone (1080×1920 or similar); add 7" tablet if possible
- **Category:** Business or Health & Fitness
- **Contact:** website `https://activehq.fit`, email support

### 2.3 Policy & compliance
- **Privacy policy URL:** `https://activehq.fit/privacy`
- **Data safety form:** declare name, phone, email, payment info, photos (member profiles), attendance — collected for gym operations, not sold.
- **Target audience:** not primarily children → 18+ / business app
- **News app / COVID declarations:** No, unless applicable

### 2.4 Build release AAB (Android App Bundle)

#### One-time: create the upload keystore

```bash
cd frontend/android
keytool -genkey -v -keystore activehq-upload.jks -alias activehq -keyalg RSA -keysize 2048 -validity 10000
cp keystore.properties.example keystore.properties
# Edit keystore.properties with your password / alias
```

The keystore and `keystore.properties` are git-ignored. **Back up `activehq-upload.jks` somewhere safe** — losing it means you can never publish updates with the same package name.

#### Build

In Android Studio (after `npm run mobile:android`):

1. **Build → Generate Signed Bundle / APK** → **Android App Bundle**
2. Select the keystore you just created
3. Build **release** variant
4. Output: `android/app/release/app-release.aab`

Or CLI (uses `keystore.properties` automatically):

```bash
cd frontend/android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

### 2.5 Upload & rollout
1. Play Console → **Production** (or **Internal testing** first)
2. Create release → upload AAB
3. Complete all checklist items (content rating questionnaire, etc.)
4. **Internal testing** → add your Gmail → install → smoke test login, members, dashboard
5. Promote to **Production**

### 2.6 Updates later
```bash
npm run mobile:sync
# bump versionCode + versionName in android/app/build.gradle
# build new AAB → upload new release
```

---

## Phase 3 — Apple App Store

### 3.1 App Store Connect
1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** New App
2. Platform: iOS
3. Name: **ActiveHQ**
4. Bundle ID: `com.activehq.app` (must match Xcode / Capacitor)
5. SKU: e.g. `activehq-ios-001`

### 3.2 Certificates & signing (Mac + Xcode)
1. Apple Developer → **Identifiers** → App IDs → confirm `com.activehq.app`
2. Xcode → open `frontend/ios/App/App.xcworkspace`
3. **Signing & Capabilities** → Team = your Apple Developer team → Automatic signing
4. Set **Version** (marketing) and **Build** (integer) in target settings

### 3.3 Archive & upload
1. Select **Any iOS Device (arm64)** (not simulator)
2. **Product → Archive**
3. **Distribute App** → App Store Connect → Upload
4. Wait for processing in App Store Connect (10–30 min)

### 3.4 App Store listing
- **Subtitle** (30 chars)
- **Description**, **keywords**, **support URL**, **marketing URL**
- **Privacy Policy URL:** `https://activehq.fit/privacy`
- **Screenshots:** 6.7", 6.5", 5.5" iPhone sizes (see `store-assets/README.md`)
- **App icon:** 1024×1024 PNG, no transparency
- **Age rating:** questionnaire in Connect
- **App Review notes:** demo login for reviewer (see below)

### 3.5 App Review — provide test account
Apple requires working login. In **App Review Information**:

```
Demo gym owner:
Email: owner@fitzonegym.com
Password: Owner@123

(Or create a dedicated reviewer gym and paste credentials here.)
```

Explain: B2B gym management SaaS; biometric requires physical hardware at gym.

### 3.6 Common Apple rejections (avoid)
| Issue | Fix |
|-------|-----|
| 4.2 Minimum functionality | App must work logged in; not a broken web wrapper |
| Login required with no demo | Provide reviewer credentials |
| Missing privacy policy | Link `/privacy` |
| Crashes on launch | Test release build on real device |
| Placeholder screenshots | Use real UI screenshots |

### 3.7 Updates later
```bash
npm run mobile:sync
# bump CFBundleShortVersionString / CFBundleVersion in Xcode
# Archive → Upload
```

---

## Phase 4 — Backend & CORS for mobile

Native app calls your API (e.g. `https://activehq-api.onrender.com`). On Render, set:

```
CORS_ORIGINS_STR=https://activehq.fit,https://www.activehq.fit,https://active-hq.vercel.app,capacitor://localhost,https://localhost,http://localhost
```

These are the WebView origins:

| Platform | Origin |
|----------|--------|
| iOS (Capacitor) | `capacitor://localhost` |
| Android (Capacitor 6) | `https://localhost` |
| Android dev with cleartext | `http://localhost` (rarely needed) |

If API calls fail only in the app, run `adb logcat` (Android) or Safari → Develop → iPhone (iOS) and add the origin shown in the failed preflight to CORS.

### Reviewer demo account
Before submitting, create a clean reviewer account on production and paste credentials into `docs/STORE-REVIEWER-NOTES.md`.

---

## Phase 5 — Checklist before submit

### Code
- [ ] `npm run build:mobile` succeeds
- [ ] Login, dashboard, members list work on **real Android phone**
- [ ] Same on **real iPhone** (TestFlight internal)
- [ ] Production CORS includes `capacitor://localhost` and `https://localhost`
- [ ] Database migrations applied on production API

### Compliance
- [ ] `/privacy`, `/terms`, `/account/delete` all load publicly
- [ ] In-app account deletion works (Settings → Profile)
- [ ] `frontend/ios/App/App/PrivacyInfo.xcprivacy` present
- [ ] Android `usesCleartextTraffic="false"` (set)
- [ ] Reviewer demo credentials created and tested

### Build & sign
- [ ] Version numbers bumped (`versionCode`/`versionName`, `CURRENT_PROJECT_VERSION`)
- [ ] Signed AAB (Android) using `keystore.properties`
- [ ] Archive (iOS) uploaded to TestFlight
- [ ] Backup of `activehq-upload.jks` stored off-machine

### Store listing
- [ ] App icon 512×512 (Play), 1024×1024 (Apple, no alpha)
- [ ] Feature graphic 1024×500 (Play)
- [ ] Min 2 phone screenshots, 1 tablet (Play); 6.7" / 6.5" / 5.5" (Apple)
- [ ] Reviewer notes from `docs/STORE-REVIEWER-NOTES.md` pasted
- [ ] Support email is monitored
- [ ] Data safety form / Privacy nutrition completed

---

## Timeline (realistic)

| Week | Tasks |
|------|--------|
| 1 | Play + Apple accounts, icons, `mobile:sync`, internal Android test |
| 2 | Play internal → production; Mac: Xcode archive → TestFlight |
| 3 | App Store submit, fix review feedback |
| 4 | Public on both stores; website “Download on App Store / Google Play” badges |

---

## Website badges (after approval)

Add store links to `HomePage` / footer when URLs exist:

- Play: `https://play.google.com/store/apps/details?id=com.activehq.app`
- App Store: `https://apps.apple.com/app/idXXXXXXXXX` (ID from Connect after create)

---

## Help

- Capacitor docs: https://capacitorjs.com/docs
- Play policy: https://play.google.com/about/developer-content-policy/
- App Review guidelines: https://developer.apple.com/app-store/review/guidelines/

*Bundle ID: `com.activehq.app` · Web: `https://activehq.fit`*
