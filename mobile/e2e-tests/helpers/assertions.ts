import { Page, expect } from '@playwright/test'

/**
 * Custom assertion helpers for E2E tests
 */

export async function assertProductVisible(page: Page, productName: string) {
  await expect(page.getByText(productName)).toBeVisible({ timeout: 10000 })
}

export async function assertPriceFormat(page: Page, price: number) {
  // XOF currency format: "250 XOF" or "250 FCFA"
  const priceRegex = new RegExp(`${price}\\s*(XOF|FCFA)`, 'i')
  await expect(page.getByText(priceRegex)).toBeVisible()
}

export async function assertNotificationVisible(page: Page, message: string) {
  const notification = page.getByRole('alert').or(page.getByTestId('notification'))
  await expect(notification.filter({ hasText: message })).toBeVisible({ timeout: 5000 })
}

export async function assertErrorMessage(page: Page, errorText: string) {
  const error = page.getByRole('alert').or(page.getByText(errorText))
  await expect(error).toBeVisible({ timeout: 5000 })
}

export async function assertUrlContains(page: Page, urlFragment: string) {
  await expect(page).toHaveURL(new RegExp(urlFragment))
}

export async function assertButtonEnabled(page: Page, buttonTestId: string) {
  const button = page.getByTestId(buttonTestId)
  await expect(button).toBeEnabled()
}

export async function assertButtonDisabled(page: Page, buttonTestId: string) {
  const button = page.getByTestId(buttonTestId)
  await expect(button).toBeDisabled()
}

export async function assertLoadingState(page: Page, isLoading: boolean) {
  const loader = page.getByTestId('loading-indicator').or(page.getByRole('progressbar'))

  if (isLoading) {
    await expect(loader).toBeVisible({ timeout: 2000 })
  } else {
    await expect(loader).toBeHidden({ timeout: 5000 })
  }
}

export async function assertEmptyState(page: Page, message: string) {
  const emptyState = page.getByTestId('empty-state').or(page.getByText(message))
  await expect(emptyState).toBeVisible()
}
