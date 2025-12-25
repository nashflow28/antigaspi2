// @ts-nocheck
/**
 * useTheme Hook Tests
 * Tests theme access, helpers, and state management
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { Text, View } from 'react-native'
import { ThemeProvider } from './ThemeContext'
import { useTheme } from './useTheme'

// Test component that uses the theme
const TestComponent: React.FC<{ testId?: string }> = ({ testId }) => {
  const theme = useTheme()

  return (
    <View testID={testId}>
      <Text>{theme.isDark ? 'Dark' : 'Light'}</Text>
      <Text>{theme.colors.primary[500]}</Text>
    </View>
  )
}

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('useTheme Hook', () => {
  describe('Theme Access', () => {
    it('provides theme object', () => {
      const { getByText } = renderWithTheme(<TestComponent />)
      // Should render either "Dark" or "Light"
      expect(getByText(/Dark|Light/)).toBeTruthy()
    })

    it('provides theme colors', () => {
      const Component = () => {
        const theme = useTheme()
        return <Text>{theme.colors.primary[500]}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('#F5C518')).toBeTruthy() // Primary color - gold
    })

    it('provides theme spacing', () => {
      const Component = () => {
        const theme = useTheme()
        return <Text>{theme.spacing.md}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('16')).toBeTruthy() // md = 16
    })

    it('provides theme typography', () => {
      const Component = () => {
        const theme = useTheme()
        return <Text>{theme.typography.fontSize.body.size}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('16')).toBeTruthy() // body size = 16
    })

    it('provides theme radius', () => {
      const Component = () => {
        const theme = useTheme()
        return <Text>{theme.radius.lg}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('8')).toBeTruthy() // lg = 8
    })
  })

  describe('Theme State', () => {
    it('provides isDark state', () => {
      const Component = () => {
        const theme = useTheme()
        return <Text>{theme.isDark ? 'Dark Mode' : 'Light Mode'}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText(/Dark Mode|Light Mode/)).toBeTruthy()
    })

    it('provides mode state', () => {
      const Component = () => {
        const theme = useTheme()
        return <Text>{theme.mode}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText(/light|dark|auto/)).toBeTruthy()
    })
  })

  describe('Helper Functions', () => {
    it('provides withOpacity helper', () => {
      const Component = () => {
        const theme = useTheme()
        const color = theme.withOpacity('#10B981', 0.5)
        return <Text>{color}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('rgba(16, 185, 129, 0.5)')).toBeTruthy()
    })

    it('provides cardStyle helper', () => {
      const Component = () => {
        const theme = useTheme()
        const cardStyle = theme.cardStyle(true)
        return <Text>{cardStyle.borderRadius}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('12')).toBeTruthy() // xl radius
    })

    it('provides buttonStyle helper', () => {
      const Component = () => {
        const theme = useTheme()
        const buttonStyle = theme.buttonStyle('primary', 'md')
        return <Text>{buttonStyle.backgroundColor}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('#F5C518')).toBeTruthy() // Primary color - gold
    })

    it('provides inputStyle helper', () => {
      const Component = () => {
        const theme = useTheme()
        const inputStyle = theme.inputStyle(false)
        return <Text>{inputStyle.borderRadius}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('8')).toBeTruthy() // lg radius
    })

    it('provides withOpacity helper', () => {
      const Component = () => {
        const theme = useTheme()
        const color = theme.withOpacity('#10B981', 0.5)
        return <Text>{color}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('rgba(16, 185, 129, 0.5)')).toBeTruthy()
    })

    it('provides getTypography helper', () => {
      const Component = () => {
        const theme = useTheme()
        const typo = theme.getTypography('h1')
        return <Text>{typo.fontSize}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('32')).toBeTruthy() // h1 size
    })
  })

  describe('Color Palette', () => {
    it('provides primary colors', () => {
      const Component = () => {
        const theme = useTheme()
        return (
          <>
            <Text>{theme.colors.primary[50]}</Text>
            <Text>{theme.colors.primary[500]}</Text>
            <Text>{theme.colors.primary[900]}</Text>
          </>
        )
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('#FFFEF5')).toBeTruthy() // Gold 50
      expect(getByText('#F5C518')).toBeTruthy() // Gold 500
      expect(getByText('#755405')).toBeTruthy() // Gold 900
    })

    it('provides neutral colors', () => {
      const Component = () => {
        const theme = useTheme()
        return <Text>{theme.colors.neutral[500]}</Text>
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('#6B7280')).toBeTruthy()
    })

    it('provides accent colors', () => {
      const Component = () => {
        const theme = useTheme()
        return (
          <>
            <Text>{theme.colors.accent.orange}</Text>
            <Text>{theme.colors.accent.red}</Text>
            <Text>{theme.colors.accent.yellow}</Text>
          </>
        )
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('#FB923C')).toBeTruthy() // Updated orange
      expect(getByText('#EF4444')).toBeTruthy()
      expect(getByText('#FCD34D')).toBeTruthy()
    })

    it('provides semantic colors', () => {
      const Component = () => {
        const theme = useTheme()
        return (
          <>
            <Text>{theme.colors.success}</Text>
            <Text>{theme.colors.error}</Text>
            <Text>{theme.colors.warning}</Text>
            <Text>{theme.colors.info}</Text>
          </>
        )
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('#10B981')).toBeTruthy() // success
      expect(getByText('#EF4444')).toBeTruthy() // error
      expect(getByText('#F59E0B')).toBeTruthy() // warning
      expect(getByText('#3B82F6')).toBeTruthy() // info
    })
  })

  describe('Spacing System', () => {
    it('provides all spacing values', () => {
      const Component = () => {
        const theme = useTheme()
        return (
          <>
            <Text>xs-{theme.spacing.xs}</Text>
            <Text>sm-{theme.spacing.sm}</Text>
            <Text>md-{theme.spacing.md}</Text>
            <Text>lg-{theme.spacing.lg}</Text>
            <Text>xl-{theme.spacing.xl}</Text>
          </>
        )
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('xs-4')).toBeTruthy()
      expect(getByText('sm-8')).toBeTruthy()
      expect(getByText('md-16')).toBeTruthy()
      expect(getByText('lg-24')).toBeTruthy()
      expect(getByText('xl-32')).toBeTruthy()
    })
  })

  describe('Border Radius', () => {
    it('provides all radius values', () => {
      const Component = () => {
        const theme = useTheme()
        return (
          <>
            <Text>none-{theme.radius.none}</Text>
            <Text>sm-{theme.radius.sm}</Text>
            <Text>md-{theme.radius.md}</Text>
            <Text>lg-{theme.radius.lg}</Text>
            <Text>xl-{theme.radius.xl}</Text>
            <Text>full-{theme.radius.full}</Text>
          </>
        )
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('none-0')).toBeTruthy()
      expect(getByText('sm-2')).toBeTruthy()
      expect(getByText('md-4')).toBeTruthy()
      expect(getByText('lg-8')).toBeTruthy()
      expect(getByText('xl-12')).toBeTruthy()
      expect(getByText('full-9999')).toBeTruthy()
    })
  })

  describe('Typography Scale', () => {
    it('provides all font sizes', () => {
      const Component = () => {
        const theme = useTheme()
        return (
          <>
            <Text>caption-{theme.typography.fontSize.caption.size}</Text>
            <Text>small-{theme.typography.fontSize.small.size}</Text>
            <Text>body-{theme.typography.fontSize.body.size}</Text>
            <Text>h4-{theme.typography.fontSize.h4.size}</Text>
            <Text>h3-{theme.typography.fontSize.h3.size}</Text>
            <Text>h2-{theme.typography.fontSize.h2.size}</Text>
            <Text>h1-{theme.typography.fontSize.h1.size}</Text>
          </>
        )
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('caption-12')).toBeTruthy()
      expect(getByText('small-14')).toBeTruthy()
      expect(getByText('body-16')).toBeTruthy()
      expect(getByText('h4-18')).toBeTruthy()
      expect(getByText('h3-20')).toBeTruthy()
      expect(getByText('h2-24')).toBeTruthy()
      expect(getByText('h1-32')).toBeTruthy()
    })
  })

  describe('Shadow System', () => {
    it('provides shadow styles', () => {
      const Component = () => {
        const theme = useTheme()
        return (
          <>
            <Text>{theme.shadows.sm.shadowRadius}</Text>
            <Text>{theme.shadows.md.shadowRadius}</Text>
            <Text>{theme.shadows.lg.shadowRadius}</Text>
          </>
        )
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('2')).toBeTruthy() // sm
      expect(getByText('4')).toBeTruthy() // md
      expect(getByText('8')).toBeTruthy() // lg
    })
  })

  describe('Accessibility', () => {
    it('provides accessibility settings', () => {
      const Component = () => {
        const theme = useTheme()
        return (
          <>
            <Text>{theme.accessibility.fontSizeMultiplier}</Text>
            <Text>{theme.accessibility.reduceMotion ? 'reduced' : 'normal'}</Text>
          </>
        )
      }
      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('1')).toBeTruthy() // default multiplier
      expect(getByText(/reduced|normal/)).toBeTruthy()
    })
  })

  describe('Theme Context', () => {
    it('throws error when used outside provider', () => {
      const Component = () => {
        try {
          const theme = useTheme()
          return <Text>{theme.isDark ? 'Dark' : 'Light'}</Text>
        } catch (error) {
          return <Text>Error caught</Text>
        }
      }

      // This should throw because no provider
      const { getByText } = render(<Component />)
      expect(getByText('Error caught')).toBeTruthy()
    })

    it('works correctly inside provider', () => {
      const Component = () => {
        const theme = useTheme()
        return <Text>{theme ? 'Theme loaded' : 'No theme'}</Text>
      }

      const { getByText } = renderWithTheme(<Component />)
      expect(getByText('Theme loaded')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('handles multiple components using theme', () => {
      const Component1 = () => {
        const theme = useTheme()
        return <Text>Comp1-{theme.spacing.md}</Text>
      }
      const Component2 = () => {
        const theme = useTheme()
        return <Text>Comp2-{theme.spacing.lg}</Text>
      }

      const { getByText } = renderWithTheme(
        <>
          <Component1 />
          <Component2 />
        </>
      )

      expect(getByText('Comp1-16')).toBeTruthy()
      expect(getByText('Comp2-24')).toBeTruthy()
    })

    it('provides consistent theme across renders', () => {
      const Component = () => {
        const theme = useTheme()
        return <Text>{theme.colors.primary[500]}</Text>
      }

      const { getByText, rerender } = renderWithTheme(<Component />)
      expect(getByText('#F5C518')).toBeTruthy() // Gold color

      rerender(
        <ThemeProvider>
          <Component />
        </ThemeProvider>
      )
      expect(getByText('#F5C518')).toBeTruthy() // Still gold
    })
  })
})
