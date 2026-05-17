# ActiveHQ First Gym Operating Pipeline

Use this as the standard cutover workflow for Bodyline and the next 6 gyms.

## 1. Pre-Onboarding Checklist

- Backend is paid/non-sleeping and healthy: `/health` and `/health/ready`.
- Vercel frontend points to the correct backend with `VITE_API_URL`.
- Render CORS includes `https://www.activehq.fit` and `https://activehq.fit`.
- Owner account exists and can log in on mobile and desktop.
- Do not promise trainer marketplace, advanced accounting, or full AdviceFit parity yet.

## 2. Migration Pipeline

Always import in this order.

1. Members
   - Use the old software member export.
   - Supported common headers include `Name`, `Member`, `Member Name`, `Phone`, `Mobile`, `Code`, `Email`, `Gender`, `Join Date`.

2. Memberships
   - If the member export contains package dates, upload the same file again in the Memberships step.
   - Supported common headers include `Phone`, `Package`, `Plan`, `Start Date`, `End Date`, `Price`, `Package Status`.
   - Missing plans are auto-created from membership rows.

3. Payments
   - Upload payment history after members exist.
   - Supported common headers include `Date`, `Member`, `Phone`, `Amount`, `Method`, `Invoice`, `Received By`.
   - Historical payment import must not send receipts.

4. Attendance
   - Import only after member codes/device ids are mapped.
   - Use `member_code` or device user id as the person identifier.

5. Verify
   - Check total members, active memberships, payments, and total revenue.
   - Spot-check 10 members manually against the old software.

## 3. Biometric Pipeline

1. Install the biometric agent at the gym PC/device network.
2. Register the device in ActiveHQ.
3. Map device user ids to ActiveHQ members.
4. Run a small live test:
   - one member check-in
   - one duplicate punch
   - one unmapped punch
5. Only after the test passes, turn on routine attendance sync.

## 4. WhatsApp, SMS, And Email Automation

The daily cron endpoint runs:

- renewal reminders for memberships expiring in the next 7 days
- payment follow-ups for pending dues
- inactivity nudges for members absent for 7+ days

Safety rules:

- Default campaigns are created automatically if a gym has no campaigns yet.
- A member is not messaged twice for the same notification type on the same day.
- If Picky Assist is configured, ActiveHQ tries WhatsApp first and SMS fallback.
- If Picky Assist is not configured but SMTP is configured, ActiveHQ sends email when the member has an email.
- If neither provider is configured, use the manual reminder list.

Render Cron:

```text
GET https://activehq.onrender.com/api/v1/automation/run-cron?secret=<CRON_SECRET>
```

Suggested schedule:

```text
Every day at 9:00 AM IST
```

## 5. Payment Receipt Pipeline

When a new payment is recorded manually:

- ActiveHQ records the payment first.
- Then it tries to send a receipt by WhatsApp/SMS or email.
- Receipt sending is best-effort and must never block payment collection.
- Historical payment import does not send receipts.

## 6. Day-One Gym Owner Workflow

Train the owner/staff on only these actions:

1. Add member
2. Create or renew membership
3. Record payment
4. Mark attendance
5. Check expired/expiring/dues list

Do not train all screens on day one. Keep the first session focused.

## 7. Cutover Quality Bar

Before telling the gym to use ActiveHQ daily:

- All members imported.
- Active memberships imported.
- Payment totals are close to the old system for the checked period.
- Expired list does not show active members.
- At least 10 member records are manually verified.
- One real payment receipt is tested with your own number/email.
- One real attendance event is tested.

## 8. Why A Gym Should Switch Now

For the first 6 gyms, the pitch is not feature parity.

The pitch is:

- done-for-you migration
- local founder support
- simpler owner workflow
- WhatsApp-first follow-up
- reliable member, payment, and attendance operations
- fast fixes based on their actual usage
