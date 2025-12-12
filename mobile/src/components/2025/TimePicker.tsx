/**
 * TimePicker - Time slot selector
 *
 * Replaces basic TextInput for time selection with
 * visual time slot buttons.
 *
 * Features:
 * - Predefined time slots
 * - Custom time input
 * - Morning/Afternoon/Evening sections
 * - Haptic feedback
 * - Disabled slots support
 */

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../theme'

interface TimePickerProps {
  value: string // Format: "HH:MM"
  onChange: (time: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  minTime?: string // Format: "HH:MM"
  maxTime?: string // Format: "HH:MM"
  interval?: number // Minutes between slots (default: 30)
  availableSlots?: string[] // If provided, only these slots are available
}

interface TimeSection {
  label: string
  icon: string
  slots: string[]
}

const generateTimeSlots = (
  interval: number = 30,
  minTime?: string,
  maxTime?: string
): TimeSection[] => {
  const slots: string[] = []
  // FIX HIGH: Parse both hours AND minutes from minTime/maxTime
  const minParts = minTime ? minTime.split(':') : ['6', '0']
  const maxParts = maxTime ? maxTime.split(':') : ['22', '0']
  const minHour = parseInt(minParts[0])
  const minMinute = parseInt(minParts[1] || '0')
  const maxHour = parseInt(maxParts[0])
  const maxMinute = parseInt(maxParts[1] || '0')

  for (let hour = minHour; hour <= maxHour; hour++) {
    for (let min = 0; min < 60; min += interval) {
      // FIX HIGH: Skip slots before minTime or after maxTime
      if (hour === minHour && min < minMinute) continue
      if (hour === maxHour && min > maxMinute) continue

      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
      slots.push(timeStr)
    }
  }

  // Categorize into sections
  const morning = slots.filter(t => {
    const h = parseInt(t.split(':')[0])
    return h >= 6 && h < 12
  })

  const afternoon = slots.filter(t => {
    const h = parseInt(t.split(':')[0])
    return h >= 12 && h < 18
  })

  const evening = slots.filter(t => {
    const h = parseInt(t.split(':')[0])
    return h >= 18 && h <= 22
  })

  return [
    { label: 'Matin', icon: 'sunny-outline', slots: morning },
    { label: 'Après-midi', icon: 'partly-sunny-outline', slots: afternoon },
    { label: 'Soir', icon: 'moon-outline', slots: evening },
  ].filter(section => section.slots.length > 0)
}

const formatTimeDisplay = (time: string): string => {
  const [hours, minutes] = time.split(':')
  return `${hours}h${minutes}`
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Sélectionner une heure',
  disabled = false,
  error,
  minTime,
  maxTime,
  interval = 30,
  availableSlots,
}) => {
  const theme = useTheme()
  const [visible, setVisible] = useState(false)

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [])

  const handleOpen = () => {
    if (!disabled) {
      triggerHaptic()
      setVisible(true)
    }
  }

  const handleClose = () => {
    setVisible(false)
  }

  const handleSelectTime = (time: string) => {
    triggerHaptic()
    onChange(time)
    setVisible(false)
  }

  const sections = generateTimeSlots(interval, minTime, maxTime)

  const isSlotAvailable = (slot: string): boolean => {
    if (!availableSlots) return true
    return availableSlots.includes(slot)
  }

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
        accessibilityLabel={label || 'Sélecteur d\'heure'}
        accessibilityHint="Appuyez pour choisir une heure"
      >
        <Ionicons
          name="time-outline"
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
          {value ? formatTimeDisplay(value) : placeholder}
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
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.picker,
              {
                backgroundColor: theme.colors.background,
                ...theme.shadows.lg,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Choisir une heure
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Selected time display */}
            {value && (
              <View style={[styles.selectedDisplay, { backgroundColor: theme.colors.primary[50] }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary[600]} />
                <Text style={[styles.selectedText, { color: theme.colors.primary[700] }]}>
                  Heure sélectionnée: {formatTimeDisplay(value)}
                </Text>
              </View>
            )}

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {sections.map((section, sectionIndex) => (
                <View key={section.label} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name={section.icon as any}
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                    <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                      {section.label}
                    </Text>
                  </View>

                  <View style={styles.slotsGrid}>
                    {section.slots.map((slot) => {
                      const isSelected = value === slot
                      const isAvailable = isSlotAvailable(slot)

                      return (
                        <TouchableOpacity
                          key={slot}
                          style={[
                            styles.slotButton,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.primary[500]
                                : isAvailable
                                  ? theme.colors.surface.light
                                  : theme.colors.neutral[100],
                              borderColor: isSelected
                                ? theme.colors.primary[500]
                                : theme.colors.border,
                            },
                          ]}
                          onPress={() => isAvailable && handleSelectTime(slot)}
                          disabled={!isAvailable}
                          accessibilityRole="button"
                          accessibilityLabel={formatTimeDisplay(slot)}
                          accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
                        >
                          <Text
                            style={[
                              styles.slotText,
                              {
                                color: isSelected
                                  ? '#FFFFFF'
                                  : isAvailable
                                    ? theme.colors.text
                                    : theme.colors.neutral[400],
                              },
                            ]}
                          >
                            {formatTimeDisplay(slot)}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Quick actions */}
            <View style={[styles.quickActions, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: theme.colors.primary[500] }]}
                onPress={handleClose}
              >
                <Text style={styles.quickButtonText}>
                  Confirmer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    justifyContent: 'flex-end',
  },
  picker: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    padding: 16,
    borderTopWidth: 1,
  },
  quickButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default TimePicker
