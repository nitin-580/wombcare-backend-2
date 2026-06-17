import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  
  // Database
  SUPABASE_URL: z.string().url().default('https://placeholder-project.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('placeholder-service-role-key'),
  
  // Email
  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.string().default('2525').transform(Number),
  SMTP_USER: z.string().default('placeholder-smtp-user'),
  SMTP_PASS: z.string().default('placeholder-smtp-pass'),
  EMAIL_FROM: z.string().email().default('hello@earlyaccess.com'),
  
  // Admin Security
  ADMIN_API_KEY: z.string().min(16).default('placeholder-admin-api-key-must-be-long-enough-32-chars'),
  
  // JWT Security
  JWT_SECRET: z.string().min(1).default('placeholder-jwt-secret-key-for-token-signing'),
  
  // Jitsi JaaS Integration
  JAAS_APP_ID: z.string().default('vpaas-magic-cookie-fdbdcbb19a264008a307ac74211da6c7'),
  JAAS_KID: z.string().default('vpaas-magic-cookie-fdbdcbb19a264008a307ac74211da6c7/YOUR_KEY_ID'),
  JAAS_PRIVATE_KEY: z.string().min(1).default('placeholder-jaas-private-key'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
});


const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
