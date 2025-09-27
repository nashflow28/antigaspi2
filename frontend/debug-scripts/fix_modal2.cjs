const fs = require('fs')

let content = fs.readFileSync('src/components/ui/AccessibleModal.vue', 'utf8')

// Fix broken replacements
content = content.replace(/\{\{ \$2 \}\}/g, 'Skip to close button')

// Fix specific strings with correct content
content = content.replace(
  'class="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 bg-primary-600 text-white px-2 py-1 rounded text-sm z-10">\n              {{ $2 }}',
  'class="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 bg-primary-600 text-white px-2 py-1 rounded text-sm z-10">\n              Skip to close button'
)

// Fix help text
content = content.replace(
  '{{ $2 }}\n                  </div>\n                  <div\n                    v-if="showConfirm"\n                    :id="`${titleId}-confirm-help`"\n                  >\n                    {{ $2 }}',
  'Close this dialog without saving changes\n                  </div>\n                  <div\n                    v-if="showConfirm"\n                    :id="`${titleId}-confirm-help`"\n                  >\n                    Confirm and apply changes'
)

// Fix remaining $t reference
content = content.replace(
  '$t?.(\'accessibility.closeModal\') || \'Close dialog\'',
  '\'Close dialog\''
)

// Fix scrollable aria label
content = content.replace(
  ':aria-label="scrollable ? ($t?.(\'accessibility.scrollableContent\') || \'Scrollable content\') : undefined"',
  ':aria-label="scrollable ? \'Scrollable content\' : undefined"'
)

fs.writeFileSync('src/components/ui/AccessibleModal.vue', content)
console.log('Fixed remaining issues in AccessibleModal.vue')
