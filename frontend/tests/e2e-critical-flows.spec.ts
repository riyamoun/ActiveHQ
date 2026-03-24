import { expect, test, type Page } from '@playwright/test'

const mockApi = async (page: Page) => {
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.endsWith('/auth/login') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'bearer',
          expires_in: 900,
        }),
      })
    }
    if (url.endsWith('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u1',
          gym_id: 'g1',
          email: 'owner@fitzonegym.com',
          name: 'Rajesh Kumar',
          phone: '9999999999',
          role: 'owner',
          is_active: true,
        }),
      })
    }
    if (url.endsWith('/gym/current')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'g1', name: 'FitZone Premium Gym' }),
      })
    }
    if (url.includes('/reports/dashboard')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_members: 50,
          active_members: 42,
          expiring_soon: 4,
          expired_members: 8,
          today_check_ins: 17,
          today_collection: 3500,
          members_with_dues: 3,
          total_dues: 9200,
          new_joins_this_month: 6,
        }),
      })
    }
    if (url.includes('/reports/action-center')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          expiring_count: 4,
          dues_count: 3,
          total_dues: 9200,
          inactive_7d_count: 5,
          inactive_14d_count: 2,
        }),
      })
    }
    if (url.includes('/reports/revenue-opportunity')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ potential_renewals_count: 4, potential_revenue: 18000 }),
      })
    }
    if (url.includes('/reports/activity-feed')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            type: 'check_in',
            title: 'Rahul checked in',
            subtitle: '09:15 AM',
            time: new Date().toISOString(),
            link_id: 'a1',
          },
        ]),
      })
    }
    if (url.includes('/automation/reminder-list')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          expiring: [
            {
              member_id: 'm1',
              member_name: 'Rahul',
              phone: '9999999999',
              days_until_expiry: 2,
              end_date: '2026-03-31',
              messages: [{ campaign_name: 'Renewal', message_text: 'Please renew today.' }],
            },
          ],
          dues: [
            {
              member_id: 'm2',
              member_name: 'Aman',
              phone: '9888888888',
              amount_due: 2000,
              end_date: '2026-03-25',
              messages: [{ campaign_name: 'Dues', message_text: 'Please clear your pending dues.' }],
            },
          ],
        }),
      })
    }
    if (url.includes('/members')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 }),
      })
    }
    if (url.includes('/plans')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    if (url.includes('/payments')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, total_amount: 0, page: 1, page_size: 20 }),
      })
    }
    if (url.includes('/attendance')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, page_size: 50 }),
      })
    }
    if (url.includes('/reports/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
}

const loginWithMock = async (page: Page) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('owner@fitzonegym.com')
  await page.getByLabel(/password/i).fill('Owner@123')
  await page.getByRole('button', { name: /start demo|sign in|login/i }).click()
  await expect(page).toHaveURL(/\/dashboard/i)
}

test.describe('ActiveHQ critical flows (CI-stable)', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
  })

  test('public pages load', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ActiveHQ/i)
    await page.goto('/for-gym-owners')
    await expect(page.getByRole('heading', { name: /features|gym growth/i })).toBeVisible()
    await page.goto('/contact')
    await expect(page.getByRole('button', { name: /request demo/i })).toBeVisible()
  })

  test('login and dashboard action center render', async ({ page }) => {
    await loginWithMock(page)
    await expect(page.getByText(/action needed today/i)).toBeVisible()
    await expect(page.getByText(/revenue opportunity/i)).toBeVisible()
  })

  test('action center CTA buttons work', async ({ page }) => {
    await loginWithMock(page)
    await page.getByRole('button', { name: /send whatsapp reminders/i }).click()
    await expect(page).toHaveURL(/\/members/i)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /open follow-ups/i }).click()
    await expect(page).toHaveURL(/\/payments/i)
  })

  test('sidebar navigation across core modules', async ({ page }) => {
    await loginWithMock(page)
    await page.getByRole('link', { name: /members/i }).click()
    await expect(page).toHaveURL(/\/members/i)
    await page.getByRole('link', { name: /plans/i }).click()
    await expect(page).toHaveURL(/\/plans/i)
    await page.getByRole('link', { name: /payments/i }).click()
    await expect(page).toHaveURL(/\/payments/i)
    await page.getByRole('link', { name: /attendance/i }).click()
    await expect(page).toHaveURL(/\/attendance/i)
    await page.getByRole('link', { name: /reports/i }).click()
    await expect(page).toHaveURL(/\/reports/i)
    await page.getByRole('link', { name: /settings/i }).click()
    await expect(page).toHaveURL(/\/settings/i)
  })
})
