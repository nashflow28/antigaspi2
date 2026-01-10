import type { Meta, StoryObj } from '@storybook/vue3'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'


const meta: Meta<any> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  args: {
    variant: 'default',
    interactive: false,
    shadow: 'md',
    rounded: 'lg',
    noPadding: false,
    title: 'Carte de suivi',
    subtitle: 'Statistiques mises à jour',
    body: 'Affichez un aperçu des performances de vos paniers et suivez les KPIs clés de votre activité.',
    footerLabel: 'Dernière mise à jour il y a 5 min',
    showHeader: true,
    showFooter: true
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'glass', 'gradient', 'bordered', 'elevated']
    },
    interactive: {
      control: { type: 'boolean' }
    },
    noPadding: {
      control: { type: 'boolean' }
    },
    shadow: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl']
    },
    rounded: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl', 'full']
    },
    showHeader: {
      control: { type: 'boolean' }
    },
    showFooter: {
      control: { type: 'boolean' }
    },
    title: {
      control: { type: 'text' }
    },
    subtitle: {
      control: { type: 'text' }
    },
    body: {
      control: { type: 'text' }
    },
    footerLabel: {
      control: { type: 'text' }
    }
  },
  render: (args) => ({
    components: { Card, Button },
    setup() {
      return { args }
    },
    template: `
      <Card
        :variant="args.variant"
        :interactive="args.interactive"
        :no-padding="args.noPadding"
        :shadow="args.shadow"
        :rounded="args.rounded"
        class="max-w-xl"
      >
        <template v-if="args.showHeader" #header>
          <div class="flex flex-col gap-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-50">{{ args.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-300">{{ args.subtitle }}</p>
          </div>
        </template>

        <p class="text-gray-700 text-gray-700 dark:text-gray-200">
          {{ args.body }}
        </p>

        <template v-if="args.showFooter" #footer>
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ args.footerLabel }}</span>
            <Button size="sm" variant="secondary">Voir le détail</Button>
          </div>
        </template>
      </Card>
    `
  })
}

export default meta


type Story = StoryObj<any>;

export const Playground: Story = {}

export const GlassHighlight: Story = {
  args: {
    variant: 'glass',
    interactive: true,
    shadow: 'lg',
    title: 'Visibilité renforcée',
    subtitle: 'Mise en avant marketing',
    body: 'Utilisez cette variante pour les éléments clés de la page qui nécessitent une attention accrue et un effet premium.'
  },
  parameters: {
    pseudo: { hover: ['article'] }
  }
}

export const Minimal: Story = {
  args: {
    variant: 'bordered',
    shadow: 'sm',
    rounded: 'md',
    noPadding: true,
    showFooter: false,
    subtitle: '',
    body: "Idéal pour des blocs secondaires ou des cartes d'information discrètes."
  }
}

export const DarkMode: Story = {
  args: {
    variant: 'elevated',
    interactive: true,
    shadow: 'xl',
    body: 'La variante elevated combine ombres profondes et surfaces contrastées pour le mode sombre.',
    footerLabel: 'Action requise'
  },
  parameters: {
    backgrounds: { default: 'Surface Dark' },
    globals: { theme: 'dark' }
  }
}

export const ResponsiveGrid: Story = {
  args: {
    showFooter: false
  },
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'tablet' }
  },
  decorators: [

    ((story: any, context: any) => ({
      components: { Story: story() },
      setup() {
        return { args: context.args }
      },
      template: `
        <div class="mx-auto grid w-full max-w-5xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
          <Story :args="{ ...args, title: 'Suivi des ventes', body: 'Mesurez vos performances quotidiennes.' }" />
          <Story :args="{ ...args, variant: 'glass', interactive: true, shadow: 'lg', title: 'Conversion', body: 'Optimisez votre tunnel de commande.' }" />
          <Story :args="{ ...args, variant: 'gradient', rounded: 'xl', title: 'Satisfaction client', body: 'Surveillez vos avis et retours.' }" />
        </div>
      `
    })) as any
  ]
}
