# 📚 Gym Owner's Import & Biometric Guide

## Welcome! 👋

This guide explains the **new import features** in ActiveHQ that make it easier to bring data from your old gym software. No technical knowledge needed!

---

## 🎯 Why These Changes?

### The Problem
- Old gym software exports don't have everything
- Different systems have different fields
- Biometric (face) data wasn't handled properly
- When you paused a member's membership, there was no good way to track it

### The Solution
We've upgraded ActiveHQ to be **flexible** about data import:
- Accept data even if some fields are missing
- Track which system data came from
- Store face/fingerprint data properly
- Support membership freezes (for medical leaves, vacation, etc.)

---

## 📋 What's New for You

### 1. Member Data - More Fields

When importing members, you can now specify:

| Field | Example | What It Means |
|-------|---------|---------------|
| **Name** | Raj Kumar | Member's name (required) |
| **Phone** | 9876543210 | Primary contact (required) |
| **Email** | raj@email.com | Email address (optional) |
| **Alternate Phone** | 9123456789 | Extra phone number (for family/friend) |
| **Source System** | "GymSoft" | Tells ActiveHQ which old software it came from |
| **Enrollment Status** | ACTIVE / NEW / PAUSED | Is member active, new, or paused? |
| **Biometric Status** | True / False | Does member have face/fingerprint enrolled? |
| **Notes** | "Family of 3" | Any special info about the member |
| **Extra Data** | JSON | Any other info from old software (stored safely) |

### 2. Membership Data - Better Tracking

When importing memberships, you can now specify:

| Field | Example | What It Means |
|-------|---------|---------------|
| **Plan Name** | "Gold - 12 Month" | Type of membership plan |
| **Start Date** | 2024-01-01 | When membership started |
| **End Date** | 2025-01-01 | When membership expires |
| **Renewal Date** | 2024-12-15 | When to send renewal reminder (optional) |
| **Freeze Period** | Jan 1 - Mar 31 | When member paused membership (medical leave, etc.) |
| **Amount Total** | ₹12,000 | Full membership price |
| **Amount Paid** | ₹10,000 | What member has paid so far |
| **Discount** | ₹2,000 | Amount discounted (tracked separately) |
| **Payment Method** | CASH / UPI / CARD | How member prefers to pay |
| **Auto Renewal** | Yes / No | Should we remind before expiry? |

### 3. Biometric (Face/Fingerprint) - Better Management

We now store face data **separately** so:
- Same member can be enrolled on **multiple devices** (office + home)
- Each device stores the face template safely
- We track the **quality of enrollment** (how good the face scan was)
- If enrollment fails on one device, you can use another

---

## 💡 Real-World Examples

### Example 1: Importing from GymSoft

**You have:**
- Member list from GymSoft export (has name, phone, membership dates)
- But NO email addresses
- No information about special notes

**ActiveHQ lets you:**
```
Import what you have (name, phone, membership dates)
Leave other fields empty
Add extra notes later as you remember them
```

✅ No problem! Import works fine.

---

### Example 2: Member on Medical Leave

**You have:**
- Raj Kumar's membership was "ACTIVE" from Jan 1 - Dec 31
- But he was on medical leave from Jan 1 - Mar 31

**Old system:** No way to track this. You had to manually manage it.

**ActiveHQ:**
```
Membership fields:
  Start Date: Jan 1, 2024
  End Date: Dec 31, 2024
  Freeze Start: Jan 1, 2024 ← NEW
  Freeze End: Mar 31, 2024 ← NEW
  Status: PAUSED
```

✅ Now ActiveHQ knows he was paused during that period!

---

### Example 3: Face Data on Multiple Devices

**You have:**
- Device A (fingerprint machine at entrance)
- Device B (face camera at gym floor)

**Raj Kumar enrolls on both:**
- Device A stores his fingerprint ID
- Device B stores his face template

**Old system:** Messy, confusing, data duplication.

**ActiveHQ:** 
```
Separate face template storage
Each device has its own record
Same member, different devices
All linked together properly
```

✅ Biometric data stays organized!

---

## 🚀 How to Use (Step by Step)

### Step 1: Prepare Your Data

Export from old software as CSV or JSON:
- Members list (name, phone, etc.)
- Memberships (plan name, dates, amounts)
- Any other details available

**❌ Don't worry if:**
- Some columns are missing
- Data format is different
- Some fields are empty

### Step 2: Login to ActiveHQ

As **Owner** or **Manager**, go to:
```
Dashboard → Import Data
```

### Step 3: Choose What to Import

Options:
- Import Members
- Import Memberships
- Import Payments
- Import Attendance

### Step 4: Map Your Columns

ActiveHQ will ask you to match your columns:
```
Your CSV Column → ActiveHQ Field
"Member Name" → "name"
"Phone Number" → "phone"
"Old Software ID" → "import_metadata" (extra data)
```

### Step 5: Preview & Confirm

ActiveHQ shows:
- ✅ How many records will be imported
- ⚠️ Any warnings or errors
- ❌ Rows that can't be imported (why?)

**You decide:** Import all, or fix errors first?

### Step 6: Biometric Enrollment

After importing:
1. Members get check-in via app/SMS
2. First check-in requires **face/fingerprint scan**
3. ActiveHQ stores face template securely
4. Future visits: automatic recognition!

---

## ❓ Common Questions

### Q: What if a member's phone number is missing?
**A:** ActiveHQ will skip that row and show an error. Phone is required (we use it to find the member).

### Q: Can I import the same member twice?
**A:** No, ActiveHQ prevents duplicates. If same phone exists, it skips that row.

### Q: What if I made a mistake in import?
**A:** Contact support or delete/re-import that member. All data is tracked by `import_ref` (reference number).

### Q: Do I need to re-enroll all members' faces?
**A:** Yes. For security, ActiveHQ captures fresh face data on first check-in after import.

### Q: Can I import partial data and fill in later?
**A:** Yes! Leave fields blank, add details later via dashboard.

### Q: What's "Source System"?
**A:** Which software the data came from (GymSoft, eTimeTrack, etc.). Helps you remember where each record originated.

### Q: What if the freeze period doesn't match my membership dates?
**A:** No problem! You can set:
- Membership valid: Jan 1 - Dec 31
- But paused: Jan 1 - Mar 31
- Automatically tracks freeze periods separately

---

## ✅ Import Checklist

Before importing, verify:

- [ ] Phone numbers are in correct format (10 digits)
- [ ] Dates are formatted as YYYY-MM-DD
- [ ] Amounts are positive numbers
- [ ] No duplicate phone numbers in same file
- [ ] Membership end_date is after start_date
- [ ] Plans already exist in ActiveHQ (import plans first!)

---

## 📊 After Import - What Happens?

### Immediate (Within 1 minute)
✅ All records created in ActiveHQ
✅ Members can log in via app/portal
✅ Staff can see member data in dashboard

### Within 24 hours
✅ System sends SMS/WhatsApp: "Welcome to ActiveHQ"
✅ Members can schedule face enrollment

### First Check-in
✅ Member's face is captured and stored
✅ Future visits: automatic recognition
✅ Attendance is logged

---

## 🔐 Data Security & Privacy

Your data is safe:
- ✅ All data encrypted in database
- ✅ Face templates stored securely (binary, not photos)
- ✅ Only your gym's staff can see member data
- ✅ Audit trail tracks all changes
- ✅ Complies with Indian privacy laws

---

## 📞 Need Help?

If import fails or you have questions:

1. **Check preview errors** - ActiveHQ tells you what's wrong
2. **Read this guide** - Answers common questions
3. **Contact support** - We're here to help!

---

## 🎉 Next Steps

1. Export data from old software
2. Go to "Import Data" in ActiveHQ dashboard
3. Follow the step-by-step wizard
4. Verify imported records
5. Share details with members
6. Enroll biometric data as members check in

**Questions? Let us know!** We're here to make the transition smooth! 😊

---

*For technical staff: See ENHANCED-DATA-IMPORT-GUIDE.md for detailed API documentation.*
