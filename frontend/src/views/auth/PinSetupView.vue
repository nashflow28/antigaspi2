<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 px-4 py-12">
    <Card class="w-full max-w-lg">
      <div class="text-center mb-6">
        <div class="mx-auto w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
          <Lock class="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
          {{ hasPin ? 'Modifier votre PIN' : 'Configurer votre PIN' }}
        </h1>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          Protégez votre portefeuille avec un code PIN sécurisé.
        </p>
      </div>

      <form class="space-y-5" @submit.prevent="handleSubmit">
        <Input
          v-if="hasPin"
          v-model="form.currentPin"
          type="password"
          label="PIN actuel"
          placeholder="••••"
          autocomplete="off"
          inputmode="numeric"
        />
        <Input
          v-model="form.newPin"
          type="password"
          label="Nouveau PIN"
          placeholder="••••"
          autocomplete="off"
          inputmode="numeric"
          :error="validationMessage"
        />
        <Input
          v-model="form.confirmPin"
          type="password"
          label="Confirmer le PIN"
          placeholder="••••"
          autocomplete="off"
          inputmode="numeric"
          :error="confirmMessage"
        />

        <div class="rounded-xl bg-amber-50 px-3 py-3 text-xs text-amber-700">
          Le code PIN doit contenir entre 4 et 6 chiffres et rester confidentiel.
        </div>

        <Button type="submit" class="w-full" :loading="loading">
          {{ hasPin ? 'Mettre à jour le PIN' : 'Activer mon PIN' }}
        </Button>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { Lock } from 'lucide-vue-next'
import { Button, Card, Input } from '@/components/ui/2025'
import { useWalletStore } from '@/stores/wallet'
import { walletService } from '@/services/walletService'
import { notify } from '@/composables/useNotifications'

const router = useRouter()
const walletStore = useWalletStore()
const { hasPin, loading } = storeToRefs(walletStore)

const form = reactive({
  currentPin: '',
  newPin: '',
  confirmPin: ''
})

const validationMessage = computed(() => {
  if (!form.newPin) return ''
  const result = walletService.validatePin(form.newPin)
  return result.isValid ? '' : result.error || ''
})

const confirmMessage = computed(() => {
  if (!form.confirmPin) return ''
  return form.newPin === form.confirmPin ? '' : 'Les codes PIN ne correspondent pas'
})

const handleSubmit = async () => {
  if (validationMessage.value || confirmMessage.value) {
    notify.warning('Veuillez corriger les erreurs du formulaire.')
    return
  }

  if (hasPin.value && !form.currentPin) {
    notify.warning('Veuillez saisir votre PIN actuel.')
    return
  }

  const success = hasPin.value
    ? await walletStore.changePin(form.currentPin, form.newPin)
    : await walletStore.setPin(form.newPin)

  if (success) {
    notify.success('PIN mis à jour avec succès')
    router.push('/wallet')
  } else {
    notify.error(walletStore.error || 'Impossible de mettre à jour le PIN')
  }
}

onMounted(() => {
  walletStore.fetchWallet()
})
</script>
