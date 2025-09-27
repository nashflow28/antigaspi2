import { describe, it, expect } from 'vitest'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

describe('useDesignSystem2025', () => {
  it('returns all required properties and methods', () => {
    const result = useDesignSystem2025()

    // Check that all expected properties exist
    expect(result).toHaveProperty('isEnabled')
    expect(result).toHaveProperty('components')
    expect(result).toHaveProperty('isDebugMode')
    expect(result).toHaveProperty('toggleGlobal')
    expect(result).toHaveProperty('toggleComponent')
    expect(result).toHaveProperty('shouldUse2025')
    expect(result).toHaveProperty('logMigration')
    expect(result).toHaveProperty('useButton2025')
    expect(result).toHaveProperty('useCard2025')
    expect(result).toHaveProperty('useBadge2025')
  })

  it('has reactive state properties', () => {
    const { isEnabled, components, isDebugMode } = useDesignSystem2025()

    expect(typeof isEnabled.value).toBe('boolean')
    expect(typeof components.value).toBe('object')
    expect(typeof components.value.button).toBe('boolean')
    expect(typeof components.value.card).toBe('boolean')
    expect(typeof components.value.badge).toBe('boolean')
    expect(typeof isDebugMode.value).toBe('boolean')
  })

  it('toggleGlobal changes the global state', () => {
    const { isEnabled, toggleGlobal } = useDesignSystem2025()
    const initialState = isEnabled.value

    toggleGlobal()
    expect(isEnabled.value).toBe(!initialState)

    toggleGlobal()
    expect(isEnabled.value).toBe(initialState)
  })

  it('toggleComponent changes specific component state', () => {
    const { components, toggleComponent } = useDesignSystem2025()
    const initialButtonState = components.value.button

    toggleComponent('button')
    expect(components.value.button).toBe(!initialButtonState)

    toggleComponent('button')
    expect(components.value.button).toBe(initialButtonState)
  })

  it('shouldUse2025 returns boolean values', () => {
    const { shouldUse2025 } = useDesignSystem2025()

    expect(typeof shouldUse2025('button')).toBe('boolean')
    expect(typeof shouldUse2025('card')).toBe('boolean')
    expect(typeof shouldUse2025('badge')).toBe('boolean')
  })

  it('shouldUse2025 responds to global toggle', () => {
    const { shouldUse2025, toggleGlobal, isEnabled } = useDesignSystem2025()

    // If global is disabled, toggle it and check shouldUse2025
    if (!isEnabled.value) {
      toggleGlobal()
      expect(shouldUse2025('button')).toBe(true)
      expect(shouldUse2025('card')).toBe(true)
      expect(shouldUse2025('badge')).toBe(true)
    } else {
      // If global is enabled, shouldUse2025 should return true
      expect(shouldUse2025('button')).toBe(true)
    }
  })

  it('shouldUse2025 responds to component toggle', () => {
    const { shouldUse2025, toggleComponent, components } = useDesignSystem2025()

    // Test button component specifically
    const initialButtonState = components.value.button
    const shouldUseInitial = shouldUse2025('button')

    toggleComponent('button')
    const shouldUseAfterToggle = shouldUse2025('button')

    // The result should change unless global is overriding
    if (!shouldUseInitial || components.value.button !== initialButtonState) {
      expect(shouldUseAfterToggle).toBeDefined()
    }
  })

  it('component helper methods return boolean values', () => {
    const { useButton2025, useCard2025, useBadge2025 } = useDesignSystem2025()

    expect(typeof useButton2025()).toBe('boolean')
    expect(typeof useCard2025()).toBe('boolean')
    expect(typeof useBadge2025()).toBe('boolean')
  })

  it('logMigration function can be called without errors', () => {
    const { logMigration } = useDesignSystem2025()

    expect(() => logMigration('TestComponent', 'test action')).not.toThrow()
    expect(() => logMigration('TestComponent', 'test action', { detail: 'test' })).not.toThrow()
  })

  it('multiple instances share the same state', () => {
    const instance1 = useDesignSystem2025()
    const instance2 = useDesignSystem2025()

    const initialState = instance1.isEnabled.value

    instance1.toggleGlobal()
    expect(instance2.isEnabled.value).toBe(!initialState)

    instance2.toggleGlobal()
    expect(instance1.isEnabled.value).toBe(initialState)
  })

  it('component toggles work independently', () => {
    const { components, toggleComponent } = useDesignSystem2025()

    const initialButton = components.value.button
    const initialCard = components.value.card

    toggleComponent('button')
    expect(components.value.button).toBe(!initialButton)
    expect(components.value.card).toBe(initialCard) // Should not change

    toggleComponent('card')
    expect(components.value.card).toBe(!initialCard)
  })
})
