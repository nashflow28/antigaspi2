/**
 * useDebounce - Hook for debouncing values and callbacks
 *
 * BUG FIX #15: Prevents excessive API calls on rapid state changes
 * (e.g., date picker selections, search inputs, filter changes)
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Debounce a value - returns the debounced version after delay
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 300)
 *
 * useEffect(() => {
 *   // This only runs after user stops typing for 300ms
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounce a callback function
 *
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns A debounced version of the callback
 *
 * @example
 * const debouncedSave = useDebouncedCallback((data) => {
 *   saveToServer(data)
 * }, 1000)
 *
 * // Call this on every change - it will only execute after 1s of inactivity
 * debouncedSave(formData)
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref if callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
        timeoutRef.current = null
      }, delay)
    }) as T,
    [delay]
  )

  return debouncedCallback
}

/**
 * Create a debounced effect that only runs after values stabilize
 *
 * @param effect - Effect function to run
 * @param deps - Dependencies array
 * @param delay - Delay in milliseconds (default: 500ms)
 *
 * @example
 * useDebouncedEffect(() => {
 *   fetchAnalytics({ startDate, endDate })
 * }, [startDate, endDate], 800)
 */
export function useDebouncedEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  delay: number = 500
): void {
  const isFirstMount = useRef(true)
  const cleanupRef = useRef<(() => void) | void>(undefined)

  useEffect(() => {
    // Skip debounce on first mount to load initial data immediately
    if (isFirstMount.current) {
      isFirstMount.current = false
      cleanupRef.current = effect()
      return
    }

    const timer = setTimeout(() => {
      // Run cleanup from previous effect if exists
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current()
      }
      cleanupRef.current = effect()
    }, delay)

    return () => {
      clearTimeout(timer)
    }
     
  }, deps)

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current()
      }
    }
  }, [])
}

export default useDebounce
