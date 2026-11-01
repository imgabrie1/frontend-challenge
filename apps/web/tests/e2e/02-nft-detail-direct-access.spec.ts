import { test, expect } from '@playwright/test'

test.describe('2. Direct Access to NFT Detail and 404 Handling', () => {
  test('should load valid NFT directly via URL and display details and gallery', async ({ page }) => {
    await page.goto('/nfts/nft-1')

    // Details must be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('Standard Edition')).toBeVisible()
    await expect(page.getByRole('button', { name: /Add to Cart/i })).toBeVisible()

    // Test edition selection
    const goldEditionBtn = page.getByRole('radio', { name: /Gold Edition/i })
    if (await goldEditionBtn.isVisible()) {
      await goldEditionBtn.click()
      await expect(goldEditionBtn).toHaveAttribute('aria-checked', 'true')
    }

    // Test gallery image switching
    const thumbs = page.locator('button[aria-label^="Show image"]')
    const count = await thumbs.count()
    if (count > 1) {
      await thumbs.nth(1).click()
      await expect(thumbs.nth(1)).toHaveAttribute('aria-pressed', 'true')
    }
  })

  test('should show 404 not found state for non-existent NFT id', async ({ page }) => {
    await page.goto('/nfts/nft-non-existent-99999')
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('heading', { name: /NFT Not Found/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Back to Marketplace/i })).toBeVisible()
  })
})
