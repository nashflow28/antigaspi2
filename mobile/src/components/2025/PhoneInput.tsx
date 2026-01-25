import React, { useState, useMemo } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Typography } from './Typography'

/**
 * Country code data for West African countries
 * Togo is default as per business requirements
 */
const COUNTRY_CODES = [
  { code: '+228', country: 'Togo', flag: '🇹🇬', iso: 'TG' },
  { code: '+229', country: 'Bénin', flag: '🇧🇯', iso: 'BJ' },
  { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮', iso: 'CI' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭', iso: 'GH' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫', iso: 'BF' },
  { code: '+221', country: 'Sénégal', flag: '🇸🇳', iso: 'SN' },
  { code: '+223', country: 'Mali', flag: '🇲🇱', iso: 'ML' },
  { code: '+227', country: 'Niger', flag: '🇳🇪', iso: 'NE' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', iso: 'NG' },
  { code: '+237', country: 'Cameroun', flag: '🇨🇲', iso: 'CM' },
]

interface PhoneInputProps {
  value: string
  onChangeText: (fullNumber: string) => void
  placeholder?: string
  defaultCountryCode?: string
  style?: ViewStyle
  disabled?: boolean
  testID?: string
}

/**
 * Phone input component with country code selector
 * Default country is Togo (+228) for West African market
 */
export function PhoneInput({
  value,
  onChangeText,
  placeholder = 'Ex: 90 12 34 56',
  defaultCountryCode = '+228',
  style,
  disabled = false,
  testID,
}: PhoneInputProps) {
  const theme = useTheme()
  const [showCountryPicker, setShowCountryPicker] = useState(false)

  // Parse initial value to extract country code and local number
  const { selectedCountry, localNumber } = useMemo(() => {
    // Find matching country code from value
    for (const country of COUNTRY_CODES) {
      if (value.startsWith(country.code)) {
        return {
          selectedCountry: country,
          localNumber: value.substring(country.code.length).trim(),
        }
      }
    }
    // Default to Togo if no match
    const defaultCountry = COUNTRY_CODES.find(c => c.code === defaultCountryCode) || COUNTRY_CODES[0]
    // If value doesn't start with +, treat it as local number
    const cleanValue = value.startsWith('+') ? '' : value
    return {
      selectedCountry: defaultCountry,
      localNumber: cleanValue,
    }
  }, [value, defaultCountryCode])

  const [currentCountry, setCurrentCountry] = useState(selectedCountry)

  const handleCountrySelect = (country: typeof COUNTRY_CODES[0]) => {
    setCurrentCountry(country)
    setShowCountryPicker(false)
    // Update full number with new country code
    const fullNumber = localNumber ? `${country.code}${localNumber.replace(/\s/g, '')}` : ''
    onChangeText(fullNumber)
  }

  const handleLocalNumberChange = (text: string) => {
    // Remove any non-numeric characters except spaces for formatting
    const cleaned = text.replace(/[^0-9\s]/g, '')
    // Build full number
    const fullNumber = cleaned ? `${currentCountry.code}${cleaned.replace(/\s/g, '')}` : ''
    onChangeText(fullNumber)
  }

  return (
    <View style={[styles.container, style]}>
      {/* Country Code Selector */}
      <TouchableOpacity
        style={[
          styles.countrySelector,
          {
            backgroundColor: theme.isDark ? theme.colors.neutral[700] : theme.colors.neutral[100],
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => !disabled && setShowCountryPicker(true)}
        disabled={disabled}
        testID={testID ? `${testID}-country-selector` : undefined}
      >
        <Typography variant="body" style={{ fontSize: 18 }}>
          {currentCountry.flag}
        </Typography>
        <Typography variant="body" weight="medium" style={{ marginLeft: 4 }}>
          {currentCountry.code}
        </Typography>
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.colors.textSecondary}
          style={{ marginLeft: 2 }}
        />
      </TouchableOpacity>

      {/* Phone Number Input */}
      <TextInput
        value={localNumber}
        onChangeText={handleLocalNumberChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.neutral[400]}
        keyboardType="phone-pad"
        editable={!disabled}
        style={[
          styles.input,
          {
            backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        testID={testID}
      />

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.isDark ? theme.colors.neutral[900] : theme.colors.background,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="semibold">
                Sélectionner un pays
              </Typography>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.iso}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    {
                      backgroundColor:
                        item.iso === currentCountry.iso
                          ? theme.colors.primary[50]
                          : 'transparent',
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Typography variant="body" style={{ fontSize: 24, marginRight: 12 }}>
                    {item.flag}
                  </Typography>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="medium">
                      {item.country}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {item.code}
                    </Typography>
                  </View>
                  {item.iso === currentCountry.iso && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.primary[500]}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    padding: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
})

export default PhoneInput
