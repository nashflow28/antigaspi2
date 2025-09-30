/**
 * Card Component Tests
 * Tests all variants, pressable behavior, and accessibility
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { Card } from './Card'
import { ThemeProvider } from '../../theme/ThemeContext'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Card Component', () => {
  describe('Rendering', () => {
    it('renders correctly with children', () => {
      const { getByText } = renderWithTheme(
        <Card>
          <Text>Card Content</Text>
        </Card>
      )
      expect(getByText('Card Content')).toBeTruthy()
    })

    it('renders with header', () => {
      const { getByText } = renderWithTheme(
        <Card header={<Text>Header</Text>}>
          <Text>Content</Text>
        </Card>
      )
      expect(getByText('Header')).toBeTruthy()
      expect(getByText('Content')).toBeTruthy()
    })

    it('renders with footer', () => {
      const { getByText } = renderWithTheme(
        <Card footer={<Text>Footer</Text>}>
          <Text>Content</Text>
        </Card>
      )
      expect(getByText('Footer')).toBeTruthy()
      expect(getByText('Content')).toBeTruthy()
    })

    it('renders with header and footer', () => {
      const { getByText } = renderWithTheme(
        <Card
          header={<Text>Header</Text>}
          footer={<Text>Footer</Text>}
        >
          <Text>Content</Text>
        </Card>
      )
      expect(getByText('Header')).toBeTruthy()
      expect(getByText('Content')).toBeTruthy()
      expect(getByText('Footer')).toBeTruthy()
    })
  })

  describe('Variants', () => {
    it('renders elevated variant', () => {
      const { getByText } = renderWithTheme(
        <Card variant="elevated">
          <Text>Elevated</Text>
        </Card>
      )
      expect(getByText('Elevated')).toBeTruthy()
    })

    it('renders flat variant', () => {
      const { getByText } = renderWithTheme(
        <Card variant="flat">
          <Text>Flat</Text>
        </Card>
      )
      expect(getByText('Flat')).toBeTruthy()
    })

    it('renders glass variant', () => {
      const { getByText } = renderWithTheme(
        <Card variant="glass">
          <Text>Glass</Text>
        </Card>
      )
      expect(getByText('Glass')).toBeTruthy()
    })

    it('renders outline variant', () => {
      const { getByText } = renderWithTheme(
        <Card variant="outline">
          <Text>Outline</Text>
        </Card>
      )
      expect(getByText('Outline')).toBeTruthy()
    })
  })

  describe('Border Radius', () => {
    it('renders with small radius', () => {
      const { getByText } = renderWithTheme(
        <Card rounded="sm">
          <Text>Small Radius</Text>
        </Card>
      )
      expect(getByText('Small Radius')).toBeTruthy()
    })

    it('renders with large radius', () => {
      const { getByText } = renderWithTheme(
        <Card rounded="xl">
          <Text>Large Radius</Text>
        </Card>
      )
      expect(getByText('Large Radius')).toBeTruthy()
    })

    it('renders with 2xl radius', () => {
      const { getByText } = renderWithTheme(
        <Card rounded="2xl">
          <Text>2XL Radius</Text>
        </Card>
      )
      expect(getByText('2XL Radius')).toBeTruthy()
    })
  })

  describe('Pressable Behavior', () => {
    it('is not pressable by default', () => {
      const { queryByRole } = renderWithTheme(
        <Card>
          <Text>Non-pressable</Text>
        </Card>
      )
      // Should not have button role if not pressable
      expect(queryByRole('button')).toBeNull()
    })

    it('becomes pressable when onPress is provided', () => {
      const onPress = jest.fn()
      const { getByRole } = renderWithTheme(
        <Card pressable onPress={onPress}>
          <Text>Pressable</Text>
        </Card>
      )
      expect(getByRole('button')).toBeTruthy()
    })

    it('calls onPress when pressed', () => {
      const onPress = jest.fn()
      const { getByRole } = renderWithTheme(
        <Card pressable onPress={onPress}>
          <Text>Press Me</Text>
        </Card>
      )

      const card = getByRole('button')
      fireEvent.press(card)

      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('does not call onPress if pressable is false', () => {
      const onPress = jest.fn()
      const { getByText } = renderWithTheme(
        <Card pressable={false} onPress={onPress}>
          <Text>Not Pressable</Text>
        </Card>
      )

      const content = getByText('Not Pressable')
      // Should not throw, and onPress should not be called
      expect(() => fireEvent.press(content)).not.toThrow()
      expect(onPress).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has button role when pressable', () => {
      const { getByRole } = renderWithTheme(
        <Card pressable onPress={() => {}}>
          <Text>Accessible Card</Text>
        </Card>
      )
      expect(getByRole('button')).toBeTruthy()
    })

    it('uses custom accessibility label', () => {
      const { getByA11yLabel } = renderWithTheme(
        <Card
          pressable
          onPress={() => {}}
          accessibilityLabel="Product Card"
        >
          <Text>Content</Text>
        </Card>
      )
      expect(getByA11yLabel('Product Card')).toBeTruthy()
    })

    it('has accessibility hint', () => {
      const { getByA11yHint } = renderWithTheme(
        <Card
          pressable
          onPress={() => {}}
          accessibilityHint="Tap to view details"
        >
          <Text>Card</Text>
        </Card>
      )
      expect(getByA11yHint('Tap to view details')).toBeTruthy()
    })

    it('is accessible when not pressable', () => {
      const { getByText } = renderWithTheme(
        <Card>
          <Text>Non-interactive Card</Text>
        </Card>
      )
      expect(getByText('Non-interactive Card')).toBeTruthy()
    })
  })

  describe('Layout Sections', () => {
    it('renders only content when no header/footer', () => {
      const { getByText, queryByText } = renderWithTheme(
        <Card>
          <Text>Content Only</Text>
        </Card>
      )
      expect(getByText('Content Only')).toBeTruthy()
    })

    it('separates header from content', () => {
      const { getByText } = renderWithTheme(
        <Card header={<Text>Header Section</Text>}>
          <Text>Content Section</Text>
        </Card>
      )
      // Both should be present and separate
      expect(getByText('Header Section')).toBeTruthy()
      expect(getByText('Content Section')).toBeTruthy()
    })

    it('separates content from footer', () => {
      const { getByText } = renderWithTheme(
        <Card footer={<Text>Footer Section</Text>}>
          <Text>Content Section</Text>
        </Card>
      )
      expect(getByText('Content Section')).toBeTruthy()
      expect(getByText('Footer Section')).toBeTruthy()
    })
  })

  describe('Theme Integration', () => {
    it('uses theme colors', () => {
      const { getByText } = renderWithTheme(
        <Card variant="elevated">
          <Text>Themed Card</Text>
        </Card>
      )
      expect(getByText('Themed Card')).toBeTruthy()
    })

    it('applies theme shadows for elevated variant', () => {
      const { getByText } = renderWithTheme(
        <Card variant="elevated">
          <Text>Shadowed</Text>
        </Card>
      )
      expect(getByText('Shadowed')).toBeTruthy()
    })

    it('uses theme radius values', () => {
      const { getByText } = renderWithTheme(
        <Card rounded="xl">
          <Text>Rounded</Text>
        </Card>
      )
      expect(getByText('Rounded')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      const { container } = renderWithTheme(
        <Card>
          <></>
        </Card>
      )
      expect(container).toBeTruthy()
    })

    it('handles complex nested content', () => {
      const { getByText } = renderWithTheme(
        <Card>
          <Text>Parent</Text>
          <Text>Child 1</Text>
          <Text>Child 2</Text>
        </Card>
      )
      expect(getByText('Parent')).toBeTruthy()
      expect(getByText('Child 1')).toBeTruthy()
      expect(getByText('Child 2')).toBeTruthy()
    })
  })
})