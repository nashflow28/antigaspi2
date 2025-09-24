import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Input from '@/components/ui/Input.vue';
import Textarea from '@/components/ui/Textarea.vue';
import Modal from '@/components/ui/Modal.vue';

describe('UI Components', () => {
  describe('Button', () => {
    it('renders primary variant by default', () => {
      const wrapper = mount(Button, {
        slots: {
          default: 'Découvrir',
        },
      });

      expect(wrapper.classes()).toContain('bg-nav-gradient');
      expect(wrapper.classes()).toContain('text-white');
    });

    it('applies secondary variant and disabled state when loading', () => {
      const wrapper = mount(Button, {
        props: {
          variant: 'secondary',
          loading: true,
        },
        slots: {
          default: 'Charger',
        },
      });

      expect(wrapper.attributes('disabled')).toBeDefined();
      expect(wrapper.classes()).toContain('bg-white');
      expect(wrapper.classes()).toContain('cursor-wait');
    });
  });

  describe('Card', () => {
    it('supports glass variant with glow hover', () => {
      const wrapper = mount(Card, {
        props: {
          variant: 'glass',
          hover: 'glow',
          padding: 'lg',
        },
        slots: {
          default: '<p>Contenu</p>',
        },
      });

      expect(wrapper.classes()).toContain('bg-primary-200/15');
      expect(wrapper.classes()).toContain('hover:shadow-glow');
      expect(wrapper.classes()).toContain('p-8');
    });
  });

  describe('Input', () => {
    const Icon = defineComponent({
      name: 'DummyIcon',
      render() {
        return h('svg');
      },
    });

    it('renders label, helper text and updates value', async () => {
      const wrapper = mount(Input, {
        props: {
          label: 'Email',
          helperText: 'Nous ne partagerons jamais votre email',
          modelValue: '',
          leftIcon: Icon,
        },
      });

      const input = wrapper.find('input');
      expect(wrapper.text()).toContain('Nous ne partagerons jamais votre email');
      expect(input.classes()).toContain('pl-12');

      await input.setValue('test@antigaspi.fr');
      expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['test@antigaspi.fr']);
    });

    it('shows error state with accent border', () => {
      const wrapper = mount(Input, {
        props: {
          label: 'Nom',
          error: 'Champ obligatoire',
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('border-accent-red');
      expect(wrapper.text()).toContain('Champ obligatoire');
    });
  });

  describe('Textarea', () => {
    it('renders helper text and error styles', async () => {
      const wrapper = mount(Textarea, {
        props: {
          label: 'Message',
          helperText: 'Partagez les détails utiles',
          modelValue: '',
        },
      });

      expect(wrapper.text()).toContain('Partagez les détails utiles');

      await wrapper.setProps({ error: 'Ce champ est requis' });
      const textarea = wrapper.find('textarea');
      expect(textarea.classes()).toContain('border-accent-red');
      expect(wrapper.text()).toContain('Ce champ est requis');
    });
  });

  describe('Modal', () => {
    let originalOverflow: string;

    beforeEach(() => {
      originalOverflow = document.body.style.overflow;
    });

    afterEach(() => {
      document.body.style.overflow = originalOverflow;
    });

    it('renders content and closes on overlay click', async () => {
      const onClose = vi.fn();
      const wrapper = mount(Modal, {
        props: {
          isOpen: true,
          title: 'Confirmation',
          description: 'Êtes-vous sûr ? ',
          onClose,
        },
        slots: {
          default: '<p>Contenu principal</p>',
          footer: '<button>Action</button>',
        },
        attachTo: document.body,
        global: {
          stubs: {
            transition: false,
          },
        },
      });

      const overlay = document.querySelector('.modal-overlay') as HTMLElement | null;
      expect(overlay).not.toBeNull();
      expect(document.body.style.overflow).toBe('hidden');

      overlay?.click();
      expect(onClose).toHaveBeenCalled();

      wrapper.unmount();
    });

    it('responds to escape key when enabled', () => {
      const onClose = vi.fn();
      const wrapper = mount(Modal, {
        props: {
          isOpen: true,
          closeOnEscape: true,
          onClose,
        },
        attachTo: document.body,
        global: {
          stubs: {
            transition: false,
          },
        },
      });

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(onClose).toHaveBeenCalled();

      wrapper.unmount();
    });
  });
});
