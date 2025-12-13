/**
 * Country data for phone input
 * Prioritizes West African countries (target market)
 */

export interface Country {
  code: string        // ISO 3166-1 alpha-2 (e.g., "TG")
  name: string        // French name
  dialCode: string    // e.g., "+228"
  flag: string        // Emoji flag
  format: string      // Phone format pattern (# = digit)
  priority?: number   // Lower = higher priority in list
}

// West African countries (priority market)
export const WEST_AFRICAN_COUNTRIES: Country[] = [
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬', format: '## ## ## ##', priority: 1 },
  { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯', format: '## ## ## ##', priority: 2 },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮', format: '## ## ## ## ##', priority: 3 },
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳', format: '## ### ## ##', priority: 4 },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱', format: '## ## ## ##', priority: 5 },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫', format: '## ## ## ##', priority: 6 },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪', format: '## ## ## ##', priority: 7 },
  { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳', format: '### ## ## ##', priority: 8 },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', format: '## ### ####', priority: 9 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', format: '### ### ####', priority: 10 },
]

// Other common countries
export const OTHER_COUNTRIES: Country[] = [
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '# ## ## ## ##' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪', format: '### ## ## ##' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭', format: '## ### ## ##' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: '### ### ####' },
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸', format: '### ### ####' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧', format: '#### ######' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪', format: '### #######' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸', format: '### ## ## ##' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹', format: '### ### ####' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', format: '### ### ###' },
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦', format: '## ## ## ## ##' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿', format: '### ## ## ##' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳', format: '## ### ###' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲', format: '# ## ## ## ##' },
  { code: 'CD', name: 'RD Congo', dialCode: '+243', flag: '🇨🇩', format: '### ### ###' },
  { code: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬', format: '## ### ####' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦', format: '# ## ## ##' },
]

// All countries combined
export const ALL_COUNTRIES: Country[] = [
  ...WEST_AFRICAN_COUNTRIES,
  ...OTHER_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name, 'fr')),
]

// Default country (Togo - target market)
export const DEFAULT_COUNTRY = WEST_AFRICAN_COUNTRIES[0]

// Map locale to country code
export const LOCALE_TO_COUNTRY: Record<string, string> = {
  'fr_TG': 'TG',
  'fr_BJ': 'BJ',
  'fr_CI': 'CI',
  'fr_SN': 'SN',
  'fr_ML': 'ML',
  'fr_BF': 'BF',
  'fr_NE': 'NE',
  'fr_GN': 'GN',
  'en_GH': 'GH',
  'en_NG': 'NG',
  'fr_FR': 'FR',
  'fr_BE': 'BE',
  'fr_CH': 'CH',
  'en_CA': 'CA',
  'fr_CA': 'CA',
  'en_US': 'US',
  'en_GB': 'GB',
  'de_DE': 'DE',
  'es_ES': 'ES',
  'it_IT': 'IT',
  'pt_PT': 'PT',
  'ar_MA': 'MA',
  'fr_MA': 'MA',
  'ar_DZ': 'DZ',
  'fr_DZ': 'DZ',
  'ar_TN': 'TN',
  'fr_TN': 'TN',
  'fr_CM': 'CM',
  'fr_CD': 'CD',
  'fr_CG': 'CG',
  'fr_GA': 'GA',
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return ALL_COUNTRIES.find(c => c.code === code)
}

/**
 * Get country by dial code
 */
export function getCountryByDialCode(dialCode: string): Country | undefined {
  return ALL_COUNTRIES.find(c => c.dialCode === dialCode)
}

/**
 * Format phone number according to country pattern
 */
export function formatPhoneNumber(phone: string, country: Country): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  if (!digits) return ''

  const format = country.format
  let result = ''
  let digitIndex = 0

  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === '#') {
      result += digits[digitIndex]
      digitIndex++
    } else {
      result += format[i]
    }
  }

  // Add remaining digits if format is exhausted
  if (digitIndex < digits.length) {
    result += digits.slice(digitIndex)
  }

  return result
}

/**
 * Get raw phone number (digits only)
 */
export function getRawPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Get full international phone number
 */
export function getFullPhoneNumber(phone: string, country: Country): string {
  const raw = getRawPhoneNumber(phone)
  if (!raw) return ''
  return `${country.dialCode} ${formatPhoneNumber(raw, country)}`
}

/**
 * Parse a full phone number into country and local number
 */
export function parsePhoneNumber(fullPhone: string): { country: Country | undefined; localNumber: string } {
  const cleaned = fullPhone.replace(/\s/g, '')

  // Try to find matching country by dial code
  for (const country of ALL_COUNTRIES) {
    if (cleaned.startsWith(country.dialCode)) {
      const localNumber = cleaned.slice(country.dialCode.length)
      return { country, localNumber }
    }
  }

  return { country: undefined, localNumber: cleaned.replace(/^\+/, '') }
}

/**
 * Validate phone number length for country
 * BUG FIX #11: Improved validation with stricter rules
 */
export function isValidPhoneLength(phone: string, country: Country): boolean {
  const digits = getRawPhoneNumber(phone)
  const expectedLength = country.format.split('#').length - 1

  // BUG FIX #11: Stricter validation - only allow ±1 digit tolerance
  // This prevents accepting clearly invalid numbers
  return digits.length >= expectedLength - 1 && digits.length <= expectedLength + 1
}

/**
 * BUG FIX #11: Comprehensive phone number validation
 * Returns { valid: boolean, error?: string }
 */
export interface PhoneValidationResult {
  valid: boolean
  error?: string
}

export function validatePhoneNumber(phone: string, country: Country): PhoneValidationResult {
  // Check for empty input
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Le numéro de téléphone est requis' }
  }

  const digits = getRawPhoneNumber(phone)

  // Check minimum length (at least 6 digits for any phone number)
  if (digits.length < 6) {
    return { valid: false, error: 'Le numéro doit contenir au moins 6 chiffres' }
  }

  // Check maximum length (no phone number should exceed 15 digits per ITU-T E.164)
  if (digits.length > 15) {
    return { valid: false, error: 'Le numéro ne peut pas dépasser 15 chiffres' }
  }

  // Check for invalid characters (only digits, spaces, dashes, parentheses allowed)
  const cleanedForFormat = phone.replace(/[\d\s\-\(\)+]/g, '')
  if (cleanedForFormat.length > 0) {
    return { valid: false, error: 'Le numéro contient des caractères invalides' }
  }

  // Check expected length for the country
  const expectedLength = country.format.split('#').length - 1

  if (digits.length < expectedLength - 1) {
    return {
      valid: false,
      error: `Le numéro est trop court pour ${country.name} (${expectedLength} chiffres attendus)`
    }
  }

  if (digits.length > expectedLength + 1) {
    return {
      valid: false,
      error: `Le numéro est trop long pour ${country.name} (${expectedLength} chiffres attendus)`
    }
  }

  // All checks passed
  return { valid: true }
}

/**
 * BUG FIX #11: Quick validation check (boolean only)
 */
export function isValidPhoneNumber(phone: string, country: Country): boolean {
  return validatePhoneNumber(phone, country).valid
}
