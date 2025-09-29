import { expect, test } from '@playwright/test'

type ThemeMode = 'light' | 'dark'

type Viewport = {
  width: number
  height: number
}

const RESERVATION_ID = 512

const reservationApiResponse = {
  success: true,
  data: {
    id: RESERVATION_ID,
    reservation_code: 'ANT-512',
    quantity: 2,
    quantity_reserved: 2,
    original_price: 12000,
    discounted_price: 8400,
    total_amount: 16800,
    status: 'confirmed' as const,
    pickup_date: '2030-06-19T09:30:00.000Z',
    pickup_notes: 'Présentez votre QR code et votre sac isotherme à l\'arrivée.',
    reserved_at: '2030-06-17T16:00:00.000Z',
    product: {
      id: 42,
      name: 'Panier signature anti-gaspi',
      description: 'Sélection premium de produits frais sauvés du gaspillage.',
      image_url: 'https://images.antigaspi.dev/products/panier-signature.jpg',
      original_price: 12000,
      discounted_price: 8400,
      merchant: {
        id: 7,
        name: 'La Ferme Urbaine',
        address: '12 avenue des Serres, Abidjan',
        phone: '+225 01 23 45 67'
      }
    }
  }
}

const disableAnimations = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.id = 'disable-animations'
    style.innerHTML = `
      *, *::before, *::after {
        transition-property: none !important;
        animation: none !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
    `
    document.head.appendChild(style)
  })
}

const seedTheme = async (page: import('@playwright/test').Page, theme: ThemeMode) => {
  await page.addInitScript((selectedTheme: ThemeMode) => {
    window.localStorage.setItem('theme', selectedTheme)
  }, theme)
  await page.emulateMedia({ colorScheme: theme })
}

const seedAuth = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('auth_token', 'visual-snapshot-token')
    window.localStorage.setItem('user', JSON.stringify({
      id: 24,
      name: 'Awa Traoré',
      email: 'awa.traore@example.com',
      role: 'consumer',
      phone: '+225 07 00 11 22'
    }))
  })
}

const interceptReservation = async (page: import('@playwright/test').Page) => {
  await page.route('**/api/reservations/' + RESERVATION_ID, async route => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(reservationApiResponse)
    })
  })
}

const gotoReservationDetail = async (
  page: import('@playwright/test').Page,
  options: { theme: ThemeMode; viewport: Viewport }
) => {
  await page.setViewportSize(options.viewport)
  await disableAnimations(page)
  await seedTheme(page, options.theme)
  await seedAuth(page)
  await interceptReservation(page)

  await page.goto(`/reservations/${RESERVATION_ID}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: reservationApiResponse.data.product.name })).toBeVisible()
  await expect(page.getByText('Erreur de chargement')).toHaveCount(0)
}

test.describe('ReservationDetailView2025 visual regression', () => {
  test('desktop light mode', async ({ page }) => {
    await gotoReservationDetail(page, {
      theme: 'light',
      viewport: { width: 1440, height: 900 }
    })

    await expect(page).toHaveScreenshot('reservation-detail-desktop-light.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true
    })
  })

  test('desktop dark mode', async ({ page }) => {
    await gotoReservationDetail(page, {
      theme: 'dark',
      viewport: { width: 1440, height: 900 }
    })

    await expect(page).toHaveScreenshot('reservation-detail-desktop-dark.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true
    })
  })

  test('mobile light mode', async ({ page }) => {
    await gotoReservationDetail(page, {
      theme: 'light',
      viewport: { width: 390, height: 844 }
    })

    await expect(page).toHaveScreenshot('reservation-detail-mobile-light.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true
    })
  })

  test('mobile dark mode', async ({ page }) => {
    await gotoReservationDetail(page, {
      theme: 'dark',
      viewport: { width: 390, height: 844 }
    })

    await expect(page).toHaveScreenshot('reservation-detail-mobile-dark.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true
    })
  })
})
