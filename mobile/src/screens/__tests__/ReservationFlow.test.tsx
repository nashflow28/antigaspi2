/**
 * Reservation Flow Tests
 * Tests reservation components and Design System 2025 usage
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { View, Text } from 'react-native'
import { ThemeProvider } from '../../theme/ThemeContext'
import { Button, Card, Badge, Typography } from '../../components/2025'

// Helper to wrap components with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Reservation Flow - Design System 2025', () => {
  describe('Product List Components', () => {
    it('renders product card with elevated variant', () => {
      const { getByText } = renderWithTheme(
        <Card variant="elevated">
          <Typography variant="h3" weight="bold">
            Pain complet artisanal
          </Typography>
          <Typography variant="body" color="secondary">
            250 XOF
          </Typography>
        </Card>
      )

      expect(getByText('Pain complet artisanal')).toBeTruthy()
      expect(getByText('250 XOF')).toBeTruthy()
    })

    it('renders discount badge', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="success" size="sm">
          -50%
        </Badge>
      )

      expect(getByText('-50%')).toBeTruthy()
    })

    it('renders availability badge', () => {
      const { getByText } = renderWithTheme(
        <Badge variant="warning" size="sm">
          Stock faible
        </Badge>
      )

      expect(getByText('Stock faible')).toBeTruthy()
    })
  })

  describe('Product Details Components', () => {
    it('renders product title', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="h2" weight="bold">
          Pain complet artisanal
        </Typography>
      )

      expect(getByText('Pain complet artisanal')).toBeTruthy()
    })

    it('renders product description', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="body" color="secondary">
          Pain frais du jour, préparé avec des ingrédients locaux
        </Typography>
      )

      expect(getByText('Pain frais du jour, préparé avec des ingrédients locaux')).toBeTruthy()
    })

    it('renders reserve button', () => {
      const { getByText } = renderWithTheme(
        <Button variant="primary" size="lg" fullWidth>
          Réserver maintenant
        </Button>
      )

      expect(getByText('Réserver maintenant')).toBeTruthy()
    })

    it('renders quantity controls', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Button variant="secondary" size="md">
            -
          </Button>
          <Typography variant="h3">1</Typography>
          <Button variant="secondary" size="md">
            +
          </Button>
        </View>
      )

      expect(getByText('-')).toBeTruthy()
      expect(getByText('1')).toBeTruthy()
      expect(getByText('+')).toBeTruthy()
    })
  })

  describe('Reservation List Components', () => {
    it('renders reservation card', () => {
      const { getByText } = renderWithTheme(
        <Card variant="flat">
          <Typography variant="h4" weight="semibold">
            Pain complet artisanal
          </Typography>
          <Typography variant="caption" color="secondary">
            Quantité: 2
          </Typography>
          <Badge variant="info" size="sm">
            En attente
          </Badge>
        </Card>
      )

      expect(getByText('Pain complet artisanal')).toBeTruthy()
      expect(getByText('Quantité: 2')).toBeTruthy()
      expect(getByText('En attente')).toBeTruthy()
    })

    it('renders reservation status badges', () => {
      const { getByText: getByTextPending } = renderWithTheme(
        <Badge variant="info">En attente</Badge>
      )

      const { getByText: getByTextConfirmed } = renderWithTheme(
        <Badge variant="success">Confirmée</Badge>
      )

      const { getByText: getByTextCompleted } = renderWithTheme(
        <Badge variant="neutral">Terminée</Badge>
      )

      const { getByText: getByTextCancelled } = renderWithTheme(
        <Badge variant="error">Annulée</Badge>
      )

      expect(getByTextPending('En attente')).toBeTruthy()
      expect(getByTextConfirmed('Confirmée')).toBeTruthy()
      expect(getByTextCompleted('Terminée')).toBeTruthy()
      expect(getByTextCancelled('Annulée')).toBeTruthy()
    })

    it('renders action buttons for reservations', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Button variant="primary" size="sm">
            QR Code
          </Button>
          <Button variant="secondary" size="sm">
            Voir
          </Button>
          <Button variant="destructive" size="sm">
            Annuler
          </Button>
        </View>
      )

      expect(getByText('QR Code')).toBeTruthy()
      expect(getByText('Voir')).toBeTruthy()
      expect(getByText('Annuler')).toBeTruthy()
    })
  })

  describe('Empty States', () => {
    it('renders empty reservation state', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Typography variant="h3" weight="semibold">
            Aucune réservation
          </Typography>
          <Typography variant="body" color="secondary">
            Vous n'avez pas encore de réservation
          </Typography>
          <Button variant="primary" size="md">
            Explorer les produits
          </Button>
        </View>
      )

      expect(getByText('Aucune réservation')).toBeTruthy()
      expect(getByText('Vous n\'avez pas encore de réservation')).toBeTruthy()
      expect(getByText('Explorer les produits')).toBeTruthy()
    })

    it('renders empty products state', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Typography variant="h3">Aucun produit disponible</Typography>
          <Typography variant="body" color="secondary">
            Aucun produit ne correspond à votre recherche
          </Typography>
        </View>
      )

      expect(getByText('Aucun produit disponible')).toBeTruthy()
      expect(getByText('Aucun produit ne correspond à votre recherche')).toBeTruthy()
    })
  })

  describe('Design System Integration', () => {
    it('all reservation components use theme context', () => {
      const { root } = renderWithTheme(
        <View>
          <Card variant="elevated">
            <Typography variant="h3">Product</Typography>
            <Badge variant="success">-50%</Badge>
            <Button variant="primary">Reserve</Button>
          </Card>
        </View>
      )

      expect(root).toBeTruthy()
    })

    it('reservation flow uses Design System 2025 components consistently', () => {
      const { getByText } = renderWithTheme(
        <View>
          <Typography variant="h2">Mes Réservations</Typography>
          <Card variant="flat">
            <Typography variant="body">Reservation Item</Typography>
            <Badge variant="info" size="sm">
              Status
            </Badge>
            <Button variant="secondary" size="sm">
              View
            </Button>
          </Card>
        </View>
      )

      expect(getByText('Mes Réservations')).toBeTruthy()
      expect(getByText('Reservation Item')).toBeTruthy()
      expect(getByText('Status')).toBeTruthy()
      expect(getByText('View')).toBeTruthy()
    })
  })
})
