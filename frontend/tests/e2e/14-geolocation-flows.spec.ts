import { test, expect } from '@playwright/test'

// Mock data
const mockUser = {
  id: 1,
  email: 'jean.dupont@email.com',
  name: 'Jean Dupont',
  role: 'consumer'
}

const mockNearbyMerchants = [
  {
    id: 1,
    business_name: 'Boulangerie Martin',
    address: 'Avenue de la Liberation, Lome',
    latitude: 6.1319,
    longitude: 1.2228,
    distance: 0.5,
    rating: 4.5,
    products_count: 12
  },
  {
    id: 2,
    business_name: 'Supermarche Central',
    address: 'Boulevard du 13 Janvier, Lome',
    latitude: 6.1350,
    longitude: 1.2150,
    distance: 1.2,
    rating: 4.0,
    products_count: 25
  },
  {
    id: 3,
    business_name: 'Fruits et Legumes Kara',
    address: 'Quartier Administratif, Kara',
    latitude: 9.5511,
    longitude: 1.1865,
    distance: 350.0,
    rating: 4.8,
    products_count: 8
  }
]

const mockGeocodeResult = {
  latitude: 6.1319,
  longitude: 1.2228,
  display_name: 'Lome, Maritime, Togo'
}

const mockReverseGeocodeResult = {
  display_name: 'Avenue de la Liberation, Lome, Maritime, Togo',
  address: {
    road: 'Avenue de la Liberation',
    city: 'Lome',
    state: 'Maritime',
    country: 'Togo'
  }
}

test.describe('Geolocation - Location Services', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'jean.dupont@email.com',
        name: 'Jean Dupont',
        role: 'consumer'
      }))
    })

    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser })
      })
    })
  })

  test('User can enable location services', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 6.1319, longitude: 1.2228 })

    await page.goto('http://localhost:3000')

    // Look for location permission prompt or button
    const enableLocationBtn = page.locator('[data-testid="enable-location"]')
    if (await enableLocationBtn.isVisible()) {
      await enableLocationBtn.click()

      // Should show location enabled state
      const locationEnabled = page.locator('[data-testid="location-enabled"]')
      const locationIcon = page.locator('[data-testid="location-icon-active"]')

      await expect(locationEnabled.or(locationIcon)).toBeVisible({ timeout: 5000 })
    }
  })

  test('User can search address manually', async ({ page }) => {
    await page.route('**/api/geocoding/search*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { latitude: 6.1319, longitude: 1.2228, display_name: 'Lome, Maritime, Togo' },
            { latitude: 6.1350, longitude: 1.2150, display_name: 'Lome Centre, Maritime, Togo' }
          ]
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const searchInput = page.locator('[data-testid="location-search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Lome')

      // Wait for suggestions
      const suggestions = page.locator('[data-testid="location-suggestions"]')
      await expect(suggestions).toBeVisible({ timeout: 5000 })

      // Should show multiple results
      const suggestionItems = suggestions.locator('[data-testid="suggestion-item"]')
      await expect(suggestionItems.first()).toBeVisible()
    }
  })

  test('User can geocode an address', async ({ page }) => {
    await page.route('**/api/geocoding/geocode*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockGeocodeResult
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const searchInput = page.locator('[data-testid="location-search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Avenue de la Liberation, Lome')

      const searchButton = page.locator('[data-testid="search-location-btn"]')
      if (await searchButton.isVisible()) {
        await searchButton.click()

        // Should update location display
        const locationDisplay = page.locator('[data-testid="current-location"]')
        await expect(locationDisplay).toContainText('Lome')
      }
    }
  })

  test('User can get current location name (reverse geocode)', async ({ page, context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 6.1319, longitude: 1.2228 })

    await page.route('**/api/geocoding/reverse*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockReverseGeocodeResult
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const myLocationBtn = page.locator('[data-testid="use-my-location"]')
    if (await myLocationBtn.isVisible()) {
      await myLocationBtn.click()

      // Should show resolved address
      const addressDisplay = page.locator('[data-testid="current-address"]')
      await expect(addressDisplay).toContainText('Liberation')
    }
  })
})

test.describe('Geolocation - Nearby Merchants', () => {
  test.beforeEach(async ({ page, context }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'jean.dupont@email.com',
        role: 'consumer'
      }))
    })

    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 6.1319, longitude: 1.2228 })

    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser })
      })
    })
  })

  test('User can view nearby merchants', async ({ page }) => {
    await page.route('**/api/merchants/nearby*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockNearbyMerchants.slice(0, 2) // Only nearby ones
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const merchantList = page.locator('[data-testid="nearby-merchants"]')
    if (await merchantList.isVisible()) {
      const merchantCards = merchantList.locator('[data-testid="merchant-card"]')
      await expect(merchantCards).toHaveCount(2)

      // Should show distance
      await expect(merchantList).toContainText('km')
    }
  })

  test('Merchants are sorted by distance', async ({ page }) => {
    await page.route('**/api/merchants/nearby*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockNearbyMerchants
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const merchantList = page.locator('[data-testid="nearby-merchants"]')
    if (await merchantList.isVisible()) {
      const distances = await merchantList.locator('[data-testid="merchant-distance"]').allTextContents()

      // First merchant should be closer
      if (distances.length >= 2) {
        const firstDistance = parseFloat(distances[0].replace(/[^0-9.]/g, ''))
        const secondDistance = parseFloat(distances[1].replace(/[^0-9.]/g, ''))
        expect(firstDistance).toBeLessThanOrEqual(secondDistance)
      }
    }
  })

  test('User can filter merchants by radius', async ({ page }) => {
    await page.route('**/api/merchants/nearby*', route => {
      const url = new URL(route.request().url())
      const radius = url.searchParams.get('radius')

      let filteredMerchants = mockNearbyMerchants
      if (radius) {
        const maxDistance = parseFloat(radius)
        filteredMerchants = mockNearbyMerchants.filter(m => m.distance <= maxDistance)
      }

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: filteredMerchants
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const radiusFilter = page.locator('[data-testid="radius-filter"]')
    if (await radiusFilter.isVisible()) {
      // Select 1km radius
      await radiusFilter.selectOption('1')

      // Wait for filtered results
      await page.waitForResponse('**/api/merchants/nearby*')

      const merchantList = page.locator('[data-testid="nearby-merchants"]')
      const merchantCards = merchantList.locator('[data-testid="merchant-card"]')

      // Should only show merchants within 1km
      await expect(merchantCards).toHaveCount(1) // Only Boulangerie Martin (0.5km)
    }
  })

  test('User can view merchant on map', async ({ page }) => {
    await page.route('**/api/merchants/nearby*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockNearbyMerchants
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const mapToggle = page.locator('[data-testid="map-view-toggle"]')
    if (await mapToggle.isVisible()) {
      await mapToggle.click()

      // Map should be visible
      const mapContainer = page.locator('[data-testid="merchants-map"]')
      await expect(mapContainer).toBeVisible({ timeout: 10000 })

      // Should show merchant markers
      const markers = mapContainer.locator('[data-testid="merchant-marker"]')
      await expect(markers.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('User can get directions to merchant', async ({ page }) => {
    await page.route('**/api/merchants/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockNearbyMerchants[0]
        })
      })
    })

    await page.goto('http://localhost:3000/merchants/1')

    const directionsBtn = page.locator('[data-testid="get-directions"]')
    if (await directionsBtn.isVisible()) {
      // Mock window.open for external maps
      await page.evaluate(() => {
        window.open = (url) => {
          (window as any).__lastOpenedUrl = url
          return null
        }
      })

      await directionsBtn.click()

      // Should open maps app/website
      const openedUrl = await page.evaluate(() => (window as any).__lastOpenedUrl)
      expect(openedUrl).toContain('maps')
    }
  })
})

test.describe('Geolocation - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'jean.dupont@email.com',
        role: 'consumer'
      }))
    })

    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser })
      })
    })
  })

  test('Shows error when location permission denied', async ({ page, context }) => {
    // Deny geolocation permission
    await context.clearPermissions()

    await page.goto('http://localhost:3000/discover')

    const enableLocationBtn = page.locator('[data-testid="enable-location"]')
    if (await enableLocationBtn.isVisible()) {
      await enableLocationBtn.click()

      // Should show permission denied message
      const errorMessage = page.locator('[data-testid="location-error"]')
      const permissionDenied = page.locator('text=permission').or(page.locator('text=autorise'))

      await expect(errorMessage.or(permissionDenied)).toBeVisible({ timeout: 5000 })
    }
  })

  test('Shows error when address not found', async ({ page }) => {
    await page.route('**/api/geocoding/geocode*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Address not found'
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const searchInput = page.locator('[data-testid="location-search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('NonexistentPlace12345')

      const searchButton = page.locator('[data-testid="search-location-btn"]')
      if (await searchButton.isVisible()) {
        await searchButton.click()

        // Should show not found message
        const notFoundMessage = page.locator('[data-testid="address-not-found"]')
        const errorText = page.locator('text=trouve').or(page.locator('text=found'))

        await expect(notFoundMessage.or(errorText)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('Shows empty state when no merchants nearby', async ({ page, context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 0, longitude: 0 }) // Middle of ocean

    await page.route('**/api/merchants/nearby*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: []
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const emptyState = page.locator('[data-testid="no-merchants-nearby"]')
    const emptyMessage = page.locator('text=aucun').or(page.locator('text=no merchants'))

    await expect(emptyState.or(emptyMessage)).toBeVisible({ timeout: 10000 })
  })

  test('Handles geocoding API errors gracefully', async ({ page }) => {
    await page.route('**/api/geocoding/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Service temporarily unavailable'
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const searchInput = page.locator('[data-testid="location-search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Lome')

      const searchButton = page.locator('[data-testid="search-location-btn"]')
      if (await searchButton.isVisible()) {
        await searchButton.click()

        // Should show error message
        const errorMessage = page.locator('[data-testid="geocoding-error"]')
        const serviceError = page.locator('text=erreur').or(page.locator('text=error'))

        await expect(errorMessage.or(serviceError)).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

test.describe('Geolocation - Togo Specific', () => {
  test.beforeEach(async ({ page, context }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'jean.dupont@email.com',
        role: 'consumer'
      }))
    })

    await context.grantPermissions(['geolocation'])

    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser })
      })
    })
  })

  test('Can search Togo cities', async ({ page }) => {
    const togoCities = [
      { name: 'Lome', lat: 6.1319, lon: 1.2228 },
      { name: 'Kara', lat: 9.5511, lon: 1.1865 },
      { name: 'Sokode', lat: 8.9833, lon: 1.1333 },
      { name: 'Atakpame', lat: 7.5333, lon: 1.1167 }
    ]

    await page.route('**/api/geocoding/search*', route => {
      const url = new URL(route.request().url())
      const query = url.searchParams.get('query')?.toLowerCase() || ''

      const matchingCities = togoCities.filter(c =>
        c.name.toLowerCase().includes(query)
      )

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: matchingCities.map(c => ({
            latitude: c.lat,
            longitude: c.lon,
            display_name: `${c.name}, Togo`
          }))
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const searchInput = page.locator('[data-testid="location-search"]')
    if (await searchInput.isVisible()) {
      for (const city of togoCities) {
        await searchInput.fill(city.name)

        const suggestions = page.locator('[data-testid="location-suggestions"]')
        if (await suggestions.isVisible()) {
          await expect(suggestions).toContainText(city.name)
        }

        await searchInput.clear()
      }
    }
  })

  test('Distance calculations are accurate for Togo geography', async ({ page, context }) => {
    // Set location to Lome
    await context.setGeolocation({ latitude: 6.1319, longitude: 1.2228 })

    await page.route('**/api/merchants/nearby*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              business_name: 'Shop Lome',
              latitude: 6.1350,
              longitude: 1.2250,
              distance: 0.4 // About 400m away
            },
            {
              id: 2,
              business_name: 'Shop Kara',
              latitude: 9.5511,
              longitude: 1.1865,
              distance: 380 // About 380km to Kara
            }
          ]
        })
      })
    })

    await page.goto('http://localhost:3000/discover')

    const merchantList = page.locator('[data-testid="nearby-merchants"]')
    if (await merchantList.isVisible()) {
      // Verify distances are shown in appropriate units
      const distances = await merchantList.locator('[data-testid="merchant-distance"]').allTextContents()

      if (distances.length >= 2) {
        // First should be in meters or small km
        expect(distances[0]).toMatch(/0\.\d|m/)
        // Second should be in km (large distance)
        expect(distances[1]).toMatch(/\d+.*km/)
      }
    }
  })
})
