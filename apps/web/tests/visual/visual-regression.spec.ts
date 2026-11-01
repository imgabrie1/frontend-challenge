import { test, expect } from '@playwright/test'

test.describe('Visual Regression: Stable Snapshot Baselines', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('visual snapshot - home catalog', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('article')
    await expect(page).toHaveScreenshot('home-catalog.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })

  test('visual snapshot - nft detail', async ({ page }) => {
    await page.goto('/nfts/nft-1')
    await page.waitForSelector('h1')
    await expect(page).toHaveScreenshot('nft-detail.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })

  test('visual snapshot - cart page', async ({ page }) => {
    await page.goto('/cart')
    await expect(page).toHaveScreenshot('cart-page.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })

  test('visual snapshot - checkout page', async ({ page }) => {
    // Sign in first
    await page.goto('/login')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#password').fill('Alice@123')
    await page.getByRole('button', { name: /Sign In/i }).click()

    await page.goto('/checkout')
    await expect(page).toHaveScreenshot('checkout-page.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })
})
