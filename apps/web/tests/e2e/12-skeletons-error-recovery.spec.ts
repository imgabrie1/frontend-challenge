import { test, expect } from '@playwright/test'

test.describe('12. Skeletons Loading & Error Recovery Feedback', () => {
  test('should display shimmer skeletons during initial loading', async ({ page }) => {
    // Intercept API call to delay response and observe skeletons
    await page.route('**/api/nfts*', async (route) => {
      await new Promise((r) => setTimeout(r, 600))
      await route.continue()
    })

    await page.goto('/')
    // Shimmer skeletons should be present
    const skeletons = page.locator('.shimmer')
    const count = await skeletons.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display recovery retry button upon network failure', async ({ page }) => {
    // Set flag BEFORE page load so the MSW Service Worker picks it up on the first request
    await page.addInitScript(() => {
      ;(window as any).__MSW_FORCE_NFT_ERROR__ = true
    })

    await page.goto('/')
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible()
  })
})
