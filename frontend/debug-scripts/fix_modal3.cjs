const fs = require('fs')

let content = fs.readFileSync('src/components/ui/AccessibleModal.vue', 'utf8')

// Fix help text correctly
content = content.replace(
  '                    Skip to close button\n                  </div>\n                  <div\n                    v-if="showConfirm"\n                    :id="`${titleId}-confirm-help`"\n                  >\n                    Skip to close button',
  '                    Close this dialog without saving changes\n                  </div>\n                  <div\n                    v-if="showConfirm"\n                    :id="`${titleId}-confirm-help`"\n                  >\n                    Confirm and apply changes'
)

fs.writeFileSync('src/components/ui/AccessibleModal.vue', content)
console.log('Fixed help text in AccessibleModal.vue')
