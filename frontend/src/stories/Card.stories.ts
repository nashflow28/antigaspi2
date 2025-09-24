import type { Meta, StoryObj } from '@storybook/vue3';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';

type CardComponent = typeof Card;

type StoryProps = {
  title: string;
  subtitle: string;
  body: string;
  footerLabel: string;
  showHeader: boolean;
  showFooter: boolean;
};

const meta: Meta<CardComponent & StoryProps> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    variant: 'default',
    hover: 'lift',
    padding: 'md',
    title: 'Carte de suivi',
    subtitle: 'Statistiques mises à jour',
    body: 'Affichez un aperçu des performances de vos paniers et suivez les KPIs clés de votre activité.',
    footerLabel: 'Dernière mise à jour il y a 5 min',
    showHeader: true,
    showFooter: true,
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'glass', 'highlight', 'muted'],
    },
    hover: {
      control: { type: 'select' },
      options: ['none', 'lift', 'glow', 'subtle'],
    },
    padding: {
      control: { type: 'inline-radio' },
      options: ['none', 'sm', 'md', 'lg'],
    },
    showHeader: {
      control: { type: 'boolean' },
    },
    showFooter: {
      control: { type: 'boolean' },
    },
    title: {
      control: { type: 'text' },
    },
    subtitle: {
      control: { type: 'text' },
    },
    body: {
      control: { type: 'text' },
    },
    footerLabel: {
      control: { type: 'text' },
    },
  },
  render: (args) => ({
    components: { Card, Button },
    setup() {
      return { args };
    },
    template: `
      <Card :variant="args.variant" :hover="args.hover" :padding="args.padding" class="max-w-md">
        <template v-if="args.showHeader" #header>
          <div class="flex flex-col gap-1">
            <h3 class="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">{{ args.title }}</h3>
            <p class="text-small text-neutral-500 dark:text-neutral-300">{{ args.subtitle }}</p>
          </div>
        </template>

        <p class="text-body text-neutral-600 dark:text-neutral-200">
          {{ args.body }}
        </p>

        <template v-if="args.showFooter" #footer>
          <div class="flex items-center justify-between gap-4">
            <span class="text-small text-neutral-500 dark:text-neutral-400">{{ args.footerLabel }}</span>
            <Button size="sm" variant="secondary">Voir le détail</Button>
          </div>
        </template>
      </Card>
    `,
  }),
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const GlassHighlight: Story = {
  args: {
    variant: 'glass',
    hover: 'glow',
    title: 'Visibilité renforcée',
    subtitle: 'Mise en avant marketing',
    body: 'Utilisez cette variante pour les éléments clés de la page qui nécessitent une attention accrue et un effet premium.',
  },
  parameters: {
    pseudo: { hover: ['article'] },
  },
};

export const Minimal: Story = {
  args: {
    variant: 'muted',
    hover: 'none',
    padding: 'sm',
    showFooter: false,
    subtitle: '',
    body: "Idéal pour des blocs secondaires ou des cartes d'information discrètes.",
  },
};

export const DarkMode: Story = {
  args: {
    variant: 'highlight',
    hover: 'lift',
    body: 'La variante highlight ressort particulièrement bien sur les fonds sombres.',
    footerLabel: 'Action requise',
  },
  parameters: {
    backgrounds: { default: 'Surface Dark' },
    globals: { theme: 'dark' },
  },
};

export const ResponsiveGrid: Story = {
  args: {
    showFooter: false,
  },
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'tablet' },
  },
  decorators: [
    (story, context) => ({
      components: { Story: story() },
      setup() {
        return { args: context.args };
      },
      template: `
        <div class="mx-auto grid w-full max-w-5xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
          <Story :args="{ ...args, title: 'Suivi des ventes', body: 'Mesurez vos performances quotidiennes.' }" />
          <Story :args="{ ...args, variant: 'glass', hover: 'glow', title: 'Conversion', body: 'Optimisez votre tunnel de commande.' }" />
          <Story :args="{ ...args, variant: 'muted', title: 'Satisfaction client', body: 'Surveillez vos avis et retours.' }" />
        </div>
      `,
    }),
  ],
};
