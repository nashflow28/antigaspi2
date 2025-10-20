import { Page, Locator } from '@playwright/test'

export class ProfilePage {
  readonly page: Page
  readonly userName: Locator
  readonly userEmail: Locator
  readonly userRole: Locator
  readonly editProfileButton: Locator
  readonly logoutButton: Locator
  readonly settingsButton: Locator
  readonly notificationsToggle: Locator
  readonly darkModeToggle: Locator
  readonly languageSelector: Locator
  readonly deleteAccountButton: Locator
  readonly loyaltyPoints: Locator
  readonly reservationsHistory: Locator

  constructor(page: Page) {
    this.page = page
    this.userName = page.getByTestId('profile-name')
    this.userEmail = page.getByTestId('profile-email')
    this.userRole = page.getByTestId('profile-role')
    this.editProfileButton = page.getByTestId('edit-profile-button')
    this.logoutButton = page.getByTestId('logout-button')
    this.settingsButton = page.getByTestId('settings-button')
    this.notificationsToggle = page.getByTestId('notifications-toggle')
    this.darkModeToggle = page.getByTestId('dark-mode-toggle')
    this.languageSelector = page.getByTestId('language-selector')
    this.deleteAccountButton = page.getByTestId('delete-account-button')
    this.loyaltyPoints = page.getByTestId('loyalty-points')
    this.reservationsHistory = page.getByTestId('reservations-history')
  }

  async editProfile() {
    await this.editProfileButton.click()
  }

  async logout() {
    await this.logoutButton.click()
  }

  async openSettings() {
    await this.settingsButton.click()
  }

  async toggleNotifications() {
    await this.notificationsToggle.click()
  }

  async toggleDarkMode() {
    await this.darkModeToggle.click()
  }

  async changeLanguage(language: 'fr' | 'en') {
    await this.languageSelector.click()
    await this.page.getByTestId(`language-option-${language}`).click()
  }

  async deleteAccount() {
    await this.deleteAccountButton.click()
  }

  async getUserName(): Promise<string> {
    return (await this.userName.textContent()) || ''
  }

  async getUserEmail(): Promise<string> {
    return (await this.userEmail.textContent()) || ''
  }
}
