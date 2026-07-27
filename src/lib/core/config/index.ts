import { isEnvConfigured } from "@/lib/utils";

// ============================================================
// Centralized configuration
// All env vars are read ONCE through this module.
// No engine should read process.env directly.
// ============================================================

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "Lavisk",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    nodeEnv: process.env.NODE_ENV ?? "development",
    isDev: process.env.NODE_ENV !== "production",
    isProd: process.env.NODE_ENV === "production",
  },

  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DATABASE_DIRECT_URL,
    isConfigured: isEnvConfigured(process.env.DATABASE_URL),
  },

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    isConfigured: isEnvConfigured(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },

  payment: {
    provider: process.env.PAYMENT_PROVIDER ?? "razorpay",
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
      isConfigured: isEnvConfigured(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET),
    },
  },

  email: {
    provider: process.env.EMAIL_PROVIDER ?? "resend",
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
      isConfigured: isEnvConfigured(process.env.RESEND_API_KEY),
    },
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL,
  },

  security: {
    adminPassword: process.env.ADMIN_PASSWORD,
    adminEmail: process.env.ADMIN_EMAIL,
    jwtSecret: process.env.JWT_SECRET,
    csrfSecret: process.env.CSRF_SECRET,
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER ?? "local",
    cloudinary: {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      isConfigured: isEnvConfigured(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
    },
  },

  features: {
    enableCheckout: process.env.NEXT_PUBLIC_ENABLE_CHECKOUT !== "false",
    enableReviews: process.env.NEXT_PUBLIC_ENABLE_REVIEWS !== "false",
    enableBlog: process.env.NEXT_PUBLIC_ENABLE_BLOG !== "false",
  },

  get(key: string): string | undefined {
    return process.env[key];
  },
} as const;

export type AppConfig = typeof config;