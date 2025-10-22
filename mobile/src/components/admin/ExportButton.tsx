import React, { useState } from 'react'
import { Alert } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../2025'
import apiService from '../../services/api'
import { AdminAnalyticsFilters } from '../../types'

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
        Alert.alert('Erreur', 'Le partage de fichiers n\'est pas disponible sur cet appareil')
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

      Alert.alert('Succès', `Rapport ${format.toUpperCase()} exporté avec succès`)
    } catch (error: any) {
      console.error(`❌ Export error:`, error)
      const errorMessage = error?.response?.data?.message || error?.message || `Impossible d'exporter en ${format.toUpperCase()}`
      onExportError?.(errorMessage)
      Alert.alert('Erreur d\'export', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}

export default ExportButton
