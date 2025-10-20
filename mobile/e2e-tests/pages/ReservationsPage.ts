import { Page, Locator } from '@playwright/test'

export class ReservationsPage {
  readonly page: Page
  readonly reservationsList: Locator
  readonly activeTab: Locator
  readonly completedTab: Locator
  readonly cancelledTab: Locator
  readonly emptyState: Locator
  readonly loadMoreButton: Locator

  constructor(page: Page) {
    this.page = page
    this.reservationsList = page.getByTestId('reservations-list')
    this.activeTab = page.getByTestId('active-reservations-tab')
    this.completedTab = page.getByTestId('completed-reservations-tab')
    this.cancelledTab = page.getByTestId('cancelled-reservations-tab')
    this.emptyState = page.getByTestId('empty-state')
    this.loadMoreButton = page.getByTestId('load-more-button')
  }

  async switchToActive() {
    await this.activeTab.click()
  }

  async switchToCompleted() {
    await this.completedTab.click()
  }

  async switchToCancelled() {
    await this.cancelledTab.click()
  }

  async clickReservation(reservationId: number) {
    await this.page.getByTestId(`reservation-card-${reservationId}`).click()
  }

  async clickReservationByIndex(index: number) {
    const reservations = this.reservationsList.locator('[data-testid^="reservation-card-"]')
    await reservations.nth(index).click()
  }

  async getReservationCount(): Promise<number> {
    const reservations = this.reservationsList.locator('[data-testid^="reservation-card-"]')
    return reservations.count()
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible({ timeout: 3000 }).catch(() => false)
  }

  async loadMore() {
    await this.loadMoreButton.scrollIntoViewIfNeeded()
    await this.loadMoreButton.click()
  }
}
