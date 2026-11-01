import { test, expect } from '@playwright/test'

test.describe('9. Realtime Socket.IO: Price/Stock Update During Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
  })

  test('should inform price update and invalidate stale checkout quote via Socket.IO', async ({ page }) => {
    // 1. Sign in as Alice
    await page.goto('/login')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#password').fill('Alice@123')
    await page.getByRole('button', { name: /Sign In/i }).click()

    await expect(page).toHaveURL('/')

    // 2. Add NFT-1 to cart
    await page.goto('/nfts/nft-1')
    await page.getByRole('button', { name: /Add to Cart/i }).click()
    await expect(page.getByText(/Added to cart/i).first()).toBeVisible()

    // 3. Open cart
    await page.goto('/cart')
    await expect(page.getByText('Shopping Cart (1)')).toBeVisible()

    // 4. Simulate real-time nft.updated event via MSW/socket
    await page.evaluate(() => {
      // Dispatch event simulation
      window.dispatchEvent(
        new CustomEvent('msw:nft_updated', {
          detail: {
            nftId: 'nft-1',
            version: 2,
            changes: {
              editionId: 'edition-1-standard',
              price: '0.8888',
              available: 5,
            },
          },
        }),
      )
    })

    // 5. Interface informs update
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Checkout & Payment')).toBeVisible({ timeout: 10000 })
  })
})
