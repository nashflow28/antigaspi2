import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

const ConnectivityBanner: React.FC = () => {
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  offline: {
    backgroundColor: '#B91C1C',
  },
  syncing: {
    backgroundColor: '#2563EB',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  subtitle: {
    color: '#F9FAFB',
    fontSize: 12,
  },
})

export default ConnectivityBanner
