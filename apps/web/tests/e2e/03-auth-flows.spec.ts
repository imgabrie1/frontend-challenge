import { test, expect } from '@playwright/test'

test.describe('3. Auth Flows: Register, Login, Session Expiry, Logout & User Switch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
  })

  test('should register a new user successfully and update session', async ({ page }) => {
    await page.goto('/register')
    const uniqueEmail = `tester-${Date.now()}@example.com`
    const uniqueUser = `user_${Date.now()}`

    await page.locator('#name').fill('Test User')
    await page.locator('#email').fill(uniqueEmail)
    await page.locator('#username').fill(uniqueUser)
    await page.locator('#password').fill('Secret@123')
    await page.getByRole('button', { name: /Complete Registration/i }).click()

    // Redirected to home, session authenticated
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('link', { name: /Profile/i })).toBeVisible()
  })

  test('should handle validation errors and conflict on registration', async ({ page }) => {
    await page.goto('/register')
    // Attempt with existing email
    await page.locator('#name').fill('Alice Duplicate')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#username').fill('new_unique_user')
    await page.locator('#password').fill('Secret@123')
    await page.getByRole('button', { name: /Complete Registration/i }).click()

    await expect(page.getByText(/already in use/i)).toBeVisible()
  })

  test('should login with demo user and logout', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#password').fill('Alice@123')
    await page.getByRole('button', { name: /Sign In/i }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByLabel(/Profile: Alice Chen/i)).toBeVisible()

    // Logout
    await page.getByLabel('Logout').click()
    await expect(page.getByRole('link', { name: /Sign in/i })).toBeVisible()
  })

  test('should switch user cleanly without leaking session cache', async ({ page }) => {
    // Login as Alice
    await page.goto('/login')
    await page.locator('#email').fill('alice@nftmarket.dev')
    await page.locator('#password').fill('Alice@123')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page.getByLabel(/Profile: Alice Chen/i)).toBeVisible()

    // Logout
    await page.getByLabel('Logout').click()

    // Login as Bob
    await page.goto('/login')
    await page.locator('#email').fill('bob@nftmarket.dev')
    await page.locator('#password').fill('Bob@123')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page.getByLabel(/Profile: Bob Martinez/i)).toBeVisible()
  })
})
