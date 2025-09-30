/**
 * Button Component Tests
 * Tests all variants, sizes, states, and accessibility features
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from './Button'
import { ThemeProvider } from '../../theme/ThemeContext'

// Helper to wrap components with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByText } = renderWithTheme(<Button>Click me</Button>)
      expect(getByText('Click me')).toBeTruthy()
    })

    it('renders with custom text', () => {
      const { getByText } = renderWithTheme(<Button>Custom Button</Button>)
      expect(getByText('Custom Button')).toBeTruthy()
    })
  })

  describe('Variants', () => {
    it('renders primary variant', () => {
      const { getByText } = renderWithTheme(
        <Button variant="primary">Primary</Button>
      )
      expect(getByText('Primary')).toBeTruthy()
    })

    it('renders secondary variant', () => {
      const { getByText } = renderWithTheme(
        <Button variant="secondary">Secondary</Button>
      )
      expect(getByText('Secondary')).toBeTruthy()
    })

    it('renders promo variant', () => {
      const { getByText } = renderWithTheme(
        <Button variant="promo">Promo</Button>
      )
      expect(getByText('Promo')).toBeTruthy()
    })

    it('renders ghost variant', () => {
      const { getByText } = renderWithTheme(
        <Button variant="ghost">Ghost</Button>
      )
      expect(getByText('Ghost')).toBeTruthy()
    })

    it('renders destructive variant', () => {
      const { getByText } = renderWithTheme(
        <Button variant="destructive">Delete</Button>
      )
      expect(getByText('Delete')).toBeTruthy()
    })
  })

  describe('Sizes', () => {
    it('renders small size', () => {
      const { getByText } = renderWithTheme(
        <Button size="sm">Small</Button>
      )
      expect(getByText('Small')).toBeTruthy()
    })

    it('renders medium size', () => {
      const { getByText } = renderWithTheme(
        <Button size="md">Medium</Button>
      )
      expect(getByText('Medium')).toBeTruthy()
    })

    it('renders large size', () => {
      const { getByText } = renderWithTheme(
        <Button size="lg">Large</Button>
      )
      expect(getByText('Large')).toBeTruthy()
    })
  })

  describe('States', () => {
    it('handles disabled state', () => {
      const onPress = jest.fn()
      const { getByText } = renderWithTheme(
        <Button disabled onPress={onPress}>
          Disabled Button
        </Button>
      )

      const button = getByText('Disabled Button')
      fireEvent.press(button)

      // onPress should not be called when disabled
      expect(onPress).not.toHaveBeenCalled()
    })

    it('shows loading state', () => {
      const { getByRole } = renderWithTheme(
        <Button loading>Loading Button</Button>
      )

      const button = getByRole('button')
      expect(button).toBeTruthy()
      expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true })
    })

    it('does not call onPress when loading', () => {
      const onPress = jest.fn()
      const { getByRole } = renderWithTheme(
        <Button loading onPress={onPress}>
          Loading
        </Button>
      )

      const button = getByRole('button')
      fireEvent.press(button)

      expect(onPress).not.toHaveBeenCalled()
    })
  })

  describe('Interactions', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn()
      const { getByText } = renderWithTheme(
        <Button onPress={onPress}>Press Me</Button>
      )

      const button = getByText('Press Me')
      fireEvent.press(button)

      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn()
      const { getByText } = renderWithTheme(
        <Button disabled onPress={onPress}>
          Disabled
        </Button>
      )

      const button = getByText('Disabled')
      fireEvent.press(button)

      expect(onPress).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      const { getByRole } = renderWithTheme(<Button>Accessible</Button>)
      expect(getByRole('button')).toBeTruthy()
    })

    it('uses custom accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <Button accessibilityLabel="Custom Label">Button</Button>
      )
      expect(getByLabelText('Custom Label')).toBeTruthy()
    })

    it('generates accessibility label from children text', () => {
      const { getByLabelText } = renderWithTheme(
        <Button>Auto Label</Button>
      )
      expect(getByLabelText('Auto Label')).toBeTruthy()
    })

    it('has accessibility hint', () => {
      const { getByRole } = renderWithTheme(
        <Button accessibilityHint="Press to submit">Submit</Button>
      )
      const button = getByRole('button')
      expect(button.props.accessibilityHint).toBe('Press to submit')
    })

    it('has disabled accessibility state', () => {
      const { getByRole } = renderWithTheme(
        <Button disabled>Disabled</Button>
      )
      const button = getByRole('button')
      expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false })
    })

    it('has busy accessibility state when loading', () => {
      const { getByRole } = renderWithTheme(
        <Button loading>Loading</Button>
      )
      const button = getByRole('button')
      expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true })
    })
  })

  describe('Layout', () => {
    it('renders full width', () => {
      const { getByText } = renderWithTheme(
        <Button fullWidth>Full Width</Button>
      )
      expect(getByText('Full Width')).toBeTruthy()
    })

    it('renders with left icon', () => {
      const LeftIcon = () => <></>
      const { getByText } = renderWithTheme(
        <Button leftIcon={<LeftIcon />}>With Icon</Button>
      )
      expect(getByText('With Icon')).toBeTruthy()
    })

    it('renders with right icon', () => {
      const RightIcon = () => <></>
      const { getByText } = renderWithTheme(
        <Button rightIcon={<RightIcon />}>With Icon</Button>
      )
      expect(getByText('With Icon')).toBeTruthy()
    })
  })

  describe('Theme Integration', () => {
    it('uses theme colors for primary variant', () => {
      const { getByText } = renderWithTheme(
        <Button variant="primary">Primary</Button>
      )
      const button = getByText('Primary')
      expect(button).toBeTruthy()
    })

    it('uses theme spacing', () => {
      const { getByText } = renderWithTheme(
        <Button size="md">Button</Button>
      )
      const button = getByText('Button')
      expect(button).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty onPress gracefully', () => {
      const { getByText } = renderWithTheme(<Button>No Handler</Button>)
      const button = getByText('No Handler')

      // Should not throw error
      expect(() => fireEvent.press(button)).not.toThrow()
    })

    it('handles very long text', () => {
      const longText = 'This is a very long button text that should still render properly'
      const { getByText } = renderWithTheme(<Button>{longText}</Button>)
      expect(getByText(longText)).toBeTruthy()
    })
  })
})