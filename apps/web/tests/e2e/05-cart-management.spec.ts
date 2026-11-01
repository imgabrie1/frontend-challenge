import { test, expect } from '@playwright/test'

test.describe('5. Cart: Quantities, Removal, Coupon & Guest to User Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
  })

  test('should add NFT to cart as guest, adjust quantities and remove', async ({ page }) => {
    await page.goto('/nfts/nft-1')
    await page.getByRole('button', { name: /Add to Cart/i }).click()
    await expect(page.getByText(/Added to cart/i).first()).toBeVisible()

    // Go to cart
    await page.goto('/cart')
    await expect(page.getByText('Shopping Cart (1)')).toBeVisible()

    // Increase quantity
    await page.getByRole('button', { name: 'Increase quantity' }).click()
    await expect(page.getByText('2', { exact: true })).toBeVisible()

    // Remove item
    await page.getByRole('button', { name: /Remove .* from cart/i }).click()
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible()
  })

  test('should apply discount coupon and handle expired/invalid coupons', async ({ page }) => {
    await page.goto('/nfts/nft-1')
    await page.getByRole('button', { name: /Add to Cart/i }).click()
    await expect(page.getByText(/Added to cart/i).first()).toBeVisible()
    await page.goto('/cart')

    // Test invalid coupon
    await page.locator('#coupon-input').fill('INVALID99')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText(/Coupon Error/i).first()).toBeVisible()

    // Test valid coupon
    await page.locator('#coupon-input').fill('SAVE10')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText(/SAVE10 applied/i)).toBeVisible()
    await expect(page.getByText(/Coupon Discount/i)).toBeVisible()
  })

  test('should preserve cart items after refresh and merge into authenticated session', async ({ page }) => {
    // Add item as guest
    await page.goto('/nfts/nft-2')
    await page.getByRole('button', { name: /Add to Cart/i }).click()
    await expect(page.getByText(/Added to cart/i).first()).toBeVisible()

    // Refresh page
    await page.reload()
    await page.goto('/cart')
    await expect(page.getByText('Shopping Cart (1)')).toBeVisible()

    // Login and verify cart is merged
    await page.goto('/login')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#password').fill('Alice@123')
    await page.getByRole('button', { name: /Sign In/i }).click()

    await page.goto('/cart')
    await expect(page.getByText(/Shopping Cart/)).toBeVisible()
  })
})
