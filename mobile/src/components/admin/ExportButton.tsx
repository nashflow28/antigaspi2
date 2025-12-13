import React, { useState } from 'react'
import { View } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../2025'
import apiService from '../../services/api'
import { AdminAnalyticsFilters } from '../../types'
import AlertModal, { AlertType, AlertButton } from '../AlertModal'

interface ExportButtonProps {
  format: 'csv' | 'pdf'
  filters?: AdminAnalyticsFilters
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: string) => void
}

const ExportButton: React.FC<ExportButtonProps> = ({
  format,
  filters,
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
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

  const handleExport = async () => {
    try {
      setLoading(true)
      onExportStart?.()

      console.log(`📊 Exporting analytics as ${format.toUpperCase()}...`)

      // BUG-001 FIX: Verify file system availability before proceeding
      if (!FileSystem.documentDirectory) {
        throw new Error('Le système de fichiers n\'est pas disponible sur cet appareil')
      }

      // Call API to get export data
      const response = await apiService.exportAnalytics(format, filters)

      if (!response.file_content && !response.file_url) {
        throw new Error('No export data received from server')
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `analytics-${timestamp}.${format}`
      const fileUri = `${FileSystem.documentDirectory}${filename}`

      // Write file to cache
      if (response.file_content) {
        // Base64 content
        await FileSystem.writeAsStringAsync(fileUri, response.file_content, {
          encoding: 'base64' as any,
        })
      } else if (response.file_url) {
        // Download from URL
        const downloadResult = await FileSystem.downloadAsync(response.file_url, fileUri)
        if (downloadResult.status !== 200) {
          throw new Error('Failed to download export file')
        }
      }

      console.log(`✅ File saved to: ${fileUri}`)

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        showAlert('error', 'Erreur', 'Le partage de fichiers n\'est pas disponible sur cet appareil')
        return
      }

      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: format === 'csv' ? 'text/csv' : 'application/pdf',
        dialogTitle: `Exporter les analytics (${format.toUpperCase()})`,
        UTI: format === 'csv' ? 'public.comma-separated-values-text' : 'com.adobe.pdf',
      })

      console.log('✅ Export completed successfully')
      onExportComplete?.()

      showAlert('success', 'Succès', `Rapport ${format.toUpperCase()} exporté avec succès`)
    } catch (error: any) {
      console.error(`❌ Export error:`, error)
      const errorMessage = error?.response?.data?.message || error?.message || `Impossible d'exporter en ${format.toUpperCase()}`
      onExportError?.(errorMessage)
      showAlert('error', 'Erreur d\'export', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <Button
        variant="secondary"
        size="sm"
        onPress={handleExport}
        loading={loading}
        disabled={loading}
        leftIcon={<Ionicons name="download-outline" size={18} />}
        testID={`export-${format}-button`}
      >
        {format.toUpperCase()}
      </Button>
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

export default ExportButton
