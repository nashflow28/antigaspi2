import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  StatusBar,
  Platform,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from '../../theme'
import apiService from '../../services/api'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'

interface DaySchedule {
  day: string
  is_open: boolean
  morning_start: string
  morning_end: string
  afternoon_start: string
  afternoon_end: string
}

const DAYS_FR = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
]

const MerchantOpeningHoursScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const { alertProps, showError, showSuccess, showWarning, hideAlert } = useAlert()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Initialiser avec les valeurs par défaut
  const defaultSchedule: DaySchedule[] = DAYS_FR.map((day) => ({
    day: day.key,
    is_open: day.key !== 'sunday', // Fermé le dimanche par défaut
    morning_start: '08:00',
    morning_end: '12:00',
    afternoon_start: '14:00',
    afternoon_end: '18:00',
  }))
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule)
  const [showTimePicker, setShowTimePicker] = useState<{
    dayIndex: number
    field: 'morning_start' | 'morning_end' | 'afternoon_start' | 'afternoon_end'
  } | null>(null)

  useEffect(() => {
    loadOpeningHours()
  }, [])

  const loadOpeningHours = async () => {
    try {
      setLoading(true)
      const response = await apiService.get('/merchants/opening-hours')

      // 🐛 BUG FIX #30: apiService.get() returns response.data directly
      // So response IS the data object, not response.data
      console.log('📅 [OpeningHours] API response:', response)

      if (response?.success) {
        const existingHours = response.data?.opening_hours

        // Si des heures existent, les utiliser
        if (existingHours && Array.isArray(existingHours) && existingHours.length > 0) {
          // Assurer que tous les jours sont présents
          const fullSchedule: DaySchedule[] = DAYS_FR.map((day) => {
            const existingDay = existingHours.find((h: DaySchedule) => h.day === day.key)
            return existingDay || {
              day: day.key,
              is_open: day.key !== 'sunday',
              morning_start: '08:00',
              morning_end: '12:00',
              afternoon_start: '14:00',
              afternoon_end: '18:00',
            }
          })
          setSchedule(fullSchedule)
          console.log('📅 [OpeningHours] Loaded existing hours')
        } else {
          // Garder les valeurs par défaut (déjà initialisées dans useState)
          console.log('📅 [OpeningHours] No existing hours, using defaults')
        }
      } else {
        console.warn('📅 [OpeningHours] API returned success: false')
      }
    } catch (error: any) {
      console.error('📅 [OpeningHours] Error:', error?.message || error)
      // Ne pas afficher d'alerte, garder les valeurs par défaut
      // L'utilisateur peut quand même définir ses horaires
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      console.log('📅 [OpeningHours] Saving schedule:', JSON.stringify(schedule, null, 2))

      const response = await apiService.put('/merchants/opening-hours', {
        opening_hours: schedule,
      })

      console.log('📅 [OpeningHours] Save response:', response)

      // 🐛 BUG FIX #30: apiService.put() returns response.data directly
      if (response?.success) {
        showSuccess('Succès', 'Heures d\'ouverture mises à jour avec succès', [
	          {
	            text: 'OK',
	            onPress: () => {
	              hideAlert()
	              if (navigation.canGoBack()) {
	                navigation.goBack()
	              } else {
	                (navigation as any).navigate('Dashboard')
              }
            },
          },
        ])
      } else {
        // Handle case where response exists but success is false
        console.error('📅 [OpeningHours] Save failed:', response)
        showError('Erreur', response?.message || 'La sauvegarde a échoué')
      }
    } catch (error: any) {
      console.error('📅 [OpeningHours] Save error:', error)
      console.error('📅 [OpeningHours] Error details:', {
        message: error?.message,
        statusCode: error?.statusCode,
        validationErrors: error?.validationErrors,
      })

      let errorMessage = 'Impossible de sauvegarder les heures'
      if (error?.validationErrors) {
        const errors = Object.values(error.validationErrors).flat()
        errorMessage = errors.join('\n')
      } else if (error?.message) {
        errorMessage = error.message
      }

      showError('Erreur', errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (index: number) => {
    const newSchedule = [...schedule]
    newSchedule[index].is_open = !newSchedule[index].is_open
    setSchedule(newSchedule)
  }

  // 🐛 BUG FIX #MOB-M-003: Validate HH:MM format for manual time input (web)
  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  const updateTime = (index: number, field: keyof DaySchedule, value: string) => {
    // Validate time format before updating
    if (!validateTimeFormat(value)) {
      showError('Format invalide', 'Veuillez entrer l\'heure au format HH:MM (ex: 08:00)')
      return
    }
    const newSchedule = [...schedule]
    ;(newSchedule[index] as any)[field] = value
    setSchedule(newSchedule)
  }

  const formatTime = (time: string) => {
    if (!time) return '--:--'
    return time
  }

  const parseTimeToDate = (timeString: string): Date => {
    if (!timeString || !/^\d{1,2}:\d{2}$/.test(timeString)) {
      return new Date()
    }
    const [hours, minutes] = timeString.split(':')
    const h = parseInt(hours, 10)
    const m = parseInt(minutes, 10)
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      return new Date()
    }
    const date = new Date()
    date.setHours(h)
    date.setMinutes(m)
    return date
  }

  const formatDateToTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (showTimePicker && selectedDate) {
      const { dayIndex, field } = showTimePicker
      const timeString = formatDateToTime(selectedDate)
      updateTime(dayIndex, field, timeString)
    }
    setShowTimePicker(null)
  }

  const copyToAllDays = (index: number) => {
    showWarning(
      'Copier aux autres jours',
      'Voulez-vous appliquer ces horaires à tous les jours ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: hideAlert },
        {
          text: 'Copier',
          onPress: () => {
            hideAlert()
            const sourceDay = schedule[index]
            const newSchedule = schedule.map((day) => ({
              ...day,
              is_open: sourceDay.is_open,
              morning_start: sourceDay.morning_start,
              morning_end: sourceDay.morning_end,
              afternoon_start: sourceDay.afternoon_start,
              afternoon_end: sourceDay.afternoon_end,
            }))
            setSchedule(newSchedule)
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            (navigation as any).navigate('Dashboard')
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Heures d'ouverture</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={[styles.infoCard, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary[500]} />
          <Text style={[styles.infoText, { color: theme.colors.primary[700] }]}>
            Définissez vos horaires d'ouverture pour informer vos clients. Vous pouvez définir des horaires
            différents le matin et l'après-midi.
          </Text>
        </View>

        {/* Days list */}
        {schedule.map((day, index) => {
          const dayLabel = DAYS_FR.find((d) => d.key === day.day)?.label || day.day

          return (
            <View key={day.day} style={[styles.dayCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
              {/* Day header */}
              <View style={styles.dayHeader}>
                <View style={styles.dayTitleRow}>
                  <Text style={[styles.dayTitle, { color: theme.colors.text }]}>{dayLabel}</Text>
                  <Switch
                    value={day.is_open}
                    onValueChange={() => toggleDay(index)}
                    trackColor={{
                      false: theme.colors.neutral[200],
                      true: theme.colors.primary[400],
                    }}
                    thumbColor={day.is_open ? theme.colors.primary[600] : theme.colors.neutral[50]}
                  />
                </View>
                {day.is_open && (
                  <TouchableOpacity
                    onPress={() => copyToAllDays(index)}
                    style={[styles.copyButton, { backgroundColor: theme.colors.neutral[100] }]}
                  >
                    <Ionicons name="copy-outline" size={16} color={theme.colors.primary[500]} />
                    <Text style={[styles.copyButtonText, { color: theme.colors.primary[500] }]}>
                      Copier à tous
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Time slots */}
              {day.is_open && (
                <View style={styles.timeSlotsContainer}>
                  {/* Morning */}
                  <View style={styles.timeSlot}>
                    <Text style={[styles.timeSlotLabel, { color: theme.colors.textSecondary }]}>Matin</Text>
                    <View style={styles.timeInputs}>
                      <TouchableOpacity
                        style={[styles.timeButton, { backgroundColor: theme.colors.neutral[100] }]}
                        onPress={() => setShowTimePicker({ dayIndex: index, field: 'morning_start' })}
                      >
                        <Ionicons name="time-outline" size={18} color={theme.colors.primary[500]} />
                        <Text style={[styles.timeText, { color: theme.colors.text }]}>
                          {formatTime(day.morning_start)}
                        </Text>
                      </TouchableOpacity>
                      <Text style={[styles.timeSeparator, { color: theme.colors.textSecondary }]}>-</Text>
                      <TouchableOpacity
                        style={[styles.timeButton, { backgroundColor: theme.colors.neutral[100] }]}
                        onPress={() => setShowTimePicker({ dayIndex: index, field: 'morning_end' })}
                      >
                        <Ionicons name="time-outline" size={18} color={theme.colors.primary[500]} />
                        <Text style={[styles.timeText, { color: theme.colors.text }]}>
                          {formatTime(day.morning_end)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Afternoon */}
                  <View style={styles.timeSlot}>
                    <Text style={[styles.timeSlotLabel, { color: theme.colors.textSecondary }]}>
                      Après-midi
                    </Text>
                    <View style={styles.timeInputs}>
                      <TouchableOpacity
                        style={[styles.timeButton, { backgroundColor: theme.colors.neutral[100] }]}
                        onPress={() => setShowTimePicker({ dayIndex: index, field: 'afternoon_start' })}
                      >
                        <Ionicons name="time-outline" size={18} color={theme.colors.primary[500]} />
                        <Text style={[styles.timeText, { color: theme.colors.text }]}>
                          {formatTime(day.afternoon_start)}
                        </Text>
                      </TouchableOpacity>
                      <Text style={[styles.timeSeparator, { color: theme.colors.textSecondary }]}>-</Text>
                      <TouchableOpacity
                        style={[styles.timeButton, { backgroundColor: theme.colors.neutral[100] }]}
                        onPress={() => setShowTimePicker({ dayIndex: index, field: 'afternoon_end' })}
                      >
                        <Ionicons name="time-outline" size={18} color={theme.colors.primary[500]} />
                        <Text style={[styles.timeText, { color: theme.colors.text }]}>
                          {formatTime(day.afternoon_end)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {!day.is_open && (
                <View style={styles.closedBadge}>
                  <Text style={[styles.closedText, { color: theme.colors.semantic.error }]}>Fermé</Text>
                </View>
              )}
            </View>
          )
        })}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary[500] }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.saveButtonText}>Enregistrer les horaires</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={parseTimeToDate(schedule[showTimePicker.dayIndex][showTimePicker.field])}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      <AlertModal {...alertProps} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  dayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    marginBottom: 12,
  },
  dayTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeSlotsContainer: {
    gap: 12,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSlotLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closedBadge: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default MerchantOpeningHoursScreen
