# Store reviewer notes (paste into Apple + Google forms)

When uploading the build, you'll be asked for **reviewer notes** and **demo credentials**.
Use the text below verbatim — adjust only the demo account details.

---

## Demo account (create on staging or production)

```
Owner:
  Email:    reviewer@activehq.fit
  Password: Reviewer@123
  Gym:      "ActiveHQ Reviewer Gym" (seed data only)

Optional member portal (for member side):
  Phone:    9999900001
  OTP:      999999 (override if app review reviewer flag is enabled)
```

> Make sure this account is **active** and not in a paused / trial-expired state on review day. If credentials change, update the listing too — Apple will reject after one failed login.

---

## Reviewer-facing description (paste into both stores)

> ActiveHQ is a **B2B gym management** app for Indian gym owners, managers, and staff. After login the app surfaces:
>
> - Member management (add, search, profile, photo)
> - Memberships and renewals
> - Payments and daily collection
> - Attendance + biometric device dashboard
> - AI coach (BMI / macros)
> - Reports
>
> **Biometric note:** The app does **not** capture faces or fingerprints from the phone. Biometric attendance comes from a physical eSSL device installed on the gym's LAN; the app only displays the resulting attendance and lets owners map device user IDs to members. No camera or biometric API is invoked on the device for authentication.
>
> **No in-app purchases.** Subscriptions are billed B2B outside the app. Pricing details are available at activehq.fit/pricing.
>
> **Account deletion:** Available in-app under Settings → Profile → Delete account, and publicly at https://activehq.fit/account/delete.
>
> Privacy policy: https://activehq.fit/privacy
> Terms: https://activehq.fit/terms

---

## Google Play — Data safety form

| Data type | Collected | Shared | Required | Purpose |
|-----------|-----------|--------|----------|---------|
| Name | Yes | No | Yes | Account, App functionality |
| Email | Yes | No | Yes | Account, Communication |
| Phone | Yes | No | Yes | Account, Communication |
| Address (member, optional) | Yes | No | No | App functionality |
| Photos (member profile, optional) | Yes | No | No | App functionality |
| Payment info (amount + method only) | Yes | No | No | App functionality |
| Crash logs | Yes | No | No | Analytics, Fix bugs |
| App interactions | Yes | No | No | Analytics |

- **Encrypted in transit?** Yes
- **Can users request deletion?** Yes — link to `/account/delete`
- **Does the app follow the Families Policy?** No (business app, 18+)
- **Independent security review?** No
- **Are users notified of changes to data-handling practices?** Yes

---

## Apple — App Privacy nutrition

Same structure as the Play form. The bundled `PrivacyInfo.xcprivacy` already
declares the same data types — keep this table in App Store Connect aligned.

Notable answers:

- **Track users across other apps / websites?** No
- **Used for advertising / marketing?** No
- **Third-party SDKs that access tracked APIs?** None (no analytics SDKs that
  use IDFA; Sentry runs only in JS).

---

## Apple App Review — common rejection avoidance

| Guideline | Our compliance |
|-----------|----------------|
| 2.1 App completeness | Real backend, real login, real data |
| 2.3.10 Mention of other platforms | Marketing copy mentions Android only on activehq.fit, not in the iOS listing |
| 4.0 Minimum functionality | Multiple business workflows beyond a static web wrapper |
| 4.2 Sign-in required | Demo credentials provided above |
| 5.1.1(v) Account deletion | In-app + `/account/delete` public page |
| 5.1.2 Privacy / data use | Privacy manifest + permissions strings included |

---

## Google Play — common rejection avoidance

| Policy | Our compliance |
|--------|----------------|
| User data | Privacy policy URL + data safety form |
| Permissions | INTERNET only by default; camera/photos requested only on tap |
| Sensitive permissions | No background location, SMS, contacts, accessibility |
| Account deletion (2024 policy) | In-app + public URL |
| Spam / minimum functionality | Business app with full backend |
| Target API level | `compileSdk` / `targetSdk` from Capacitor 6 (API 34+) |

---

## Build numbers checklist (every release)

- **Android** — bump `versionCode` (integer) + `versionName` in `frontend/android/app/build.gradle`.
- **iOS** — bump `MARKETING_VERSION` + `CURRENT_PROJECT_VERSION` in Xcode target settings.
- Tag git: `git tag v1.0.0` (or use `npm version`).

---

## What to do if a review is rejected

1. Read the resolution centre message carefully — Apple includes screenshots.
2. Reproduce the issue using the exact build the reviewer downloaded.
3. Reply in the same thread with steps you took.
4. Rebuild only if needed; if the issue is metadata-only, fix on the listing and resubmit.
