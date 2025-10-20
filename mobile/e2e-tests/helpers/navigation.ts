import { Page } from '@playwright/test'

/**
 * Navigation helper functions for E2E tests
 */

export async function navigateToHome(page: Page) {
  const homeTab = page.getByTestId('home-tab').or(page.getByRole('button', { name: /accueil|home/i }))
  await homeTab.click()
  await page.waitForLoadState('networkidle')
}

export async function navigateToProducts(page: Page) {
  const productsTab = page.getByTestId('products-tab').or(page.getByRole('button', { name: /produits|products/i }))
  await productsTab.click()
  await page.waitForLoadState('networkidle')
}

export async function navigateToReservations(page: Page) {
  const reservationsTab = page.getByTestId('reservations-tab').or(page.getByRole('button', { name: /réservations|reservations/i }))
  await reservationsTab.click()
  await page.waitForLoadState('networkidle')
}

export async function navigateToProfile(page: Page) {
  const profileTab = page.getByTestId('profile-tab').or(page.getByRole('button', { name: /profil|profile/i }))
  await profileTab.click()
  await page.waitForLoadState('networkidle')
}

export async function navigateToProductDetail(page: Page, productId: number) {
  await navigateToProducts(page)

  // Click on product card
  const productCard = page.getByTestId(`product-card-${productId}`)
  await productCard.click()
  await page.waitForLoadState('networkidle')
}

export async function scrollToBottom(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
  })
  await page.waitForTimeout(500) // Wait for potential lazy loading
}

export async function scrollToElement(page: Page, testId: string) {
  const element = page.getByTestId(testId)
  await element.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
}

export async function waitForSkeletonToDisappear(page: Page) {
  // Wait for loading skeletons to disappear
  try {
    await page.waitForSelector('[data-testid*="skeleton"]', { state: 'hidden', timeout: 5000 })
  } catch {
    // Skeletons may not exist, continue
  }
}
