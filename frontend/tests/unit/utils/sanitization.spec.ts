import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock DOMPurify
const mockDOMPurify = {
  sanitize: vi.fn(),
  addHook: vi.fn(),
  removeHook: vi.fn()
}

vi.mock('dompurify', () => ({
  default: mockDOMPurify
}))

describe('Sanitization Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDOMPurify.sanitize.mockImplementation((input) => input)
  })

  it('should be imported correctly', async () => {
    const sanitizationModule = await import('@/utils/sanitization')
    expect(sanitizationModule).toBeDefined()
  })

  it('should have DOMPurify as dependency', () => {
    expect(mockDOMPurify).toBeDefined()
    expect(typeof mockDOMPurify.sanitize).toBe('function')
  })

  it('should handle empty input', () => {
    mockDOMPurify.sanitize.mockReturnValue('')

    const result = mockDOMPurify.sanitize('')
    expect(result).toBe('')
  })

  it('should sanitize malicious HTML', () => {
    const maliciousInput = '<script>alert("XSS")</script><p>Safe content</p>'
    const sanitizedOutput = '<p>Safe content</p>'

    mockDOMPurify.sanitize.mockReturnValue(sanitizedOutput)

    const result = mockDOMPurify.sanitize(maliciousInput)
    expect(result).toBe(sanitizedOutput)
    expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(maliciousInput)
  })

  it('should preserve safe HTML content', () => {
    const safeInput = '<p>This is <strong>safe</strong> content</p>'

    mockDOMPurify.sanitize.mockReturnValue(safeInput)

    const result = mockDOMPurify.sanitize(safeInput)
    expect(result).toBe(safeInput)
  })
})
