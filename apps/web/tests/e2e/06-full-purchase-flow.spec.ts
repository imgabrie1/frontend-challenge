import { test, expect } from '@playwright/test'

test.describe('6. Full Purchase Flow: Catalog to Confirmed Receipt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
  })

  test('should complete end-to-end purchase from discovery to order receipt', async ({ page }) => {
    // 1. Sign in as Alice
    await page.goto('/login')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#password').fill('Alice@123')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page).toHaveURL('/')

    // 2. Discover NFT from Catalog
    const firstNFTLink = page.locator('article a').first()
    await firstNFTLink.click()
    await expect(page).toHaveURL(/\/nfts\/nft-/)

    // 3. Add to Cart
    await page.getByRole('button', { name: /Add to Cart/i }).click()
    await expect(page.getByText(/Added to cart/i).first()).toBeVisible()

    // 4. View Cart
    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: /Shopping Cart/i })).toBeVisible()

    // 5. Apply Coupon
    await page.locator('#coupon-input').fill('SAVE10')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText(/SAVE10 applied/i).first()).toBeVisible()

    // 6. Proceed to Checkout
    await page.getByRole('link', { name: /Proceed to Checkout/i }).click()
    await expect(page).toHaveURL('/checkout')

    // 7. Verify Collector & Wallet
    await expect(page.getByText('Alice Chen')).toBeVisible()
    await expect(page.getByRole('radio', { name: /Main Wallet/i })).toBeVisible()

    // 8. Confirm review terms
    const termsCheckbox = page.getByRole('checkbox')
    await termsCheckbox.check()
    await expect(termsCheckbox).toBeChecked()

    // 9. Submit Order
    const payBtn = page.getByRole('button', { name: /Confirm & Pay/i })
    await expect(payBtn).toBeEnabled({ timeout: 10000 })
    await payBtn.click()

    // 10. Confirmation Receipt
    await expect(page).toHaveURL(/\/orders\/order-/, { timeout: 15000 })
    await expect(page.getByText(/Receipt Snapshot/i)).toBeAttached()
    await expect(page.getByText(/Transaction Information/i)).toBeAttached()
  })
})
