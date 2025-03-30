// File: src/infrastructure/database/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/config'; // Using path alias

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      console.error("❌ Supabase URL or Anon Key is missing in configuration.");
      throw new Error('Supabase URL or Anon Key is missing in configuration.');
    }
    try {
        supabaseInstance = createClient(config.supabase.url, config.supabase.anonKey, {
        // Recommended options for server-side usage:
        auth: {
            autoRefreshToken: false, // No need to auto-refresh on the server
            persistSession: false, // Don't persist sessions on the server
            detectSessionInUrl: false, // Not relevant for server-side
        },
        // Add global fetch options if needed (e.g., custom agent)
        // global: { fetch: customFetchImplementation }
        });
        console.log('🔑 Supabase client initialized successfully.');
    } catch (error) {
        console.error("❌ Failed to create Supabase client:", error);
        throw error; // Re-throw the error to be caught during app startup
    }
  }
  return supabaseInstance;
}

// Export type for convenience elsewhere
export type { SupabaseClient };
