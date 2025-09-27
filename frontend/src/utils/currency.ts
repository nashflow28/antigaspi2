/**
 * 💰 Currency Utilities for West Africa (XOF - Franc CFA)
 *
 * Conversion rate: 1 EUR ≈ 656 XOF (approximate rate)
 * Used for AntiGaspi West Africa market adaptation
 */

// Taux de change EUR vers XOF (mise à jour régulière recommandée)
export const EUR_TO_XOF_RATE = 656

/**
 * Convertit un prix en euros vers les francs CFA (XOF)
 * @param euroPrice Prix en euros
 * @returns Prix en francs CFA
 */
export const convertEurToXOF = (euroPrice: number): number => {
  return Math.round(euroPrice * EUR_TO_XOF_RATE)
}

/**
 * Formate un prix en francs CFA avec la devise
 * @param price Prix en francs CFA
 * @param locale Locale pour le formatage (par défaut: français)
 * @returns Prix formaté avec "F CFA"
 */
export const formatPrice = (price: number, locale: string = 'fr-FR'): string => {
  // Formatage avec séparateur de milliers
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(price))

  return `${formattedNumber} F CFA`
}

/**
 * Formate un prix original en euros vers F CFA
 * Utilisé pour la migration depuis les prix en euros
 * @param euroPrice Prix en euros
 * @param locale Locale pour le formatage
 * @returns Prix formaté en F CFA
 */
export const formatPriceFromEur = (euroPrice: number, locale: string = 'fr-FR'): string => {
  const xofPrice = convertEurToXOF(euroPrice)
  return formatPrice(xofPrice, locale)
}

/**
 * Calcule l'économie réalisée en F CFA
 * @param originalPrice Prix original en F CFA
 * @param discountedPrice Prix réduit en F CFA
 * @returns Économie formatée en F CFA
 */
export const formatSavings = (originalPrice: number, discountedPrice: number): string => {
  const savings = originalPrice - discountedPrice
  return formatPrice(savings)
}

/**
 * Calcule le pourcentage de réduction
 * @param originalPrice Prix original
 * @param discountedPrice Prix réduit
 * @returns Pourcentage de réduction (ex: 50)
 */
export const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number): number => {
  if (originalPrice === 0) return 0
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}

/**
 * Prix d'exemple adaptés au marché ouest-africain (en F CFA)
 */
export const SAMPLE_PRICES = {
  // Boulangerie
  BREAD: {
    original: 2950, // ~4.50€
    discounted: 1475 // ~2.25€
  },
  CROISSANTS: {
    original: 656, // ~1.00€
    discounted: 394 // ~0.60€
  },

  // Produits laitiers
  CHEESE_PLATTER: {
    original: 10432, // ~15.90€
    discounted: 5216 // ~7.95€
  },
  YOGURT: {
    original: 2624, // ~4.00€
    discounted: 1574 // ~2.40€
  },

  // Fruits et légumes
  BANANAS: {
    original: 984, // ~1.50€
    discounted: 590 // ~0.90€
  },
  VEGETABLES: {
    original: 1968, // ~3.00€
    discounted: 1181 // ~1.80€
  }
}

/**
 * Devise et informations locales pour l'Afrique de l'Ouest
 */
export const CURRENCY_INFO = {
  code: 'XOF',
  symbol: 'F CFA',
  name: 'Franc CFA',
  countries: ['Côte d\'Ivoire', 'Sénégal', 'Mali', 'Burkina Faso', 'Niger', 'Guinée-Bissau', 'Togo', 'Bénin'],
  centralBank: 'BCEAO - Banque Centrale des États de l\'Afrique de l\'Ouest'
}
