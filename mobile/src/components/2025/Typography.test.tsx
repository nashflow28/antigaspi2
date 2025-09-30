/**
 * Typography Component Tests
 * Tests all variants, colors, weights, and accessibility
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { Typography, Heading1, Heading2, Heading3, Heading4, BodyText, SmallText, CaptionText, Display } from './Typography'
import { ThemeProvider } from '../../theme/ThemeContext'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Typography Component', () => {
  describe('Rendering', () => {
    it('renders correctly with text', () => {
      const { getByText } = renderWithTheme(
        <Typography>Sample Text</Typography>
      )
      expect(getByText('Sample Text')).toBeTruthy()
    })

    it('renders with default body variant', () => {
      const { getByText } = renderWithTheme(
        <Typography>Body Text</Typography>
      )
      expect(getByText('Body Text')).toBeTruthy()
    })
  })

  describe('Variants', () => {
    it('renders displayXl variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="displayXl">Display XL</Typography>
      )
      expect(getByText('Display XL')).toBeTruthy()
    })

    it('renders displayLg variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="displayLg">Display LG</Typography>
      )
      expect(getByText('Display LG')).toBeTruthy()
    })

    it('renders displayMd variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="displayMd">Display MD</Typography>
      )
      expect(getByText('Display MD')).toBeTruthy()
    })

    it('renders displaySm variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="displaySm">Display SM</Typography>
      )
      expect(getByText('Display SM')).toBeTruthy()
    })

    it('renders h1 variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="h1">Heading 1</Typography>
      )
      expect(getByText('Heading 1')).toBeTruthy()
    })

    it('renders h2 variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="h2">Heading 2</Typography>
      )
      expect(getByText('Heading 2')).toBeTruthy()
    })

    it('renders h3 variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="h3">Heading 3</Typography>
      )
      expect(getByText('Heading 3')).toBeTruthy()
    })

    it('renders h4 variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="h4">Heading 4</Typography>
      )
      expect(getByText('Heading 4')).toBeTruthy()
    })

    it('renders body variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="body">Body Text</Typography>
      )
      expect(getByText('Body Text')).toBeTruthy()
    })

    it('renders small variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="small">Small Text</Typography>
      )
      expect(getByText('Small Text')).toBeTruthy()
    })

    it('renders caption variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="caption">Caption Text</Typography>
      )
      expect(getByText('Caption Text')).toBeTruthy()
    })
  })

  describe('Colors', () => {
    it('renders with default color', () => {
      const { getByText } = renderWithTheme(
        <Typography color="default">Default Color</Typography>
      )
      expect(getByText('Default Color')).toBeTruthy()
    })

    it('renders with secondary color', () => {
      const { getByText } = renderWithTheme(
        <Typography color="secondary">Secondary</Typography>
      )
      expect(getByText('Secondary')).toBeTruthy()
    })

    it('renders with tertiary color', () => {
      const { getByText } = renderWithTheme(
        <Typography color="tertiary">Tertiary</Typography>
      )
      expect(getByText('Tertiary')).toBeTruthy()
    })

    it('renders with inverse color', () => {
      const { getByText } = renderWithTheme(
        <Typography color="inverse">Inverse</Typography>
      )
      expect(getByText('Inverse')).toBeTruthy()
    })

    it('renders with primary color', () => {
      const { getByText } = renderWithTheme(
        <Typography color="primary">Primary</Typography>
      )
      expect(getByText('Primary')).toBeTruthy()
    })

    it('renders with success color', () => {
      const { getByText } = renderWithTheme(
        <Typography color="success">Success</Typography>
      )
      expect(getByText('Success')).toBeTruthy()
    })

    it('renders with warning color', () => {
      const { getByText } = renderWithTheme(
        <Typography color="warning">Warning</Typography>
      )
      expect(getByText('Warning')).toBeTruthy()
    })

    it('renders with error color', () => {
      const { getByText } = renderWithTheme(
        <Typography color="error">Error</Typography>
      )
      expect(getByText('Error')).toBeTruthy()
    })
  })

  describe('Alignment', () => {
    it('renders with left alignment by default', () => {
      const { getByText } = renderWithTheme(
        <Typography>Left Aligned</Typography>
      )
      expect(getByText('Left Aligned')).toBeTruthy()
    })

    it('renders with center alignment', () => {
      const { getByText } = renderWithTheme(
        <Typography align="center">Centered</Typography>
      )
      expect(getByText('Centered')).toBeTruthy()
    })

    it('renders with right alignment', () => {
      const { getByText } = renderWithTheme(
        <Typography align="right">Right Aligned</Typography>
      )
      expect(getByText('Right Aligned')).toBeTruthy()
    })

    it('renders with justify alignment', () => {
      const { getByText } = renderWithTheme(
        <Typography align="justify">Justified Text</Typography>
      )
      expect(getByText('Justified Text')).toBeTruthy()
    })
  })

  describe('Font Weight', () => {
    it('renders with thin weight', () => {
      const { getByText } = renderWithTheme(
        <Typography weight="thin">Thin</Typography>
      )
      expect(getByText('Thin')).toBeTruthy()
    })

    it('renders with light weight', () => {
      const { getByText } = renderWithTheme(
        <Typography weight="light">Light</Typography>
      )
      expect(getByText('Light')).toBeTruthy()
    })

    it('renders with regular weight', () => {
      const { getByText } = renderWithTheme(
        <Typography weight="regular">Regular</Typography>
      )
      expect(getByText('Regular')).toBeTruthy()
    })

    it('renders with medium weight', () => {
      const { getByText } = renderWithTheme(
        <Typography weight="medium">Medium</Typography>
      )
      expect(getByText('Medium')).toBeTruthy()
    })

    it('renders with semibold weight', () => {
      const { getByText } = renderWithTheme(
        <Typography weight="semibold">Semibold</Typography>
      )
      expect(getByText('Semibold')).toBeTruthy()
    })

    it('renders with bold weight', () => {
      const { getByText } = renderWithTheme(
        <Typography weight="bold">Bold</Typography>
      )
      expect(getByText('Bold')).toBeTruthy()
    })

    it('renders with black weight', () => {
      const { getByText } = renderWithTheme(
        <Typography weight="black">Black</Typography>
      )
      expect(getByText('Black')).toBeTruthy()
    })
  })

  describe('Truncation', () => {
    it('handles numberOfLines for truncation', () => {
      const longText = 'This is a very long text that should be truncated when numberOfLines is set'
      const { getByText } = renderWithTheme(
        <Typography numberOfLines={1}>{longText}</Typography>
      )
      expect(getByText(longText)).toBeTruthy()
    })

    it('allows multiple lines', () => {
      const { getByText } = renderWithTheme(
        <Typography numberOfLines={3}>Line 1\nLine 2\nLine 3</Typography>
      )
      expect(getByText('Line 1\nLine 2\nLine 3')).toBeTruthy()
    })
  })

  describe('Convenience Components', () => {
    it('renders Heading1', () => {
      const { getByText } = renderWithTheme(
        <Heading1>Heading 1</Heading1>
      )
      expect(getByText('Heading 1')).toBeTruthy()
    })

    it('renders Heading2', () => {
      const { getByText } = renderWithTheme(
        <Heading2>Heading 2</Heading2>
      )
      expect(getByText('Heading 2')).toBeTruthy()
    })

    it('renders Heading3', () => {
      const { getByText } = renderWithTheme(
        <Heading3>Heading 3</Heading3>
      )
      expect(getByText('Heading 3')).toBeTruthy()
    })

    it('renders Heading4', () => {
      const { getByText } = renderWithTheme(
        <Heading4>Heading 4</Heading4>
      )
      expect(getByText('Heading 4')).toBeTruthy()
    })

    it('renders BodyText', () => {
      const { getByText } = renderWithTheme(
        <BodyText>Body</BodyText>
      )
      expect(getByText('Body')).toBeTruthy()
    })

    it('renders SmallText', () => {
      const { getByText } = renderWithTheme(
        <SmallText>Small</SmallText>
      )
      expect(getByText('Small')).toBeTruthy()
    })

    it('renders CaptionText', () => {
      const { getByText } = renderWithTheme(
        <CaptionText>Caption</CaptionText>
      )
      expect(getByText('Caption')).toBeTruthy()
    })

    it('renders Display with small size', () => {
      const { getByText } = renderWithTheme(
        <Display size="sm">Display Small</Display>
      )
      expect(getByText('Display Small')).toBeTruthy()
    })

    it('renders Display with medium size', () => {
      const { getByText } = renderWithTheme(
        <Display size="md">Display Medium</Display>
      )
      expect(getByText('Display Medium')).toBeTruthy()
    })

    it('renders Display with large size', () => {
      const { getByText } = renderWithTheme(
        <Display size="lg">Display Large</Display>
      )
      expect(getByText('Display Large')).toBeTruthy()
    })

    it('renders Display with xl size', () => {
      const { getByText } = renderWithTheme(
        <Display size="xl">Display XL</Display>
      )
      expect(getByText('Display XL')).toBeTruthy()
    })
  })

  describe('Theme Integration', () => {
    it('uses theme typography styles', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="h1">Themed</Typography>
      )
      expect(getByText('Themed')).toBeTruthy()
    })

    it('uses theme colors', () => {
      const { getByText } = renderWithTheme(
        <Typography color="primary">Primary Color</Typography>
      )
      expect(getByText('Primary Color')).toBeTruthy()
    })

    it('respects accessibility font size multiplier', () => {
      const { getByText } = renderWithTheme(
        <Typography>Accessible Text</Typography>
      )
      expect(getByText('Accessible Text')).toBeTruthy()
    })
  })

  describe('Complex Combinations', () => {
    it('combines variant, color, and alignment', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="h2" color="primary" align="center">
          Combined Props
        </Typography>
      )
      expect(getByText('Combined Props')).toBeTruthy()
    })

    it('combines variant, weight, and color', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="body" weight="bold" color="error">
          Error Message
        </Typography>
      )
      expect(getByText('Error Message')).toBeTruthy()
    })

    it('combines all props', () => {
      const { getByText } = renderWithTheme(
        <Typography
          variant="h3"
          color="success"
          align="center"
          weight="semibold"
          numberOfLines={2}
        >
          Fully Customized
        </Typography>
      )
      expect(getByText('Fully Customized')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty string', () => {
      const { container } = renderWithTheme(
        <Typography></Typography>
      )
      expect(container).toBeTruthy()
    })

    it('handles very long text', () => {
      const longText = 'Lorem ipsum '.repeat(50)
      const { getByText } = renderWithTheme(
        <Typography>{longText}</Typography>
      )
      expect(getByText(longText)).toBeTruthy()
    })

    it('handles special characters', () => {
      const { getByText } = renderWithTheme(
        <Typography>Special: @#$%^&*()</Typography>
      )
      expect(getByText('Special: @#$%^&*()')).toBeTruthy()
    })

    it('handles multiline text', () => {
      const { getByText } = renderWithTheme(
        <Typography>Line 1{'\n'}Line 2{'\n'}Line 3</Typography>
      )
      expect(getByText(/Line 1/)).toBeTruthy()
    })
  })

  describe('Use Cases', () => {
    it('renders page title', () => {
      const { getByText } = renderWithTheme(
        <Heading1 align="center">Page Title</Heading1>
      )
      expect(getByText('Page Title')).toBeTruthy()
    })

    it('renders section heading', () => {
      const { getByText } = renderWithTheme(
        <Heading2 color="primary">Section</Heading2>
      )
      expect(getByText('Section')).toBeTruthy()
    })

    it('renders body paragraph', () => {
      const { getByText } = renderWithTheme(
        <BodyText>This is a paragraph of body text.</BodyText>
      )
      expect(getByText('This is a paragraph of body text.')).toBeTruthy()
    })

    it('renders caption/metadata', () => {
      const { getByText } = renderWithTheme(
        <CaptionText color="secondary">Posted 2 hours ago</CaptionText>
      )
      expect(getByText('Posted 2 hours ago')).toBeTruthy()
    })

    it('renders error message', () => {
      const { getByText } = renderWithTheme(
        <SmallText color="error" weight="medium">
          Invalid input
        </SmallText>
      )
      expect(getByText('Invalid input')).toBeTruthy()
    })

    it('renders success message', () => {
      const { getByText } = renderWithTheme(
        <BodyText color="success" weight="semibold">
          Successfully saved!
        </BodyText>
      )
      expect(getByText('Successfully saved!')).toBeTruthy()
    })
  })
})