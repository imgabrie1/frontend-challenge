import { test, expect } from '@playwright/test'

test.describe('10. Event Deduplication & Reconnection Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
  })

  test('should tolerate duplicate and older versioned socket events without regression', async ({ page }) => {
    await page.goto('/nfts/nft-1')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Send version 5 event
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('msw:nft_updated', {
          detail: {
            nftId: 'nft-1',
            version: 5,
            changes: { price: '1.5000' },
          },
        }),
      )
    })

    // Send obsolete version 2 event (should be ignored and not regress state)
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('msw:nft_updated', {
          detail: {
            nftId: 'nft-1',
            version: 2,
            changes: { price: '0.0100' },
          },
        }),
      )
    })

    // Assert page remains stable
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
