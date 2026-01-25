<template>
  <div v-if="show" class="fixed inset-0 z-[120] overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
      @click="closeModal"
    />

    <!-- Modal -->
    <div class="flex min-h-screen items-center justify-center p-4">
      <div
        class="relative w-full max-w-xl bg-white rounded shadow-80 transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="px-4 py-4 border-b border-neutral-200">
          <div class="flex items-center justify-start sm:justify-between">
            <div class="flex items-center gap-3">
              <div
                class="p-2 rounded"
                :class="iconBgClass"
              >
                <component
                  :is="icon"
                  class="h-6 w-6"
                  :class="iconClass"
                />
              </div>
              <h3 class="text-xl font-semibold text-neutral-900">{{ title }}</h3>
            </div>
            <button
              class="p-2 hover:transition-colors"
              @click="closeModal"
            >
              <XMarkIcon class="h-4 w-4 text-neutral-400" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 py-6">
          <div class="space-y-4">
            <div
              v-for="(section, index) in contentSections"
              :key="index"
              class="space-y-4"
            >
              <h4
                v-if="section.title"
                class="font-semibold text-neutral-900 text-lg"
              >
                {{ section.title }}
              </h4>
              <div class="space-y-4">
                <!-- SECURITY FIX: Replace unsafe v-html with secure rendering -->
                <div
                  v-for="(item, itemIndex) in section.items"
                  :key="itemIndex"
                  class="text-neutral-700 flex items-stretch sm:items-start gap-2"
                >
                  <!-- Safe rendering of sanitized content -->
                  <span v-if="item.type === 'bullet'" class="inline-block h-4 w-4 bg-primary-600 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                  <span v-else-if="item.type === 'success'" class="text-green-600 mr-2">✅</span>
                  <span v-else-if="item.type === 'warning'" class="text-yellow-500 mr-2">⚠️</span>
                  <span v-else-if="item.type === 'info'" class="text-info mr-2">ℹ️</span>
                  <span v-else-if="item.type === 'error'" class="text-red-600 mr-2">❌</span>
                  <span>{{ item.text }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-4 bg-neutral-50 rounded-b-2xl">
          <div class="flex justify-center sm:justify-end gap-3">
            <button
              class="px-3 py-3 text-neutral-700 hover:transition-colors"
              @click="closeModal"
            >
              Fermer
            </button>
            <button
              v-if="actionButton"
              class="px-4 py-3 bg-primary-600 text-white rounded hover:transition-colors"
              @click="handleAction"
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
import { sanitizeText, logXssAttempt } from '@/utils/sanitization'

interface ContentItem {
  type: 'bullet' | 'success' | 'warning' | 'info' | 'error' | 'plain'
  text: string
}

interface ContentSection {
  title?: string
  items: ContentItem[]
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
    info: 'bg-primary-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    error: 'bg-red-100'
  }
  return classes[props.type]
})

const iconClass = computed(() => {
  const classes = {
    info: 'text-info',
    success: 'text-green-600',
    warning: 'text-yellow-500',
    error: 'text-red-600'
  }
  return classes[props.type]
})

const contentSections = computed(() => {
  const sections: ContentSection[] = []

  // Security: Log potential XSS attempts in content
  logXssAttempt(props.content, 'AdminModal content')

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
      // Sanitize title and remove emojis
      section.title = sanitizeText(firstLine.replace(/[📊🔧🚀]/gu, '').trim().replace(':', ''))
      section.items = lines.slice(1).map(formatLineSecure)
    } else {
      section.items = lines.map(formatLineSecure)
    }

    sections.push(section)
  })

  return sections
})

/**
 * SECURITY FIX: Safe line formatting without HTML injection
 * Replaces the unsafe formatLine function that used HTML strings
 */
const formatLineSecure = (line: string): ContentItem => {
  // Security: Sanitize input first
  const sanitizedLine = sanitizeText(line)

  // Log potential XSS attempts in individual lines
  logXssAttempt(line, 'AdminModal line content')

  // Determine type and extract text safely
  if (sanitizedLine.startsWith('• ')) {
    return {
      type: 'bullet',
      text: sanitizedLine.substring(2).trim()
    }
  } else if (sanitizedLine.startsWith('✅ ')) {
    return {
      type: 'success',
      text: sanitizedLine.substring(3).trim()
    }
  } else if (sanitizedLine.startsWith('⚠️ ')) {
    return {
      type: 'warning',
      text: sanitizedLine.substring(3).trim()
    }
  } else if (sanitizedLine.startsWith('ℹ️ ')) {
    return {
      type: 'info',
      text: sanitizedLine.substring(3).trim()
    }
  } else if (sanitizedLine.startsWith('❌ ')) {
    return {
      type: 'error',
      text: sanitizedLine.substring(3).trim()
    }
  } else {
    return {
      type: 'plain',
      text: sanitizedLine
    }
  }
}

const closeModal = () => {
  emit('close')
}

const handleAction = () => {
  emit('action')
}
</script>
