// @ts-nocheck
import { test, expect } from '@playwright/test'
import { testUsers } from '../../fixtures/users'
import { login } from '../../helpers/auth'
import { navigateToProducts } from '../../helpers/navigation'

test.describe('Performance Tests', () => {
  test('01 - Initial page load should be under 3 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)
  })

  test('02 - Login should complete within 5 seconds', async ({ page }) => {
    await page.goto('/')

    const startTime = Date.now()

    await login(page, testUsers.consumer)

    const loginTime = Date.now() - startTime
    expect(loginTime).toBeLessThan(5000)
  })

  test('03 - Products list should load within 2 seconds', async ({ page }) => {
    await login(page, testUsers.consumer)

    const startTime = Date.now()

    await navigateToProducts(page)

    await page.waitForSelector('[data-testid="products-list"]', { state: 'visible' })

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2000)
  })

  test('04 - Images should lazy load properly', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProducts(page)

    // Check that images have loading="lazy" attribute
    const images = page.locator('img')
    const firstImage = images.first()

    if (await firstImage.isVisible()) {
      const loading = await firstImage.getAttribute('loading')
      expect(loading).toBe('lazy')
    }
  })

  test('05 - Bundle size should be reasonable (< 500KB JS)', async ({ page }) => {
    // Measure network payload
    const requests: number[] = []

    page.on('response', (response) => {
      const url = response.url()
      if (url.endsWith('.js') || url.endsWith('.bundle.js')) {
        response.body().then((body) => {
          requests.push(body.length)
        }).catch(() => {})
      }
    })

    await page.goto('/')

    await page.waitForLoadState('networkidle')

    // Total JS should be reasonable
    const totalSize = requests.reduce((sum, size) => sum + size, 0)
    expect(totalSize).toBeLessThan(500 * 1024) // 500KB
  })

  test('06 - API requests should complete within 1 second', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Monitor API requests
    const apiTimes: number[] = []

    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        const timing = response.timing()
        apiTimes.push(timing.responseEnd - timing.requestStart)
      }
    })

    await navigateToProducts(page)

    await page.waitForLoadState('networkidle')

    // All API requests should be fast
    apiTimes.forEach((time) => {
      expect(time).toBeLessThan(1000)
    })
  })

  test('07 - Scroll performance should be smooth (no jank)', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProducts(page)

    // Measure scroll performance
    const scrollMetrics = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0
        const startTime = performance.now()

        function countFrame() {
          frameCount++
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrame)
          } else {
            resolve(frameCount)
          }
        }

        window.scrollTo(0, 500)
        requestAnimationFrame(countFrame)
      })
    })

    // Should have at least 30 FPS (30 frames in 1 second)
    expect(scrollMetrics).toBeGreaterThan(30)
  })

  test('08 - No memory leaks on navigation', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Get initial memory
    const initialMetrics = await page.metrics()
    const initialJSHeap = initialMetrics.JSHeapUsedSize || 0

    // Navigate multiple times
    for (let i = 0; i < 5; i++) {
      await navigateToProducts(page)
      await page.goto('/')
    }

    // Get final memory
    const finalMetrics = await page.metrics()
    const finalJSHeap = finalMetrics.JSHeapUsedSize || 0

    // Memory should not grow excessively (allow 10MB growth)
    const memoryGrowth = finalJSHeap - initialJSHeap
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
  })

  test('09 - Network requests should be minimal (< 20 requests)', async ({ page }) => {
    const requests: string[] = []

    page.on('request', (request) => {
      requests.push(request.url())
    })

    await page.goto('/')

    await page.waitForLoadState('networkidle')

    expect(requests.length).toBeLessThan(20)
  })

  test('10 - Should cache static assets properly', async ({ page }) => {
    await page.goto('/')

    await page.waitForLoadState('networkidle')

    // Navigate away and back
    await page.goto('about:blank')
    await page.goto('/')

    // Check that resources are loaded from cache
    const cachedRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource').filter((entry: any) => {
        return entry.transferSize === 0 && entry.decodedBodySize > 0
      }).length
    })

    // Should have some cached resources
    expect(cachedRequests).toBeGreaterThan(0)
  })
})
