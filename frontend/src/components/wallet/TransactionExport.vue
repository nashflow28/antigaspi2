<template>
  <div class="relative">
    <Button
      variant="outline"
      size="sm"
      class="gap-2"
      @click="showMenu = !showMenu"
    >
      <Download class="h-4 w-4" />
      Exporter
    </Button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black/5 z-50"
      >
        <div class="py-1">
          <button
            class="flex items-center gap-3 w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            :disabled="exporting"
            @click="exportAs('csv')"
          >
            <FileSpreadsheet class="h-4 w-4 text-emerald-500" />
            Exporter en CSV
          </button>
          <button
            class="flex items-center gap-3 w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            :disabled="exporting"
            @click="exportAs('pdf')"
          >
            <FileText class="h-4 w-4 text-rose-500" />
            Exporter en PDF
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Download, FileSpreadsheet, FileText } from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'
import type { WalletTransaction, TransactionFilters } from '@/types/wallet'

const props = defineProps<{
  transactions: WalletTransaction[]
  filters?: TransactionFilters
}>()

const emit = defineEmits<{
  exported: [format: 'csv' | 'pdf']
}>()

const showMenu = ref(false)
const exporting = ref(false)

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const exportAs = async (format: 'csv' | 'pdf') => {
  exporting.value = true
  showMenu.value = false

  try {
    if (format === 'csv') {
      exportCSV()
    } else {
      exportPDF()
    }
    emit('exported', format)
  } finally {
    exporting.value = false
  }
}

const exportCSV = () => {
  const headers = ['Date', 'Type', 'Description', 'Montant', 'Référence']
  const rows = props.transactions.map(t => [
    formatDate(t.created_at),
    t.type === 'credit' ? 'Crédit' : 'Débit',
    t.description,
    `${t.type === 'credit' ? '+' : '-'}${t.amount} XOF`,
    t.reference
  ])

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `transactions_${new Date().toISOString().split('T')[0]}.csv`)
}

const exportPDF = async () => {
  // Dynamic import for jsPDF to reduce bundle size
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.setTextColor(30, 64, 175)
  doc.text('GÊLADAL - Transactions Wallet', 20, 20)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 20, 28)

  // Table header
  let y = 40
  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.setFillColor(243, 244, 246)
  doc.rect(15, y - 5, 180, 8, 'F')
  doc.text('Date', 20, y)
  doc.text('Type', 55, y)
  doc.text('Description', 80, y)
  doc.text('Montant', 150, y)

  // Table rows
  y += 10
  doc.setFontSize(9)

  for (const t of props.transactions) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }

    doc.setTextColor(t.type === 'credit' ? 16 : 185, t.type === 'credit' ? 185 : 28, t.type === 'credit' ? 129 : 28)
    doc.text(formatDate(t.created_at).substring(0, 10), 20, y)
    doc.text(t.type === 'credit' ? 'Crédit' : 'Débit', 55, y)
    doc.setTextColor(0)
    doc.text(t.description.substring(0, 35), 80, y)
    doc.setTextColor(t.type === 'credit' ? 16 : 185, t.type === 'credit' ? 185 : 28, t.type === 'credit' ? 129 : 28)
    doc.text(`${t.type === 'credit' ? '+' : '-'}${t.amount} XOF`, 150, y)

    y += 7
  }

  doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`)
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Close menu on click outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
