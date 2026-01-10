import { computed } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import Button from '@/components/ui/2025/Button.vue'
import { ArrowRight, Check, Loader2, ShoppingBag, Star } from 'lucide-vue-next'


const iconOptions = {
  none: null,
  ArrowRight,
  Check,
  Loader2,
  ShoppingBag,
  Star
}

type IconOption = keyof typeof iconOptions;

const resolveIcons = (args: { leftIcon?: IconOption; rightIcon?: IconOption }) => {
  const resolvedLeft = computed(() => iconOptions[(args.leftIcon ?? 'none') as IconOption] ?? null)
  const resolvedRight = computed(() => iconOptions[(args.rightIcon ?? 'none') as IconOption] ?? null)
  return { resolvedLeft, resolvedRight }
}

const renderButton = (args: any) => {
  const { resolvedLeft, resolvedRight } = resolveIcons(args as { leftIcon?: IconOption; rightIcon?: IconOption })
  return {
    components: { Button },
    setup() {
      return { args, resolvedLeft, resolvedRight }
    },
    template: `
      <Button
        :variant="args.variant"
        :size="args.size"
        :disabled="args.disabled"
        :loading="args.loading"
        :left-icon="resolvedLeft"
        :right-icon="resolvedRight"
      >
        {{ args.label }}
      </Button>
    `
  }
}


const meta: Meta<any> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  render: renderButton,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost', 'outline', 'promo', 'destructive']
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['xs', 'sm', 'md', 'lg', 'xl']
    },
    disabled: {
      control: { type: 'boolean' }
    },
    loading: {
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
    label: {
      control: { type: 'text' }
    }
  },
  args: {
    label: 'Valider la commande',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    leftIcon: 'ShoppingBag',
    rightIcon: 'ArrowRight'
  }
}

export default meta


type Story = StoryObj<any>;

export const Playground: Story = {}

export const Hover: Story = {
  name: 'Hover',
  parameters: {
    pseudo: { hover: ['button'] }
  }
}

export const Focus: Story = {
  name: 'Focus',
  parameters: {
    pseudo: { focus: ['button'] }
  }
}

export const Disabled: Story = {
  args: {
    disabled: true,
    leftIcon: 'none',
    rightIcon: 'none'
  }
}

export const Loading: Story = {
  args: {
    loading: true,
    rightIcon: 'none'
  }
}

export const SecondaryDark: Story = {
  args: {
    variant: 'secondary',
    label: 'Action secondaire',
    leftIcon: 'none',
    rightIcon: 'Check'
  },
  parameters: {
    backgrounds: { default: 'Surface Dark' },
    globals: { theme: 'dark' }
  }
}

export const FullWidthMobile: Story = {
  args: {
    label: 'CTA mobile',
    size: 'lg',
    leftIcon: 'Star',
    rightIcon: 'none'
  },
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' }
  },
  decorators: [

    ((story: any) => ({
      components: { Story: story() },
      template: `
        <div class="mx-auto w-full max-w-xs px-4 py-8">
          <Story />
        </div>
      `
    })) as any
  ]
}
