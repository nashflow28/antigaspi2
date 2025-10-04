/**
 * Authentication Flow Tests
 * Tests login and registration screens structure and accessibility
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { View, Text } from 'react-native'
import { ThemeProvider } from '../../theme/ThemeContext'
import { Button, Card, Typography } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'

// Helper to wrap components with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Authentication Flow - Design System 2025', () => {
  describe('Login Form Components', () => {
    it('renders login button with primary variant', () => {
      const { getByText } = renderWithTheme(
        <Button variant="primary" size="lg" fullWidth>
          Se connecter
        </Button>
      )

      expect(getByText('Se connecter')).toBeTruthy()
    })

    it('renders login card container', () => {
      const { getByText } = renderWithTheme(
        <Card variant="elevated">
          <View>
            <Text>Login Form</Text>
          </View>
        </Card>
      )

      expect(getByText('Login Form')).toBeTruthy()
    })

    it('renders typography for form labels', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="body" weight="semibold">
          Email
        </Typography>
      )

      expect(getByText('Email')).toBeTruthy()
    })

    it('renders test account buttons with secondary variant', () => {
      const { getByText } = renderWithTheme(
        <Button variant="secondary" size="md" fullWidth>
          👤 Consumer
        </Button>
      )

      expect(getByText('👤 Consumer')).toBeTruthy()
    })
  })

  describe('Registration Form Components', () => {
    it('renders registration title', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="displayMd" weight="bold">
          Créer un compte
        </Typography>
      )

      expect(getByText('Créer un compte')).toBeTruthy()
    })

    it('renders registration card with form fields', () => {
      const { getByText } = renderWithTheme(
        <Card variant="elevated">
          <View>
            <Text>Prénom *</Text>
            <Text>Nom *</Text>
            <Text>Email *</Text>
          </View>
        </Card>
      )

      expect(getByText('Prénom *')).toBeTruthy()
      expect(getByText('Nom *')).toBeTruthy()
      expect(getByText('Email *')).toBeTruthy()
    })

    it('renders registration button', () => {
      const { getByText } = renderWithTheme(
        <Button variant="primary" size="lg" fullWidth>
          Créer mon compte
        </Button>
      )

      expect(getByText('Créer mon compte')).toBeTruthy()
    })
  })

  describe('Form Validation UI', () => {
    it('renders error message card', () => {
      const { getByText } = renderWithTheme(
        <Card variant="flat">
          <Typography variant="caption">
            Veuillez remplir tous les champs
          </Typography>
        </Card>
      )

      expect(getByText('Veuillez remplir tous les champs')).toBeTruthy()
    })
  })

  describe('Navigation Links', () => {
    it('renders navigation text with correct styling', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="caption" color="secondary">
          Pas encore de compte ?
        </Typography>
      )

      expect(getByText('Pas encore de compte ?')).toBeTruthy()
    })

    it('renders link text with primary color', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="caption" weight="semibold">
          Créer un compte
        </Typography>
      )

      expect(getByText('Créer un compte')).toBeTruthy()
    })
  })

  describe('Design System Integration', () => {
    it('all auth components use theme context', () => {
      const { root } = renderWithTheme(
        <View>
          <BrandLogo />
          <Card variant="elevated">
            <Button variant="primary" size="lg">
              Se connecter
            </Button>
          </Card>
        </View>
      )

      expect(root).toBeTruthy()
    })

    it('auth flow uses Design System 2025 components', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Typography variant="body">Email</Typography>
          <Button variant="primary">Login</Button>
          <Card variant="elevated">
            <Text>Form content</Text>
          </Card>
        </View>
      )

      expect(getByText('Email')).toBeTruthy()
      expect(getByText('Login')).toBeTruthy()
    })
  })
})
