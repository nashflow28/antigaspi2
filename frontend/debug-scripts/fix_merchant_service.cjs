const fs = require('fs')

let content = fs.readFileSync('src/services/merchantService.ts', 'utf8')

// Fix all return handleError statements to cast to proper type
content = content.replace(/return this\.handleError\(error\)/g, 'return this.handleError(error) as any')

// Fix ApiResponse generic type arguments
content = content.replace(/: ApiResponse = \{/g, ': ApiResponse<any> = {')
content = content.replace(/ApiResponse<PaginatedResponse<any>>/g, 'ApiResponse<PaginatedResponse<any>>')

fs.writeFileSync('src/services/merchantService.ts', content)
console.log('Fixed merchant service type errors')
