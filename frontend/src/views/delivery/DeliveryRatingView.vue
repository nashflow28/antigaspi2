<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light via-neutral-50 to-primary-50 dark:from-surface-dark dark:via-neutral-900 dark:to-surface-darker">
    <div class="container px-3 py-6 sm:py-8">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" @click="router.back()">
          <ArrowLeft class="h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Noter la livraison</h1>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">Votre avis aide à améliorer la qualité du service.</p>
        </div>
      </div>

      <div class="mt-6">
        <Card>
          <template #header>
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Votre évaluation</h2>
          </template>

          <div class="space-y-6">
            <div class="flex items-center justify-center gap-2">
              <button
                v-for="value in 5"
                :key="value"
                type="button"
                class="rounded-full p-2 transition"
                :class="rating >= value ? 'bg-primary-500/10 text-primary-600' : 'text-neutral-400'"
                @click="rating = value"
              >
                <Star class="h-6 w-6" :class="rating >= value ? 'fill-primary-500' : ''" />
              </button>
            </div>
            <p class="text-center text-sm text-neutral-600 dark:text-neutral-400">
              {{ ratingLabel }}
            </p>

            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Commentaires (optionnel)
              <textarea
                v-model="feedback"
                rows="4"
                class="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                placeholder="Ex : Livraison rapide et livreur courtois"
              />
            </label>

            <div class="flex justify-end">
              <Button :disabled="rating === 0" :loading="submitting" @click="submitRating">
                Envoyer mon avis
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Star } from 'lucide-vue-next'
import { Button, Card } from '@/components/ui/2025'
import { deliveryService } from '@/services/deliveryService'
import { notify } from '@/composables/useNotifications'

const route = useRoute()
const router = useRouter()

const rating = ref(0)
const feedback = ref('')
const submitting = ref(false)

const ratingLabel = computed(() => {
  const labels = ['Sélectionnez une note', 'Très mauvais', 'Mauvais', 'Correct', 'Bon', 'Excellent']
  return labels[rating.value] || labels[0]
})

const submitRating = async () => {
  const deliveryId = Number(route.params.deliveryId)
  if (Number.isNaN(deliveryId)) {
    notify.error('Identifiant de livraison invalide')
    return
  }

  submitting.value = true

  try {
    const response = await deliveryService.rateDelivery(deliveryId, rating.value, feedback.value.trim() || undefined)
    notify.success(response.message || 'Merci pour votre évaluation !')
    router.push({ name: 'delivery-history' })
  } catch (err: any) {
    notify.error(err?.message || 'Impossible d’envoyer votre avis.')
  } finally {
    submitting.value = false
  }
}
</script>
