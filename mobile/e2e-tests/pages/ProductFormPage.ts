import { Page, Locator } from '@playwright/test'

export class ProductFormPage {
  readonly page: Page
  readonly nameInput: Locator
  readonly descriptionInput: Locator
  readonly categorySelect: Locator
  readonly originalPriceInput: Locator
  readonly discountedPriceInput: Locator
  readonly quantityInput: Locator
  readonly expirationDateInput: Locator
  readonly imageUpload: Locator
  readonly imagePreview: Locator
  readonly submitButton: Locator
  readonly cancelButton: Locator
  readonly deleteButton: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.getByTestId('product-name-input')
    this.descriptionInput = page.getByTestId('product-description-input')
    this.categorySelect = page.getByTestId('product-category-select')
    this.originalPriceInput = page.getByTestId('product-original-price-input')
    this.discountedPriceInput = page.getByTestId('product-discounted-price-input')
    this.quantityInput = page.getByTestId('product-quantity-input')
    this.expirationDateInput = page.getByTestId('product-expiration-date-input')
    this.imageUpload = page.getByTestId('product-image-upload')
    this.imagePreview = page.getByTestId('product-image-preview')
    this.submitButton = page.getByTestId('submit-product-button')
    this.cancelButton = page.getByTestId('cancel-product-button')
    this.deleteButton = page.getByTestId('delete-product-button')
  }

  async fillProductForm(product: {
    name: string
    description: string
    category: string
    originalPrice: number
    discountedPrice: number
    quantity: number
    expirationDate: string
  }) {
    await this.nameInput.fill(product.name)
    await this.descriptionInput.fill(product.description)
    await this.categorySelect.selectOption(product.category)
    await this.originalPriceInput.fill(product.originalPrice.toString())
    await this.discountedPriceInput.fill(product.discountedPrice.toString())
    await this.quantityInput.fill(product.quantity.toString())
    await this.expirationDateInput.fill(product.expirationDate)
  }

  async uploadImage(imagePath: string) {
    await this.imageUpload.setInputFiles(imagePath)
  }

  async submit() {
    await this.submitButton.click()
  }

  async cancel() {
    await this.cancelButton.click()
  }

  async delete() {
    await this.deleteButton.click()
  }

  async isImagePreviewVisible(): Promise<boolean> {
    return this.imagePreview.isVisible({ timeout: 3000 }).catch(() => false)
  }
}
