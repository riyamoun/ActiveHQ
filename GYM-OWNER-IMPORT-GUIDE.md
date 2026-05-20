# Gym Owner Import Guide — ActiveHQ

This guide is for **owners and managers** moving members, memberships, and biometric attendance from another gym app (GymSoft, AdviceFit, eTimeTrack, Excel exports, etc.). You do **not** need technical skills.

Use **Settings → Import Data** in ActiveHQ (not the small “bulk upload” on the Members page — that only adds name and phone).

---

## Before you start

1. **Export CSV** from your old software’s portal (Members, Memberships, Payments, Attendance if available).
2. Open files in Excel or Google Sheets once — fix obvious broken phones and dates.
3. **Run database migrations** on your server (your tech person or Render deploy): `alembic upgrade head`.
4. Plan **one evening** for import + **next day** for biometric enrollment on the physical device.

---

## Import order (follow this every time)

| Step | What | Why |
|------|------|-----|
| 1 | **Plans** (optional) | ActiveHQ can create plans from membership dates, but importing plans first avoids duplicate plan names. |
| 2 | **Members** | Everything else links by phone or old software ID. |
| 3 | **Memberships** | Needs members to exist first. |
| 4 | **Payments** | Historical money records (optional). |
| 5 | **Attendance** | Needs **Device User ID** on each member (see biometric section). |
| 6 | **Verify** | Check totals and biometric device status. |

---

## Step 1 — Members CSV

### Required columns

| Your export might say | ActiveHQ uses | Rule |
|----------------------|---------------|------|
| Name, Member Name | `name` | Required |
| Phone, Mobile | `phone` | Required — 10-digit Indian mobile |

### Strongly recommended

| Column aliases we accept | Stored as | Why |
|--------------------------|-----------|-----|
| Old ID, Member ID, Legacy ID, Source ID | **external_id** | Same person on **re-import** from the portal — turn on **Update existing members** |
| Code, Device User ID, Face ID, User ID, Biometric ID | **member_code** | Must match the number on your **eSSL device** after face enroll |
| Email | email | Optional |
| Join Date | joined_date | `YYYY-MM-DD` or `DD/MM/YYYY` |
| City, State, Pincode | address fields | Optional |
| Alternate Phone, Phone2 | alternate_phone | Optional |
| Source System, Software | source_system | e.g. `GymSoft`, `AdviceFit` |
| Package, Plan, Membership Type | plan_name | If start/end dates are in the same row, membership is created too |
| Start Date, End Date | membership dates | Both needed to auto-create a membership |
| Price, Amount | membership amount | Optional |
| Photo URL | photo_url | URL only (not login-page screenshots) |

### Any other columns

Columns we do not recognize are saved in **import_metadata** (nothing is thrown away). You can view them on the member profile after import.

### Example members CSV

```csv
name,phone,external_id,code,email,city,package,start_date,end_date,price,source_system
Rajesh Kumar,9876543210,AD1001,4,rajesh@email.com,Mumbai,Monthly,2026-03-01,2026-03-31,1500,GymSoft
Priya Sharma,9123456789,AD1002,5,,Delhi,Monthly,2026-03-01,2026-03-31,1500,GymSoft
```

### Re-importing from the portal (second export)

1. Upload the new CSV on the **Members** step.
2. Turn on **Update existing members**.
3. Click **Review import** — you should see **update** (not skip) for rows that match `external_id` or phone.
4. Confirm import.

Empty cells in the new file **do not erase** data you already have.

---

## Step 2 — Memberships CSV

### Required

| Column | Rule |
|--------|------|
| member_phone | Must match an imported member |
| plan_name | e.g. Monthly, Gold 12 Month |
| start_date, end_date | End must be on or after start |
| amount_total | Package price |

### Recommended

| Column | Purpose |
|--------|---------|
| import_ref, membership_id, subscription_id, invoice_id | Old system ID — **prevents importing the same membership twice** |
| member_external_id, external_id | Use when phone changed in old software but ID stayed the same |
| amount_paid | Balance tracking |
| status | active / expired / paused / cancelled |
| renewal_date, freeze_start, freeze_end | Paused / medical leave |
| payment_method | CASH, UPI, CARD, etc. |

### Example memberships CSV

```csv
member_phone,external_id,plan_name,start_date,end_date,amount_total,amount_paid,import_ref,status
9876543210,AD1001,Monthly,2026-03-01,2026-03-31,1500,1500,SUB-8821,active
```

**Tip:** If your export is only a member list **without** start/end dates, import it on the **Members** step, not Memberships.

---

## Step 3 — Payments & attendance (optional)

**Payments:** need `date`, `phone`, `amount`. Import members first.

**Attendance:** need `person_identifier` (same as Device User ID / member code) and `timestamp`. Import members and set codes first, or map device users in **Settings → Biometric**.

---

## Biometric (face) — critical for owners

ActiveHQ **does not** copy face photos from your old software or from the member profile picture. Faces must be enrolled **on the eSSL device** in your gym.

### What you must do

1. **Settings → Biometric (eSSL)** — register device, copy agent token, run the agent on a **PC on the same Wi‑Fi** as the device.
2. For each member, set **Device User ID** on the member profile (or in CSV as `code` / `device_user_id`). It must match the **User ID on the device screen** (e.g. `4`).
3. On the **device**, enroll each member’s face (device menu — not ActiveHQ).
4. Run the **biometric agent** so punches reach ActiveHQ.

### After import

| Status on profile | Meaning |
|-------------------|---------|
| Biometric linked | ID is mapped; punches can match this member |
| Biometric not linked | Set Device User ID and enroll on device |

### If attendance does not show

- Agent running on gym LAN?
- Device User ID on member = ID on device?
- Face enrolled on device (not only photo in ActiveHQ)?
- Check **Verify** step → “Unmapped device users” / conflicts.

### Common mistakes

| Mistake | Result |
|---------|--------|
| Only uploaded profile photo | Device will not recognize them |
| Wrong User ID | Punch appears as “unknown member” |
| No agent on LAN | Device works locally but ActiveHQ sees nothing |
| Import attendance before setting codes | Rows skipped as unknown |

---

## Using the Import Data wizard

1. Go to **Settings → Import Data**.
2. Select step: Members → Plans → Memberships → …
3. Upload CSV (UTF-8, comma-separated).
4. Read any **yellow warning** (wrong file for this step).
5. For members: optionally enable **Update existing members**.
6. Click **Review import** — check create / update / skip / error per row.
7. Click **Confirm import** only when errors are acceptable.
8. Finish with **Verify** — compare member counts and biometric conflicts.

---

## Checklist before go-live

- [ ] Phones are 10 digits (no country code, or we strip `91`)
- [ ] No duplicate phones in the same CSV
- [ ] Membership `end_date` ≥ `start_date`
- [ ] `external_id` filled if you will re-export from old portal
- [ ] `code` / Device User ID filled for members who use biometric
- [ ] Plans/memberships imported in order
- [ ] Faces enrolled on **device** after import
- [ ] Biometric agent shows recent events on **Verify** step
- [ ] Spot-check 3 members: profile, membership dates, test punch

---

## Quick FAQ

**Can I import without email?**  
Yes. Phone + name are enough.

**Same member imported twice by mistake?**  
Use `external_id` and **Update existing members**, or we skip duplicate phones.

**Old software only gives a login portal, not a full export?**  
Export whatever screens allow (members, subscriptions, invoices). Put odd columns in the CSV anyway — we store unmapped fields in `import_metadata`.

**Member paid but membership shows due?**  
Re-import payment history on the Payments step, or record payment manually.

**Paused / medical leave?**  
Use membership `status` = paused and optional freeze start/end columns.

**Who can import?**  
Owner or Manager.

---

## Need help?

1. Use **Review import** — every problem row is listed with a reason.  
2. Share the first 5 error lines with support.  
3. Technical API details: `ENHANCED-DATA-IMPORT-GUIDE.md`.

---

*Last updated: May 2026 — includes `external_id`, update-on-reimport, and biometric Device User ID workflow.*
