<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <header class="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div class="container mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <nav class="text-sm text-gray-500" aria-label="Fil d'Ariane">
              <ol class="flex items-center gap-2">
                <li>
                  <RouterLink to="/" class="hover:text-gray-800">Accueil</RouterLink>
                </li>
                <li class="text-gray-400">/</li>
                <li class="font-medium text-gray-800">Messagerie commerçant</li>
              </ol>
            </nav>
            <h1 class="mt-3 text-2xl font-semibold text-gray-900">Messagerie commerçant</h1>
            <p class="mt-2 text-gray-600">
              Discutez directement avec vos commerçants pour poser vos questions et organiser vos commandes.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button
              variant="ghost"
              :disabled="messagingLoading"
              @click="refreshConversations"
            >
              Rafraîchir
            </Button>
            <Button
              variant="primary"
              :disabled="messagingLoading"
              @click="goBackToList"
            >
              Nouvelle conversation
            </Button>
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto grid gap-6 px-4 py-10 lg:grid-cols-[320px_1fr] lg:px-8">
      <section class="space-y-4">
        <Card class="overflow-hidden border border-gray-200 bg-white">
          <header class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-600">Conversations</h2>
            <span class="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
              {{ conversations.length }}
            </span>
          </header>

          <div class="max-h-[600px] overflow-y-auto">
            <ul v-if="!messagingLoading && conversations.length" class="divide-y divide-gray-200">
              <li
                v-for="conversation in conversations"
                :key="conversation.id"
                :class="[
                  'cursor-pointer px-4 py-4 transition-colors duration-150 hover:bg-primary-50/60',
                  conversation.id === activeConversation?.id ? 'bg-primary-50/70' : 'bg-white'
                ]"
                @click="handleSelectConversation(conversation.id)"
              >
                <p class="text-sm font-semibold text-gray-900">
                  {{ getConversationTitle(conversation) }}
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  {{ formatPreview(conversation.last_message_preview) }}
                </p>
                <p class="mt-2 text-xs text-gray-400">
                  {{ formatTimestamp(conversation.last_message_at) }}
                </p>
              </li>
            </ul>

            <EmptyState
              v-else-if="!messagingLoading && !conversations.length"
              title="Aucune conversation pour le moment"
              description="Commencez par contacter un commerçant depuis sa fiche produit pour initier la discussion."
              :icon="MessageCircle"
              class="py-12"
            />

            <div v-else class="flex items-center justify-center py-12">
              <Loading label="Chargement des conversations" />
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card class="flex h-full flex-col border border-gray-200 bg-white">
          <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">
                {{ activeConversation ? getConversationTitle(activeConversation) : 'Sélectionnez une conversation' }}
              </h2>
              <p v-if="activeConversation?.merchant?.phone" class="text-sm text-gray-500">
                {{ activeConversation.merchant.phone }}
              </p>
            </div>
            <Button
              v-if="activeConversation"
              variant="ghost"
              size="sm"
              :disabled="messagingLoading"
              @click="refreshActiveConversation"
            >
              Actualiser
            </Button>
          </div>

          <div ref="messagesContainer" class="flex-1 overflow-y-auto px-5 py-6">
            <div v-if="messagingError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ messagingError }}
            </div>

            <div v-if="messagingLoading && !messages.length" class="flex items-center justify-center py-12">
              <Loading label="Chargement des messages" />
            </div>

            <div v-else-if="activeConversation && messages.length" class="space-y-4">
              <div
                v-for="message in messages"
                :key="message.id"
                :class="[
                  'flex',
                  message.sender_id === activeConversation?.consumer_id ? 'justify-end' : 'justify-start'
                ]"
              >
                <div
                  :class="[
                    'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
                    message.sender_id === activeConversation?.consumer_id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  ]"
                >
                  <p class="text-sm leading-relaxed">{{ message.content }}</p>
                  <p
                    :class="[
                      'mt-2 text-xs',
                      message.sender_id === activeConversation?.consumer_id
                        ? 'text-primary-100'
                        : 'text-gray-500'
                    ]"
                  >
                    {{ formatTimestamp(message.created_at) }}
                  </p>
                </div>
              </div>
            </div>

            <EmptyState
              v-else-if="activeConversation && !messages.length && !messagingLoading"
              title="Aucun message pour l'instant"
              description="Soyez le premier à envoyer un message pour organiser votre commande."
              :icon="MessageCircle"
              class="py-12"
            />

            <EmptyState
              v-else
              title="Sélectionnez une conversation"
              description="Choisissez un commerçant dans la liste pour afficher vos échanges."
              :icon="MessageCircle"
              class="py-12"
            />
          </div>

          <footer class="border-t border-gray-200 bg-white px-5 py-4">
            <form class="space-y-3" @submit.prevent="handleSendMessage">
              <Textarea
                v-model="messageDraft"
                :disabled="!activeConversation || messagingSending"
                :rows="4"
                placeholder="Écrivez votre message..."
              />
              <div class="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  :disabled="messagingSending || !messageDraft.trim()"
                  @click="messageDraft = ''"
                >
                  Effacer
                </Button>
                <Button
                  type="submit"
                  :disabled="!messageDraft.trim() || messagingSending || !activeConversation"
                >
                  <template v-if="messagingSending">Envoi...</template>
                  <template v-else>Envoyer</template>
                </Button>
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
import { Button, Card, EmptyState, Loading } from '@/components/ui/2025'
import Textarea from '@/components/ui/Textarea.vue'
import { useMessagingStore } from '@/stores/messaging'
import type { Conversation } from '@/types'
import { MessageCircle } from 'lucide-vue-next'

const messagingStore = useMessagingStore()
const { conversations, activeConversation, messages, loading, sending, error } = storeToRefs(messagingStore)

const router = useRouter()
const route = useRoute()
const messageDraft = ref('')
const messagesContainer = ref<HTMLDivElement | null>(null)

const messagingLoading = computed(() => loading.value)
const messagingSending = computed(() => sending.value)
const messagingError = computed(() => error.value)

const getConversationTitle = (conversation: Conversation) => {
  const merchantProfile = conversation.merchant?.merchant
  if (merchantProfile?.business_name) {
    return merchantProfile.business_name
  }
  const firstName = conversation.merchant?.first_name ?? ''
  const lastName = conversation.merchant?.last_name ?? ''
  const fallback = `${firstName} ${lastName}`.trim()
  if (fallback) {
    return fallback
  }
  return `Commerçant #${conversation.merchant_id}`
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
  return value.length > 60 ? `${value.slice(0, 60)}…` : value
}

const handleSelectConversation = async (conversationId: number) => {
  if (route.params.id !== String(conversationId)) {
    await router.push({ name: 'conversation-detail', params: { id: conversationId } })
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
  } catch (error) {
    // error already handled via store
  }
}

const refreshConversations = async () => {
  try {
    await messagingStore.fetchConversations()
  } catch (error) {
    // handled in store
  }
}

const refreshActiveConversation = async () => {
  if (!activeConversation.value) return
  try {
    await messagingStore.loadConversation(activeConversation.value.id)
    scrollToBottom()
  } catch (error) {
    // handled in store
  }
}

const goBackToList = async () => {
  await router.push({ name: 'messaging' })
  messagingStore.clearActiveConversation()
}

watch(
  () => route.params.id,
  async (id) => {
    if (id) {
      try {
        await messagingStore.ensureConversation({ conversationId: Number(id) })
        scrollToBottom()
      } catch (error) {
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
  if (!conversations.value.length) {
    try {
      await messagingStore.fetchConversations()
    } catch (error) {
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
