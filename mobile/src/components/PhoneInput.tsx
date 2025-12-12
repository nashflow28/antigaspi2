/**
 * PhoneInput - International phone number input with country code selector
 *
 * Features:
 * - Auto-detects country from device locale
 * - Clickable prefix with flag + dial code
 * - Searchable country picker modal
 * - Auto-formats number according to country pattern
 * - West African countries prioritized
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getLocales } from 'expo-localization'
import { useTheme } from '../theme'
import { Typography } from './2025'
import {
  Country,
  ALL_COUNTRIES,
  WEST_AFRICAN_COUNTRIES,
  OTHER_COUNTRIES,
  DEFAULT_COUNTRY,
  LOCALE_TO_COUNTRY,
  getCountryByCode,
  formatPhoneNumber,
  getRawPhoneNumber,
  getFullPhoneNumber,
  parsePhoneNumber,
} from '../data/countries'

interface PhoneInputProps {
  value: string                           // Full phone number with country code
  onChangeText: (value: string) => void   // Called with full number (e.g., "+228 90 12 34 56")
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  testID?: string
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  placeholder = '90 12 34 56',
  label,
  error,
  disabled = false,
  testID,
}) => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [localNumber, setLocalNumber] = useState('')

  // Auto-detect country from device locale on mount
  useEffect(() => {
    const detectCountry = () => {
      try {
        // Get device locales using new expo-localization API
        const locales = getLocales()
        const primaryLocale = locales[0]

        if (!primaryLocale) {
          setSelectedCountry(DEFAULT_COUNTRY)
          return
        }

        // Get languageTag (e.g., "fr-TG", "en-US") and regionCode
        const languageTag = primaryLocale.languageTag || ''
        const regionCode = primaryLocale.regionCode || ''
        const normalizedLocale = languageTag.replace('-', '_')

        // Try exact match with locale
        let countryCode = LOCALE_TO_COUNTRY[normalizedLocale]

        // Try with just language_region format
        if (!countryCode) {
          const parts = normalizedLocale.split('_')
          if (parts.length >= 2) {
            countryCode = LOCALE_TO_COUNTRY[`${parts[0]}_${parts[1]}`]
          }
        }

        // Try region code directly
        if (!countryCode && regionCode) {
          const country = getCountryByCode(regionCode.toUpperCase())
          if (country) {
            countryCode = country.code
          }
        }

        if (countryCode) {
          const country = getCountryByCode(countryCode)
          if (country) {
            setSelectedCountry(country)
            return
          }
        }

        // Default to Togo (target market)
        setSelectedCountry(DEFAULT_COUNTRY)
      } catch (e) {
        console.log('[PhoneInput] Error detecting country:', e)
        setSelectedCountry(DEFAULT_COUNTRY)
      }
    }

    detectCountry()
  }, [])

  // Parse incoming value to extract country and local number
  useEffect(() => {
    if (value) {
      const parsed = parsePhoneNumber(value)
      if (parsed.country) {
        setSelectedCountry(parsed.country)
        setLocalNumber(formatPhoneNumber(parsed.localNumber, parsed.country))
      } else if (parsed.localNumber) {
        setLocalNumber(formatPhoneNumber(parsed.localNumber, selectedCountry))
      }
    } else {
      setLocalNumber('')
    }
  }, []) // Only on mount

  // Handle local number change
  const handleLocalNumberChange = useCallback((text: string) => {
    // Format the number
    const formatted = formatPhoneNumber(text, selectedCountry)
    setLocalNumber(formatted)

    // Call parent with full international number
    const fullNumber = getFullPhoneNumber(text, selectedCountry)
    onChangeText(fullNumber)
  }, [selectedCountry, onChangeText])

  // Handle country selection
  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country)
    setModalVisible(false)
    setSearchQuery('')

    // Update the full number with new country code
    if (localNumber) {
      const fullNumber = getFullPhoneNumber(localNumber, country)
      onChangeText(fullNumber)
    }
  }, [localNumber, onChangeText])

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        westAfrica: WEST_AFRICAN_COUNTRIES,
        others: OTHER_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name, 'fr')),
      }
    }

    const query = searchQuery.toLowerCase().trim()
    const filterFn = (c: Country) =>
      c.name.toLowerCase().includes(query) ||
      c.dialCode.includes(query) ||
      c.code.toLowerCase().includes(query)

    return {
      westAfrica: WEST_AFRICAN_COUNTRIES.filter(filterFn),
      others: OTHER_COUNTRIES.filter(filterFn).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    }
  }, [searchQuery])

  // Render country item
  const renderCountryItem = useCallback(({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        {
          backgroundColor: item.code === selectedCountry.code
            ? `${theme.colors.primary[500]}15`
            : 'transparent',
        },
      ]}
      onPress={() => handleCountrySelect(item)}
      activeOpacity={0.7}
    >
      <Typography variant="h3" style={styles.countryFlag}>{item.flag}</Typography>
      <View style={styles.countryInfo}>
        <Typography variant="body" weight={item.code === selectedCountry.code ? 'bold' : 'regular'}>
          {item.name}
        </Typography>
        <Typography variant="caption" color="secondary">{item.dialCode}</Typography>
      </View>
      {item.code === selectedCountry.code && (
        <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary[500]} />
      )}
    </TouchableOpacity>
  ), [selectedCountry, theme, handleCountrySelect])

  // Section header
  const renderSectionHeader = useCallback((title: string) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surface.muted }]}>
      <Typography variant="caption" weight="bold" color="secondary">
        {title}
      </Typography>
    </View>
  ), [theme])

  return (
    <View style={styles.container}>
      {label && (
        <Typography
          variant="caption"
          weight="semibold"
          style={[styles.label, { color: theme.colors.textSecondary }]}
        >
          {label}
        </Typography>
      )}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: error ? theme.colors.error : theme.colors.inputBorder,
          },
        ]}
      >
        {/* Country Code Selector */}
        <TouchableOpacity
          style={[styles.countrySelector, { borderRightColor: theme.colors.inputBorder }]}
          onPress={() => !disabled && setModalVisible(true)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Typography variant="body" style={styles.flagText}>{selectedCountry.flag}</Typography>
          <Typography variant="body" weight="semibold" style={{ color: theme.colors.text }}>
            {selectedCountry.dialCode}
          </Typography>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          value={localNumber}
          onChangeText={handleLocalNumberChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="phone-pad"
          editable={!disabled}
          testID={testID}
        />
      </View>

      {error && (
        <Typography variant="caption" style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Typography>
      )}

      {/* Country Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Typography variant="h3" weight="bold" style={styles.modalTitle}>
              Sélectionner un pays
            </Typography>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface.muted }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher un pays..."
              placeholderTextColor={theme.colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Country List */}
          <FlatList
            data={[
              ...(filteredCountries.westAfrica.length > 0 ? [{ type: 'header', title: 'Afrique de l\'Ouest' }] : []),
              ...filteredCountries.westAfrica.map(c => ({ type: 'country', ...c })),
              ...(filteredCountries.others.length > 0 ? [{ type: 'header', title: 'Autres pays' }] : []),
              ...filteredCountries.others.map(c => ({ type: 'country', ...c })),
            ] as any[]}
            keyExtractor={(item, index) => item.type === 'header' ? `header-${index}` : item.code}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return renderSectionHeader(item.title)
              }
              return renderCountryItem({ item: item as Country })
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    gap: 6,
  },
  flagText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  countryFlag: {
    fontSize: 28,
  },
  countryInfo: {
    flex: 1,
  },
})

export default PhoneInput
