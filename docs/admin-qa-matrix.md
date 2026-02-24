# Admin Portal QA Matrix

## Role-Based Access

| Module | Owner | Manager | Staff | Expected behavior |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | Read-only metrics per gym tenant |
| Members CRUD | ✅ | ✅ | ✅ | Staff can manage members within same gym only |
| Plans CRUD | ✅ | ✅ | ❌/limited | Staff cannot change pricing plans without permission |
| Payments | ✅ | ✅ | ✅ | Collection entry allowed, sensitive exports restricted |
| Reports | ✅ | ✅ | ✅ | Scope strictly by `gym_id` |
| Settings | ✅ | ✅ (limited) | ❌ | Staff blocked from owner settings |
| Biometric Devices | ✅ | ✅ | ❌ | Hardware setup restricted to manager+ |
| Automation Campaigns | ✅ | ✅ | ❌ | Messaging strategy controlled by manager+ |

## Critical Flows (must pass every release)

1. Register gym -> auto-login -> dashboard.
2. Login -> token refresh -> protected routes.
3. Add member -> create membership -> collect payment.
4. Mark attendance -> report reflects same day counts.
5. Create demo request from public site -> row stored in `demo_requests`.
6. Biometric ingest event -> attendance row created or conflict logged.
7. Create automation campaign -> AI preview -> delivery log summary updates.

## Security Checks

- API requests without token to protected routes return `401/403`.
- Cross-gym data access blocked for all list/detail endpoints.
- Setup endpoint disabled when `SETUP_DATABASE_KEY` is empty.
- Webhook failures never break primary request path.

## Automation Checks

- CI: frontend lint + build, backend pytest smoke tests.
- Playwright smoke: homepage and contact form visibility.
- Health monitors: `/health` and `/health/detailed`.
