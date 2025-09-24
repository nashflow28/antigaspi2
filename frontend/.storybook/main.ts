import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/vue3-vite';
import viteConfig from '../vite.config';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    'storybook/internal/actions',
    'storybook/internal/controls',
    'storybook/viewport',
    'storybook-addon-pseudo-states',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    const { server: _server, test: _test, ...rest } = viteConfig;
    return mergeConfig(config, rest);
  },
};

export default config;
