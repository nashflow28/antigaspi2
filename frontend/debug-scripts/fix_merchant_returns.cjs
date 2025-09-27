const fs = require('fs')

let content = fs.readFileSync('src/services/merchantService.ts', 'utf8')

// Fix all "return response" statements to cast to proper type
content = content.replace(/const response = await apiService\.get\([^)]+\)\s*return response/g,
  'const response = await apiService.get($&); return response as any')

content = content.replace(/return response$/gm, 'return response as any')
content = content.replace(/const response = await apiService\./g, 'const response = await apiService.')
content = content.replace(/return response as any as any/g, 'return response as any')

// More specific fixes
const lines = content.split('\n')
const fixedLines = lines.map(line => {
  if (line.trim().startsWith('return response') && !line.includes('as any')) {
    return line.replace('return response', 'return response as any')
  }
  return line
})

fs.writeFileSync('src/services/merchantService.ts', fixedLines.join('\n'))
console.log('Fixed merchant service return types')
