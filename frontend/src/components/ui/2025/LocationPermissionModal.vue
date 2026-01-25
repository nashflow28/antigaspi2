<template>
  <BottomSheet
    :model-value="modelValue"
    size="md"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="$emit('close')"
  >
    <div class="space-y-6 py-4">
      <!-- Illustration -->
      <div class="flex justify-center">
        <div class="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500/10 to-primary-600/20">
          <MapPin class="h-12 w-12 text-primary-600" />
        </div>
      </div>

      <!-- Title & Description -->
      <div class="space-y-3 text-center">
        <h3 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Trouvez des paniers près de chez vous
        </h3>
        <p class="text-base text-neutral-600 dark:text-neutral-400">
          Autorisez l'accès à votre position pour découvrir les commerçants les plus proches et réduire vos déplacements.
        </p>
      </div>

      <!-- Benefits -->
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <CheckCircle2 class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 class="font-medium text-neutral-900 dark:text-neutral-50">Paniers à proximité</h4>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Filtrez par distance (1 km, 5 km, 10 km) pour optimiser vos trajets
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Clock class="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h4 class="font-medium text-neutral-900 dark:text-neutral-50">Récupération rapide</h4>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Identifiez les commerces à quelques minutes de chez vous
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <ShieldCheck class="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 class="font-medium text-neutral-900 dark:text-neutral-50">Données sécurisées</h4>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Votre position est uniquement utilisée pour le filtrage, jamais partagée
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3 pt-4">
        <Button
          variant="primary"
          size="lg"
          :left-icon="MapPin"
          :loading="loading"
          :disabled="loading"
          class="w-full justify-center"
          @click="$emit('authorize')"
        >
          Autoriser la géolocalisation
        </Button>
        <Button
          variant="ghost"
          size="md"
          class="w-full justify-center text-neutral-600"
          :disabled="loading"
          @click="$emit('close')"
        >
          Peut-être plus tard
        </Button>
      </div>

      <!-- Privacy Note -->
      <p class="text-center text-xs text-neutral-500 dark:text-neutral-400">
        Vous pouvez modifier cette autorisation à tout moment dans les paramètres de votre navigateur
      </p>
    </div>
  </BottomSheet>
</template>

<script setup lang="ts">
import { MapPin, CheckCircle2, Clock, ShieldCheck } from 'lucide-vue-next'
import BottomSheet from './BottomSheet.vue'
import Button from './Button.vue'

interface Props {
  modelValue: boolean
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'authorize': []
}>()
</script>
