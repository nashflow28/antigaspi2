/**
 * Excel Export Service - Export stylisé minimaliste élégant
 *
 * Utilise la librairie xlsx (SheetJS) pour générer des fichiers Excel
 * avec mise en forme professionnelle.
 */

import * as XLSX from 'xlsx'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Reservation } from '../types'
import { createLogger } from '../utils/logger'

const logger = createLogger('ExcelExportService')

// Types pour le style des cellules
interface CellStyle {
  font?: {
    bold?: boolean
    italic?: boolean
    sz?: number
    color?: { rgb: string }
  }
  fill?: {
    fgColor: { rgb: string }
  }
  alignment?: {
    horizontal?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'center' | 'bottom'
    wrapText?: boolean
  }
  border?: {
    top?: { style: string; color: { rgb: string } }
    bottom?: { style: string; color: { rgb: string } }
    left?: { style: string; color: { rgb: string } }
    right?: { style: string; color: { rgb: string } }
  }
}

// Couleurs du thème minimaliste
const COLORS = {
  headerBg: 'F8F9FA',      // Gris très clair
  headerText: '1F2937',     // Gris foncé
  borderLight: 'E5E7EB',    // Gris bordure
  altRowBg: 'FAFAFA',       // Alternance ligne
  textPrimary: '374151',    // Texte principal
  textSecondary: '6B7280',  // Texte secondaire
  success: '059669',        // Vert succès
  warning: 'D97706',        // Orange warning
  error: 'DC2626',          // Rouge erreur
  total: 'F3F4F6',          // Fond totaux
}

// Styles prédéfinis
const STYLES = {
  header: {
    font: { bold: true, sz: 11, color: { rgb: COLORS.headerText } },
    fill: { fgColor: { rgb: COLORS.headerBg } },
    alignment: { horizontal: 'center' as const, vertical: 'center' as const },
    border: {
      bottom: { style: 'medium', color: { rgb: COLORS.borderLight } },
    },
  } as CellStyle,

  cell: {
    font: { sz: 10, color: { rgb: COLORS.textPrimary } },
    alignment: { vertical: 'center' as const },
    border: {
      bottom: { style: 'thin', color: { rgb: COLORS.borderLight } },
    },
  } as CellStyle,

  cellAlt: {
    font: { sz: 10, color: { rgb: COLORS.textPrimary } },
    fill: { fgColor: { rgb: COLORS.altRowBg } },
    alignment: { vertical: 'center' as const },
    border: {
      bottom: { style: 'thin', color: { rgb: COLORS.borderLight } },
    },
  } as CellStyle,

  number: {
    font: { sz: 10, color: { rgb: COLORS.textPrimary } },
    alignment: { horizontal: 'right' as const, vertical: 'center' as const },
    border: {
      bottom: { style: 'thin', color: { rgb: COLORS.borderLight } },
    },
  } as CellStyle,

  total: {
    font: { bold: true, sz: 11, color: { rgb: COLORS.textPrimary } },
    fill: { fgColor: { rgb: COLORS.total } },
    alignment: { horizontal: 'right' as const, vertical: 'center' as const },
    border: {
      top: { style: 'medium', color: { rgb: COLORS.borderLight } },
      bottom: { style: 'medium', color: { rgb: COLORS.borderLight } },
    },
  } as CellStyle,

  title: {
    font: { bold: true, sz: 14, color: { rgb: COLORS.headerText } },
    alignment: { horizontal: 'left' as const },
  } as CellStyle,

  subtitle: {
    font: { italic: true, sz: 10, color: { rgb: COLORS.textSecondary } },
    alignment: { horizontal: 'left' as const },
  } as CellStyle,
}

// Status labels et couleurs
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: COLORS.warning },
  confirmed: { label: 'Confirmé', color: COLORS.success },
  ready: { label: 'Prêt', color: COLORS.success },
  completed: { label: 'Complété', color: COLORS.success },
  cancelled: { label: 'Annulé', color: COLORS.error },
  expired: { label: 'Expiré', color: COLORS.textSecondary },
}

/**
 * Formater une date pour affichage
 */
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

/**
 * Formater une heure pour affichage
 */
const formatTime = (dateString?: string | null): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

/**
 * Formater un montant en XOF
 */
const formatCurrency = (amount?: number | null): string => {
  if (amount == null) return '-'
  return new Intl.NumberFormat('fr-FR').format(amount)
}

/**
 * Appliquer un style à une cellule
 */
const applyStyle = (cell: XLSX.CellObject, style: CellStyle): void => {
  if (!cell.s) cell.s = {}
  Object.assign(cell.s, style)
}

/**
 * Générer le fichier Excel pour les réservations
 */
export const exportReservationsToExcel = async (
  reservations: Reservation[],
  options?: {
    merchantName?: string
    dateRange?: { start: Date; end: Date }
  }
): Promise<string> => {
  logger.info(`Generating Excel export for ${reservations.length} reservations`)

  // Créer le workbook
  const wb = XLSX.utils.book_new()

  // ===== FEUILLE 1: RÉSERVATIONS =====
  const wsData: any[][] = []

  // Titre et métadonnées (lignes 1-3)
  const title = options?.merchantName
    ? `Réservations - ${options.merchantName}`
    : 'Export des Réservations'

  wsData.push([title])
  wsData.push([`Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`])
  wsData.push([]) // Ligne vide

  // En-têtes (ligne 4)
  const headers = [
    'Code',
    'Client',
    'Téléphone',
    'Produit',
    'Qté',
    'Prix unitaire',
    'Total',
    'Statut',
    'Date réservation',
    'Date retrait',
  ]
  wsData.push(headers)

  // Données (à partir de la ligne 5)
  let totalAmount = 0
  let totalQuantity = 0

  reservations.forEach((reservation) => {
    const clientName = reservation.consumer
      ? `${reservation.consumer.first_name} ${reservation.consumer.last_name}`
      : 'Client inconnu'

    const clientPhone = reservation.consumer?.phone || '-'
    const productName = reservation.product?.name || 'Produit inconnu'
    const quantity = reservation.quantity || 1
    const unitPrice = reservation.discounted_price || 0
    const total = reservation.total_amount || (quantity * unitPrice)
    const statusConfig = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending

    totalAmount += total
    totalQuantity += quantity

    wsData.push([
      reservation.reservation_code,
      clientName,
      clientPhone,
      productName,
      quantity,
      unitPrice,
      total,
      statusConfig.label,
      formatDate(reservation.created_at),
      reservation.pickup_date ? formatDate(reservation.pickup_date) : '-',
    ])
  })

  // Ligne de total
  wsData.push([]) // Ligne vide
  wsData.push([
    '',
    '',
    '',
    'TOTAL',
    totalQuantity,
    '',
    totalAmount,
    '',
    '',
    '',
  ])

  // Créer la feuille
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Définir les largeurs de colonnes
  ws['!cols'] = [
    { wch: 12 },  // Code
    { wch: 22 },  // Client
    { wch: 14 },  // Téléphone
    { wch: 28 },  // Produit
    { wch: 6 },   // Qté
    { wch: 12 },  // Prix unitaire
    { wch: 12 },  // Total
    { wch: 12 },  // Statut
    { wch: 14 },  // Date réservation
    { wch: 14 },  // Date retrait
  ]

  // Fusionner les cellules du titre
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Titre
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Sous-titre
  ]

  // Appliquer les styles (Note: xlsx ne supporte pas les styles dans la version gratuite)
  // Les styles seront simulés par le formatage des données

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Réservations')

  // ===== FEUILLE 2: RÉSUMÉ =====
  const summaryData: any[][] = []

  summaryData.push(['Résumé des Réservations'])
  summaryData.push([])
  summaryData.push(['Statistique', 'Valeur'])
  summaryData.push(['Nombre total de réservations', reservations.length])
  summaryData.push(['Quantité totale', totalQuantity])
  summaryData.push(['Montant total (XOF)', formatCurrency(totalAmount)])
  summaryData.push([])

  // Répartition par statut
  summaryData.push(['Répartition par statut', ''])
  const statusCounts = reservations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(statusCounts).forEach(([status, count]) => {
    const config = STATUS_CONFIG[status] || { label: status }
    summaryData.push([`  ${config.label}`, count])
  })

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  wsSummary['!cols'] = [
    { wch: 30 },
    { wch: 20 },
  ]
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
  ]

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé')

  // Générer le fichier
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })

  // Sauvegarder le fichier
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `reservations-${timestamp}.xlsx`
  const fileUri = `${FileSystem.documentDirectory}${filename}`

  await FileSystem.writeAsStringAsync(fileUri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  })

  logger.info(`Excel file saved to: ${fileUri}`)
  return fileUri
}

/**
 * Exporter les analytics en Excel
 */
export const exportAnalyticsToExcel = async (
  data: {
    summary?: {
      total_revenue?: number
      total_orders?: number
      average_order_value?: number
      total_users?: number
      total_merchants?: number
      total_products?: number
    }
    dailyStats?: Array<{
      date: string
      revenue: number
      orders: number
      new_users: number
    }>
    topProducts?: Array<{
      name: string
      quantity_sold: number
      revenue: number
    }>
    topMerchants?: Array<{
      business_name: string
      total_orders: number
      total_revenue: number
    }>
  },
  dateRange?: { start: Date; end: Date }
): Promise<string> => {
  logger.info('Generating analytics Excel export')

  const wb = XLSX.utils.book_new()

  // ===== FEUILLE 1: RÉSUMÉ =====
  const summarySheet: any[][] = [
    ['Rapport Analytics Antigaspi'],
    [`Période: ${dateRange ? `${formatDate(dateRange.start.toISOString())} - ${formatDate(dateRange.end.toISOString())}` : 'Toutes les données'}`],
    [`Généré le ${new Date().toLocaleDateString('fr-FR')}`],
    [],
    ['Indicateur', 'Valeur'],
    ['Chiffre d\'affaires total (XOF)', formatCurrency(data.summary?.total_revenue)],
    ['Nombre de commandes', data.summary?.total_orders || 0],
    ['Panier moyen (XOF)', formatCurrency(data.summary?.average_order_value)],
    ['Utilisateurs inscrits', data.summary?.total_users || 0],
    ['Commerçants actifs', data.summary?.total_merchants || 0],
    ['Produits en ligne', data.summary?.total_products || 0],
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheet)
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 20 }]
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé')

  // ===== FEUILLE 2: STATS JOURNALIÈRES =====
  if (data.dailyStats && data.dailyStats.length > 0) {
    const dailySheet: any[][] = [
      ['Statistiques Journalières'],
      [],
      ['Date', 'CA (XOF)', 'Commandes', 'Nouveaux utilisateurs'],
    ]

    data.dailyStats.forEach(day => {
      dailySheet.push([
        formatDate(day.date),
        day.revenue,
        day.orders,
        day.new_users,
      ])
    })

    const wsDaily = XLSX.utils.aoa_to_sheet(dailySheet)
    wsDaily['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Stats Journalières')
  }

  // ===== FEUILLE 3: TOP PRODUITS =====
  if (data.topProducts && data.topProducts.length > 0) {
    const productsSheet: any[][] = [
      ['Top Produits'],
      [],
      ['Rang', 'Produit', 'Quantité vendue', 'CA (XOF)'],
    ]

    data.topProducts.forEach((product, index) => {
      productsSheet.push([
        index + 1,
        product.name,
        product.quantity_sold,
        product.revenue,
      ])
    })

    const wsProducts = XLSX.utils.aoa_to_sheet(productsSheet)
    wsProducts['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 16 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Produits')
  }

  // ===== FEUILLE 4: TOP COMMERÇANTS =====
  if (data.topMerchants && data.topMerchants.length > 0) {
    const merchantsSheet: any[][] = [
      ['Top Commerçants'],
      [],
      ['Rang', 'Commerçant', 'Commandes', 'CA (XOF)'],
    ]

    data.topMerchants.forEach((merchant, index) => {
      merchantsSheet.push([
        index + 1,
        merchant.business_name,
        merchant.total_orders,
        merchant.total_revenue,
      ])
    })

    const wsMerchants = XLSX.utils.aoa_to_sheet(merchantsSheet)
    wsMerchants['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsMerchants, 'Top Commerçants')
  }

  // Générer le fichier
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `analytics-${timestamp}.xlsx`
  const fileUri = `${FileSystem.documentDirectory}${filename}`

  await FileSystem.writeAsStringAsync(fileUri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  })

  logger.info(`Analytics Excel file saved to: ${fileUri}`)
  return fileUri
}

/**
 * Partager un fichier Excel
 */
export const shareExcelFile = async (fileUri: string, title?: string): Promise<void> => {
  const isAvailable = await Sharing.isAvailableAsync()

  if (!isAvailable) {
    throw new Error('Le partage de fichiers n\'est pas disponible sur cet appareil')
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: title || 'Exporter le fichier Excel',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  })
}

export default {
  exportReservationsToExcel,
  exportAnalyticsToExcel,
  shareExcelFile,
}
