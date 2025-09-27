const fs = require('fs')

let content = fs.readFileSync('src/components/ui/AccessibleModal.vue', 'utf8')

// Check current position and add slots declaration if missing
if (!content.includes('const slots = useSlots()')) {
  content = content.replace(
    'const emit = defineEmits<{\n  \'update:modelValue\': [value: boolean]\n  close: []\n  cancel: []\n  confirm: []\n  opened: []\n  closed: []\n}>()',
    'const emit = defineEmits<{\n  \'update:modelValue\': [value: boolean]\n  close: []\n  cancel: []\n  confirm: []\n  opened: []\n  closed: []\n}>()\n\nconst slots = useSlots()'
  )
}

// If slots is not properly positioned, fix it
if (content.includes('const slots = useSlots()\n\nconst {')) {
  // Good position
} else {
  // Move it to the right place
  content = content.replace(/const slots = useSlots\(\)[^\n]*\n?/g, '')
  content = content.replace(
    'const emit = defineEmits<{\n  \'update:modelValue\': [value: boolean]\n  close: []\n  cancel: []\n  confirm: []\n  opened: []\n  closed: []\n}>()',
    'const emit = defineEmits<{\n  \'update:modelValue\': [value: boolean]\n  close: []\n  cancel: []\n  confirm: []\n  opened: []\n  closed: []\n}>()\n\nconst slots = useSlots()'
  )
}

fs.writeFileSync('src/components/ui/AccessibleModal.vue', content)
console.log('Fixed slots positioning in AccessibleModal.vue')
