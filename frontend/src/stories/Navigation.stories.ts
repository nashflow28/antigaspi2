import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import Navigation from '@/components/ui/2025/Navigation.vue'
import ThemeToggle from '@/components/ui/2025/ThemeToggle.vue'
import Button from '@/components/ui/2025/Button.vue'
import { LogIn, UserPlus, Package, Gift, MapPin, MessageSquare } from 'lucide-vue-next'

const meta: Meta<typeof Navigation> = {
  title: 'UI/Navigation',
  component: Navigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Navigation },
    setup() {
      const mainLinks = [
        { id: 'products', label: 'Produits', to: '/products', icon: Package },
        { id: 'surprise', label: 'Paniers surprise', to: '/surprise-baskets', icon: Gift },
        { id: 'map', label: 'Carte', to: '/merchants/map', icon: MapPin },
        { id: 'reviews', label: 'Avis', to: '/reviews', icon: MessageSquare }
      ]

      const authCta = {
        login: { label: 'Connexion', to: '/login', icon: LogIn },
        primary: { label: "S'inscrire", to: '/register', icon: UserPlus, variant: 'primary' as const }
      }

      return { mainLinks, authCta }
    },
    template: `
      <div class="min-h-screen bg-gradient-to-br from-surface-light via-white to-surface-light p-6">
        <Navigation
          :brand="{ name: 'Antigaspi', tagline: 'Sauvons ensemble', to: '/' }"
          :main-links="mainLinks"
          :auth-cta="authCta"
        />
      </div>
    `
  })
}

export const WithSlots: Story = {
  render: () => ({
    components: { Navigation, ThemeToggle, Button },
    setup() {
      const mainLinks = [
        { id: 'products', label: 'Produits', to: '/products', icon: Package },
        { id: 'surprise', label: 'Paniers surprise', to: '/surprise-baskets', icon: Gift },
        { id: 'map', label: 'Carte', to: '/merchants/map', icon: MapPin },
        { id: 'reviews', label: 'Avis', to: '/reviews', icon: MessageSquare }
      ]

      const authCta = {
        login: { label: 'Connexion', to: '/login', icon: LogIn },
        primary: { label: "S'inscrire", to: '/register', icon: UserPlus, variant: 'primary' as const }
      }

      const mobileOpen = ref(false)
      const toggleMobile = () => {
        mobileOpen.value = !mobileOpen.value
      }

      return { mainLinks, authCta, mobileOpen, toggleMobile }
    },
    template: `
      <div class="min-h-screen bg-surface-light p-6">
        <Navigation
          v-model:mobile-open="mobileOpen"
          :brand="{ name: 'Antigaspi', tagline: 'Sauvons ensemble', to: '/' }"
          :main-links="mainLinks"
          :auth-cta="authCta"
        >
          <template #secondary="{ closeMobile }">
            <ThemeToggle aria-label="Basculer le thème" />
            <Button
              tag="router-link"
              :to="authCta.primary.to"
              variant="ghost"
              size="sm"
              @click="closeMobile()"
            >
              {{ authCta.primary.label }}
            </Button>
          </template>
          <template #mobile-secondary="{ closeMobile }">
            <div class="rounded-3xl border border-white/60 bg-white/70 px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm">
              <span class="mr-auto">Thème</span>
              <ThemeToggle aria-label="Basculer le thème" />
            </div>
            <Button
              tag="router-link"
              :to="authCta.primary.to"
              class="w-full"
              @click="closeMobile()"
            >
              {{ authCta.primary.label }}
            </Button>
          </template>
        </Navigation>
        <div class="mt-6 flex gap-3">
          <Button variant="secondary" @click="toggleMobile">
            Basculer le menu mobile
          </Button>
        </div>
      </div>
    `
  })
}
