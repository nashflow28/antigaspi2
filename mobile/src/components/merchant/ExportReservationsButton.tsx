import React, { useState } from 'react'
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { useTheme } from '../../theme'
import { Reservation } from '../../types'
import { TEST_IDS } from '../../utils/testIds'
import AlertModal, { AlertType, AlertButton } from '../AlertModal'

interface Props {
  reservations: Reservation[]
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: string) => void
  testID?: string
}

/**
 * ExportReservationsButton - Bouton d'export CSV pour les réservations
 *
 * Features:
 * - Génération CSV avec échappement sécurisé (injection prevention)
 * - UTF-8 BOM pour compatibilité Excel
 * - Utilisation expo-file-system + expo-sharing
 * - BUG-001 fix: Vérification FileSystem.documentDirectory
 * - Gestion des états: loading, success, error
 * - Callbacks pour tracking externe
 */
const ExportReservationsButton: React.FC<Props> = ({
  reservations,
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
   * Escape CSV field to prevent injection and ensure proper formatting
   * - Wraps fields containing quotes, commas, or newlines in double quotes
   * - Escapes existing double quotes by doubling them
   * - Prevents CSV injection attacks (=, +, -, @)
   */
  const escapeCSVField = (value: any): string => {
    if (value == null) return ''

    const stringValue = String(value).trim()

    // Prevent CSV injection by prefixing dangerous characters with single quote
    if (stringValue.startsWith('=') || stringValue.startsWith('+') ||
        stringValue.startsWith('-') || stringValue.startsWith('@')) {
      return `"'${stringValue.replace(/"/g, '""')}"`
    }

    // Check if field needs quoting (contains comma, quote, or newline)
    if (stringValue.includes(',') || stringValue.includes('"') ||
        stringValue.includes('\n') || stringValue.includes('\r')) {
      // Escape existing quotes by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`
    }

    return stringValue
  }

  /**
   * Generate CSV content from reservations data
   * Includes UTF-8 BOM for Excel compatibility
   */
  const generateCSV = (): string => {
    // CSV Header row
    const headers = [
      'ID',
      'Code Réservation',
      'Client',
      'Téléphone',
      'Produit',
      'Quantité',
      'Prix Original (XOF)',
      'Prix Réduit (XOF)',
      'Total (XOF)',
      'Statut',
      'Paiement',
      'Date Retrait',
      'Heure Retrait',
      'Réservé le',
      'Confirmé le',
      'Complété le',
      'Annulé le',
      'Notes',
    ].map(escapeCSVField).join(',')

    // Data rows
    const rows = reservations.map((reservation) => {
      const clientName = reservation.consumer
        ? `${reservation.consumer.first_name} ${reservation.consumer.last_name}`
        : 'Client inconnu'

      const clientPhone = reservation.consumer?.phone || ''

      return [
        reservation.id,
        reservation.reservation_code,
        clientName,
        clientPhone,
        reservation.product.name,
        reservation.quantity,
        reservation.original_price,
        reservation.discounted_price,
        reservation.total_amount || (reservation.quantity * reservation.discounted_price),
        reservation.status,
        reservation.payment_status || 'N/A',
        reservation.pickup_date || '',
        reservation.pickup_time || '',
        reservation.reserved_at || reservation.created_at || '',
        reservation.confirmed_at || '',
        reservation.completed_at || '',
        reservation.cancelled_at || '',
        reservation.notes || '',
      ].map(escapeCSVField).join(',')
    })

    // UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF'

    return BOM + [headers, ...rows].join('\n')
  }

  /**
   * Handle CSV export process
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

      // BUG-001 FIX: Verify file system availability before proceeding
      if (!FileSystem.documentDirectory) {
        throw new Error('Le système de fichiers n\'est pas disponible sur cet appareil')
      }

      // Generate CSV content
      const csvContent = generateCSV()

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `reservations-export-${timestamp}.csv`
      const fileUri = `${FileSystem.documentDirectory}${filename}`

      // Write CSV file
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync()

      if (!isAvailable) {
        showAlert('error', 'Erreur', 'Le partage de fichiers n\'est pas disponible sur cet appareil')
        setLoading(false)
        return
      }

      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Exporter ${reservations.length} réservation${reservations.length > 1 ? 's' : ''}`,
        UTI: 'public.comma-separated-values-text',
      })

      // Success feedback
      showAlert(
        'success',
        'Export réussi',
        `${reservations.length} réservation${reservations.length > 1 ? 's' : ''} exportée${reservations.length > 1 ? 's' : ''} avec succès`
      )

      onExportComplete?.()
    } catch (error: any) {
      console.error('CSV export error:', error)

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
            <Ionicons name="download-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Exporter CSV</Text>
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
