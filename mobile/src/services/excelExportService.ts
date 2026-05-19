/**
 * Spreadsheet export service.
 *
 * The app exposes "Excel" export actions for users, but writes CSV files that
 * open cleanly in Excel/Numbers/LibreOffice. This avoids shipping SheetJS/xlsx,
 * which currently has unresolved production audit findings.
 */

import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Reservation, WalletTransaction } from '../types'
import { createLogger } from '../utils/logger'

const logger = createLogger('SpreadsheetExportService')
const CSV_SEPARATOR = ';'

const STATUS_CONFIG: Record<string, { label: string }> = {
  pending: { label: 'En attente' },
  confirmed: { label: 'Confirme' },
  ready: { label: 'Pret' },
  completed: { label: 'Complete' },
  cancelled: { label: 'Annule' },
  expired: { label: 'Expire' },
}

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

const formatTime = (dateString?: string | null): string => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

const formatCurrency = (amount?: number | null): string => {
  if (amount == null) return '-'
  return new Intl.NumberFormat('fr-FR').format(amount)
}

const escapeCsvCell = (value: unknown): string => {
  if (value == null) return ''

  let cell = String(value)

  // Prevent spreadsheet formula injection when user-controlled values are exported.
  if (/^[=+\-@]/.test(cell)) {
    cell = `'${cell}`
  }

  return `"${cell.replace(/"/g, '""')}"`
}

const toCsv = (sheets: Array<{ title: string; rows: unknown[][] }>): string => {
  const lines = [`sep=${CSV_SEPARATOR}`]

  sheets.forEach((sheet, index) => {
    if (index > 0) {
      lines.push('')
    }

    lines.push(escapeCsvCell(sheet.title))
    lines.push('')
    sheet.rows.forEach((row) => {
      lines.push(row.map(escapeCsvCell).join(CSV_SEPARATOR))
    })
  })

  return lines.join('\n')
}

const writeCsvFile = async (prefix: string, csvContent: string): Promise<string> => {
  if (!FileSystem.documentDirectory) {
    throw new Error('Le systeme de fichiers nest pas disponible sur cet appareil')
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const fileUri = `${FileSystem.documentDirectory}${prefix}-${timestamp}.csv`

  await FileSystem.writeAsStringAsync(fileUri, csvContent)
  logger.info(`CSV export saved to: ${fileUri}`)

  return fileUri
}

export const exportReservationsToExcel = async (
  reservations: Reservation[],
  options?: {
    merchantName?: string
    dateRange?: { start: Date; end: Date }
  }
): Promise<string> => {
  logger.info(`Generating reservations CSV export for ${reservations.length} reservations`)

  let totalAmount = 0
  let totalQuantity = 0

  const reservationRows: unknown[][] = [
    [
      options?.merchantName ? `Reservations - ${options.merchantName}` : 'Export des Reservations',
      `Exporte le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`,
    ],
    [],
    [
      'Code',
      'Client',
      'Telephone',
      'Produit',
      'Qte',
      'Prix unitaire',
      'Total',
      'Statut',
      'Date reservation',
      'Date retrait',
    ],
  ]

  reservations.forEach((reservation) => {
    const clientName = reservation.consumer
      ? `${reservation.consumer.first_name} ${reservation.consumer.last_name}`
      : 'Client inconnu'
    const quantity = reservation.quantity || 1
    const unitPrice = reservation.discounted_price || 0
    const total = reservation.total_amount || quantity * unitPrice
    const statusConfig = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending

    totalAmount += total
    totalQuantity += quantity

    reservationRows.push([
      reservation.reservation_code,
      clientName,
      reservation.consumer?.phone || '-',
      reservation.product?.name || 'Produit inconnu',
      quantity,
      unitPrice,
      total,
      statusConfig.label,
      formatDate(reservation.created_at),
      reservation.pickup_date ? formatDate(reservation.pickup_date) : '-',
    ])
  })

  reservationRows.push([])
  reservationRows.push(['', '', '', 'TOTAL', totalQuantity, '', totalAmount, '', '', ''])

  const statusCounts = reservations.reduce((acc, reservation) => {
    acc[reservation.status] = (acc[reservation.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const summaryRows: unknown[][] = [
    ['Statistique', 'Valeur'],
    ['Nombre total de reservations', reservations.length],
    ['Quantite totale', totalQuantity],
    ['Montant total (XOF)', formatCurrency(totalAmount)],
    [],
    ['Repartition par statut', ''],
  ]

  Object.entries(statusCounts).forEach(([status, count]) => {
    const config = STATUS_CONFIG[status] || { label: status }
    summaryRows.push([config.label, count])
  })

  return writeCsvFile(
    'reservations',
    toCsv([
      { title: 'Reservations', rows: reservationRows },
      { title: 'Resume', rows: summaryRows },
    ])
  )
}

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
  logger.info('Generating analytics CSV export')

  const summaryRows: unknown[][] = [
    ['Rapport Analytics GELADAL'],
    [
      'Periode',
      dateRange
        ? `${formatDate(dateRange.start.toISOString())} - ${formatDate(dateRange.end.toISOString())}`
        : 'Toutes les donnees',
    ],
    ['Genere le', new Date().toLocaleDateString('fr-FR')],
    [],
    ['Indicateur', 'Valeur'],
    ["Chiffre d'affaires total (XOF)", formatCurrency(data.summary?.total_revenue)],
    ['Nombre de commandes', data.summary?.total_orders || 0],
    ['Panier moyen (XOF)', formatCurrency(data.summary?.average_order_value)],
    ['Utilisateurs inscrits', data.summary?.total_users || 0],
    ['Commercants actifs', data.summary?.total_merchants || 0],
    ['Produits en ligne', data.summary?.total_products || 0],
  ]

  const sheets: Array<{ title: string; rows: unknown[][] }> = [
    { title: 'Resume', rows: summaryRows },
  ]

  if (data.dailyStats?.length) {
    sheets.push({
      title: 'Stats journalieres',
      rows: [
        ['Date', 'CA (XOF)', 'Commandes', 'Nouveaux utilisateurs'],
        ...data.dailyStats.map((day) => [
          formatDate(day.date),
          day.revenue,
          day.orders,
          day.new_users,
        ]),
      ],
    })
  }

  if (data.topProducts?.length) {
    sheets.push({
      title: 'Top Produits',
      rows: [
        ['Rang', 'Produit', 'Quantite vendue', 'CA (XOF)'],
        ...data.topProducts.map((product, index) => [
          index + 1,
          product.name,
          product.quantity_sold,
          product.revenue,
        ]),
      ],
    })
  }

  if (data.topMerchants?.length) {
    sheets.push({
      title: 'Top Commercants',
      rows: [
        ['Rang', 'Commercant', 'Commandes', 'CA (XOF)'],
        ...data.topMerchants.map((merchant, index) => [
          index + 1,
          merchant.business_name,
          merchant.total_orders,
          merchant.total_revenue,
        ]),
      ],
    })
  }

  return writeCsvFile('analytics', toCsv(sheets))
}

export const exportWalletTransactionsToExcel = async (
  transactions: WalletTransaction[],
  options?: {
    walletBalance?: number
    userName?: string
  }
): Promise<string> => {
  logger.info(`Generating wallet transactions CSV export for ${transactions.length} transactions`)

  let totalCredits = 0
  let totalDebits = 0

  const title = options?.userName
    ? `Transactions Wallet - ${options.userName}`
    : 'Export des Transactions Wallet'

  const transactionRows: unknown[][] = [
    [title],
    [`Exporte le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`],
  ]

  if (options?.walletBalance !== undefined) {
    transactionRows.push([`Solde actuel: ${formatCurrency(options.walletBalance)} XOF`])
  }

  transactionRows.push([])
  transactionRows.push(['Reference', 'Type', 'Montant (XOF)', 'Description', 'Date', 'Heure'])

  transactions.forEach((transaction) => {
    const amount = transaction.amount || 0

    if (transaction.type === 'credit') {
      totalCredits += amount
    } else {
      totalDebits += amount
    }

    transactionRows.push([
      transaction.reference || String(transaction.id),
      transaction.type === 'credit' ? 'Credit' : 'Debit',
      transaction.type === 'credit' ? `+${formatCurrency(amount)}` : `-${formatCurrency(amount)}`,
      transaction.description || '-',
      formatDate(transaction.created_at),
      formatTime(transaction.created_at),
    ])
  })

  transactionRows.push([])
  transactionRows.push(['', 'Total credits', `+${formatCurrency(totalCredits)}`, '', '', ''])
  transactionRows.push(['', 'Total debits', `-${formatCurrency(totalDebits)}`, '', '', ''])
  transactionRows.push(['', 'Solde net', formatCurrency(totalCredits - totalDebits), '', '', ''])

  const summaryRows: unknown[][] = [
    ['Statistique', 'Valeur'],
    ['Nombre de transactions', transactions.length],
    ['Total des credits (XOF)', formatCurrency(totalCredits)],
    ['Total des debits (XOF)', formatCurrency(totalDebits)],
    ['Solde net (XOF)', formatCurrency(totalCredits - totalDebits)],
    [],
    ['Credits', transactions.filter((transaction) => transaction.type === 'credit').length],
    ['Debits', transactions.filter((transaction) => transaction.type === 'debit').length],
  ]

  if (options?.walletBalance !== undefined) {
    summaryRows.push([])
    summaryRows.push(['Solde actuel du wallet (XOF)', formatCurrency(options.walletBalance)])
  }

  return writeCsvFile(
    'wallet-transactions',
    toCsv([
      { title: 'Transactions', rows: transactionRows },
      { title: 'Resume', rows: summaryRows },
    ])
  )
}

export const shareExcelFile = async (fileUri: string, title?: string): Promise<void> => {
  const isAvailable = await Sharing.isAvailableAsync()

  if (!isAvailable) {
    throw new Error('Le partage de fichiers nest pas disponible sur cet appareil')
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: title || 'Exporter le fichier',
    UTI: 'public.comma-separated-values-text',
  })
}

export default {
  exportReservationsToExcel,
  exportAnalyticsToExcel,
  exportWalletTransactionsToExcel,
  shareExcelFile,
}
