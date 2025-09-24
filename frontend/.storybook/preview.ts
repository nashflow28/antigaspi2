import type { Preview } from '@storybook/vue3-vite';
import { withPseudo } from 'storybook-addon-pseudo-states/vue';
import '../src/assets/css/main.css';
import '../src/assets/animations.css';

const preview: Preview = {
  decorators: [
    withPseudo,
    (story, context) => {
      const theme = (context.globals.theme as 'light' | 'dark' | undefined) ?? 'light';
      const root = document.documentElement;
      root.classList.toggle('dark', theme === 'dark');

      const containerClass =
        context.parameters.layout === 'fullscreen'
          ? 'w-full px-0 py-0'
          : 'mx-auto w-full max-w-5xl px-8 py-10';

      return {
        components: { Story: story() },
        setup() {
          return { containerClass };
        },
        template: `
          <div class="min-h-screen w-full bg-surface-light text-neutral-900 transition-colors duration-300 dark:bg-surface-darker dark:text-neutral-50">
            <div :class="containerClass">
              <Story />
            </div>
          </div>
        `,
      };
    },
  ],
  globalTypes: {
    theme: {
      description: 'Sélection du thème global',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Clair' },
          { value: 'dark', title: 'Sombre' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'Surface Light',
      values: [
        { name: 'Surface Light', value: '#F9FAFB' },
        { name: 'Surface Dark', value: '#0B1120' },
        { name: 'Neutre', value: '#FFFFFF' },
      ],
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablette', styles: { width: '834px', height: '1112px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '720px' } },
      },
      defaultViewport: 'desktop',
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['UI'],
      },
    },
    pseudo: {
      disable: false,
    },
  },
};

export default preview;
