<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50">
    <div class="container px-4 sm:px-6 lg:px-8 mx-auto max-w-5xl px-6 py-8 sm:py-10 lg:py-12">
      <div class="mb-10 flex flex-col items-stretch sm:items-start justify-between gap-4 sm:gap-6 lg:flex-row lg:items-center">
        <div>
          <p class="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-100/60 px-4 py-3 text-responsive-sm font-semibold text-primary-emphasis">
            <Sparkles class="h-5 w-5" />
            Guide de démarrage AntiGaspi
          </p>
          <h1 class="text-display-sm font-semibold tracking-tight text-heading">
            Bienvenue ! Faisons connaissance en quelques étapes
          </h1>
          <p class="mt-3 max-w-full sm:max-w-xl text-responsive-lg text-body">
            Découvrez comment réserver des paniers surprise, suivre vos commerçants favoris et profiter du portefeuille AntiGaspi.
          </p>
        </div>
        <div class="w-full max-w-xs rounded-3xl border border-primary-200/60 bg-white/80 p-6 shadow-card backdrop-blur">
          <p class="text-responsive-sm font-medium text-muted">Progression</p>
          <div class="mt-2 flex items-end justify-between">
            <span class="text-display-sm font-semibold text-primary">{{ progress }}%</span>
            <span class="text-responsive-sm text-muted">Étape {{ currentStep + 1 }} sur {{ totalSteps }}</span>
          </div>
          <div class="mt-4 h-2.5 rounded-full bg-neutral-200/80">
            <div
              class="h-2.5 rounded-full bg-gradient-to-r from-primary-500 via-cyan-500 to-blue-500 transition-all duration-500"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <ul class="mt-4 space-y-2 text-responsive-sm text-muted">
            <li
              v-for="(step, index) in steps"
              :key="step.title"
              class="flex items-center gap-2"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full border"
                :class="index <= currentStep ? 'border-primary-500 bg-primary-500 text-white' : 'border-neutral-300 text-placeholder'"
              >
                {{ index + 1 }}
              </span>
              <span :class="index === currentStep ? 'font-semibold text-heading-secondary' : ''">
                {{ step.title }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div class="grid gap-4 sm:gap-6 lg:grid-cols-[2fr_1fr]">
        <Card class="bg-white/80">
          <template #header>
            <div class="flex items-center gap-3">
              <component :is="activeStep.icon" class="h-10 w-10 rounded-2xl bg-primary-100 p-2 text-primary" />
              <div>
                <p class="text-responsive-sm font-medium uppercase tracking-wide text-primary">{{ activeStep.category }}</p>
                <h2 class="text-responsive-xl font-semibold text-heading">{{ activeStep.title }}</h2>
              </div>
            </div>
          </template>

          <div class="space-y-6 text-body">
            <p class="text-responsive-lg leading-relaxed text-body-emphasis">
              {{ activeStep.description }}
            </p>

            <ul class="space-y-4">
              <li
                v-for="item in activeStep.points"
                :key="item.title"
                class="flex items-stretch sm:items-start gap-3 rounded-2xl border border-neutral-200/70 bg-white/80 p-4 shadow-sm"
              >
                <div class="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary">
                  <component :is="item.icon" class="h-5 w-5" />
                </div>
                <div>
                  <p class="font-semibold text-heading-secondary">{{ item.title }}</p>
                  <p class="text-responsive-sm text-body">{{ item.content }}</p>
                </div>
              </li>
            </ul>
          </div>

          <template #footer>
            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="ghost"
                class="text-muted hover:text-heading-secondary"
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
            variant="muted"
            class="bg-white/70"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <component :is="insight.icon" class="h-9 w-9 rounded-2xl bg-primary-100 p-2 text-primary" />
                <div>
                  <p class="text-responsive-sm font-medium text-muted">{{ insight.category }}</p>
                  <h3 class="text-responsive-lg font-semibold text-heading">{{ insight.title }}</h3>
                </div>
              </div>
            </template>
            <p class="text-responsive-sm leading-relaxed text-body">{{ insight.description }}</p>
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
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
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
        content: 'Paiement par portefeuille AntiGaspi, mobile money ou sur place. Recevez un récapitulatif dans votre profil.',
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
    title: 'Portefeuille AntiGaspi',
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
