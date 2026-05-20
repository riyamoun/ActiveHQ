# 📊 Enhanced Data Import Guide - May 20, 2026

## Overview

ActiveHQ now supports **flexible data import** from any third-party gym software system. The enhanced schema handles:

1. **Incomplete data** - Many systems don't export everything
2. **Different field names** - Map data from different software
3. **Multi-device biometric enrollment** - Handle face data properly
4. **Flexible membership tracking** - Renewal dates, discounts, freeze periods
5. **Data lineage** - Track which system data came from (for reconciliation)

---

## 🎯 Key Enhancements

### 1. Member Model - Flexible Import Support

#### New Fields for Import

```python
# Which system data came from
source_system: str | None  
# Options: "GymSoft", "eTimeTrack", "Fittr", "Manual", "Legacy", etc.
# Helps track data origin and enables multi-system reconciliation

# Alternative contact (many old systems have this)
alternative_phone: str | None

# Better status tracking (not just is_active)
enrollment_status: str  
# NEW, ACTIVE, INACTIVE, PAUSED
# Allows tracking member lifecycle properly

# Track biometric enrollment separately
biometric_enrolled: bool  
# True = has face/fingerprint data on devices
# False = needs to be enrolled

# India-specific: Aadhaar verification
aadhaar_verified: bool
# For compliance and identity verification

# Store extra unmapped fields from source systems
import_metadata: dict | None
# Example: {"old_system_id": "MEM123", "referral_source": "Facebook", ...}

# Track biometric sync status
last_biometric_sync: datetime | None

# Detailed notes
remarks: str | None
# Family groups, special notes, dependencies, etc.
```

#### Example Import

**Source system data** (from GymSoft export):
```json
{
  "name": "Raj Kumar",
  "phone": "9876543210",
  "email": "raj@example.com",
  "source_system": "GymSoft",
  "enrollment_status": "ACTIVE",
  "biometric_enrolled": false,
  "import_metadata": {
    "old_member_id": "GYM123456",
    "referral_source": "Friend",
    "preferred_timeslot": "6-7 AM"
  }
}
```

**API Call**:
```bash
POST /api/v1/migration/import-members
{
  "members": [{
    "name": "Raj Kumar",
    "phone": "9876543210",
    "email": "raj@example.com",
    "source_system": "GymSoft",
    "enrollment_status": "ACTIVE",
    "biometric_enrolled": false,
    "import_metadata": {
      "old_member_id": "GYM123456",
      "referral_source": "Friend"
    }
  }]
}
```

---

### 2. Membership Model - Flexible Renewal & Payment

#### New Fields

```python
# When to renew (different from end_date)
renewal_date: date | None  
# Set this if renewal is before expiry
# Helps track "grace period" or "early renewal" scenarios

# For paused memberships
freeze_start_date: date | None
freeze_end_date: date | None
# When member's membership is temporarily paused
# Used for medical leaves, vacations, etc.

# Separate tracking
discount_amount: Decimal  
# Store discounts separately from amount_total
# Better for reporting and reconciliation

# Payment tracking
payment_method: str | None
# CASH, UPI, CARD, CHEQUE, BANK_TRANSFER
# Track how member prefers to pay

# Automation
auto_renewal: bool  
# Enable automatic renewal reminder
# Triggers WhatsApp/email before expiry

# Link to source system
import_ref: str | None
# "GymSoft-MEM123456-REP1" or similar
# For data reconciliation

# Track reminder status
renewal_reminder_sent_at: datetime | None
```

#### Example Import

**Source system data** (from eTimeTrack):
```json
{
  "member_phone": "9876543210",
  "plan_name": "Gold - 12 Month",
  "start_date": "2024-01-01",
  "end_date": "2025-01-01",
  "amount_total": 12000,
  "amount_paid": 10000,
  "discount_amount": 2000,
  "payment_method": "UPI",
  "auto_renewal": true,
  "import_ref": "eTimeTrack-REP-001-2024"
}
```

**API Call**:
```bash
POST /api/v1/migration/import-memberships
{
  "memberships": [{
    "member_phone": "9876543210",
    "plan_name": "Gold - 12 Month",
    "start_date": "2024-01-01",
    "end_date": "2025-01-01",
    "amount_total": 12000,
    "amount_paid": 10000,
    "discount_amount": 2000,
    "payment_method": "UPI",
    "auto_renewal": true,
    "import_ref": "eTimeTrack-REP-001-2024"
  }]
}
```

---

### 3. Biometric Face Encoding - Proper Face Data Handling

#### New BiometricFaceEncoding Model

Stores face templates separately from events:

```python
gym_id: UUID               # Tenant scoping
member_id: UUID            # Which member
device_id: UUID | None     # Which device (optional)
face_template: bytes       # Binary face data (512-dim vector, JPEG2000, etc.)
face_template_format: str  # "vector_512", "jpeg2000", "arc_face"
enrollment_quality: float  # 0.0 to 1.0 (confidence score)
is_primary: bool          # Primary face for matching
last_verified: datetime   # Last successful match
created_at: datetime
updated_at: datetime
```

#### Why Separate Face Storage?

1. **Multi-device enrollment**: Same member on multiple devices
2. **Face template versioning**: Keep history of enrollments
3. **Quality tracking**: Know confidence of each enrollment
4. **Better import**: Store face data separately from attendance events
5. **Easier sync**: DeviceUserMapping links to face encoding

---

### 4. Enhanced DeviceUserMapping - Better Biometric Tracking

#### New Fields

```python
is_enrolled: bool               # Explicit enrollment flag
enrollment_date: datetime | None # When added to device
biometric_template_id: UUID | None # Link to face encoding
```

#### Relationship

```
Member
  ↓
BiometricFaceEncoding (face template + quality)
  ↓
DeviceUserMapping (links member to device's user ID)
  ↓
BiometricDevice (actual fingerprint/face device)
```

---

## 🔄 Common Import Scenarios

### Scenario 1: Import from GymSoft (Complete Data)

GymSoft exports:
- Member details ✅
- Membership records ✅
- Payment history ✅
- But NO face data (device doesn't export)

**Solution**:
```bash
1. Import members with source_system="GymSoft"
2. Import memberships with import_ref from GymSoft
3. Set biometric_enrolled=false (needs re-enrollment)
4. During first check-in, capture face for biometric matching
```

### Scenario 2: Import from eTimeTrack (Partial Data)

eTimeTrack exports:
- Member ID + name + phone ✅
- Membership start/end dates ✅
- But NO email, NO address, NO discount info

**Solution**:
```bash
POST /api/v1/migration/import-members
{
  "members": [{
    "name": "Amit Singh",
    "phone": "9123456789",
    "email": null,
    "address": null,
    "source_system": "eTimeTrack",
    "import_metadata": {
      "eTimeTrack_id": "MEM-5678",
      "last_sync": "2024-01-15"
    }
  }]
}
```

The `import_metadata` field stores unmapped data for future reference.

### Scenario 3: Import with Freeze Periods

Old system has:
- Member paused from Jan 1 - Mar 31 (medical leave)
- Expected to renew in April

**Solution**:
```bash
POST /api/v1/migration/import-memberships
{
  "memberships": [{
    "member_phone": "9876543210",
    "plan_name": "Premium",
    "start_date": "2024-01-01",
    "end_date": "2025-01-01",
    "freeze_start_date": "2024-01-01",
    "freeze_end_date": "2024-03-31",
    "status": "PAUSED"
  }]
}
```

### Scenario 4: Multi-Device Biometric Enrollment

Same member enrolled on 2 devices:

**Solution**:
```
Device A (fingerprint): Store face encoding A
Device B (face camera): Store face encoding B

Both linked via:
  Member → BiometricFaceEncoding (A & B)
  → DeviceUserMapping → Device A & B
```

---

## 🚀 Import API Reference

### POST /api/v1/migration/import-members

**Request**:
```json
{
  "members": [
    {
      "name": "string",
      "phone": "string (10-15 digits)",
      "email": "string | null",
      "gender": "M | F | O | null",
      "date_of_birth": "2000-01-01 | null",
      "address": "string | null",
      "joined_date": "2024-01-01 | null",
      "member_code": "string | null",
      "notes": "string | null",
      "emergency_contact_name": "string | null",
      "emergency_contact_phone": "string | null",
      "photo_url": "URL or base64 | null",
      "source_system": "GymSoft | eTimeTrack | Manual | null",
      "alternative_phone": "string | null",
      "enrollment_status": "NEW | ACTIVE | INACTIVE | PAUSED",
      "aadhaar_verified": "boolean | null",
      "import_metadata": "object | null"
    }
  ],
  "skip_duplicates": true
}
```

**Response**:
```json
{
  "total_received": 100,
  "created": 95,
  "skipped_duplicates": 5,
  "memberships_created": 20,
  "photos_imported": 10,
  "errors": []
}
```

### POST /api/v1/migration/import-memberships

**Request**:
```json
{
  "memberships": [
    {
      "member_phone": "string",
      "plan_name": "string",
      "start_date": "2024-01-01",
      "end_date": "2025-01-01",
      "amount_total": 12000,
      "amount_paid": 10000,
      "status": "ACTIVE | PAUSED | EXPIRED | CANCELLED",
      "renewal_date": "2024-12-15 | null",
      "freeze_start_date": "2024-01-01 | null",
      "freeze_end_date": "2024-03-31 | null",
      "discount_amount": 2000 | null",
      "payment_method": "CASH | UPI | CARD | CHEQUE | null",
      "auto_renewal": true | false | null",
      "import_ref": "string | null"
    }
  ]
}
```

---

## ✅ Pre-Import Validation Checklist

Before importing from any system:

- [ ] **Phone numbers**: Normalized to 10 digits (Indian format)
- [ ] **Dates**: In YYYY-MM-DD format
- [ ] **Amounts**: Positive decimals, 2 decimal places
- [ ] **Status values**: Valid enums (ACTIVE, PAUSED, INACTIVE, NEW)
- [ ] **Source system**: Documented in import_metadata
- [ ] **Duplicate check**: Phone uniqueness per gym
- [ ] **Data completeness**: Which fields are missing?
- [ ] **Membership dates**: end_date >= start_date
- [ ] **Discount**: discount_amount <= amount_total

---

## 🔐 Data Integrity & Audit Trail

### Tracking Data Origin

Every imported record includes:
```python
source_system: str            # Where it came from
import_metadata: dict         # Extra unmapped fields
created_at: datetime          # When imported
updated_at: datetime          # Last change
```

### Reconciliation

For re-import/updates:
```python
import_ref: str              # Reference to source system ID
# Allows matching old and new records

# Example: "GymSoft-MEM123" → Can update without creating duplicate
```

---

## 📋 Migration Checklist

- [ ] **Phase 1 - Data Export**: Get CSV/JSON from old system
- [ ] **Phase 2 - Validation**: Check phone, dates, amounts
- [ ] **Phase 3 - Preview**: Test with 10-20 records first
- [ ] **Phase 4 - Full Import**: Run complete member import
- [ ] **Phase 5 - Biometric**: Set biometric_enrolled flags
- [ ] **Phase 6 - Verification**: Spot-check imported records
- [ ] **Phase 7 - Production**: Go live with confidence ✅

---

## 🆘 Troubleshooting

### Issue: "Phone already exists"
**Solution**: Use `skip_duplicates: true` in request, or update import_ref to mark duplicates

### Issue: Plan not found during import
**Solution**: Import plans first, then members with membership data

### Issue: Dates showing errors
**Solution**: Ensure dates are ISO format: `YYYY-MM-DD`

### Issue: Biometric matching failing
**Solution**: Enroll new face data after import, set `biometric_enrolled: true`

---

## 📞 Support

For import issues or custom field mapping:
1. Check `import_metadata` for unmapped fields
2. Review error messages in import result
3. Contact support with sample data export

