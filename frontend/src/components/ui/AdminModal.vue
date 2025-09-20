<template>
  <div v-if="show" class="fixed inset-0 z-[120] overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
      @click="closeModal"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div
        class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="p-2 rounded-xl"
                :class="iconBgClass"
              >
                <component
                  :is="icon"
                  class="w-6 h-6"
                  :class="iconClass"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900">{{ title }}</h3>
            </div>
            <button
              @click="closeModal"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-6">
          <div class="space-y-4">
            <div
              v-for="(section, index) in contentSections"
              :key="index"
              class="space-y-2"
            >
              <h4
                v-if="section.title"
                class="font-semibold text-gray-900 text-lg"
              >
                {{ section.title }}
              </h4>
              <div class="space-y-1">
                <p
                  v-for="(item, itemIndex) in section.items"
                  :key="itemIndex"
                  class="text-gray-600 flex items-start gap-2"
                  v-html="item"
                ></p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div class="flex justify-end gap-3">
            <button
              @click="closeModal"
              class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Fermer
            </button>
            <button
              v-if="actionButton"
              @click="handleAction"
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              {{ actionButton }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface ContentSection {
  title?: string
  items: string[]
}

interface Props {
  show: boolean
  title: string
  content: string
  icon?: any
  type?: 'info' | 'success' | 'warning' | 'error'
  actionButton?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info'
})

const emit = defineEmits<{
  close: []
  action: []
}>()

const iconBgClass = computed(() => {
  const classes = {
    info: 'bg-blue-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    error: 'bg-red-100'
  }
  return classes[props.type]
})

const iconClass = computed(() => {
  const classes = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }
  return classes[props.type]
})

const contentSections = computed(() => {
  const sections: ContentSection[] = []

  // Parse content by double line breaks (sections)
  const sectionParts = props.content.split('\n\n')

  sectionParts.forEach(sectionText => {
    const lines = sectionText.split('\n').filter(line => line.trim())
    if (lines.length === 0) return

    const section: ContentSection = { items: [] }

    // Check if first line is a title (contains specific patterns)
    const firstLine = lines[0]
    if (firstLine.includes('📊') || firstLine.includes('🔧') || firstLine.includes('🚀') ||
        firstLine.includes('Statistiques:') || firstLine.includes('Configuration:')) {
      section.title = firstLine.replace(/[📊🔧🚀]/g, '').trim().replace(':', '')
      section.items = lines.slice(1).map(formatLine)
    } else {
      section.items = lines.map(formatLine)
    }

    sections.push(section)
  })

  return sections
})

const formatLine = (line: string): string => {
  // Convert bullet points and format
  return line
    .replace(/^• /, '<span class="inline-block w-2 h-2 bg-primary-600 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>')
    .replace(/^✅ /, '<span class="text-green-600 mr-2">✅</span>')
    .replace(/^⚠️ /, '<span class="text-yellow-600 mr-2">⚠️</span>')
    .replace(/^ℹ️ /, '<span class="text-blue-600 mr-2">ℹ️</span>')
    .replace(/^❌ /, '<span class="text-red-600 mr-2">❌</span>')
}

const closeModal = () => {
  emit('close')
}

const handleAction = () => {
  emit('action')
}
</script>