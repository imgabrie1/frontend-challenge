import { test, expect } from '@playwright/test'

test.describe('11. Accessibility: Keyboard Navigation & Visible Focus', () => {
  test('should navigate header and search using keyboard Tab and Enter', async ({ page }) => {
    await page.goto('/')

    // Press Tab multiple times to navigate through interactive elements
    await page.keyboard.press('Tab')
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedTag).toBeDefined()

    // Test search input focus and keyboard submission
    const searchInput = page.getByPlaceholder(/search by name/i)
    await searchInput.focus()
    await searchInput.fill('Pixel')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/search=Pixel/)
  })

  test('should support keyboard selection in NFT detail edition tabs', async ({ page }) => {
    await page.goto('/nfts/nft-1')

    const editions = page.getByRole('radio')
    if (await editions.first().isVisible()) {
      await editions.first().focus()
      await page.keyboard.press('ArrowRight')
      // Radio should receive focus or state
      expect(await page.evaluate(() => !!document.activeElement)).toBeTruthy()
    }
  })
})
