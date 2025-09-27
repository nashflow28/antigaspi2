const fs = require('fs')
const path = require('path')

const modalPath = 'src/components/ui/AccessibleModal.vue'
let content = fs.readFileSync(modalPath, 'utf8')

// Fix imports
content = content.replace(
  "import { ref, computed, watch, nextTick, onUnmounted } from 'vue'",
  "import { ref, computed, watch, nextTick, onUnmounted, useSlots } from 'vue'"
)

// Add slots declaration after emit
content = content.replace(
  'const emit = defineEmits<{\n  \'update:modelValue\': [value: boolean]\n  close: []\n  cancel: []\n  confirm: []\n  opened: []\n  closed: []\n}>()',
  'const emit = defineEmits<{\n  \'update:modelValue\': [value: boolean]\n  close: []\n  cancel: []\n  confirm: []\n  opened: []\n  closed: []\n}>()\n\nconst slots = useSlots()'
)

// Replace $slots with slots
content = content.replace(/\$slots\./g, 'slots.')

// Replace $t references with static text
content = content.replace(/\{\{ \$t\?\.\([^)]+\) \|\| ([^}]+) \}\}/g, '{{ $2 }}')

// Fix cleanupFocusTrap assignment type
content = content.replace(
  'cleanupFocusTrap.value = trapFocusInContainer(modalRef.value)',
  'cleanupFocusTrap.value = trapFocusInContainer(modalRef.value) || null'
)

fs.writeFileSync(modalPath, content)
console.log('Fixed AccessibleModal.vue')
