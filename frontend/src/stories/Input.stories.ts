import { computed, ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import Input from '@/components/ui/2025/Input.vue'
import { Calendar, Lock, Mail, Search, User } from 'lucide-vue-next'


const iconOptions = {
  none: null,
  Search,
  Mail,
  User,
  Calendar,
  Lock
}

type IconOption = keyof typeof iconOptions;


const meta: Meta<any> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  args: {
    variant: 'default',
    size: 'md',
    label: 'Email professionnel',
    helpText: 'Nous l’utiliserons pour les confirmations de réservation.',
    error: '',
    disabled: false,
    modelValue: 'contact@antigaspi.fr',
    leftIcon: 'Mail',
    rightIcon: 'none'
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline', 'filled']
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['sm', 'md', 'lg']
    },
    label: {
      control: { type: 'text' }
    },
    helpText: {
      control: { type: 'text' }
    },
    error: {
      control: { type: 'text' }
    },
    disabled: {
      control: { type: 'boolean' }
    },
    leftIcon: {
      control: { type: 'select' },
      options: Object.keys(iconOptions)
    },
    rightIcon: {
      control: { type: 'select' },
      options: Object.keys(iconOptions)
    },
    modelValue: {
      control: { type: 'text' }
    }
  },
  render: (args) => ({
    components: { Input },
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

      const resolvedLeft = computed(() => iconOptions[(args.leftIcon ?? 'none') as IconOption] ?? null)
      const resolvedRight = computed(() => iconOptions[(args.rightIcon ?? 'none') as IconOption] ?? null)

      return { args, value, updateValue, resolvedLeft, resolvedRight }
    },
    template: `
      <div class="w-full max-w-md space-y-2">
        <Input
          :model-value="value"
          :variant="args.variant"
          :size="args.size"
          :label="args.label"
          :help-text="args.helpText || undefined"
          :error="args.error || undefined"
          :disabled="args.disabled"
          :left-icon="resolvedLeft"
          :right-icon="resolvedRight"
          @update:model-value="updateValue"
        />
      </div>
    `
  })
}

export default meta


type Story = StoryObj<any>;

export const Playground: Story = {}

export const WithIcons: Story = {
  args: {
    label: 'Recherche de panier',
    helpText: 'Tapez le nom d’un commerçant ou d’un produit.',
    leftIcon: 'Search',
    rightIcon: 'Calendar',
    modelValue: ''
  },
  parameters: {
    pseudo: { hover: ['input'] }
  }
}

export const FocusState: Story = {
  args: {
    helpText: 'Saisie en cours…'
  },
  parameters: {
    pseudo: { focus: ['input'] }
  }
}

export const ErrorState: Story = {
  args: {
    error: 'Adresse email invalide',
    rightIcon: 'none'
  }
}

export const Disabled: Story = {
  args: {
    disabled: true,
    modelValue: 'Bouton désactivé',
    leftIcon: 'Lock'
  }
}

export const DarkMode: Story = {
  args: {
    variant: 'outline',
    helpText: 'Compatible mode sombre avec contraste renforcé.'
  },
  parameters: {
    backgrounds: { default: 'Surface Dark' },
    globals: { theme: 'dark' }
  }
}

export const MobileFullWidth: Story = {
  args: {
    label: 'Téléphone portable',
    helpText: 'Affichage optimisé pour mobile.',
    leftIcon: 'User',
    modelValue: ''
  },
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' }
  },
  decorators: [

    ((story: any) => ({
      components: { Story: story() },
      template: `
        <div class="mx-auto w-full max-w-sm px-4 py-8">
          <Story />
        </div>
      `
    })) as any
  ]
}
