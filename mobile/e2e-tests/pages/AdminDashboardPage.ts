import { Page, Locator } from '@playwright/test'

export class AdminDashboardPage {
  readonly page: Page
  readonly welcomeMessage: Locator
  readonly totalUsers: Locator
  readonly totalProducts: Locator
  readonly totalReservations: Locator
  readonly totalRevenue: Locator
  readonly usersSection: Locator
  readonly productsSection: Locator
  readonly analyticsSection: Locator
  readonly moderationQueue: Locator

  constructor(page: Page) {
    this.page = page
    this.welcomeMessage = page.getByTestId('admin-welcome')
    this.totalUsers = page.getByTestId('total-users-stat')
    this.totalProducts = page.getByTestId('admin-total-products-stat')
    this.totalReservations = page.getByTestId('admin-total-reservations-stat')
    this.totalRevenue = page.getByTestId('admin-total-revenue-stat')
    this.usersSection = page.getByTestId('admin-users-section')
    this.productsSection = page.getByTestId('admin-products-section')
    this.analyticsSection = page.getByTestId('admin-analytics-section')
    this.moderationQueue = page.getByTestId('moderation-queue')
  }

  async navigateToUsers() {
    await this.usersSection.click()
  }

  async navigateToProducts() {
    await this.productsSection.click()
  }

  async navigateToAnalytics() {
    await this.analyticsSection.click()
  }
}
