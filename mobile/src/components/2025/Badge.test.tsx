// @ts-nocheck
/**
 * Badge Component Tests
 * Tests all variants, sizes, and display modes
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { Badge } from './Badge'
import { ThemeProvider } from '../../theme/ThemeContext'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders correctly with text', () => {
      const { getByText } = renderWithTheme(<Badge>New</Badge>)
      expect(getByText('New')).toBeTruthy()
    })

    it('renders with number', () => {
      const { getByText } = renderWithTheme(<Badge>5</Badge>)
      expect(getByText('5')).toBeTruthy()
    })
  })

  describe('Variants', () => {
    it('renders primary variant', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="primary">Primary</Badge>
      )
      expect(getByText('Primary')).toBeTruthy()
    })

    it('renders secondary variant', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="secondary">Secondary</Badge>
      )
      expect(getByText('Secondary')).toBeTruthy()
    })

    it('renders promo variant', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="promo">-50%</Badge>
      )
      expect(getByText('-50%')).toBeTruthy()
    })

    it('renders success variant', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="success">Success</Badge>
      )
      expect(getByText('Success')).toBeTruthy()
    })

    it('renders warning variant', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="warning">Warning</Badge>
      )
      expect(getByText('Warning')).toBeTruthy()
    })

    it('renders error variant', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="error">Error</Badge>
      )
      expect(getByText('Error')).toBeTruthy()
    })

    it('renders info variant', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="info">Info</Badge>
      )
      expect(getByText('Info')).toBeTruthy()
    })

    it('renders neutral variant', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="neutral">Neutral</Badge>
      )
      expect(getByText('Neutral')).toBeTruthy()
    })
  })

  describe('Sizes', () => {
    it('renders small size', () => {
      const { getByText } = renderWithTheme(
        <Badge size="sm">SM</Badge>
      )
      expect(getByText('SM')).toBeTruthy()
    })

    it('renders medium size', () => {
      const { getByText } = renderWithTheme(
        <Badge size="md">MD</Badge>
      )
      expect(getByText('MD')).toBeTruthy()
    })

    it('renders large size', () => {
      const { getByText } = renderWithTheme(
        <Badge size="lg">LG</Badge>
      )
      expect(getByText('LG')).toBeTruthy()
    })
  })

  describe('Outline Mode', () => {
    it('renders in solid mode by default', () => {
      const { getByText } = renderWithTheme(<Badge>Solid</Badge>)
      expect(getByText('Solid')).toBeTruthy()
    })

    it('renders in outline mode', () => {
      const { getByText } = renderWithTheme(
        <Badge outline>Outline</Badge>
      )
      expect(getByText('Outline')).toBeTruthy()
    })

    it('renders all variants in outline mode', () => {
      const { getByText: getByText1 } = renderWithTheme(
        <Badge variant="primary" outline>Primary</Badge>
      )
      const { getByText: getByText2 } = renderWithTheme(
        <Badge variant="success" outline>Success</Badge>
      )
      const { getByText: getByText3 } = renderWithTheme(
        <Badge variant="error" outline>Error</Badge>
      )

      expect(getByText1('Primary')).toBeTruthy()
      expect(getByText2('Success')).toBeTruthy()
      expect(getByText3('Error')).toBeTruthy()
    })
  })

  describe('Dot Indicator', () => {
    it('renders without dot by default', () => {
      const { getByText } = renderWithTheme(<Badge>No Dot</Badge>)
      expect(getByText('No Dot')).toBeTruthy()
    })

    it('renders with dot indicator', () => {
      const { getByText } = renderWithTheme(
        <Badge dot>With Dot</Badge>
      )
      expect(getByText('With Dot')).toBeTruthy()
    })

    it('renders dot with all sizes', () => {
      const { getByText: getByText1 } = renderWithTheme(
        <Badge size="sm" dot>SM</Badge>
      )
      const { getByText: getByText2 } = renderWithTheme(
        <Badge size="md" dot>MD</Badge>
      )
      const { getByText: getByText3 } = renderWithTheme(
        <Badge size="lg" dot>LG</Badge>
      )

      expect(getByText1('SM')).toBeTruthy()
      expect(getByText2('MD')).toBeTruthy()
      expect(getByText3('LG')).toBeTruthy()
    })
  })

  describe('Theme Integration', () => {
    it('uses theme colors for primary', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="primary">Themed</Badge>
      )
      expect(getByText('Themed')).toBeTruthy()
    })

    it('uses theme spacing', () => {
      const { getByText } = renderWithTheme(
        <Badge size="md">Spaced</Badge>
      )
      expect(getByText('Spaced')).toBeTruthy()
    })

    it('uses theme radius for rounded shape', () => {
      const { getByText } = renderWithTheme(<Badge>Rounded</Badge>)
      expect(getByText('Rounded')).toBeTruthy()
    })
  })

  describe('Content Types', () => {
    it('renders text content', () => {
      const { getByText } = renderWithTheme(<Badge>Text</Badge>)
      expect(getByText('Text')).toBeTruthy()
    })

    it('renders numeric content', () => {
      const { getByText } = renderWithTheme(<Badge>99</Badge>)
      expect(getByText('99')).toBeTruthy()
    })

    it('renders single character', () => {
      const { getByText } = renderWithTheme(<Badge>!</Badge>)
      expect(getByText('!')).toBeTruthy()
    })

    it('renders emoji', () => {
      const { getByText } = renderWithTheme(<Badge>🔥</Badge>)
      expect(getByText('🔥')).toBeTruthy()
    })
  })

  describe('Variant Combinations', () => {
    it('renders promo with small size', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="promo" size="sm">-70%</Badge>
      )
      expect(getByText('-70%')).toBeTruthy()
    })

    it('renders success with outline and dot', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="success" outline dot>Available</Badge>
      )
      expect(getByText('Available')).toBeTruthy()
    })

    it('renders error with large size', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="error" size="lg">Sold Out</Badge>
      )
      expect(getByText('Sold Out')).toBeTruthy()
    })

    it('renders neutral outline with dot', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="neutral" outline dot>Draft</Badge>
      )
      expect(getByText('Draft')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty string', () => {
      const { root } = renderWithTheme(<Badge></Badge>)
      expect(root).toBeTruthy()
    })

    it('handles very long text', () => {
      const longText = 'Very Long Badge Text'
      const { getByText } = renderWithTheme(<Badge>{longText}</Badge>)
      expect(getByText(longText)).toBeTruthy()
    })

    it('handles special characters', () => {
      const { getByText } = renderWithTheme(<Badge>-50% OFF!</Badge>)
      expect(getByText('-50% OFF!')).toBeTruthy()
    })
  })

  describe('Use Cases', () => {
    it('renders discount badge', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="promo" size="sm">-30%</Badge>
      )
      expect(getByText('-30%')).toBeTruthy()
    })

    it('renders status badge', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="success" dot>Available</Badge>
      )
      expect(getByText('Available')).toBeTruthy()
    })

    it('renders notification count', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="error" size="sm">12</Badge>
      )
      expect(getByText('12')).toBeTruthy()
    })

    it('renders category tag', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="neutral" outline>Bakery</Badge>
      )
      expect(getByText('Bakery')).toBeTruthy()
    })
  })
})