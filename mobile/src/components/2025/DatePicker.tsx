/**
 * DatePicker - Visual calendar date selector
 *
 * Replaces basic TextInput for date selection with
 * an intuitive calendar interface.
 *
 * Features:
 * - Visual calendar grid
 * - Month navigation
 * - Min/max date boundaries
 * - Locale support (French)
 * - Haptic feedback
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../theme'

interface DatePickerProps {
  value: Date | null
  onChange: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate()
}

const getFirstDayOfMonth = (year: number, month: number): number => {
  const day = new Date(year, month, 1).getDay()
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  return day === 0 ? 6 : day - 1
}

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0')
  const month = MONTHS_FR[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  placeholder = 'Sélectionner une date',
  disabled = false,
  error,
}) => {
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const [viewDate, setViewDate] = useState(() => value || new Date())

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [])

  const handleOpen = () => {
    if (!disabled) {
      triggerHaptic()
      setViewDate(value || new Date())
      setVisible(true)
    }
  }

  const handleClose = () => {
    setVisible(false)
  }

  const handlePrevMonth = () => {
    triggerHaptic()
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    triggerHaptic()
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleSelectDate = (day: number) => {
    triggerHaptic()
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    onChange(selected)
    setVisible(false)
  }

  const isDateDisabled = useCallback((day: number): boolean => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return true
    return false
  }, [viewDate, minDate, maxDate])

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const days: (number | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }, [viewDate])

  const today = new Date()

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.inputButton,
          {
            backgroundColor: disabled ? theme.colors.neutral[100] : theme.colors.surface.light,
            borderColor: error ? theme.colors.error : theme.colors.border,
          },
        ]}
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label || 'Sélecteur de date'}
        accessibilityHint="Appuyez pour ouvrir le calendrier"
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={disabled ? theme.colors.neutral[400] : theme.colors.primary[500]}
        />
        <Text
          style={[
            styles.inputText,
            {
              color: value
                ? theme.colors.text
                : theme.colors.neutral[400],
            },
          ]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.neutral[400]}
        />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View
            style={[
              styles.calendar,
              {
                backgroundColor: theme.colors.background,
                ...theme.shadows.lg,
              },
            ]}
          >
            {/* Header with month navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={handlePrevMonth}
                accessibilityLabel="Mois précédent"
              >
                <Ionicons name="chevron-back" size={24} color={theme.colors.primary[500]} />
              </TouchableOpacity>

              <Text style={[styles.monthYear, { color: theme.colors.text }]}>
                {MONTHS_FR[viewDate.getMonth()]} {viewDate.getFullYear()}
              </Text>

              <TouchableOpacity
                style={styles.navButton}
                onPress={handleNextMonth}
                accessibilityLabel="Mois suivant"
              >
                <Ionicons name="chevron-forward" size={24} color={theme.colors.primary[500]} />
              </TouchableOpacity>
            </View>

            {/* Days of week header */}
            <View style={styles.weekHeader}>
              {DAYS_FR.map((day, index) => (
                <Text
                  key={index}
                  style={[styles.weekDay, { color: theme.colors.textSecondary }]}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />
                }

                const dateForDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
                const isSelected = value ? isSameDay(dateForDay, value) : false
                const isToday = isSameDay(dateForDay, today)
                const isDisabled = isDateDisabled(day)

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCell,
                      isSelected && {
                        backgroundColor: theme.colors.primary[500],
                        borderRadius: 20,
                      },
                      isToday && !isSelected && {
                        borderWidth: 1,
                        borderColor: theme.colors.primary[500],
                        borderRadius: 20,
                      },
                    ]}
                    onPress={() => !isDisabled && handleSelectDate(day)}
                    disabled={isDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={`${day} ${MONTHS_FR[viewDate.getMonth()]}`}
                    accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.colors.text },
                        isSelected && { color: '#FFFFFF', fontWeight: '700' },
                        isDisabled && { color: theme.colors.neutral[300] },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Quick actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickButton, { borderColor: theme.colors.border }]}
                onPress={() => {
                  onChange(new Date())
                  setVisible(false)
                }}
              >
                <Text style={[styles.quickButtonText, { color: theme.colors.primary[600] }]}>
                  Aujourd'hui
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickButton, { borderColor: theme.colors.border }]}
                onPress={() => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  onChange(tomorrow)
                  setVisible(false)
                }}
              >
                <Text style={[styles.quickButtonText, { color: theme.colors.primary[600] }]}>
                  Demain
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: theme.colors.neutral[100] }]}
                onPress={handleClose}
              >
                <Text style={[styles.quickButtonText, { color: theme.colors.textSecondary }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendar: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
})

export default DatePicker
