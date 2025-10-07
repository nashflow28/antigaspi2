import React from 'react'
import { View, Text, StyleSheet, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'

const AdminCategoriesScreen: React.FC = () => {
  const theme = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <Text style={styles.headerTitle}>Gestion Catégories</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="grid-outline" size={64} color={theme.colors.neutral[300]} />
        <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
          Écran de gestion des catégories
        </Text>
        <Text style={[styles.subtext, { color: theme.colors.text.secondary }]}>
          (CRUD catégories de produits)
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
})

export default AdminCategoriesScreen
