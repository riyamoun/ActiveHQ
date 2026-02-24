# Biometric + AI Automation Architecture

## Phase 4: Biometric Attendance

### Components

- `biometric_devices`: multi-tenant device registry per gym.
- `biometric_events`: raw ingest queue with dedupe/conflict state.
- `attendance`: canonical attendance records.

### Ingest Flow

1. Device pushes event payload (`external_event_id`, `person_identifier`, `event_time`).
2. API dedupes by `(gym_id, device_id, external_event_id)`.
3. Member resolved using `member_code` as person identifier.
4. Event processor:
   - check-in -> new attendance row
   - check-out -> closes open attendance row
   - unknown -> inferred from open session
5. Conflicts logged for:
   - unknown member
   - checkout without open session
   - negative duration / time drift
   - duplicate punch window

## Phase 5: AI WhatsApp/SMS Automation

### Components

- `automation_campaigns`: trigger-based campaign setup.
- `campaign_delivery_logs`: send/outcome analytics.
- AI preview endpoint for message optimization (EN/HI + tone).

### Trigger Examples

- Renewal reminders: D-7, D-3, D-1.
- Payment follow-up: due + overdue cadence.
- Inactivity nudge: no attendance in X days.

### Delivery Strategy

- Primary channel: WhatsApp.
- Fallback: SMS.
- Store provider message IDs and outcome status for analytics.
