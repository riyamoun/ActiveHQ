import { expect, test } from '@playwright/test'

test('public home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/ActiveHQ/i)
  await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible()
})

test('contact page demo form loads', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.getByRole('heading', { name: /let's connect/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /request demo/i })).toBeVisible()
})
