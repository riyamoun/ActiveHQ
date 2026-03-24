import { expect, test, type Page } from '@playwright/test'

const gotoFast = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
}

test('public home page loads', async ({ page }) => {
  await gotoFast(page, '/')
  await expect(page).toHaveTitle(/ActiveHQ/i)
  await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible()
})

test('contact page demo form loads', async ({ page }) => {
  await gotoFast(page, '/contact')
  await expect(page.getByRole('heading', { name: /let's connect/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /request demo/i })).toBeVisible()
})
