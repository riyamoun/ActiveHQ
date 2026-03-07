# Onboarding First Gym (e.g. Advice Fit) — 3-Day Checklist

**Domain:** activehq.fit (GoDaddy + professional email)  
**API:** https://activehq-api.onrender.com  
**Frontend:** Vercel → point activehq.fit to Vercel when ready  
**WhatsApp:** Interakt (India). **SMS fallback:** Twilio (optional). **Number:** 9958040484

---

## 1. Domain (activehq.fit)

- **GoDaddy:** You have the domain and professional email.
- **Frontend (Vercel):**
  - In Vercel project **active-hq** → Settings → Domains → Add **activehq.fit** and **www.activehq.fit**.
  - In GoDaddy DNS for activehq.fit, add the CNAME/A records Vercel shows (usually CNAME for `www` to `cname.vercel-dns.com`, and A for root if needed).
- **API (optional subdomain):** If you want **api.activehq.fit** → point it to Render (CNAME to your Render service hostname, e.g. `activehq-api.onrender.com`). Then set **VITE_API_URL** to `https://api.activehq.fit` on Vercel.

---

## 2. WhatsApp (Interakt) + optional SMS fallback

**Sender number:** 9958040484 (your number on Interakt)

### Interakt setup (primary)

1. **Account:** [Interakt](https://www.interakt.shop/) → sign up / log in. Get your number (e.g. 9958040484) approved for WhatsApp Business.
2. **API Key:** [Developer Settings](https://app.interakt.ai/settings/developer-setting) → copy API Key.
3. **Templates:** Create two templates in Interakt (templates list). **Variable order must match** ({{1}}, {{2}}, {{3}}):
   - **Renewal reminder** — body e.g. `Hello {{1}}, your membership expires in {{2}} days on {{3}}. Please renew at the gym.`  
     → Values we send: [member_name, days_until_expiry, end_date]. Note the **code name** (URL: `template/<codename>/view`).
   - **Payment due** — body e.g. `Hi {{1}}, pending amount Rs {{2}}. Due by {{3}}. Please clear at the gym.`  
     → Values we send: [member_name, amount_due, end_date]. Note code name.
4. **Env vars on Render** (activehq-api → Environment):
   - `INTERAKT_API_KEY` = your API Key
   - `INTERAKT_COUNTRY_CODE` = `+91`
   - `INTERAKT_TEMPLATE_RENEWAL` = renewal template code name
   - `INTERAKT_TEMPLATE_PAYMENT_DUE` = payment-due template code name
5. **Optional SMS fallback (Twilio):** If you want SMS when WhatsApp fails, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and a Twilio “from” number.

### Campaigns in the app

1. Log in to the dashboard (as Owner/Manager).
2. **Automation / Campaigns:** Create campaigns:
   - **Renewal reminder:** trigger = Renewal Reminder, template e.g.  
     `Hello {{member_name}}, your membership expires in {{days_until_expiry}} days ({{end_date}}). Please renew at the gym. - Advice Fit`
   - **Payment follow-up:** trigger = Payment Follow-up, template e.g.  
     `Hi {{member_name}}, pending amount Rs {{amount_due}}. Please clear at the gym. - Advice Fit`
3. **Cron (daily run):** On Render, add a **Cron Job** (or use [cron-job.org](https://cron-job.org)) that calls once per day:
   - `GET https://activehq-api.onrender.com/api/v1/automation/run-cron?secret=<CRON_SECRET>`
   - Set `CRON_SECRET` in Render env and use the same value in the URL.

---

## 3. Biometric (Clean Flow)

- **Devices:** In dashboard, add each biometric device (name, vendor e.g. ESSL/Generic, external device ID, location).
- **Member code:** Each member has a **member_code**. The device must send this as `person_identifier` so we can match punches to the member.
- **Ingest API:** Device (or your middleware) sends events to:
  - `POST /api/v1/biometric/events/ingest`  
  - Body: `{ "external_device_id": "<same as registered>", "events": [ { "external_event_id": "unique-id", "person_identifier": "<member_code>", "event_time": "2025-01-30T09:15:00Z", "event_type": "check_in" } ] }`
- **Flow:** We dedupe by `(gym, device, external_event_id)`, resolve member by `member_code`, then create check-in or check-out in `attendance`. Conflicts (unknown member, checkout without open session) are logged in `biometric_events`.

**For Advice Fit:** Register the device(s), ensure every member has a correct `member_code`, and point the device/middleware to the ingest URL with a valid API token (Owner/Manager).

---

## 4. First Gym (Advice Fit) in the App

1. **Register gym:** Use **Register** (public) → create gym “Advice Fit” and owner account.
2. **Add plans** (e.g. Monthly, Quarterly, Yearly).
3. **Add members** (name, phone, **member_code** for biometric).
4. **Create memberships** (member + plan + start/end).
5. **Create campaigns** (renewal + payment) as above.
6. **Biometric:** Register device(s), set `member_code` on each member, configure device/middleware to call ingest.

---

## 5. Quick Reference

| Item | Where |
|------|--------|
| API base | https://activehq-api.onrender.com |
| Cron URL | `GET /api/v1/automation/run-cron?secret=<CRON_SECRET>` |
| Biometric ingest | `POST /api/v1/biometric/events/ingest` (auth required) |
| WhatsApp | Interakt (INTERAKT_* env vars). Sender: 9958040484 |
| Domain | activehq.fit → Vercel (+ optional api.activehq.fit → Render) |
