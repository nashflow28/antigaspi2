import { expect, test } from '@playwright/test'

type ThemeMode = 'light' | 'dark'

type Viewport = {
  width: number
  height: number
}

const PRODUCT_ID = 42

const productApiResponse = {
  success: true,
  data: {
    id: PRODUCT_ID,
    name: 'Panier signature anti-gaspi',
    description: 'Sélection premium de fruits et légumes sauvés du gaspillage, avec conseils de dégustation.',
    original_price: 18000,
    discounted_price: 10900,
    quantity_available: 9,
    expiration_date: '2030-06-18T17:00:00.000Z',
    image_url: 'https://images.antigaspi.dev/products/panier-signature.jpg',
    discount_percentage: 40,
    category: { id: 3, name: 'Fruits et Légumes' },
    merchant: {
      id: 7,
      business_name: 'La Ferme Urbaine',
      address: '12 avenue des Serres, Abidjan',
      phone: '+225 01 23 45 67'
    },
    is_surprise_basket: true,
    is_expired: false,
    is_expiring_soon: false,
    related_products: [
      {
        id: 84,
        name: 'Mini panier brunch',
        discounted_price: 6900,
        quantity_available: 6,
        merchant: { business_name: 'Atelier des Saveurs' },
        image_url: 'https://images.antigaspi.dev/products/mini-brunch.jpg'
      },
      {
        id: 96,
        name: 'Sélection fromagère',
        discounted_price: 12900,
        quantity_available: 4,
        merchant: { business_name: 'Maison du Terroir' },
        image_url: 'https://images.antigaspi.dev/products/fromage.jpg'
      },
      {
        id: 58,
        name: 'Panier découverte bio',
        discounted_price: 8200,
        quantity_available: 10,
        merchant: { business_name: 'Marché Bio Riviera' },
        image_url: 'https://images.antigaspi.dev/products/decouverte-bio.jpg'
      }
    ]
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

const interceptProduct = async (page: import('@playwright/test').Page) => {
  await page.route('**/api/products/' + PRODUCT_ID, async route => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(productApiResponse)
    })
  })
}

const gotoProductDetail = async (
  page: import('@playwright/test').Page,
  options: { theme: ThemeMode; viewport: Viewport }
) => {
  await page.setViewportSize(options.viewport)
  await disableAnimations(page)
  await seedTheme(page, options.theme)
  await interceptProduct(page)

  await page.goto(`/products/${PRODUCT_ID}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: productApiResponse.data.name })).toBeVisible()
  await expect(page.getByText('Chargement du produit...')).toHaveCount(0)
}

test.describe('ProductDetailView2025 visual regression', () => {
  test('desktop light mode', async ({ page }) => {
    await gotoProductDetail(page, {
      theme: 'light',
      viewport: { width: 1440, height: 900 }
    })

    await expect(page).toHaveScreenshot('product-detail-desktop-light.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true
    })
  })

  test('desktop dark mode', async ({ page }) => {
    await gotoProductDetail(page, {
      theme: 'dark',
      viewport: { width: 1440, height: 900 }
    })

    await expect(page).toHaveScreenshot('product-detail-desktop-dark.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true
    })
  })

  test('mobile light mode', async ({ page }) => {
    await gotoProductDetail(page, {
      theme: 'light',
      viewport: { width: 390, height: 844 }
    })

    await expect(page).toHaveScreenshot('product-detail-mobile-light.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true
    })
  })

  test('mobile dark mode', async ({ page }) => {
    await gotoProductDetail(page, {
      theme: 'dark',
      viewport: { width: 390, height: 844 }
    })

    await expect(page).toHaveScreenshot('product-detail-mobile-dark.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true
    })
  })
})
