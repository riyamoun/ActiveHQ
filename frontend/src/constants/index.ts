/**
 * Application-wide constants
 */

// Authentication
export const AUTH_CONSTANTS = {
  DEMO_CREDENTIALS: {
    email: 'owner@fitzonegym.com',
    password: 'Owner@123',
  },
  PASSWORD_MIN_LENGTH: 8,
  TOKEN_STORAGE_KEY: 'activehq-auth',
} as const

// Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\d{10}$/,
  PHONE_CLEANUP_REGEX: /\D/g,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MIN_PHONE_LENGTH: 8,
  MAX_PHONE_LENGTH: 15,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number (10 digits)',
  PASSWORD_TOO_SHORT: `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_MISSING_NUMBER: 'Password must contain at least one number',
  PASSWORD_MISSING_LETTER: 'Password must contain at least one letter',
  PASSWORDS_NOT_MATCH: 'Passwords do not match',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
  TRY_AGAIN: 'Please try again or contact support',
} as const

// API
export const API_CONSTANTS = {
  BASE_URL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1',
  TIMEOUT: 30000,
} as const

// UI
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
  DESKTOP: 1280,
} as const

export default {
  AUTH_CONSTANTS,
  VALIDATION,
  ERROR_MESSAGES,
  API_CONSTANTS,
  BREAKPOINTS,
}
