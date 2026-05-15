import { expect, test, type Page } from '@playwright/test'

const gotoFast = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
}

test('public home page loads', async ({ page }) => {
  await gotoFast(page, '/')
  await expect(page).toHaveTitle(/ActiveHQ/i)
  // CTA updated to "Book a 15-min demo" in homepage redesign
  await expect(page.getByRole('link', { name: /book a 15-min demo/i }).first()).toBeVisible()
})

test('contact page demo form loads', async ({ page }) => {
  await gotoFast(page, '/contact')
  // Heading updated to "See ActiveHQ on your gym's data." in contact page redesign
  await expect(page.getByRole('heading', { name: /see activehq on/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /request demo/i })).toBeVisible()
})
