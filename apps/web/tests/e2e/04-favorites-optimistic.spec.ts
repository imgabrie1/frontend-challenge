import { test, expect } from '@playwright/test'

test.describe('4. Favorites: Optimistic Mutation & Authenticated State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
  })

  test('should require sign in to favorite an NFT', async ({ page }) => {
    await page.goto('/')
    const firstFavoriteBtn = page.locator('button[aria-label^="Add"]').first()
    await firstFavoriteBtn.click()

    await expect(page.getByText(/Sign in required/i).first()).toBeVisible()
  })

  test('should toggle favorite optimistically for authenticated user', async ({ page }) => {
    // Sign in first
    await page.goto('/login')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#password').fill('Alice@123')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page).toHaveURL('/')

    const firstFavoriteBtn = page.locator('button[aria-label*="favorites"]').first()
    const initialPressed = await firstFavoriteBtn.getAttribute('aria-pressed')

    // Click to toggle
    await firstFavoriteBtn.click()

    // Optimistic expectation: state toggles immediately
    const expected = initialPressed === 'true' ? 'false' : 'true'
    await expect(firstFavoriteBtn).toHaveAttribute('aria-pressed', expected)
  })
})
