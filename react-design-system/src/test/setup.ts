import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Framer Motion pour les tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    input: 'input',
    textarea: 'textarea',
    a: 'a',
    nav: 'nav',
    aside: 'aside',
    header: 'header',
    main: 'main'
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  HTMLMotionProps: {},
  Variants: {}
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
}));

// Mock ResizeObserver
(global as any).ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});