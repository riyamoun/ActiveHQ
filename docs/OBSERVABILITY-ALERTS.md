# ActiveHQ Observability and Alerts (Render + Sentry)

This runbook sets up practical alerts so issues are detected before gym owners complain.

## 1) Sentry Setup (Backend + Frontend)

### Backend
- Ensure `SENTRY_DSN` is set on Render (`activehq-api`).
- Set `ENVIRONMENT=production` and keep `SENTRY_TRACES_SAMPLE_RATE=0.1` initially.
- Deploy and verify Sentry receives:
  - unhandled exceptions,
  - 5xx errors,
  - performance transactions.

### Frontend
- Add/verify Sentry DSN in frontend env (`VITE_SENTRY_DSN`) if frontend capture is enabled.
- Release with source maps so stack traces map to TS/TSX files.

## 2) Render Alerts (API)

Set notification channel to Email + Slack (if available).

Recommended alerts:
- **Service down**: immediate
- **Crash loop/restart spikes**: immediate
- **High response time**:
  - warn: p95 > 1200 ms for 10 min
  - critical: p95 > 2500 ms for 5 min
- **5xx error rate**:
  - warn: > 1% for 10 min
  - critical: > 3% for 5 min
- **CPU/memory saturation**:
  - warn: > 80% for 15 min
  - critical: > 90% for 10 min

## 3) Database Health Signals

Track these via API logs + Render Postgres metrics:
- connection timeout spikes,
- failed migration attempts,
- long query bursts around reports/payments.

When alert fires:
1. hit `/health` and `/health/ready`,
2. check Render logs for error burst window,
3. check Sentry issue group for the same timestamp,
4. roll back last deploy if incident started immediately after release.

## 4) Sentry Alert Rules

Create these issue alerts:
- **New issue** in `production` -> notify engineering channel.
- **Regression** issue -> notify immediately.
- **High frequency issue**:
  - 20+ events in 10 min -> warn
  - 100+ events in 10 min -> critical

Create these metric alerts:
- transaction failure rate > 2% on `POST /api/v1/auth/login` for 10 min.
- p95 transaction duration > 1.5s on dashboard/report endpoints.

## 5) Operational Dashboards (weekly review)

Minimum widgets:
- API throughput, p95 latency, 4xx/5xx split
- Auth login success/failure trend
- Payment creation failures
- Automation cron success/failure count
- Top 5 Sentry issues by event count

## 6) On-call Ownership

Define:
- primary owner (weekday),
- backup owner,
- response SLA:
  - critical alerts: acknowledge in 10 min,
  - warn alerts: acknowledge in 30 min.

Keep one shared incident template:
- started_at
- impact
- root_cause
- mitigation
- follow_up_action_items

