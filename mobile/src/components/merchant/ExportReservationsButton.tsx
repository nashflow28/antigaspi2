import React, { useState } from 'react'
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Reservation } from '../../types'
import { TEST_IDS } from '../../utils/testIds'
import AlertModal, { AlertType, AlertButton } from '../AlertModal'
import { createLogger } from '../../utils/logger'
import { exportReservationsToExcel, shareExcelFile } from '../../services/excelExportService'

const exportReservationsLogger = createLogger('ExportReservationsButton')

interface Props {
  reservations: Reservation[]
  merchantName?: string
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: string) => void
  testID?: string
}

/**
 * ExportReservationsButton - Bouton d'export Excel pour les réservations
 *
 * Features:
 * - Génération Excel (XLSX) avec mise en forme élégante
 * - Multi-feuilles: Réservations + Résumé
 * - Colonnes auto-dimensionnées
 * - Totaux calculés automatiquement
 * - Répartition par statut
 * - Utilisation expo-file-system + expo-sharing
 */
const ExportReservationsButton: React.FC<Props> = ({
  reservations,
  merchantName,
  onExportStart,
  onExportComplete,
  onExportError,
  testID = TEST_IDS.exportReservationsCsvButton,
}) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)

  // AlertModal state
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertType, setAlertType] = useState<AlertType>('info')
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([])

  const showAlert = (
    type: AlertType,
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => {
    setAlertType(type)
    setAlertTitle(title)
    setAlertMessage(message || '')
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }])
    setAlertVisible(true)
  }

  /**
   * Handle Excel export process
   */
  const handleExport = async () => {
    try {
      setLoading(true)
      onExportStart?.()

      // Validate reservations data
      if (!reservations || reservations.length === 0) {
        showAlert('warning', 'Aucune donnée', 'Il n\'y a aucune réservation à exporter')
        setLoading(false)
        return
      }

      // Generate Excel file
      const fileUri = await exportReservationsToExcel(reservations, {
        merchantName,
      })

      // Share the file
      await shareExcelFile(
        fileUri,
        `Exporter ${reservations.length} réservation${reservations.length > 1 ? 's' : ''}`
      )

      // Success feedback
      showAlert(
        'success',
        'Export Excel réussi',
        `${reservations.length} réservation${reservations.length > 1 ? 's' : ''} exportée${reservations.length > 1 ? 's' : ''} dans un fichier Excel`
      )

      onExportComplete?.()
    } catch (error: any) {
      exportReservationsLogger.error('Excel export error:', error)

      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          'Impossible d\'exporter les réservations'

      showAlert('error', 'Erreur d\'export', errorMessage)

      onExportError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <TouchableOpacity
        onPress={handleExport}
        disabled={loading || reservations.length === 0}
        style={[
          styles.button,
          {
            backgroundColor: loading || reservations.length === 0
              ? theme.colors.neutral[200]
              : theme.colors.primary[500],
          },
        ]}
        testID={testID}
      >
        {loading ? (
          <>
            <ActivityIndicator
              size="small"
              color="white"
              testID={TEST_IDS.exportReservationsLoading}
            />
            <Text style={styles.buttonText}>Export en cours...</Text>
          </>
        ) : (
          <>
            <Ionicons name="document-text-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Exporter Excel</Text>
            {reservations.length > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.accent.orange }]}>
                <Text style={styles.badgeText}>{reservations.length}</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
      <AlertModal
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
})

export default ExportReservationsButton
