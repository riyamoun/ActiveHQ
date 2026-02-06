/**
 * Form validation utilities
 */

import { VALIDATION, ERROR_MESSAGES } from '@/constants'

export interface ValidationError {
  [key: string]: string
}

export const validators = {
  /**
   * Validate email format
   */
  email: (value: string | undefined): string | null => {
    if (!value?.trim()) return ERROR_MESSAGES.REQUIRED_FIELD
    if (!VALIDATION.EMAIL_REGEX.test(value)) return ERROR_MESSAGES.INVALID_EMAIL
    return null
  },

  /**
   * Validate phone number
   */
  phone: (value: string | undefined): string | null => {
    if (!value?.trim()) return ERROR_MESSAGES.REQUIRED_FIELD
    const cleaned = value.replace(VALIDATION.PHONE_CLEANUP_REGEX, '')
    if (!VALIDATION.PHONE_REGEX.test(cleaned)) return ERROR_MESSAGES.INVALID_PHONE
    return null
  },

  /**
   * Validate password strength
   */
  password: (value: string | undefined): string | null => {
    if (!value) return ERROR_MESSAGES.REQUIRED_FIELD
    if (value.length < 8) return ERROR_MESSAGES.PASSWORD_TOO_SHORT
    if (!/\d/.test(value)) return ERROR_MESSAGES.PASSWORD_MISSING_NUMBER
    if (!/[a-zA-Z]/.test(value)) return ERROR_MESSAGES.PASSWORD_MISSING_LETTER
    return null
  },

  /**
   * Validate passwords match
   */
  passwordMatch: (password: string, confirm: string): string | null => {
    if (password !== confirm) return ERROR_MESSAGES.PASSWORDS_NOT_MATCH
    return null
  },

  /**
   * Validate required text field
   */
  required: (value: string | undefined, fieldName: string): string | null => {
    if (!value?.trim()) return `${fieldName} is required`
    return null
  },

  /**
   * Validate text field with min length
   */
  minLength: (value: string | undefined, min: number, fieldName: string): string | null => {
    if (!value?.trim()) return `${fieldName} is required`
    if (value.length < min) return `${fieldName} must be at least ${min} characters`
    return null
  },

  /**
   * Validate number is positive
   */
  positiveNumber: (value: number, fieldName: string): string | null => {
    if (value <= 0) return `${fieldName} must be greater than 0`
    return null
  },
}

/**
 * Validate entire form
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => string | null>
): ValidationError => {
  const errors: ValidationError = {}

  Object.entries(rules).forEach(([field, validator]) => {
    const error = validator(data[field])
    if (error) {
      errors[field] = error
    }
  })

  return errors
}

export default {
  validators,
  validateForm,
}
