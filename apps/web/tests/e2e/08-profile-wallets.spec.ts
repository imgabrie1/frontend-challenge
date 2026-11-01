import { test, expect } from '@playwright/test'

test.describe('8. Profile & Wallets Management with Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()

    // Sign in as Alice
    await page.goto('/login')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#password').fill('Alice@123')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('should update profile name and bio', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: /Collector Profile/i })).toBeVisible()

    await page.locator('#profile-name').fill('Alice Updated')
    await page.locator('#profile-bio').fill('Web3 collector and digital curator.')
    await page.getByRole('button', { name: /Save Profile Details/i }).click()

    await expect(page.getByText(/Profile updated!/i).first()).toBeVisible()
  })

  test('should validate password change fields and reject wrong current password', async ({ page }) => {
    await page.goto('/profile')

    await page.locator('#current-pass').fill('WrongPassword@999')
    await page.locator('#new-pass').fill('NewSecret@123')
    await page.getByRole('button', { name: /Update Password/i }).click()

    await expect(page.getByText(/Current password incorrect/i)).toBeVisible()
  })

  test('should add and edit wallet configurations', async ({ page }) => {
    await page.goto('/wallets')
    await expect(page.getByRole('heading', { name: /Connected Wallets/i })).toBeVisible()

    // Add new wallet
    await page.getByRole('button', { name: /Add Wallet/i }).click()
    await page.locator('#new-wallet-label').fill('Hardware Cold Vault')
    await page.locator('#new-wallet-address').fill('0x1111222233334444555566667777888899990000')
    await page.getByRole('button', { name: 'Add Wallet', exact: true }).click()

    await expect(page.getByText('Hardware Cold Vault')).toBeVisible()
  })
})
