/**
 * ComponentGalleryScreen - Galerie de visualisation des primitives UI 2025
 * Affiche toutes les variantes et états des composants
 */

import React, { useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'
import {
  Button,
  Card,
  Badge,
  Modal,
  Typography,
  Heading1,
  Heading2,
  Heading3,
  BodyText,
  SmallText,
  CaptionText,
} from '../components/2025'

export const ComponentGalleryScreen: React.FC = () => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)
  const [modalVariant, setModalVariant] = useState<'center' | 'bottom' | 'fullscreen'>('center')

  const styles = createStyles(theme)

  const openModal = (variant: 'center' | 'bottom' | 'fullscreen') => {
    setModalVariant(variant)
    setModalVisible(true)
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Heading2 color="inverse">Primitives UI 2025</Heading2>
        <SmallText color="inverse" style={{ opacity: 0.9 }}>
          Galerie de composants
        </SmallText>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Section: Typography */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>Typography</Heading3>
          <Card variant="elevated" style={styles.card}>
            <Heading1>Heading 1</Heading1>
            <Heading2>Heading 2</Heading2>
            <Heading3>Heading 3</Heading3>
            <BodyText>Body text with normal weight</BodyText>
            <SmallText color="secondary">Small text secondary color</SmallText>
            <CaptionText color="tertiary">Caption text tertiary</CaptionText>
          </Card>
        </View>

        {/* Section: Buttons */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>Buttons</Heading3>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Variantes
          </BodyText>
          <Card variant="elevated" style={styles.card}>
            <Button variant="primary" onPress={() => console.log('Primary')}>
              Primary Button
            </Button>
            <Button variant="secondary" onPress={() => console.log('Secondary')}>
              Secondary Button
            </Button>
            <Button variant="promo" onPress={() => console.log('Promo')}>
              Promo Button
            </Button>
            <Button variant="ghost" onPress={() => console.log('Ghost')}>
              Ghost Button
            </Button>
            <Button variant="destructive" onPress={() => console.log('Destructive')}>
              Destructive Button
            </Button>
          </Card>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Tailles
          </BodyText>
          <Card variant="elevated" style={styles.card}>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </Card>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            États
          </BodyText>
          <Card variant="elevated" style={styles.card}>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button
              variant="primary"
              fullWidth
              leftIcon={<Ionicons name="heart" size={20} color={theme.colors.textInverse} />}
            >
              With Icon
            </Button>
          </Card>
        </View>

        {/* Section: Badges */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>Badges</Heading3>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Variantes Solid
          </BodyText>
          <Card variant="elevated" style={[styles.card, styles.badgeContainer]}>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="promo">Promo</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </Card>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Variantes Outline
          </BodyText>
          <Card variant="elevated" style={[styles.card, styles.badgeContainer]}>
            <Badge variant="primary" outline>Primary</Badge>
            <Badge variant="secondary" outline>Secondary</Badge>
            <Badge variant="promo" outline>Promo</Badge>
            <Badge variant="success" outline>Success</Badge>
          </Card>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Tailles et Dot
          </BodyText>
          <Card variant="elevated" style={[styles.card, styles.badgeContainer]}>
            <Badge variant="primary" size="sm">Small</Badge>
            <Badge variant="primary" size="md">Medium</Badge>
            <Badge variant="primary" size="lg">Large</Badge>
            <Badge variant="success" dot>Active</Badge>
          </Card>
        </View>

        {/* Section: Cards */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>Cards</Heading3>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Elevated Card
          </BodyText>
          <Card variant="elevated">
            <BodyText>Card with elevation and shadow</BodyText>
          </Card>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Flat Card
          </BodyText>
          <Card variant="flat">
            <BodyText>Card without shadow</BodyText>
          </Card>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Glass Card
          </BodyText>
          <Card variant="glass">
            <BodyText>Card with glassmorphism effect</BodyText>
          </Card>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Outline Card
          </BodyText>
          <Card variant="outline">
            <BodyText>Card with border only</BodyText>
          </Card>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Card with Header & Footer
          </BodyText>
          <Card
            variant="elevated"
            header={<Heading3>Card Header</Heading3>}
            footer={
              <Button variant="primary" fullWidth>
                Action Button
              </Button>
            }
          >
            <BodyText>This card has a header and footer section.</BodyText>
          </Card>

          <BodyText color="secondary" style={styles.subsectionTitle}>
            Pressable Card
          </BodyText>
          <Card
            variant="elevated"
            pressable
            onPress={() => console.log('Card pressed')}
          >
            <BodyText>Tap me! I'm pressable.</BodyText>
          </Card>
        </View>

        {/* Section: Modals */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>Modals</Heading3>
          <Card variant="elevated" style={styles.card}>
            <Button variant="primary" onPress={() => openModal('center')}>
              Open Center Modal
            </Button>
            <Button variant="secondary" onPress={() => openModal('bottom')}>
              Open Bottom Modal
            </Button>
            <Button variant="ghost" onPress={() => openModal('fullscreen')}>
              Open Fullscreen Modal
            </Button>
          </Card>
        </View>

        {/* Section: Theme */}
        <View style={styles.section}>
          <Heading3 style={styles.sectionTitle}>Theme Controls</Heading3>
          <Card variant="elevated" style={styles.card}>
            <BodyText color="secondary" style={{ marginBottom: theme.spacing.md }}>
              Current mode: {theme.mode} {theme.isDark ? '🌙' : '☀️'}
            </BodyText>
            <Button variant="primary" onPress={theme.toggleTheme} fullWidth>
              Toggle Theme
            </Button>
          </Card>
        </View>
      </ScrollView>

      {/* Demo Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={`Modal ${modalVariant}`}
        variant={modalVariant}
        footer={
          <Button variant="primary" fullWidth onPress={() => setModalVisible(false)}>
            Close Modal
          </Button>
        }
      >
        <BodyText>
          This is a {modalVariant} modal with animations and overlay.
        </BodyText>
        <BodyText color="secondary" style={{ marginTop: theme.spacing.md }}>
          Try different variants to see the animations!
        </BodyText>
      </Modal>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.lg,
    paddingTop: theme.spacing['2xl'],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  subsectionTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  card: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
})

export default ComponentGalleryScreen