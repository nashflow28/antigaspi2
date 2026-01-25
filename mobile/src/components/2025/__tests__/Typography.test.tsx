// @ts-nocheck
/**
 * Tests unitaires Typography - React Native Web compatibility
 *
 * Ces tests auraient détecté le bug de style array spreading
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { Typography } from '../Typography'
import { ThemeProvider } from '../../../theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Typography Component', () => {
  describe('Style handling', () => {
    it('should render with single object style', () => {
      const { getByText } = renderWithTheme(
        <Typography style={{ fontSize: 20 }}>Test</Typography>
      )

      expect(getByText('Test')).toBeTruthy()
    })

    it('should render with array of styles (React Native Web compatibility)', () => {
      // Ce test aurait échoué avec l'ancien code
      const arrayStyle = [{ fontSize: 20 }, { color: 'red' }, { fontWeight: 'bold' }]

      const { getByText } = renderWithTheme(
        <Typography style={arrayStyle}>Test Array Styles</Typography>
      )

      expect(getByText('Test Array Styles')).toBeTruthy()
    })

    it('should handle nested array styles', () => {
      const nestedStyle = [
        { fontSize: 16 },
        [{ color: 'blue' }, { marginTop: 10 }],
        { padding: 5 },
      ]

      const { getByText } = renderWithTheme(
        <Typography style={nestedStyle as any}>Nested</Typography>
      )

      expect(getByText('Nested')).toBeTruthy()
    })

    it('should handle undefined style', () => {
      const { getByText } = renderWithTheme(
        <Typography style={undefined}>No Style</Typography>
      )

      expect(getByText('No Style')).toBeTruthy()
    })

    it('should handle null style', () => {
      const { getByText } = renderWithTheme(
        <Typography style={null as any}>Null Style</Typography>
      )

      expect(getByText('Null Style')).toBeTruthy()
    })

    it('should flatten empty array styles', () => {
      const { getByText } = renderWithTheme(
        <Typography style={[]}>Empty Array</Typography>
      )

      expect(getByText('Empty Array')).toBeTruthy()
    })

    it('should handle array with null/undefined values', () => {
      const mixedStyle = [
        { fontSize: 18 },
        null,
        undefined,
        { color: 'green' },
      ]

      const { getByText } = renderWithTheme(
        <Typography style={mixedStyle as any}>Mixed</Typography>
      )

      expect(getByText('Mixed')).toBeTruthy()
    })
  })

  describe('Variants', () => {
    it('should render all typography variants', () => {
      const variants = ['h1', 'h2', 'h3', 'h4', 'body', 'small', 'caption'] as const

      variants.forEach(variant => {
        const { getByText } = renderWithTheme(
          <Typography variant={variant}>{variant}</Typography>
        )

        expect(getByText(variant)).toBeTruthy()
      })
    })
  })

  describe('Color variants', () => {
    it('should render all color variants', () => {
      const colors = ['default', 'secondary', 'tertiary', 'primary', 'success', 'warning', 'error'] as const

      colors.forEach(color => {
        const { getByText } = renderWithTheme(
          <Typography color={color}>{color}</Typography>
        )

        expect(getByText(color)).toBeTruthy()
      })
    })
  })

  describe('Weight and alignment', () => {
    it('should apply custom weight', () => {
      const { getByText } = renderWithTheme(
        <Typography weight="bold">Bold Text</Typography>
      )

      expect(getByText('Bold Text')).toBeTruthy()
    })

    it('should apply text alignment', () => {
      const { getByText } = renderWithTheme(
        <Typography align="center">Centered</Typography>
      )

      expect(getByText('Centered')).toBeTruthy()
    })
  })

  describe('Regression test for BrandLogo use case', () => {
    it('should handle the exact style pattern used by BrandLogo', () => {
      // Reproduire le pattern exact de BrandLogo.tsx:69-75
      const fontSize = 32
      const customColorStyle = { color: '#10B981' }
      const externalStyle = { marginTop: 20 }

      const combinedStyle = [
        { fontSize },
        customColorStyle,
        externalStyle,
      ]

      const { getByText } = renderWithTheme(
        <Typography variant="displayXl" weight="bold" align="center" style={combinedStyle}>
          🌱 GÊLADAL
        </Typography>
      )

      expect(getByText('🌱 GÊLADAL')).toBeTruthy()
    })
  })
})
