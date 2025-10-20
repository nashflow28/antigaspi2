import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly registerLink: Locator
  readonly errorMessage: Locator
  readonly forgotPasswordLink: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByTestId('login-email-input')
    this.passwordInput = page.getByTestId('login-password-input')
    this.submitButton = page.getByTestId('login-submit-button')
    this.registerLink = page.getByTestId('register-link').or(page.getByRole('link', { name: /créer un compte|s'inscrire/i }))
    this.errorMessage = page.getByRole('alert')
    this.forgotPasswordLink = page.getByTestId('forgot-password-link')
  }

  async goto() {
    await this.page.goto('/')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async clickRegister() {
    await this.registerLink.click()
  }

  async isErrorVisible(): Promise<boolean> {
    return this.errorMessage.isVisible({ timeout: 3000 }).catch(() => false)
  }
}
