import React, { useState } from 'react'
import { View } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../2025'
import apiService from '../../services/api'
import { AdminAnalyticsFilters } from '../../types'
import AlertModal, { AlertType, AlertButton } from '../AlertModal'
import { exportAnalyticsToExcel, shareExcelFile } from '../../services/excelExportService'

interface ExportButtonProps {
  format: 'csv' | 'pdf' | 'xlsx'
  filters?: AdminAnalyticsFilters
  analyticsData?: {
    summary?: any
    dailyStats?: any[]
    topProducts?: any[]
    topMerchants?: any[]
  }
  dateRange?: { start: Date; end: Date }
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: string) => void
}

const FORMAT_CONFIG = {
  csv: {
    label: 'CSV',
    icon: 'document-text-outline' as const,
    mimeType: 'text/csv',
    uti: 'public.comma-separated-values-text',
  },
  pdf: {
    label: 'PDF',
    icon: 'document-outline' as const,
    mimeType: 'application/pdf',
    uti: 'com.adobe.pdf',
  },
  xlsx: {
    label: 'Excel',
    icon: 'grid-outline' as const,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uti: 'org.openxmlformats.spreadsheetml.sheet',
  },
}

const ExportButton: React.FC<ExportButtonProps> = ({
  format,
  filters,
  analyticsData,
  dateRange,
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

      const config = FORMAT_CONFIG[format]

      // BUG-001 FIX: Verify file system availability before proceeding
      if (!FileSystem.documentDirectory) {
        throw new Error('Le système de fichiers n\'est pas disponible sur cet appareil')
      }

      let fileUri: string

      // Handle Excel export locally
      if (format === 'xlsx' && analyticsData) {
        fileUri = await exportAnalyticsToExcel(analyticsData, dateRange)
        await shareExcelFile(fileUri, `Exporter les analytics (${config.label})`)
      } else {
        // Call API to get export data for CSV/PDF
        const response = await apiService.exportAnalytics(format === 'xlsx' ? 'csv' : format, filters)

        if (!response.file_content && !response.file_url) {
          throw new Error('No export data received from server')
        }

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
        const filename = `analytics-${timestamp}.${format}`
        fileUri = `${FileSystem.documentDirectory}${filename}`

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

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync()
        if (!isAvailable) {
          showAlert('error', 'Erreur', 'Le partage de fichiers n\'est pas disponible sur cet appareil')
          return
        }

        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: config.mimeType,
          dialogTitle: `Exporter les analytics (${config.label})`,
          UTI: config.uti,
        })
      }

      onExportComplete?.()

      showAlert('success', 'Succès', `Rapport ${config.label} exporté avec succès`)
    } catch (error: any) {
      const config = FORMAT_CONFIG[format]
      const errorMessage = error?.response?.data?.message || error?.message || `Impossible d'exporter en ${config.label}`
      onExportError?.(errorMessage)
      showAlert('error', 'Erreur d\'export', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const config = FORMAT_CONFIG[format]

  return (
    <View>
      <Button
        variant="secondary"
        size="sm"
        onPress={handleExport}
        loading={loading}
        disabled={loading}
        leftIcon={<Ionicons name={config.icon} size={18} />}
        testID={`export-${format}-button`}
      >
        {config.label}
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
