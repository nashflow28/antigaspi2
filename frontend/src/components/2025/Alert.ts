// Alert component stub for module resolution
// TODO: Create proper Alert component when needed
import { defineComponent, h } from 'vue'

export const Alert = defineComponent({
  name: 'Alert',
  props: {
    type: { type: String, default: 'info' },
    message: { type: String, default: '' },
    dismissible: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    const typeColors: Record<string, string> = {
      info: 'bg-blue-50 text-blue-800 border-blue-200',
      success: 'bg-green-50 text-green-800 border-green-200',
      warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      error: 'bg-red-50 text-red-800 border-red-200'
    }

    return () => h('div', {
      class: `p-4 rounded-lg border ${typeColors[props.type] || typeColors.info}`,
      role: 'alert'
    }, slots.default?.() || props.message)
  }
})

export default Alert
