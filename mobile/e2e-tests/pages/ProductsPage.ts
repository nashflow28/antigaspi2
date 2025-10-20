import { Page, Locator } from '@playwright/test'

export class ProductsPage {
  readonly page: Page
  readonly productsList: Locator
  readonly filterButton: Locator
  readonly sortButton: Locator
  readonly searchInput: Locator
  readonly categoryFilter: Locator
  readonly priceFilter: Locator
  readonly loadMoreButton: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    this.page = page
    this.productsList = page.getByTestId('products-list')
    this.filterButton = page.getByTestId('filter-button')
    this.sortButton = page.getByTestId('sort-button')
    this.searchInput = page.getByTestId('products-search')
    this.categoryFilter = page.getByTestId('category-filter')
    this.priceFilter = page.getByTestId('price-filter')
    this.loadMoreButton = page.getByTestId('load-more-button')
    this.emptyState = page.getByTestId('empty-state')
  }

  async clickProduct(productId: number) {
    await this.page.getByTestId(`product-card-${productId}`).click()
  }

  async clickProductByName(productName: string) {
    await this.page.getByText(productName).click()
  }

  async applyFilter(filterType: 'category' | 'price', value: string) {
    await this.filterButton.click()

    if (filterType === 'category') {
      await this.page.getByText(value).click()
    } else if (filterType === 'price') {
      await this.page.getByTestId(`price-range-${value}`).click()
    }

    await this.page.getByTestId('apply-filters').click()
  }

  async sortBy(sortOption: 'price-asc' | 'price-desc' | 'date' | 'discount') {
    await this.sortButton.click()
    await this.page.getByTestId(`sort-${sortOption}`).click()
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.page.keyboard.press('Enter')
  }

  async loadMore() {
    await this.loadMoreButton.scrollIntoViewIfNeeded()
    await this.loadMoreButton.click()
  }

  async getProductCount(): Promise<number> {
    const products = this.productsList.locator('[data-testid^="product-card-"]')
    return products.count()
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible({ timeout: 3000 }).catch(() => false)
  }
}
