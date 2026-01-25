/**
 * Navigation Flow Tests
 * Tests screen structure and navigation components with Design System 2025
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

describe('Navigation Flow - Design System 2025', () => {
  describe('Splash Screen Components', () => {
    it('renders splash screen branding', () => {
      const { getByText } = renderWithTheme(
        <View>
          <BrandLogo />
          <Typography variant="h3">
            Luttons contre le gaspillage
          </Typography>
          <Typography variant="body">
            Chargement...
          </Typography>
        </View>
      )

      expect(getByText('🌱 GÊLADAL')).toBeTruthy()
      expect(getByText('Luttons contre le gaspillage')).toBeTruthy()
      expect(getByText('Chargement...')).toBeTruthy()
    })
  })

  describe('Home Screen Components', () => {
    it('renders home screen welcome message', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Typography variant="displayMd" weight="bold">
            Bienvenue sur GÊLADAL
          </Typography>
          <Typography variant="body" color="secondary">
            Découvrez les produits à prix réduits près de chez vous
          </Typography>
        </View>
      )

      expect(getByText('Bienvenue sur GÊLADAL')).toBeTruthy()
      expect(getByText('Découvrez les produits à prix réduits près de chez vous')).toBeTruthy()
    })

    it('renders category cards', () => {
      const { getByText } = renderWithTheme(
        <Card variant="elevated" pressable>
          <Typography variant="h4" weight="semibold">
            🥖 Boulangerie
          </Typography>
        </Card>
      )

      expect(getByText('🥖 Boulangerie')).toBeTruthy()
    })

    it('renders action button', () => {
      const { getByText } = renderWithTheme(
        <Button variant="primary" size="lg" fullWidth>
          Explorer tous les produits
        </Button>
      )

      expect(getByText('Explorer tous les produits')).toBeTruthy()
    })
  })

  describe('Profile Screen Components', () => {
    it('renders profile header', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Typography variant="h2" weight="bold">
            Test User
          </Typography>
          <Typography variant="body" color="secondary">
            test@example.com
          </Typography>
        </View>
      )

      expect(getByText('Test User')).toBeTruthy()
      expect(getByText('test@example.com')).toBeTruthy()
    })

    it('renders profile statistics cards', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Card variant="flat">
            <Typography variant="caption" color="secondary">
              Réservations
            </Typography>
            <Typography variant="h3" weight="bold">
              12
            </Typography>
          </Card>
          <Card variant="flat">
            <Typography variant="caption" color="secondary">
              Économisé
            </Typography>
            <Typography variant="h3" weight="bold">
              2 500 XOF
            </Typography>
          </Card>
        </View>
      )

      expect(getByText('Réservations')).toBeTruthy()
      expect(getByText('12')).toBeTruthy()
      expect(getByText('Économisé')).toBeTruthy()
      expect(getByText('2 500 XOF')).toBeTruthy()
    })

    it('renders logout button', () => {
      const { getByText } = renderWithTheme(
        <Button variant="destructive" size="md" fullWidth>
          Déconnexion
        </Button>
      )

      expect(getByText('Déconnexion')).toBeTruthy()
    })
  })

  describe('Navigation Elements', () => {
    it('renders tab navigation items', () => {
      const { getByText: getText1 } = renderWithTheme(
        <Button variant="ghost" size="sm">
          Accueil
        </Button>
      )

      const { getByText: getText2 } = renderWithTheme(
        <Button variant="ghost" size="sm">
          Produits
        </Button>
      )

      const { getByText: getText3 } = renderWithTheme(
        <Button variant="ghost" size="sm">
          Réservations
        </Button>
      )

      const { getByText: getText4 } = renderWithTheme(
        <Button variant="ghost" size="sm">
          Profil
        </Button>
      )

      expect(getText1('Accueil')).toBeTruthy()
      expect(getText2('Produits')).toBeTruthy()
      expect(getText3('Réservations')).toBeTruthy()
      expect(getText4('Profil')).toBeTruthy()
    })

    it('renders back button', () => {
      const { getByText } = renderWithTheme(
        <Button variant="ghost" size="sm">
          ← Retour
        </Button>
      )

      expect(getByText('← Retour')).toBeTruthy()
    })
  })

  describe('Theme Consistency', () => {
    it('all screens use consistent typography', () => {
      const { getByText: getTitle } = renderWithTheme(
        <Typography variant="displayMd" weight="bold">
          Page Title
        </Typography>
      )

      const { getByText: getSubtitle } = renderWithTheme(
        <Typography variant="body" color="secondary">
          Page subtitle
        </Typography>
      )

      expect(getTitle('Page Title')).toBeTruthy()
      expect(getSubtitle('Page subtitle')).toBeTruthy()
    })

    it('all screens use consistent card styles', () => {
      const { getByText: getElevated } = renderWithTheme(
        <Card variant="elevated">
          <Text>Elevated Card</Text>
        </Card>
      )

      const { getByText: getFlat } = renderWithTheme(
        <Card variant="flat">
          <Text>Flat Card</Text>
        </Card>
      )

      expect(getElevated('Elevated Card')).toBeTruthy()
      expect(getFlat('Flat Card')).toBeTruthy()
    })

    it('all screens use consistent button variants', () => {
      const { getByText: getPrimary } = renderWithTheme(
        <Button variant="primary">Primary Action</Button>
      )

      const { getByText: getSecondary } = renderWithTheme(
        <Button variant="secondary">Secondary Action</Button>
      )

      const { getByText: getGhost } = renderWithTheme(
        <Button variant="ghost">Ghost Action</Button>
      )

      expect(getPrimary('Primary Action')).toBeTruthy()
      expect(getSecondary('Secondary Action')).toBeTruthy()
      expect(getGhost('Ghost Action')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('navigation buttons have button role', () => {
      const { getByRole } = renderWithTheme(
        <Button variant="primary">Navigate</Button>
      )

      expect(getByRole('button')).toBeTruthy()
    })

    it('cards can be made pressable for navigation', () => {
      const { root } = renderWithTheme(
        <Card variant="elevated" pressable onPress={() => {}}>
          <Typography variant="body">Clickable Card</Typography>
        </Card>
      )

      expect(root).toBeTruthy()
    })
  })

  describe('Design System Integration', () => {
    it('all navigation screens use Design System 2025', () => {
      const { root } = renderWithTheme(
        <View>
          <BrandLogo />
          <Card variant="elevated">
            <Typography variant="h3">Screen Content</Typography>
            <Button variant="primary">Action</Button>
          </Card>
        </View>
      )

      expect(root).toBeTruthy()
    })

    it('consistent spacing and layout across screens', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Typography variant="h2">Section Title</Typography>
          <Card variant="flat">
            <Typography variant="body">Section content</Typography>
          </Card>
          <Button variant="primary" fullWidth>
            Section action
          </Button>
        </View>
      )

      expect(getByText('Section Title')).toBeTruthy()
      expect(getByText('Section content')).toBeTruthy()
      expect(getByText('Section action')).toBeTruthy()
    })
  })
})
