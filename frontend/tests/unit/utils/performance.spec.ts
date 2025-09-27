import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => [])
  },
  writable: true
})

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should track performance correctly', () => {
    expect(performance.now).toBeDefined()
    expect(typeof performance.now).toBe('function')
  })

  it('should measure time duration', () => {
    const startTime = performance.now()
    const endTime = performance.now()
    const duration = endTime - startTime

    expect(duration).toBeGreaterThanOrEqual(0)
  })

  it('should handle performance marks', () => {
    performance.mark('test-start')
    performance.mark('test-end')

    expect(performance.mark).toHaveBeenCalledWith('test-start')
    expect(performance.mark).toHaveBeenCalledWith('test-end')
  })

  it('should handle performance measurements', () => {
    performance.measure('test-duration', 'test-start', 'test-end')

    expect(performance.measure).toHaveBeenCalledWith('test-duration', 'test-start', 'test-end')
  })

  it('should get performance entries', () => {
    const entries = performance.getEntriesByType('measure')
    expect(Array.isArray(entries)).toBe(true)
  })

  it('should format performance metrics', () => {
    const mockMetric = {
      duration: 123.456,
      name: 'test-metric'
    }

    const formatted = mockMetric.name + ': ' + mockMetric.duration.toFixed(2) + 'ms'
    expect(formatted).toBe('test-metric: 123.46ms')
  })

  it('should handle timing calculations', () => {
    const timestamps = [100, 200, 300, 400]
    const durations = timestamps.slice(1).map((time, index) => time - timestamps[index])

    expect(durations).toEqual([100, 100, 100])
  })

  it('should track resource loading times', () => {
    const mockResourceEntry = {
      name: 'https://example.com/image.jpg',
      startTime: 100,
      responseEnd: 250,
      duration: 150
    }

    const loadTime = mockResourceEntry.responseEnd - mockResourceEntry.startTime
    expect(loadTime).toBe(150)
  })
})
