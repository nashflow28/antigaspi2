<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50">
    <div class="container px-3 sm:px-4 lg:px-6 mx-auto max-w-5xl px-4 py-8 sm:py-12 lg:py-16">
      <div class="mb-10 flex flex-col items-stretch sm:items-start justify-between gap-3 sm:gap-4 lg:flex-row lg:items-center">
        <div>
          <p class="mt-2 inline-flex items-center gap-2 rounded-full bg-primary-100/60 px-3 py-3 text-sm font-semibold text-primary-900">
            <Sparkles class="h-4 w-4" />
            Guide de démarrage GÊLADAL
          </p>
          <h1 class="text-3xl font-semibold tracking-tight text-neutral-900">
            Bienvenue ! Faisons connaissance en quelques étapes
          </h1>
          <p class="mt-3 max-w-xl text-lg text-neutral-700">
            Découvrez comment réserver des paniers surprise, suivre vos commerçants favoris et profiter du portefeuille GÊLADAL.
          </p>
        </div>
        <div class="w-full max-w-xs rounded border border-primary-200/60 bg-white/80 p-6 shadow-lg backdrop-blur">
          <p class="text-sm font-medium text-neutral-500">Progression</p>
          <div class="mt-2 flex items-end justify-between">
            <span class="text-3xl font-semibold text-primary-600">{{ progress }}%</span>
            <span class="text-sm text-neutral-500">Étape {{ currentStep + 1 }} sur {{ totalSteps }}</span>
          </div>
          <div class="mt-4 h-4.5 rounded-full bg-neutral-200/80">
            <div
              class="h-4.5 rounded-full bg-gradient-to-r from-primary-500 via-cyan-500 to-primary-500 transition-all duration-500"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <ul class="mt-4 space-y-4 text-sm text-neutral-500">
            <li
              v-for="(step, index) in steps"
              :key="step.title"
              class="flex items-center gap-2"
            >
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full border"
                :class="index <= currentStep ? 'border-primary-500 bg-primary-500 text-white' : 'border-neutral-300 text-neutral-400'"
              >
                {{ index + 1 }}
              </span>
              <span :class="index === currentStep ? 'font-semibold text-neutral-800' : ''">
                {{ step.title }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div class="grid gap-3 sm:gap-4 lg:grid-cols-[2fr_1fr]">
        <Card class="bg-white/80">
          <template #header>
            <div class="flex items-center gap-3">
              <component :is="activeStep.icon" class="h-8 w-8 rounded bg-primary-100 p-2 text-primary-600" />
              <div>
                <p class="text-sm font-medium uppercase tracking-wide text-primary-600">{{ activeStep.category }}</p>
                <h2 class="text-xl font-semibold text-neutral-900">{{ activeStep.title }}</h2>
              </div>
            </div>
          </template>

          <div class="space-y-6 text-neutral-700">
            <p class="text-lg leading-relaxed text-neutral-800">
              {{ activeStep.description }}
            </p>

            <ul class="space-y-4">
              <li
                v-for="item in activeStep.points"
                :key="item.title"
                class="flex items-stretch sm:items-start gap-3 rounded border border-neutral-200/70 bg-white/80 p-4 shadow-sm"
              >
                <div class="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-primary-100 text-primary-600">
                  <component :is="item.icon" class="h-4 w-4" />
                </div>
                <div>
                  <p class="font-semibold text-neutral-800">{{ item.title }}</p>
                  <p class="text-sm text-neutral-700">{{ item.content }}</p>
                </div>
              </li>
            </ul>
          </div>

          <template #footer>
            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="ghost"
                class="text-neutral-500 hover:text-neutral-800"
                @click="skip"
              >
                Passer le guide
              </Button>

              <div class="flex items-center gap-3">
                <Button
                  v-if="currentStep > 0"
                  variant="secondary"
                  class="min-w-[140px]"
                  @click="goPrevious"
                >
                  Étape précédente
                </Button>
                <Button
                  v-if="!isLastStep"
                  class="min-w-[160px]"
                  @click="goNext"
                >
                  Continuer
                </Button>
                <Button
                  v-else
                  class="min-w-[160px]"
                  @click="finish"
                >
                  Accéder à l'application
                </Button>
              </div>
            </div>
          </template>
        </Card>

        <div class="space-y-4">
          <Card
            v-for="(insight, index) in insights"
            :key="index"
            variant="elevated"
            class="bg-white/70"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <component :is="insight.icon" class="h-10 w-9 rounded bg-primary-100 p-2 text-primary-600" />
                <div>
                  <p class="text-sm font-medium text-neutral-500">{{ insight.category }}</p>
                  <h3 class="text-lg font-semibold text-neutral-900">{{ insight.title }}</h3>
                </div>
              </div>
            </template>
            <p class="text-sm leading-relaxed text-neutral-700">{{ insight.description }}</p>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { Sparkles, MapPin, ShoppingBag, ShieldCheck, Wallet, BellRing, Heart } from 'lucide-vue-next'

interface StepPoint {
  title: string
  content: string
  icon: any
}

interface StepDefinition {
  title: string
  description: string
  category: string
  icon: any
  points: StepPoint[]
}

const router = useRouter()
const onboardingStore = useOnboardingStore()
const { currentStep, totalSteps } = storeToRefs(onboardingStore)

const steps: StepDefinition[] = [
  {
    title: 'Personnalisez votre expérience',
    description: 'Indiquez votre ville, vos préférences alimentaires et les créneaux de récupération qui vous conviennent afin de recevoir les paniers adaptés.',
    category: 'Profil',
    icon: Sparkles,
    points: [
      {
        title: 'Choisissez vos catégories favorites',
        content: 'Boulangerie, fruits & légumes, traiteur… sélectionnez ce qui vous fait envie pour des recommandations plus pertinentes.',
        icon: Heart
      },
      {
        title: 'Activez les alertes locales',
        content: 'En autorisant la localisation, nous pouvons vous prévenir lorsqu’un panier intéressant est disponible près de vous.',
        icon: MapPin
      }
    ]
  },
  {
    title: 'Réservez un panier en quelques clics',
    description: 'Découvrez les paniers surprise de vos commerçants préférés et finalisez la réservation avec un paiement sécurisé.',
    category: 'Réservation',
    icon: ShoppingBag,
    points: [
      {
        title: 'Consultez la fiche détaillée',
        content: 'Accédez aux informations essentielles : contenu estimé, heure de récupération, avis des clients.',
        icon: ShieldCheck
      },
      {
        title: 'Réglez et suivez votre commande',
        content: 'Paiement par portefeuille GÊLADAL, mobile money ou sur place. Recevez un récapitulatif dans votre profil.',
        icon: Wallet
      }
    ]
  },
  {
    title: 'Restez informé en temps réel',
    description: 'Activez les notifications afin d’être alerté lorsqu’un panier est disponible, prêt à être récupéré ou si un commerçant publie une nouveauté.',
    category: 'Engagement',
    icon: BellRing,
    points: [
      {
        title: 'Suivez vos commerçants favoris',
        content: 'Ajoutez-les à vos favoris pour recevoir leurs actualités en priorité.',
        icon: Heart
      },
      {
        title: 'Recevez des rappels automatiques',
        content: 'Nous vous avertissons avant la fin de vos créneaux de retrait afin d’éviter toute perte.',
        icon: BellRing
      }
    ]
  }
]

const insights = [
  {
    title: 'Portefeuille GÊLADAL',
    description: 'Centralisez vos remboursements et cagnotte fidélité pour payer plus rapidement vos prochains paniers.',
    category: 'Astuce',
    icon: Wallet
  },
  {
    title: 'Astuces anti-gaspillage',
    description: 'Chaque panier réservé débloque des conseils pour conserver vos produits plus longtemps.',
    category: 'Conseils',
    icon: ShieldCheck
  }
]

const activeStep = computed(() => steps[currentStep.value] ?? steps[0])
const progress = computed(() => Math.round(((currentStep.value + 1) / totalSteps.value) * 100))
const isLastStep = computed(() => currentStep.value >= totalSteps.value - 1)

const goNext = async () => {
  const result = await onboardingStore.nextStep()
  if (result?.done) {
    router.push('/')
  }
}

const goPrevious = () => {
  onboardingStore.previousStep()
}

const finish = () => {
  const result = onboardingStore.completeOnboarding()
  if (result?.done) {
    router.push('/')
  }
}

const skip = () => {
  onboardingStore.skipOnboarding()
  router.push('/')
}

onMounted(() => {
  onboardingStore.init()
})
</script>
