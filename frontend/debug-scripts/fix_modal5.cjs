const fs = require('fs')

let content = fs.readFileSync('src/components/ui/AccessibleModal.vue', 'utf8')

// Fix help text again
content = content.replace(
  'Skip to close button\n                  </div>\n                  <div\n                    v-if="showConfirm"\n                    :id="`${titleId}-confirm-help`"\n                  >\n                    Skip to close button',
  'Close this dialog without saving changes\n                  </div>\n                  <div\n                    v-if="showConfirm"\n                    :id="`${titleId}-confirm-help`"\n                  >\n                    Confirm and apply changes'
)

// Add slots declaration after emit
if (!content.includes('const slots = useSlots()')) {
  content = content.replace(
    'const emit = defineEmits<{\n  \'update:modelValue\': [value: boolean]\n  close: []\n  cancel: []\n  confirm: []\n  opened: []\n  closed: []\n}>()\n\nconst {',
    'const emit = defineEmits<{\n  \'update:modelValue\': [value: boolean]\n  close: []\n  cancel: []\n  confirm: []\n  opened: []\n  closed: []\n}>()\n\nconst slots = useSlots()\n\nconst {'
  )
}

fs.writeFileSync('src/components/ui/AccessibleModal.vue', content)
console.log('Fixed slots declaration and help text')
