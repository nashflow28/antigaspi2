import { Page, Locator } from '@playwright/test'

export class MerchantDashboardPage {
  readonly page: Page
  readonly welcomeMessage: Locator
  readonly totalProducts: Locator
  readonly activeReservations: Locator
  readonly todayRevenue: Locator
  readonly addProductButton: Locator
  readonly myProductsList: Locator
  readonly reservationsList: Locator
  readonly analyticsSection: Locator

  constructor(page: Page) {
    this.page = page
    this.welcomeMessage = page.getByTestId('merchant-welcome')
    this.totalProducts = page.getByTestId('total-products-stat')
    this.activeReservations = page.getByTestId('active-reservations-stat')
    this.todayRevenue = page.getByTestId('today-revenue-stat')
    this.addProductButton = page.getByTestId('add-product-button')
    this.myProductsList = page.getByTestId('merchant-products-list')
    this.reservationsList = page.getByTestId('merchant-reservations-list')
    this.analyticsSection = page.getByTestId('analytics-section')
  }

  async clickAddProduct() {
    await this.addProductButton.click()
  }

  async clickProduct(productId: number) {
    await this.page.getByTestId(`merchant-product-${productId}`).click()
  }

  async clickReservation(reservationId: number) {
    await this.page.getByTestId(`merchant-reservation-${reservationId}`).click()
  }

  async getTotalProducts(): Promise<number> {
    const text = await this.totalProducts.textContent()
    return parseInt(text?.replace(/\D/g, '') || '0')
  }

  async getActiveReservations(): Promise<number> {
    const text = await this.activeReservations.textContent()
    return parseInt(text?.replace(/\D/g, '') || '0')
  }
}
