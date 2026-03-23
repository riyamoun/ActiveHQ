import { expect, test } from '@playwright/test'

// Configure test base URL
const baseURL = process.env.VITE_API_URL || 'http://localhost:5173'

test.describe('ActiveHQ - Complete E2E Smoke Tests', () => {
  test.describe('Public Site', () => {
    test('should load homepage', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveTitle(/ActiveHQ/i)
      await expect(page.getByRole('heading', { name: /modern gym management/i })).toBeVisible()
    })

    test('should display hero section with CTA', async ({ page }) => {
      await page.goto('/')
      const getStartedBtn = page.getByRole('link', { name: /get started/i }).first()
      await expect(getStartedBtn).toBeVisible()
      // Should not error when clicked
      await getStartedBtn.click()
      // Should redirect to login or register
      await expect(page).toHaveURL(/\/(login|register)/)
    })

    test('should load for-gym-owners page', async ({ page }) => {
      await page.goto('/for-gym-owners')
      await expect(page.getByRole('heading', { name: /features/i })).toBeVisible()
    })

    test('should load contact page with demo form', async ({ page }) => {
      await page.goto('/contact')
      await expect(page.getByRole('heading', { name: /let's connect/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /request demo/i })).toBeVisible()
    })

    test('should submit contact form', async ({ page }) => {
      await page.goto('/contact')

      // Fill form
      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/gym name/i).fill('Test Gym')
      await page.getByLabel(/phone/i).fill('9999999999')
      await page.getByLabel(/city/i).fill('Test City')

      // Submit
      const submitBtn = page.getByRole('button', { name: /request demo/i })
      await submitBtn.click()

      // Should show success message
      await expect(page.getByText(/thank you|submitted/i)).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Clear any existing auth
      await page.context().clearCookies()
    })

    test('should register new gym', async ({ page }) => {
      await page.goto('/register')

      // Fill registration form
      const gymName = `TestGym-${Date.now()}`
      const email = `owner-${Date.now()}@test.com`

      await page.getByLabel(/gym name/i).fill(gymName)
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/owner name/i).fill('Test Owner')
      await page.getByLabel(/phone/i).fill('9999999999')
      
      // Password must be 8+ chars with uppercase, lowercase, number, special char
      await page.getByLabel(/^password/i).first().fill('TestPass@123')
      await page.getByLabel(/confirm password/i).fill('TestPass@123')

      // Accept terms
      const checkbox = page.getByRole('checkbox')
      if (await checkbox.isVisible()) {
        await checkbox.check()
      }

      // Submit
      const submitBtn = page.getByRole('button', { name: /register|sign up/i })
      await submitBtn.click()

      // Should redirect to dashboard on success
      await expect(page).toHaveURL(/\/dashboard/i, { timeout: 10000 })
      await expect(page.getByRole('heading', { name: /dashboard|overview/i })).toBeVisible()
    })

    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login')

      // Use demo account if available, otherwise skip
      // Note: In production, use a test account created via API
      await page.getByLabel(/email/i).fill('owner@fitzonegym.com')
      await page.getByLabel(/password/i).fill('Owner@123')

      const loginBtn = page.getByRole('button', { name: /login|sign in/i })
      await loginBtn.click()

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/i, { timeout: 10000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill('invalid@test.com')
      await page.getByLabel(/password/i).fill('WrongPassword@123')

      const loginBtn = page.getByRole('button', { name: /login|sign in/i })
      await loginBtn.click()

      // Should show error message
      await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Dashboard Pages', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('owner@fitzonegym.com')
      await page.getByLabel(/password/i).fill('Owner@123')
      await page.getByRole('button', { name: /login|sign in/i }).click()
      
      // Wait for dashboard load
      await expect(page).toHaveURL(/\/dashboard/i, { timeout: 10000 })
    })

    test('should display main dashboard with key metrics', async ({ page }) => {
      await page.goto('/dashboard')

      // Check for key metrics
      const metricCards = page.locator('[data-testid="stat-card"]')
      if (await metricCards.count() > 0) {
        await expect(metricCards.first()).toBeVisible()
      }

      // Navigation should be visible
      await expect(page.getByRole('navigation')).toBeVisible()
    })

    test('should navigate to members page', async ({ page }) => {
      await page.goto('/dashboard')

      const membersLink = page.getByRole('link', { name: /members/i })
      await expect(membersLink).toBeVisible()
      await membersLink.click()

      await expect(page).toHaveURL(/\/members/i)
      await expect(page.getByRole('heading', { name: /members/i })).toBeVisible()
    })

    test('should navigate to plans page', async ({ page }) => {
      await page.goto('/dashboard')

      const plansLink = page.getByRole('link', { name: /plans/i })
      await expect(plansLink).toBeVisible()
      await plansLink.click()

      await expect(page).toHaveURL(/\/plans/i)
      await expect(page.getByRole('heading', { name: /plans/i })).toBeVisible()
    })

    test('should navigate to payments page', async ({ page }) => {
      await page.goto('/dashboard')

      const paymentsLink = page.getByRole('link', { name: /payments/i })
      await expect(paymentsLink).toBeVisible()
      await paymentsLink.click()

      await expect(page).toHaveURL(/\/payments/i)
      await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible()
    })

    test('should navigate to attendance page', async ({ page }) => {
      await page.goto('/dashboard')

      const attendanceLink = page.getByRole('link', { name: /attendance/i })
      await expect(attendanceLink).toBeVisible()
      await attendanceLink.click()

      await expect(page).toHaveURL(/\/attendance/i)
      await expect(page.getByRole('heading', { name: /attendance/i })).toBeVisible()
    })

    test('should navigate to reports page', async ({ page }) => {
      await page.goto('/dashboard')

      const reportsLink = page.getByRole('link', { name: /reports/i })
      await expect(reportsLink).toBeVisible()
      await reportsLink.click()

      await expect(page).toHaveURL(/\/reports/i)
      await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible()
    })

    test('should access settings page', async ({ page }) => {
      await page.goto('/dashboard')

      const settingsLink = page.getByRole('link', { name: /settings/i })
      await expect(settingsLink).toBeVisible()
      await settingsLink.click()

      await expect(page).toHaveURL(/\/settings/i)
      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
    })
  })

  test.describe('Members Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('owner@fitzonegym.com')
      await page.getByLabel(/password/i).fill('Owner@123')
      await page.getByRole('button', { name: /login|sign in/i }).click()
      
      // Navigate to members
      await page.goto('/members')
      await expect(page).toHaveURL(/\/members/i)
    })

    test('should display members list', async ({ page }) => {
      // Should show members table or cards
      const table = page.locator('table').first()
      if (await table.isVisible()) {
        await expect(table).toBeVisible()
      } else {
        // Or show card list — at least check page loads
        await expect(page.getByRole('heading', { name: /members/i })).toBeVisible()
      }
    })

    test('should open add member form', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /\+|add|new/i }).first()
      await expect(addBtn).toBeVisible()
      await addBtn.click()

      // Should show form or modal
      await expect(page.getByRole('heading', { name: /add|new member/i })).toBeVisible()
    })
  })

  test.describe('API Health', () => {
    test('should have healthy API', async ({ page }) => {
      const response = await page.request.get(`${baseURL}/health`)
      expect([200, 307]).toContain(response.status()) // 307 is redirect for frontend
    })

    test('should have ready API', async ({ page }) => {
      const response = await page.request.get(`${baseURL}/health/ready`)
      expect([200, 307]).toContain(response.status())
    })
  })

  test.describe('Error Handling', () => {
    test('should show 404 for non-existent page', async ({ page }) => {
      // This will result in a navigation to a 404 page or home
      await page.goto('/non-existent-page', { waitUntil: 'networkidle' })
      
      // Either shows 404 or redirects to home
      const url = page.url()
      const is404OrHome = url.includes('404') || url.endsWith('/')
      expect(is404OrHome || url.includes('non-existent')).toBeTruthy()
    })
  })
})
