/**
 * Schema Validator - Lightweight validation for backend API responses
 *
 * BUG FIX #16: Validates backend data to catch malformed responses early
 * and provide meaningful error messages instead of runtime crashes.
 *
 * Usage:
 * ```typescript
 * const result = validateSchema(data, ProductSchema)
 * if (!result.valid) {
 *   console.error('Invalid product data:', result.errors)
 *   return null
 * }
 * return data as Product
 * ```
 */

export type SchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null'
  | 'date'
  | 'email'
  | 'url'

export interface SchemaField {
  type: SchemaType | SchemaType[]
  required?: boolean
  nullable?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  items?: Schema // For arrays
  properties?: Record<string, SchemaField> // For nested objects
  enum?: readonly (string | number)[]
  custom?: (value: any) => boolean | string // Custom validator, returns true or error message
}

export type Schema = Record<string, SchemaField>

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

/**
 * Validate data against a schema
 */
export function validateSchema(
  data: unknown,
  schema: Schema,
  prefix: string = ''
): ValidationResult {
  const errors: ValidationError[] = []

  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    return {
      valid: false,
      errors: [{ field: prefix || 'root', message: 'Expected object but received ' + typeof data }],
    }
  }

  const record = data as Record<string, unknown>

  // Validate each field in the schema
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName
    const value = record[fieldName]

    // Check required fields
    if (fieldSchema.required && (value === undefined || value === null)) {
      if (!fieldSchema.nullable || value === undefined) {
        errors.push({
          field: fullFieldName,
          message: `Field is required`,
          value,
        })
        continue
      }
    }

    // Skip validation if value is undefined/null and not required
    if (value === undefined || value === null) {
      continue
    }

    // Validate type
    const typeError = validateType(value, fieldSchema, fullFieldName)
    if (typeError) {
      errors.push(typeError)
      continue
    }

    // Validate string constraints
    if (typeof value === 'string') {
      const stringErrors = validateString(value, fieldSchema, fullFieldName)
      errors.push(...stringErrors)
    }

    // Validate number constraints
    if (typeof value === 'number') {
      const numberErrors = validateNumber(value, fieldSchema, fullFieldName)
      errors.push(...numberErrors)
    }

    // Validate array items
    if (Array.isArray(value) && fieldSchema.items) {
      const arrayErrors = validateArray(value, fieldSchema.items, fullFieldName)
      errors.push(...arrayErrors)
    }

    // Validate nested objects
    if (typeof value === 'object' && !Array.isArray(value) && fieldSchema.properties) {
      const nestedResult = validateSchema(value, fieldSchema.properties, fullFieldName)
      errors.push(...nestedResult.errors)
    }

    // Validate enum
    if (fieldSchema.enum && !fieldSchema.enum.includes(value as string | number)) {
      errors.push({
        field: fullFieldName,
        message: `Value must be one of: ${fieldSchema.enum.join(', ')}`,
        value,
      })
    }

    // Run custom validator
    if (fieldSchema.custom) {
      const customResult = fieldSchema.custom(value)
      if (customResult !== true) {
        errors.push({
          field: fullFieldName,
          message: typeof customResult === 'string' ? customResult : 'Custom validation failed',
          value,
        })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function validateType(
  value: unknown,
  schema: SchemaField,
  fieldName: string
): ValidationError | null {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type]
  const actualType = getActualType(value)

  // Check if any of the allowed types match
  for (const allowedType of types) {
    if (matchesType(value, allowedType)) {
      return null
    }
  }

  return {
    field: fieldName,
    message: `Expected ${types.join(' or ')} but received ${actualType}`,
    value,
  }
}

function matchesType(value: unknown, expectedType: SchemaType): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'array':
      return Array.isArray(value)
    case 'object':
      return typeof value === 'object' && !Array.isArray(value) && value !== null
    case 'null':
      return value === null
    case 'date':
      return (
        value instanceof Date ||
        (typeof value === 'string' && !isNaN(Date.parse(value)))
      )
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    case 'url':
      return typeof value === 'string' && /^https?:\/\/.+/.test(value)
    default:
      return false
  }
}

function getActualType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function validateString(
  value: string,
  schema: SchemaField,
  fieldName: string
): ValidationError[] {
  const errors: ValidationError[] = []

  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push({
      field: fieldName,
      message: `Minimum length is ${schema.minLength}`,
      value,
    })
  }

  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push({
      field: fieldName,
      message: `Maximum length is ${schema.maxLength}`,
      value,
    })
  }

  if (schema.pattern && !schema.pattern.test(value)) {
    errors.push({
      field: fieldName,
      message: `Value does not match expected pattern`,
      value,
    })
  }

  return errors
}

function validateNumber(
  value: number,
  schema: SchemaField,
  fieldName: string
): ValidationError[] {
  const errors: ValidationError[] = []

  if (schema.min !== undefined && value < schema.min) {
    errors.push({
      field: fieldName,
      message: `Minimum value is ${schema.min}`,
      value,
    })
  }

  if (schema.max !== undefined && value > schema.max) {
    errors.push({
      field: fieldName,
      message: `Maximum value is ${schema.max}`,
      value,
    })
  }

  return errors
}

function validateArray(
  value: unknown[],
  itemSchema: Schema,
  fieldName: string
): ValidationError[] {
  const errors: ValidationError[] = []

  for (let i = 0; i < value.length; i++) {
    const item = value[i]
    if (typeof item === 'object' && item !== null) {
      const itemResult = validateSchema(item, itemSchema, `${fieldName}[${i}]`)
      errors.push(...itemResult.errors)
    }
  }

  return errors
}

/**
 * Create a validator function for a specific schema
 * Returns typed data or throws if invalid
 */
export function createValidator<T>(schema: Schema) {
  return (data: unknown, options?: { throwOnError?: boolean }): T | null => {
    const result = validateSchema(data, schema)

    if (!result.valid) {
      if (options?.throwOnError) {
        const errorMessages = result.errors.map((e) => `${e.field}: ${e.message}`).join('; ')
        throw new Error(`Validation failed: ${errorMessages}`)
      }

      return null
    }

    return data as T
  }
}

/**
 * Safely extract and validate data from API response
 */
export function safeParseResponse<T>(
  response: unknown,
  schema: Schema,
  dataPath?: string
): { data: T | null; errors: ValidationError[] } {
  let data = response

  // Extract data from path (e.g., 'data.products')
  if (dataPath) {
    const paths = dataPath.split('.')
    for (const path of paths) {
      if (typeof data === 'object' && data !== null) {
        data = (data as Record<string, unknown>)[path]
      } else {
        return {
          data: null,
          errors: [{ field: dataPath, message: `Path ${dataPath} not found in response` }],
        }
      }
    }
  }

  const result = validateSchema(data, schema)

  return {
    data: result.valid ? (data as T) : null,
    errors: result.errors,
  }
}

// ============================================================================
// Pre-defined schemas for common API responses
// ============================================================================

export const ProductSchema: Schema = {
  id: { type: 'number', required: true },
  name: { type: 'string', required: true, minLength: 1 },
  description: { type: 'string', nullable: true },
  original_price: { type: 'number', required: true, min: 0 },
  discounted_price: { type: 'number', required: true, min: 0 },
  quantity_available: { type: 'number', required: true, min: 0 },
  expiration_date: { type: 'date', required: true },
  image_url: { type: ['string', 'null'], nullable: true },
  is_active: { type: 'boolean' },
  merchant_id: { type: 'number', required: true },
  category_id: { type: 'number' },
}

export const UserSchema: Schema = {
  id: { type: 'number', required: true },
  email: { type: 'email', required: true },
  first_name: { type: 'string' },
  last_name: { type: 'string' },
  role: { type: 'string', required: true, enum: ['consumer', 'merchant', 'admin'] as const },
  phone: { type: 'string', nullable: true },
  is_verified: { type: 'boolean' },
}

export const ReservationSchema: Schema = {
  id: { type: 'number', required: true },
  reservation_code: { type: 'string', required: true },
  status: {
    type: 'string',
    required: true,
    enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled', 'expired'] as const,
  },
  quantity: { type: 'number', required: true, min: 1 },
  total_amount: { type: 'number', required: true, min: 0 },
  payment_method: { type: 'string', required: false },
  product_id: { type: 'number', required: false },
  user_id: { type: 'number', required: false },
  created_at: { type: 'date', required: true },
}

export const MerchantSchema: Schema = {
  id: { type: 'number', required: true },
  business_name: { type: 'string', required: true },
  business_type: { type: 'string' },
  address: { type: 'string' },
  city: { type: 'string' },
  phone: { type: 'string' },
  latitude: { type: 'number', nullable: true },
  longitude: { type: 'number', nullable: true },
}

export const ConversationMessageSchema: Schema = {
  id: { type: 'number', required: true },
  conversation_id: { type: 'number', required: true },
  sender_id: { type: 'number', required: true },
  content: { type: 'string', required: true },
  created_at: { type: 'date', required: true },
  read_at: { type: ['date', 'null'], nullable: true },
}

export const PaginationSchema: Schema = {
  current_page: { type: 'number', required: true, min: 1 },
  per_page: { type: 'number', required: true, min: 1 },
  total: { type: 'number', required: true, min: 0 },
  last_page: { type: 'number', required: true, min: 1 },
}

// Validators for common types
export const validateProduct = createValidator<import('../types').Product>(ProductSchema)
export const validateUser = createValidator<import('../types').User>(UserSchema)
export const validateReservation = createValidator<import('../types').Reservation>(ReservationSchema)
