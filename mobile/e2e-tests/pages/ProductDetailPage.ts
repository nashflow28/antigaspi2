import { Page, Locator } from '@playwright/test'

export class ProductDetailPage {
  readonly page: Page
  readonly productName: Locator
  readonly productImage: Locator
  readonly originalPrice: Locator
  readonly discountedPrice: Locator
  readonly discountBadge: Locator
  readonly description: Locator
  readonly category: Locator
  readonly expirationDate: Locator
  readonly merchantName: Locator
  readonly merchantAddress: Locator
  readonly quantitySelector: Locator
  readonly quantityIncrement: Locator
  readonly quantityDecrement: Locator
  readonly reserveButton: Locator
  readonly backButton: Locator
  readonly shareButton: Locator
  readonly favoriteButton: Locator

  constructor(page: Page) {
    this.page = page
    this.productName = page.getByTestId('product-name')
    this.productImage = page.getByTestId('product-image')
    this.originalPrice = page.getByTestId('original-price')
    this.discountedPrice = page.getByTestId('discounted-price')
    this.discountBadge = page.getByTestId('discount-badge')
    this.description = page.getByTestId('product-description')
    this.category = page.getByTestId('product-category')
    this.expirationDate = page.getByTestId('expiration-date')
    this.merchantName = page.getByTestId('merchant-name')
    this.merchantAddress = page.getByTestId('merchant-address')
    this.quantitySelector = page.getByTestId('quantity-selector')
    this.quantityIncrement = page.getByTestId('quantity-increment')
    this.quantityDecrement = page.getByTestId('quantity-decrement')
    this.reserveButton = page.getByTestId('reserve-button')
    this.backButton = page.getByTestId('back-button')
    this.shareButton = page.getByTestId('share-button')
    this.favoriteButton = page.getByTestId('favorite-button')
  }

  async setQuantity(quantity: number) {
    const currentQuantity = await this.quantitySelector.inputValue()
    const current = parseInt(currentQuantity) || 1

    if (quantity > current) {
      const clicks = quantity - current
      for (let i = 0; i < clicks; i++) {
        await this.quantityIncrement.click()
      }
    } else if (quantity < current) {
      const clicks = current - quantity
      for (let i = 0; i < clicks; i++) {
        await this.quantityDecrement.click()
      }
    }
  }

  async reserve(quantity: number = 1) {
    await this.setQuantity(quantity)
    await this.reserveButton.click()
  }

  async goBack() {
    await this.backButton.click()
  }

  async toggleFavorite() {
    await this.favoriteButton.click()
  }

  async share() {
    await this.shareButton.click()
  }

  async getDiscountPercentage(): Promise<string> {
    const badgeText = await this.discountBadge.textContent()
    return badgeText || ''
  }
}
