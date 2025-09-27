const fs = require('fs')

let content = fs.readFileSync('src/services/merchantService.ts', 'utf8')

// Fix malformed lines first
content = content.replace(/const response = await apiService\.get\(const response = await apiService\.get\([^)]+\)\s*return response\); return response as any/g,
  (match) => {
    const methodCall = match.match(/apiService\.get\(([^)]+)\)/g)[1]
    return `const response = await ${methodCall}\n      return response as any`
  })

// Fix specific malformed patterns
content = content.replace(/const response = await apiService\.get\(const response = await apiService\.get\(`([^`]+)`\)\s*return response\); return response as any/g,
  'const response = await apiService.get(`$1`)\n      return response as any')

// Manual fixes for specific lines that are broken
const lines = content.split('\n')
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  if (line.includes('const response = await apiService.get(const response = await apiService.get(')) {
    // Extract the actual API call
    const match = line.match(/apiService\.get\(`([^`]+)`\)/g)
    if (match && match.length > 0) {
      const apiCall = match[match.length - 1] // Take the last match
      lines[i] = `      const response = await ${apiCall}`
      if (i + 1 < lines.length && !lines[i + 1].includes('return response')) {
        lines.splice(i + 1, 0, '      return response as any')
      }
    }
  }
}

fs.writeFileSync('src/services/merchantService.ts', lines.join('\n'))
console.log('Fixed malformed merchant service lines')
