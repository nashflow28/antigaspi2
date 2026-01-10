import { onMounted } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import ThemeToggle, { type ThemeMode } from '@/components/ui/2025/ThemeToggle.vue'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const meta: Meta<any> = {
  title: 'Design System 2025/Theme Toggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  args: {
    initialTheme: 'light'
  },
  argTypes: {
    initialTheme: {
      control: { type: 'inline-radio' },
      options: ['light', 'dark']
    }
  },
  render: (args, { globals }) => ({
    components: { ThemeToggle },
    setup() {
      onMounted(() => {
        if (typeof window === 'undefined') {
          return
        }

        try {
          localStorage.setItem('theme', args.initialTheme)
        } catch (error) {
          console.warn('Impossible de stocker le thème dans localStorage', error)
        }

        if (!('vibrate' in navigator)) {
          (navigator as Navigator & { vibrate?: (pattern?: number | number[]) => boolean }).vibrate = () => false
        }

        const targetTheme = args.initialTheme ?? (globals.theme as ThemeMode | undefined) ?? 'light'
        document.documentElement.classList.toggle('dark', targetTheme === 'dark')
      })

      return { args }
    },
    template: `
      <div class="flex items-center gap-6">
        <span class="text-sm text-gray-700 dark:text-gray-300">Basculer le thème</span>
        <ThemeToggle />
      </div>
    `
  })
}

export default meta

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Story = StoryObj<any>;

export const Playground: Story = {
  parameters: {
    globals: { theme: 'light' }
  }
}

export const HoverState: Story = {
  parameters: {
    pseudo: { hover: ['button'] },
    globals: { theme: 'light' }
  }
}

export const FocusState: Story = {
  parameters: {
    pseudo: { focus: ['button'] },
    globals: { theme: 'light' }
  }
}

export const DarkDefault: Story = {
  args: {
    initialTheme: 'dark'
  },
  parameters: {
    backgrounds: { default: 'Surface Dark' },
    globals: { theme: 'dark' }
  }
}
