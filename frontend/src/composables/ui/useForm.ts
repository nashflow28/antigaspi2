import { ref, reactive, computed } from 'vue'

export interface FormField {
  value: any
  error: string | null
  touched: boolean
  validator?: (value: any) => string | null
}

export interface UseFormOptions {
  initialValues?: Record<string, any>
  validators?: Record<string, (value: any) => string | null>
  onSubmit?: (values: Record<string, any>) => Promise<void> | void
}

export function useForm(options: UseFormOptions = {}) {
  const {
    initialValues = {},
    validators = {},
    onSubmit
  } = options

  const fields = reactive<Record<string, FormField>>({})
  const loading = ref(false)
  const globalError = ref<string | null>(null)

  // Initialize fields
  Object.keys(initialValues).forEach(key => {
    fields[key] = {
      value: initialValues[key],
      error: null,
      touched: false,
      validator: validators[key]
    }
  })

  const addField = (name: string, initialValue: any = '', validator?: (value: any) => string | null) => {
    fields[name] = {
      value: initialValue,
      error: null,
      touched: false,
      validator
    }
  }

  const setValue = (name: string, value: any) => {
    if (fields[name]) {
      fields[name].value = value
      fields[name].touched = true
      validateField(name)
    }
  }

  const setError = (name: string, error: string | null) => {
    if (fields[name]) {
      fields[name].error = error
    }
  }

  const validateField = (name: string) => {
    const field = fields[name]
    if (!field || !field.validator) return true

    const error = field.validator(field.value)
    field.error = error
    return !error
  }

  const validateAll = () => {
    let isValid = true
    Object.keys(fields).forEach(name => {
      if (!validateField(name)) {
        isValid = false
      }
    })
    return isValid
  }

  const reset = () => {
    Object.keys(fields).forEach(name => {
      fields[name].value = initialValues[name] || ''
      fields[name].error = null
      fields[name].touched = false
    })
    globalError.value = null
  }

  const submit = async () => {
    if (!validateAll() || !onSubmit) return

    loading.value = true
    globalError.value = null

    try {
      const values = Object.keys(fields).reduce((acc, key) => {
        acc[key] = fields[key].value
        return acc
      }, {} as Record<string, any>)

      await onSubmit(values)
    } catch (error) {
      globalError.value = error instanceof Error ? error.message : 'Une erreur est survenue'
    } finally {
      loading.value = false
    }
  }

  const values = computed(() => {
    return Object.keys(fields).reduce((acc, key) => {
      acc[key] = fields[key].value
      return acc
    }, {} as Record<string, any>)
  })

  const errors = computed(() => {
    return Object.keys(fields).reduce((acc, key) => {
      if (fields[key].error) {
        acc[key] = fields[key].error
      }
      return acc
    }, {} as Record<string, string>)
  })

  const isValid = computed(() => {
    return Object.values(fields).every(field => !field.error)
  })

  const isDirty = computed(() => {
    return Object.values(fields).some(field => field.touched)
  })

  return {
    fields,
    values,
    errors,
    loading,
    globalError,
    isValid,
    isDirty,
    addField,
    setValue,
    setError,
    validateField,
    validateAll,
    reset,
    submit
  }
}
