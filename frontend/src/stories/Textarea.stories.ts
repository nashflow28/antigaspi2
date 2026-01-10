import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import Textarea from '@/components/ui/Textarea.vue'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const meta: Meta<any> = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  args: {
    variant: 'subtle',
    size: 'md',
    label: 'Description du panier',
    helperText: 'Présentez les ingrédients phares et les consignes de récupération.',
    error: '',
    disabled: false,
    modelValue: 'Panier surprise végétarien composé de produits frais invendus du jour.'
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['subtle', 'filled', 'transparent']
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['md', 'lg']
    },
    label: {
      control: { type: 'text' }
    },
    helperText: {
      control: { type: 'text' }
    },
    error: {
      control: { type: 'text' }
    },
    disabled: {
      control: { type: 'boolean' }
    },
    modelValue: {
      control: { type: 'text' }
    }
  },
  render: (args) => ({
    components: { Textarea },
    setup() {
      const value = ref(args.modelValue ?? '')
      watch(
        () => args.modelValue,
        (next) => {
          if (typeof next === 'string' && next !== value.value) {
            value.value = next
          }
        }
      )

      const updateValue = (next: string) => {
        value.value = next
        args.modelValue = next
      }

      return { args, value, updateValue }
    },
    template: `
      <div class="w-full max-w-xl">
        <Textarea
          :model-value="value"
          :variant="args.variant"
          :size="args.size"
          :label="args.label"
          :helper-text="args.helperText || undefined"
          :error="args.error || undefined"
          :disabled="args.disabled"
          @update:model-value="updateValue"
        />
      </div>
    `
  })
}

export default meta

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Story = StoryObj<any>;

export const Playground: Story = {}

export const FocusState: Story = {
  parameters: {
    pseudo: { focus: ['textarea'] }
  },
  args: {
    helperText: 'La sélection est active.'
  }
}

export const ErrorState: Story = {
  args: {
    error: 'Merci de détailler davantage le contenu du panier.',
    helperText: ''
  }
}

export const Disabled: Story = {
  args: {
    disabled: true,
    modelValue: 'Ce champ est verrouillé car le panier est archivé.'
  }
}

export const DarkMode: Story = {
  args: {
    variant: 'transparent',
    helperText: 'Bénéficie du contraste renforcé en mode sombre.'
  },
  parameters: {
    backgrounds: { default: 'Surface Dark' },
    globals: { theme: 'dark' }
  }
}

export const ResponsiveColumns: Story = {
  args: {
    helperText: ''
  },
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'desktop' }
  },
  decorators: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((story: any, context: any) => ({
      components: { Story: story() },
      setup() {
        return { args: context.args }
      },
      template: `
        <div class="mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 lg:grid-cols-2">
          <Story :args="{ ...args, label: 'Brief marketing', modelValue: 'Mettez en avant l'impact écologique de votre offre.' }" />
          <Story :args="{ ...args, label: 'Consignes de retrait', modelValue: 'Retrait entre 18h et 19h. Merci d'apporter votre sac.' }" />
        </div>
      `
    })) as any
  ]
}
