import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useTheme } from '../theme'

const ConnectivityBanner: React.FC = () => {
  const theme = useTheme()
  const styles = createStyles(theme)

  const { isOnline, pendingActions, isSyncing, lastSyncError } = useSelector(
    (state: RootState) => state.connectivity
  )

  if (isOnline && pendingActions === 0 && !isSyncing && !lastSyncError) {
    return null
  }

  if (!isOnline) {
    return (
      <View style={[styles.container, styles.offline]} pointerEvents="none">
        <Text style={styles.title}>Mode hors ligne activé</Text>
        <Text style={styles.subtitle}>
          {pendingActions > 0
            ? `${pendingActions} action(s) seront synchronisées au retour du réseau.`
            : 'Navigation possible, mais certaines actions sont indisponibles.'}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, styles.syncing]} pointerEvents="none">
      <Text style={styles.title}>
        {isSyncing ? 'Synchronisation en cours…' : 'Synchronisation en attente'}
      </Text>
      <Text style={styles.subtitle}>
        {lastSyncError
          ? lastSyncError
          : pendingActions > 0
            ? `${pendingActions} action(s) restent à synchroniser.`
            : 'Les données locales sont prêtes.'}
      </Text>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      zIndex: 1000,
    },
    offline: {
      backgroundColor: theme.colors.semantic.error,
    },
    syncing: {
      backgroundColor: theme.colors.semantic.info,
    },
    title: {
      color: theme.colors.surface.light,
      fontWeight: '700',
      fontSize: 14,
      marginBottom: 2,
    },
    subtitle: {
      color: theme.colors.gray[50],
      fontSize: 12,
    },
  })

export default ConnectivityBanner
