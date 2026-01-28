import { test, expect, Page } from '@playwright/test'

test.describe('Admin Broadcast Notifications', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()

    // Login as admin
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('input[name="email"]', 'admin@antigaspi.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin/**', { timeout: 10000 })

    // Navigate to Broadcast page
    await page.goto('http://localhost:3000/admin/broadcast')
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await page.close()
  })

  // ============ RENDERING TESTS ============

  test('should render broadcast notification form', async () => {
    await expect(page.locator('[data-testid="broadcast-title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="broadcast-message-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="broadcast-send-button"]')).toBeVisible()
  })

  test('should render all channel options', async () => {
    await expect(page.locator('[data-testid="channel-database"]')).toBeVisible()
    await expect(page.locator('[data-testid="channel-push"]')).toBeVisible()
    await expect(page.locator('[data-testid="channel-mail"]')).toBeVisible()
    await expect(page.locator('[data-testid="channel-sms"]')).toBeVisible()
  })

  test('should render all role options', async () => {
    await expect(page.locator('[data-testid="role-consumer"]')).toBeVisible()
    await expect(page.locator('[data-testid="role-merchant"]')).toBeVisible()
    await expect(page.locator('[data-testid="role-admin"]')).toBeVisible()
  })

  test('should have database and push channels selected by default', async () => {
    const databaseChannel = page.locator('[data-testid="channel-database"]')
    const pushChannel = page.locator('[data-testid="channel-push"]')

    // Check if they have the selected class (border-primary-500)
    await expect(databaseChannel).toHaveClass(/border-primary-500/)
    await expect(pushChannel).toHaveClass(/border-primary-500/)
  })

  // ============ FORM VALIDATION TESTS ============

  test('should show error when title is empty', async () => {
    await page.fill('[data-testid="broadcast-message-input"]', 'Test message')
    await page.click('[data-testid="broadcast-send-button"]')

    // Check for validation error
    await expect(page.locator('text=Le titre est requis')).toBeVisible()
  })

  test('should show error when message is empty', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test title')
    await page.click('[data-testid="broadcast-send-button"]')

    // Check for validation error
    await expect(page.locator('text=Le message est requis')).toBeVisible()
  })

  test('should show error when title exceeds 120 characters', async () => {
    const longTitle = 'a'.repeat(121)
    await page.fill('[data-testid="broadcast-title-input"]', longTitle)
    await page.fill('[data-testid="broadcast-message-input"]', 'Test message')
    await page.click('[data-testid="broadcast-send-button"]')

    await expect(page.locator('text=/.*120 caractères.*/')).toBeVisible()
  })

  test('should show error when message exceeds 1000 characters', async () => {
    const longMessage = 'a'.repeat(1001)
    await page.fill('[data-testid="broadcast-title-input"]', 'Test title')
    await page.fill('[data-testid="broadcast-message-input"]', longMessage)
    await page.click('[data-testid="broadcast-send-button"]')

    await expect(page.locator('text=/.*1000 caractères.*/')).toBeVisible()
  })

  test('should show error when no channels selected', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test title')
    await page.fill('[data-testid="broadcast-message-input"]', 'Test message')

    // Deselect all channels
    await page.click('[data-testid="channel-database"]')
    await page.click('[data-testid="channel-push"]')

    await page.click('[data-testid="broadcast-send-button"]')

    await expect(page.locator('text=/.*au moins un canal.*/')).toBeVisible()
  })

  test('should show error for invalid action URL', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test title')
    await page.fill('[data-testid="broadcast-message-input"]', 'Test message')
    await page.fill('[data-testid="broadcast-action-url-input"]', 'invalid-url')
    await page.click('[data-testid="broadcast-send-button"]')

    await expect(page.locator('text=/.*URL invalide.*/')).toBeVisible()
  })

  // ============ CHANNEL SELECTION TESTS ============

  test('should toggle channel selection', async () => {
    const mailChannel = page.locator('[data-testid="channel-mail"]')

    // Initially not selected
    await expect(mailChannel).not.toHaveClass(/border-primary-500/)

    // Click to select
    await mailChannel.click()

    // Now selected
    await expect(mailChannel).toHaveClass(/border-primary-500/)

    // Click again to deselect
    await mailChannel.click()

    // Now deselected
    await expect(mailChannel).not.toHaveClass(/border-primary-500/)
  })

  test('should select multiple channels', async () => {
    const mailChannel = page.locator('[data-testid="channel-mail"]')
    const smsChannel = page.locator('[data-testid="channel-sms"]')

    await mailChannel.click()
    await smsChannel.click()

    // Both should be selected
    await expect(mailChannel).toHaveClass(/border-primary-500/)
    await expect(smsChannel).toHaveClass(/border-primary-500/)
  })

  // ============ ROLE SELECTION TESTS ============

  test('should toggle role selection', async () => {
    const consumerRole = page.locator('[data-testid="role-consumer"]')

    // Initially not selected
    await expect(consumerRole).not.toHaveClass(/border-primary-500/)

    // Click to select
    await consumerRole.click()

    // Now selected
    await expect(consumerRole).toHaveClass(/border-primary-500/)
  })

  test('should select multiple roles', async () => {
    const consumerRole = page.locator('[data-testid="role-consumer"]')
    const merchantRole = page.locator('[data-testid="role-merchant"]')

    await consumerRole.click()
    await merchantRole.click()

    // Both should be selected
    await expect(consumerRole).toHaveClass(/border-primary-500/)
    await expect(merchantRole).toHaveClass(/border-primary-500/)
  })

  // ============ CHARACTER COUNT TESTS ============

  test('should display title character count', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test')

    await expect(page.locator('text=/4\\/120 caractères/')).toBeVisible()
  })

  test('should display message character count', async () => {
    await page.fill('[data-testid="broadcast-message-input"]', 'Test message')

    await expect(page.locator('text=/12\\/1000 caractères/')).toBeVisible()
  })

  // ============ BROADCAST SEND TESTS ============

  test('should show confirmation dialog before sending', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test Title')
    await page.fill('[data-testid="broadcast-message-input"]', 'Test Message')

    // Click send button
    await page.click('[data-testid="broadcast-send-button"]')

    // Wait for confirmation dialog
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Confirmer')
      dialog.dismiss()
    })
  })

  test('should send broadcast notification on confirmation', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test Title')
    await page.fill('[data-testid="broadcast-message-input"]', 'Test Message')

    // Click send button
    await page.click('[data-testid="broadcast-send-button"]')

    // Accept confirmation dialog
    page.once('dialog', dialog => {
      dialog.accept()
    })

    // Wait for success alert
    await expect(page.locator('[data-testid="broadcast-success-alert"]')).toBeVisible({ timeout: 10000 })
  })

  test('should reset form after successful broadcast', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test Title')
    await page.fill('[data-testid="broadcast-message-input"]', 'Test Message')

    // Click send button
    await page.click('[data-testid="broadcast-send-button"]')

    // Accept confirmation dialog
    page.once('dialog', dialog => {
      dialog.accept()
    })

    // Wait for success
    await expect(page.locator('[data-testid="broadcast-success-alert"]')).toBeVisible({ timeout: 10000 })

    // Form should be reset
    await expect(page.locator('[data-testid="broadcast-title-input"]')).toHaveValue('')
    await expect(page.locator('[data-testid="broadcast-message-input"]')).toHaveValue('')
  })

  test('should include selected roles in broadcast', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test Title')
    await page.fill('[data-testid="broadcast-message-input"]', 'Test Message')

    // Select consumer role
    await page.click('[data-testid="role-consumer"]')

    // Click send button
    await page.click('[data-testid="broadcast-send-button"]')

    // Accept confirmation dialog
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Consommateurs')
      dialog.accept()
    })

    // Wait for success
    await expect(page.locator('[data-testid="broadcast-success-alert"]')).toBeVisible({ timeout: 10000 })
  })

  test('should include action URL in broadcast', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test Title')
    await page.fill('[data-testid="broadcast-message-input"]', 'Test Message')
    await page.fill('[data-testid="broadcast-action-url-input"]', 'https://example.com/promo')

    // Click send button
    await page.click('[data-testid="broadcast-send-button"]')

    // Accept confirmation dialog
    page.once('dialog', dialog => {
      dialog.accept()
    })

    // Wait for success
    await expect(page.locator('[data-testid="broadcast-success-alert"]')).toBeVisible({ timeout: 10000 })
  })

  // ============ BUTTON STATE TESTS ============

  test('should disable send button when form is invalid', async () => {
    const sendButton = page.locator('[data-testid="broadcast-send-button"]')

    // Initially disabled (empty form)
    await expect(sendButton).toBeDisabled()

    // Fill only title
    await page.fill('[data-testid="broadcast-title-input"]', 'Test Title')
    await expect(sendButton).toBeDisabled()

    // Fill message too
    await page.fill('[data-testid="broadcast-message-input"]', 'Test Message')
    await expect(sendButton).toBeEnabled()
  })

  test('should disable send button while loading', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test Title')
    await page.fill('[data-testid="broadcast-message-input"]', 'Test Message')

    // Click send button
    await page.click('[data-testid="broadcast-send-button"]')

    // Accept confirmation dialog
    page.once('dialog', dialog => {
      dialog.accept()
    })

    // Button should be disabled during loading
    const sendButton = page.locator('[data-testid="broadcast-send-button"]')
    await expect(sendButton).toBeDisabled()
  })

  // ============ RESET BUTTON TESTS ============

  test('should clear form when reset button is clicked', async () => {
    await page.fill('[data-testid="broadcast-title-input"]', 'Test Title')
    await page.fill('[data-testid="broadcast-message-input"]', 'Test Message')
    await page.fill('[data-testid="broadcast-action-url-input"]', 'https://example.com')

    // Click reset button
    await page.click('[data-testid="broadcast-reset-button"]')

    // Form should be cleared
    await expect(page.locator('[data-testid="broadcast-title-input"]')).toHaveValue('')
    await expect(page.locator('[data-testid="broadcast-message-input"]')).toHaveValue('')
    await expect(page.locator('[data-testid="broadcast-action-url-input"]')).toHaveValue('')
  })

  // ============ INFO CARD TESTS ============

  test('should display info card with important information', async () => {
    await expect(page.locator('text=/Informations importantes/')).toBeVisible()
    await expect(page.locator('text=/ne peuvent pas être annulées/')).toBeVisible()
    await expect(page.locator('text=/Base de données.*toujours inclus/')).toBeVisible()
    await expect(page.locator('text=/utilisateurs inactifs/')).toBeVisible()
    await expect(page.locator('text=/500 utilisateurs/')).toBeVisible()
  })

  // ============ ACCESSIBILITY TESTS ============

  test('should have proper ARIA labels and roles', async () => {
    // Check for required field indicators
    await expect(page.locator('text=/Titre.*\\*/')).toBeVisible()
    await expect(page.locator('text=/Message.*\\*/')).toBeVisible()
  })

  test('should be keyboard navigable', async () => {
    // Tab through form fields
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="broadcast-title-input"]')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="broadcast-message-input"]')).toBeFocused()
  })

  // ============ RESPONSIVE TESTS ============

  test('should be responsive on mobile viewport', async () => {
    await page.setViewportSize({ width: 375, height: 667 })

    await expect(page.locator('[data-testid="broadcast-title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="broadcast-message-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="broadcast-send-button"]')).toBeVisible()
  })

  test('should be responsive on tablet viewport', async () => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await expect(page.locator('[data-testid="broadcast-title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="broadcast-message-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="broadcast-send-button"]')).toBeVisible()
  })
})
