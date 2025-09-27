import type { Meta, StoryObj } from '@storybook/vue3'
import Skeleton from '@/components/ui/Skeleton.vue'

type SkeletonComponent = typeof Skeleton;

type StoryProps = {
  widthClass: string;
  heightClass: string;
};

const meta: Meta<SkeletonComponent & StoryProps> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  args: {
    rounded: 'md',
    widthClass: 'w-48',
    heightClass: 'h-10'
  },
  argTypes: {
    rounded: {
      control: { type: 'inline-radio' },
      options: ['sm', 'md', 'lg', 'full']
    },
    widthClass: {
      control: { type: 'text' }
    },
    heightClass: {
      control: { type: 'text' }
    }
  },
  render: (args) => ({
    components: { Skeleton },
    setup() {
      return { args }
    },
    template: `
      <Skeleton
        :rounded="args.rounded"
        :class="['bg-neutral-200/70 dark:bg-neutral-800/60', args.widthClass, args.heightClass].join(' ')"
      />
    `
  })
}

export default meta

type Story = StoryObj<typeof meta>;

export const Playground: Story = {}

export const ListPlaceholder: Story = {
  args: {
    widthClass: 'w-full',
    heightClass: 'h-6',
    rounded: 'lg'
  },
  decorators: [
    (story, context) => ({
      components: { Story: story() },
      setup() {
        return { args: context.args }
      },
      template: `
        <div class="w-full max-w-xl space-y-4">
          <Story :args="{ ...args, widthClass: 'w-3/4' }" />
          <Story :args="{ ...args, widthClass: 'w-full' }" />
          <Story :args="{ ...args, widthClass: 'w-2/3' }" />
        </div>
      `
    })
  ]
}

export const Avatar: Story = {
  args: {
    rounded: 'full',
    widthClass: 'w-16',
    heightClass: 'h-16'
  }
}

export const DarkMode: Story = {
  args: {
    widthClass: 'w-64',
    heightClass: 'h-8',
    rounded: 'lg'
  },
  parameters: {
    backgrounds: { default: 'Surface Dark' },
    globals: { theme: 'dark' }
  }
}

export const ResponsiveBanner: Story = {
  args: {
    rounded: 'lg',
    widthClass: 'w-full',
    heightClass: 'h-28'
  },
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (story) => ({
      components: { Story: story() },
      template: `
        <div class="mx-auto w-full max-w-5xl px-6 py-10">
          <Story />
        </div>
      `
    })
  ]
}
