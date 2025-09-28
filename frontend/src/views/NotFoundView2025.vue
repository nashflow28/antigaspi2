<template>
  <div
    class="container-2025 relative min-h-screen overflow-hidden bg-gradient-to-br from-surface-light via-primary-50/40 to-primary-500/10 dark:from-surface-dark dark:via-surface-dark/90 dark:to-primary-500/15"
  >
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-24 -left-24 h-80 w-80 rounded-full bg-primary-500/15 blur-3xl dark:bg-primary-500/10" />
      <div class="absolute bottom-16 right-6 h-72 w-72 rounded-full bg-accent-blue/10 blur-3xl dark:bg-accent-blue/20" />
      <div class="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/40 via-transparent dark:from-black/20" />
    </div>

    <div class="relative container px-4 py-20 sm:px-6 lg:px-10 xl:px-16">
      <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-12">
        <Card variant="glass" class="p-8 sm:p-10 lg:p-12 space-y-8 shadow-glow">
          <div class="space-y-3 text-left">
            <Badge
              variant="primary"
              size="sm"
              :left-icon="Sparkles"
              pulse
            >
              Expérience 2025
            </Badge>
            <Badge variant="secondary" size="sm" class="uppercase tracking-wide text-xs">
              Erreur 404
            </Badge>
          </div>

          <EmptyState
            size="lg"
            variant="illustration"
            :icon="Frown"
            title="Page introuvable"
            :centered="false"
          >
            <template #description>
              <p class="text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
                Oups ! La page que vous cherchez n'existe plus ou a peut-être été déplacée.
              </p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Vérifiez l'adresse renseignée ou explorez les sections ci-dessous pour continuer votre navigation.
              </p>
            </template>
            <template #actions>
              <div class="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  class="justify-center sm:justify-start"
                  :left-icon="ArrowLeft"
                  @click="goBack"
                >
                  Retour
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  class="justify-center sm:justify-start"
                  :left-icon="Home"
                  tag="router-link"
                  to="/"
                >
                  Accueil
                </Button>
              </div>
            </template>
          </EmptyState>

          <div class="grid gap-4 sm:grid-cols-2">
            <Card variant="bordered" class="p-4 sm:p-6 bg-surface-light/80 dark:bg-surface-dark/80">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
                  <Compass class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    Continuez votre visite
                  </h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-300">
                    Découvrez les offres disponibles ou consultez votre tableau de bord personnalisé.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="bordered" class="p-4 sm:p-6 bg-surface-light/80 dark:bg-surface-dark/80">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue dark:bg-accent-blue/20 dark:text-accent-blue/90">
                  <ShieldCheck class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    Navigation sécurisée
                  </h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-300">
                    Toutes vos actions restent protégées selon les standards 2025 de notre design system.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        <div class="space-y-6">
          <Card class="p-6 sm:p-8 space-y-6">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Liens rapides
              </h2>
              <p class="text-sm text-neutral-600 dark:text-neutral-300">
                Accédez rapidement aux sections clés de la plateforme.
              </p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <Button
                tag="router-link"
                to="/products"
                variant="secondary"
                size="md"
                class="justify-start"
                :left-icon="ShoppingBag"
              >
                Catalogue
              </Button>
              <Button
                tag="router-link"
                to="/dashboard"
                variant="secondary"
                size="md"
                class="justify-start"
                :left-icon="BarChart3"
              >
                Tableau de bord
              </Button>
              <Button
                tag="router-link"
                to="/reservations"
                variant="secondary"
                size="md"
                class="justify-start"
                :left-icon="Bookmark"
              >
                Réservations
              </Button>
              <Button
                tag="router-link"
                to="/profile"
                variant="secondary"
                size="md"
                class="justify-start"
                :left-icon="User"
              >
                Profil
              </Button>
            </div>
          </Card>

          <Card variant="bordered" class="p-6 sm:p-8 space-y-5 bg-surface-light/80 dark:bg-surface-dark/80">
            <div class="flex items-start gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
                <LifeBuoy class="h-6 w-6" />
              </div>
              <div class="space-y-1">
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Besoin d'aide ?
                </h2>
                <p class="text-sm text-neutral-600 dark:text-neutral-300">
                  Notre équipe support est disponible pour répondre à vos questions.
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
              <Button
                tag="a"
                href="mailto:support@antigaspi.fr"
                variant="ghost"
                size="sm"
                class="justify-start"
                :left-icon="Mail"
              >
                support@antigaspi.fr
              </Button>
              <Button
                tag="a"
                href="tel:+33123456789"
                variant="ghost"
                size="sm"
                class="justify-start"
                :left-icon="Phone"
              >
                +33 1 23 45 67 89
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Home,
  ShoppingBag,
  BarChart3,
  Bookmark,
  User,
  Mail,
  Phone,
  Frown,
  LifeBuoy,
  Compass,
  ShieldCheck,
  Sparkles
} from 'lucide-vue-next'

import Badge from '@/components/ui/2025/Badge.vue'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import EmptyState from '@/components/ui/2025/EmptyState.vue'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>
