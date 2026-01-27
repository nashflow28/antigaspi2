<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
    <header class="border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-800/80">
      <div class="container mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <nav class="text-sm text-neutral-500 dark:text-neutral-400" aria-label="Fil d'Ariane">
              <ol class="flex items-center gap-2">
                <li>
                  <RouterLink to="/merchant/dashboard" class="hover:text-neutral-800 dark:hover:text-neutral-200">
                    Tableau de bord
                  </RouterLink>
                </li>
                <li class="text-neutral-400 dark:text-neutral-500">/</li>
                <li class="font-medium text-neutral-800 dark:text-neutral-200">Messagerie clients</li>
              </ol>
            </nav>
            <h1 class="mt-3 text-2xl font-semibold text-neutral-900 dark:text-white">Messagerie clients</h1>
            <p class="mt-2 text-neutral-600 dark:text-neutral-400">
              Répondez aux questions de vos clients et organisez les réservations.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Badge v-if="unreadCount > 0" variant="primary" class="mr-2">
              {{ unreadCount }} non lu{{ unreadCount > 1 ? 's' : '' }}
            </Badge>
            <Button
              variant="ghost"
              :disabled="messagingLoading"
              @click="refreshConversations"
            >
              <RefreshCw class="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto grid gap-6 px-4 py-10 lg:grid-cols-[320px_1fr] lg:px-8">
      <!-- Liste des conversations -->
      <section class="space-y-4">
        <Card class="overflow-hidden border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <header class="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Conversations
            </h2>
            <span class="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
              {{ conversations.length }}
            </span>
          </header>

          <div class="max-h-[600px] overflow-y-auto">
            <ul v-if="!messagingLoading && conversations.length" class="divide-y divide-neutral-200 dark:divide-neutral-700">
              <li
                v-for="conversation in conversations"
                :key="conversation.id"
                :class="[
                  'cursor-pointer px-4 py-4 transition-colors duration-150 hover:bg-primary-50/60 dark:hover:bg-primary-900/30',
                  conversation.id === activeConversation?.id
                    ? 'bg-primary-50/70 dark:bg-primary-900/40'
                    : 'bg-white dark:bg-neutral-800'
                ]"
                @click="handleSelectConversation(conversation.id)"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-semibold text-neutral-900 dark:text-white">
                    {{ getClientName(conversation) }}
                  </p>
                  <Badge
                    v-if="hasUnreadMessages(conversation)"
                    variant="primary"
                    size="sm"
                  >
                    Nouveau
                  </Badge>
                </div>
                <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {{ formatPreview(conversation.last_message_preview) }}
                </p>
                <p class="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                  {{ formatTimestamp(conversation.last_message_at) }}
                </p>
              </li>
            </ul>

            <EmptyState
              v-else-if="!messagingLoading && !conversations.length"
              title="Aucun message reçu"
              description="Vos clients pourront vous contacter depuis les fiches produits. Les conversations apparaîtront ici."
              :icon="MessageCircle"
              class="py-12"
            />

            <div v-else class="flex items-center justify-center py-12">
              <Loading label="Chargement des conversations" />
            </div>
          </div>
        </Card>

        <!-- Statistiques rapides -->
        <Card class="border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Statistiques</h3>
          <div class="mt-3 grid grid-cols-2 gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ conversations.length }}</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Conversations</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ unreadCount }}</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Non lus</p>
            </div>
          </div>
        </Card>
      </section>

      <!-- Zone de conversation -->
      <section>
        <Card class="flex h-full min-h-[600px] flex-col border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <div class="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-700 dark:bg-neutral-900">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">
                {{ activeConversation ? getClientName(activeConversation) : 'Sélectionnez une conversation' }}
              </h2>
              <p v-if="activeConversation?.consumer?.email" class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ activeConversation.consumer.email }}
              </p>
              <p v-if="activeConversation?.consumer?.phone" class="text-xs text-neutral-400 dark:text-neutral-500">
                {{ activeConversation.consumer.phone }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Button
                v-if="activeConversation?.consumer?.phone"
                variant="ghost"
                size="sm"
                :href="`tel:${activeConversation.consumer.phone}`"
                as="a"
              >
                <Phone class="h-4 w-4" />
              </Button>
              <Button
                v-if="activeConversation"
                variant="ghost"
                size="sm"
                :disabled="messagingLoading"
                @click="refreshActiveConversation"
              >
                <RefreshCw class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref="messagesContainer" class="flex-1 overflow-y-auto px-5 py-6">
            <Alert v-if="messagingError" variant="error" class="mb-4">
              {{ messagingError }}
            </Alert>

            <div v-if="messagingLoading && !messages.length" class="flex items-center justify-center py-12">
              <Loading label="Chargement des messages" />
            </div>

            <div v-else-if="activeConversation && messages.length" class="space-y-4">
              <div
                v-for="message in messages"
                :key="message.id"
                :class="[
                  'flex',
                  isMyMessage(message) ? 'justify-end' : 'justify-start'
                ]"
              >
                <div
                  :class="[
                    'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
                    isMyMessage(message)
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-white'
                  ]"
                >
                  <p class="text-sm leading-relaxed">{{ message.content }}</p>
                  <div class="mt-2 flex items-center justify-between gap-2">
                    <p
                      :class="[
                        'text-xs',
                        isMyMessage(message)
                          ? 'text-primary-100'
                          : 'text-neutral-500 dark:text-neutral-400'
                      ]"
                    >
                      {{ formatTimestamp(message.created_at) }}
                    </p>
                    <CheckCheck
                      v-if="isMyMessage(message) && message.read_at"
                      class="h-3 w-3 text-primary-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <EmptyState
              v-else-if="activeConversation && !messages.length && !messagingLoading"
              title="Nouvelle conversation"
              description="Ce client vient de vous contacter. Répondez-lui pour organiser sa réservation."
              :icon="MessageCircle"
              class="py-12"
            />

            <EmptyState
              v-else
              title="Sélectionnez une conversation"
              description="Choisissez un client dans la liste pour afficher vos échanges et lui répondre."
              :icon="MessageCircle"
              class="py-12"
            />
          </div>

          <footer class="border-t border-neutral-200 bg-white px-5 py-4 dark:border-neutral-700 dark:bg-neutral-800">
            <form class="space-y-3" @submit.prevent="handleSendMessage">
              <Textarea
                v-model="messageDraft"
                :disabled="!activeConversation || messagingSending"
                :rows="3"
                placeholder="Répondez au client..."
                class="dark:bg-neutral-900"
              />
              <div class="flex items-center justify-between">
                <p class="text-xs text-neutral-400 dark:text-neutral-500">
                  Appuyez sur Entrée pour envoyer, Maj+Entrée pour un saut de ligne
                </p>
                <div class="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    :disabled="messagingSending || !messageDraft.trim()"
                    @click="messageDraft = ''"
                  >
                    Effacer
                  </Button>
                  <Button
                    type="submit"
                    :disabled="!messageDraft.trim() || messagingSending || !activeConversation"
                  >
                    <Send class="mr-2 h-4 w-4" />
                    <template v-if="messagingSending">Envoi...</template>
                    <template v-else>Envoyer</template>
                  </Button>
                </div>
              </div>
            </form>
          </footer>
        </Card>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Button, Card, EmptyState, Loading, Badge, Alert } from '@/components/ui/2025'
import Textarea from '@/components/ui/2025/Textarea.vue'
import { useMessagingStore } from '@/stores/messaging'
import { useAuthStore } from '@/stores/auth'
import type { Conversation, ConversationMessage } from '@/types'
import { MessageCircle, RefreshCw, Send, Phone, CheckCheck } from 'lucide-vue-next'

const messagingStore = useMessagingStore()
const authStore = useAuthStore()
const { conversations, activeConversation, messages, loading, sending, error } = storeToRefs(messagingStore)

const router = useRouter()
const route = useRoute()
const messageDraft = ref('')
const messagesContainer = ref<HTMLDivElement | null>(null)

const messagingLoading = computed(() => loading.value)
const messagingSending = computed(() => sending.value)
const messagingError = computed(() => error.value)

// Compte les messages non lus (simplification - à améliorer avec un vrai compteur backend)
const unreadCount = computed(() => {
  return conversations.value.filter(c => hasUnreadMessages(c)).length
})

const getClientName = (conversation: Conversation) => {
  const consumer = conversation.consumer
  if (!consumer) return `Client #${conversation.consumer_id}`

  const firstName = consumer.first_name ?? ''
  const lastName = consumer.last_name ?? ''
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || consumer.email || `Client #${conversation.consumer_id}`
}

const hasUnreadMessages = (conversation: Conversation) => {
  // Simplifié: considère non lu si le dernier message n'est pas du merchant
  if (!conversation.last_message_at) return false
  // En production, utiliser un champ unread_count du backend
  return conversation.last_message_sender_id !== authStore.user?.id
}

const isMyMessage = (message: ConversationMessage) => {
  return message.sender_id === authStore.user?.id
}

const formatTimestamp = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

const formatPreview = (value: string | null | undefined) => {
  if (!value) return 'Aucun message pour le moment'
  return value.length > 50 ? `${value.slice(0, 50)}…` : value
}

const handleSelectConversation = async (conversationId: number) => {
  if (route.params.id !== String(conversationId)) {
    await router.push({ name: 'merchant-messaging-conversation', params: { id: conversationId } })
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const handleSendMessage = async () => {
  const content = messageDraft.value.trim()
  if (!content || !activeConversation.value) {
    return
  }

  try {
    await messagingStore.sendMessage(content)
    messageDraft.value = ''
    await messagingStore.refreshConversationsList()
    scrollToBottom()
  } catch {
    // error already handled via store
  }
}

const refreshConversations = async () => {
  try {
    await messagingStore.fetchConversations()
  } catch {
    // handled in store
  }
}

const refreshActiveConversation = async () => {
  if (!activeConversation.value) return
  try {
    await messagingStore.loadConversation(activeConversation.value.id)
    scrollToBottom()
  } catch {
    // handled in store
  }
}

watch(
  () => route.params.id,
  async (id) => {
    if (id) {
      try {
        await messagingStore.ensureConversation({ conversationId: Number(id) })
        scrollToBottom()
      } catch {
        // Error already surfaced via store error state
      }
    } else {
      messagingStore.clearActiveConversation()
    }
  },
  { immediate: true }
)

watch(
  messages,
  () => {
    if (messages.value.length) {
      scrollToBottom()
    }
  },
  { deep: true }
)

watch(conversations, (items) => {
  if (!route.params.id && items.length > 0 && !activeConversation.value) {
    handleSelectConversation(items[0].id)
  }
})

onMounted(async () => {
  // Connect WebSocket for real-time updates
  await messagingStore.connectWebSocket()

  if (!conversations.value.length) {
    try {
      await messagingStore.fetchConversations()
    } catch {
      // handled in store
    }
  }
})
</script>

<style scoped>
textarea {
  resize: none;
}
</style>
