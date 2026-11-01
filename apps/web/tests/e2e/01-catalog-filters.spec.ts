import { test, expect } from '@playwright/test'

test.describe('1. Catalog: Search, Combined Filters, Sorting, Pagination & History', () => {
  test.beforeEach(async ({ page }) => {
    // Reset MSW db in localStorage to start from a clean fixture state
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display initial catalog items with pagination', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Discover/i })).toBeVisible()
    const articles = page.locator('article')
    await expect(articles).toHaveCount(12, { timeout: 15000 })
    await expect(page.getByRole('navigation', { name: /pagination/i })).toBeVisible()
  })

  test('should filter by search term and update URL', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search by name/i)
    await searchInput.fill('Cosmic')
    // Wait for debounced search and URL update
    await expect(page).toHaveURL(/search=Cosmic/)
    const articles = page.locator('article')
    await expect(articles.first()).toContainText(/Cosmic/i)
  })

  test('should combine category and network filters and restart pagination', async ({ page }) => {
    // Go to page 2 first
    await page.getByRole('button', { name: 'Page 2' }).click()
    await expect(page).toHaveURL(/page=2/)

    // Select category 'Art'
    const artTab = page.getByRole('tab', { name: 'Art' }).first()
    await artTab.click()
    await expect(page).toHaveURL(/category=art/)
    // Page must be reset to 1
    await expect(page).toHaveURL(/page=1/)

    // Open advanced filters if needed and select network
    const networkSelect = page.locator('#network-select')
    if (!(await networkSelect.isVisible())) {
      await page.getByRole('button', { name: 'Filters', exact: true }).click()
    }
    await networkSelect.selectOption('ethereum')
    await expect(page).toHaveURL(/network=ethereum/)

    // Verify cards are displayed
    await expect(page.locator('article').first()).toBeVisible()
  })

  test('should change sort order and survive history back/forward navigation', async ({ page }) => {
    await page.locator('#sort-select').selectOption('price_asc')
    await expect(page).toHaveURL(/sortBy=price_asc/)

    // Navigate to page 2
    const page2Button = page.getByRole('button', { name: 'Page 2' })
    if (await page2Button.isVisible()) {
      await page2Button.click()
      await expect(page).toHaveURL(/page=2/)

      // Navigate back in history
      await page.goBack()
      await expect(page).toHaveURL(/sortBy=price_asc/)

      // Navigate forward in history
      await page.goForward()
      await expect(page).toHaveURL(/page=2/)
    }
  })
})
