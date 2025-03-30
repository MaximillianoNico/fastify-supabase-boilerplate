// File: src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'node:path'; // Keep path import

// REMOVE these lines related to import.meta.url and fileURLToPath
// import { fileURLToPath } from 'node:url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// We can now directly use the __dirname global provided by CommonJS


// Load .env file based on NODE_ENV or default to .env
// Use the __dirname global directly to resolve path relative to this config file
const envPath = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, '..', '..', '.env.production') // Resolve from src/config up two levels
  : path.resolve(__dirname, '..', '..', '.env'); // Resolve from src/config up two levels

const result = dotenv.config({ path: envPath });

if (result.error) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(`Warning: Could not load .env file from ${envPath}`);
    }
}


const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3000),
  SUPABASE_URL: z.string().url({ message: "SUPABASE_URL must be a valid URL"}),
  SUPABASE_ANON_KEY: z.string().min(1, { message: "SUPABASE_ANON_KEY is required" }),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors,
  );
   throw new Error('Invalid environment variables');
}

export const env = parsedEnv.data;

// Logging remains the same
console.log('🔧 Environment loaded:');
console.log(`   NODE_ENV: ${env.NODE_ENV}`);
console.log(`   PORT: ${env.PORT}`);
console.log(`   SUPABASE_URL: ${env.SUPABASE_URL ? 'Loaded' : 'Missing!'}`);
console.log(`   SUPABASE_ANON_KEY: ${env.SUPABASE_ANON_KEY ? 'Loaded (key hidden)' : 'Missing!'}`);