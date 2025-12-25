// ============================================
// Environment Variable Validation
// ============================================
// Validates and types environment variables at build/runtime.
// Fails fast with clear error messages if required vars are missing.

import { z } from 'zod';

// ============================================
// Schema Definition
// ============================================

/**
 * Server-side environment variables
 * These are only available on the server
 */
const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Redis (optional but recommended)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // QStash (optional)
  QSTASH_URL: z.string().url().optional(),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // PayPal (optional)
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),

  // Coinbase (optional)
  COINBASE_COMMERCE_API_KEY: z.string().optional(),
  COINBASE_WEBHOOK_SECRET: z.string().optional(),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),

  // Admin
  ADMIN_KEY: z.string().min(16, 'ADMIN_KEY should be at least 16 characters').optional(),

  // Storage (optional)
  STORAGE_URL: z.string().url().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Client-side environment variables
 * These are exposed to the browser (NEXT_PUBLIC_ prefix)
 */
const clientSchema = z.object({
  // API URL for hardware control
  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // Stripe publishable key
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),

  // API base URL for mobile app
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
});

// ============================================
// Validation
// ============================================

/**
 * Validate server environment variables
 */
function validateServerEnv() {
  // Skip validation during build if DATABASE_URL is not set
  // (Vercel sets it at runtime)
  if (typeof window !== 'undefined') {
    return {} as z.infer<typeof serverSchema>;
  }

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, messages]) => `  ${key}: ${messages?.join(', ')}`)
      .join('\n');

    console.error(
      '\n❌ Invalid environment variables:\n' +
        errorMessages +
        '\n\nPlease check your .env file or environment configuration.\n'
    );

    // In development, log but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Continuing with missing env vars in development mode');
      return process.env as unknown as z.infer<typeof serverSchema>;
    }

    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

/**
 * Validate client environment variables
 */
function validateClientEnv() {
  const clientEnv = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  };

  const parsed = clientSchema.safeParse(clientEnv);

  if (!parsed.success) {
    console.warn('⚠️ Some client environment variables are missing or invalid');
    return clientEnv as z.infer<typeof clientSchema>;
  }

  return parsed.data;
}

// ============================================
// Exports
// ============================================

/**
 * Validated server environment variables
 * Only use on the server side
 */
export const serverEnv = validateServerEnv();

/**
 * Validated client environment variables
 * Safe to use on client side
 */
export const clientEnv = validateClientEnv();

/**
 * Combined environment (use serverEnv or clientEnv directly when possible)
 */
export const env = {
  ...serverEnv,
  ...clientEnv,
};

// ============================================
// Type Exports
// ============================================

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

// ============================================
// Utility Functions
// ============================================

/**
 * Check if a feature is enabled based on env vars
 */
export const features = {
  stripe: !!serverEnv.STRIPE_SECRET_KEY,
  paypal: !!serverEnv.PAYPAL_CLIENT_ID,
  coinbase: !!serverEnv.COINBASE_COMMERCE_API_KEY,
  redis: !!serverEnv.UPSTASH_REDIS_REST_URL,
  qstash: !!serverEnv.QSTASH_TOKEN,
  google: !!serverEnv.GOOGLE_CLIENT_ID,
  github: !!serverEnv.GITHUB_ID,
  liveMode: !!clientEnv.NEXT_PUBLIC_API_URL,
};

/**
 * Get API base URL for fetch calls
 * Uses NEXT_PUBLIC_API_BASE_URL for mobile, or relative path for web
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use NEXTAUTH_URL
    return serverEnv.NEXTAUTH_URL || '';
  }
  // Client-side: use configured base URL or relative path
  return clientEnv.NEXT_PUBLIC_API_BASE_URL || '';
}
