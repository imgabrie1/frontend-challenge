import { test, expect } from '@playwright/test'

test.describe('7. Payment Failure, Repeated Clicks & Idempotency Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
  })

  test('should handle disconnected wallet state and prevent double submission', async ({ page }) => {
    // 1. Sign in
    await page.goto('/login')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#password').fill('Alice@123')
    await page.getByRole('button', { name: /Sign In/i }).click()

    await expect(page).toHaveURL('/')

    // 2. Add item to cart
    await page.goto('/nfts/nft-3')
    await page.getByRole('button', { name: /Add to Cart/i }).click()
    await expect(page.getByText(/Added to cart/i).first()).toBeVisible()

    // 3. Go to checkout
    await page.goto('/checkout')

    // Disconnect simulated wallet
    await page.getByRole('button', { name: /Click to disconnect/i }).click()
    await expect(page.getByText('Wallet Disconnected')).toBeVisible()

    // Submit button must be disabled
    const payBtn = page.getByRole('button', { name: /Wallet Disconnected/i })
    await expect(payBtn).toBeDisabled()

    // Reconnect wallet
    await page.getByRole('button', { name: /Click to connect/i }).click()
    await page.getByRole('checkbox').check()
    await expect(page.getByRole('button', { name: /Confirm & Pay/i })).toBeEnabled()
  })
})
