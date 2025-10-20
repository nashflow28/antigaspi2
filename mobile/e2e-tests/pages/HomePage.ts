import { Page, Locator } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly welcomeMessage: Locator
  readonly featuredProducts: Locator
  readonly searchBar: Locator
  readonly categoryFilters: Locator
  readonly productsTab: Locator
  readonly reservationsTab: Locator
  readonly profileTab: Locator

  constructor(page: Page) {
    this.page = page
    this.welcomeMessage = page.getByTestId('home-welcome')
    this.featuredProducts = page.getByTestId('featured-products')
    this.searchBar = page.getByTestId('search-input')
    this.categoryFilters = page.getByTestId('category-filters')
    this.productsTab = page.getByTestId('products-tab')
    this.reservationsTab = page.getByTestId('reservations-tab')
    this.profileTab = page.getByTestId('profile-tab')
  }

  async searchProduct(query: string) {
    await this.searchBar.fill(query)
    await this.page.keyboard.press('Enter')
  }

  async selectCategory(categoryName: string) {
    await this.page.getByText(categoryName).click()
  }

  async navigateToProducts() {
    await this.productsTab.click()
  }

  async navigateToReservations() {
    await this.reservationsTab.click()
  }

  async navigateToProfile() {
    await this.profileTab.click()
  }

  async clickFeaturedProduct(productIndex: number) {
    const products = this.featuredProducts.locator('[data-testid^="product-card-"]')
    await products.nth(productIndex).click()
  }
}
