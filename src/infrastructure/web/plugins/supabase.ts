// File: src/infrastructure/web/plugins/supabase.ts
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getSupabaseClient, SupabaseClient } from '../../database/supabaseClient'; // Use relative path within infra

// Use declaration merging to add the `supabase` decorator to the Fastify instance type
declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}

/**
 * Fastify plugin to initialize and decorate the Fastify instance
 * with a Supabase client instance.
 */
async function supabasePlugin(
  fastify: FastifyInstance,
  options: FastifyPluginOptions, // Options passed during registration (if any)
) {
  try {
    const supabase = getSupabaseClient(); // Get the singleton instance
    // Decorate the Fastify instance, making `fastify.supabase` available
    fastify.decorate('supabase', supabase);
    fastify.log.info('🔌 Registered Supabase client plugin and decorator.');

    // Optional: Add a hook to close the client on server shutdown,
    // although Supabase client doesn't strictly require explicit closing usually.
    // fastify.addHook('onClose', async (instance) => {
    //    instance.log.info('Supabase client cleanup hook called (if applicable)...');
    //    // If Supabase client had a close/disconnect method, call it here:
    //    // await instance.supabase.auth.signOut(); // Example, not usually needed server-side
    // });

  } catch (error) {
    fastify.log.error({ err: error }, '❌ Failed to initialize or decorate Supabase client');
    // Depending on severity, you might want to stop the application
    throw new Error('Supabase plugin initialization failed.');
  }
}

// Export the plugin using fastify-plugin to ensure correct encapsulation
// and prevent issues if registered multiple times.
export default fp(supabasePlugin, {
  name: 'supabase',
  // dependencies: ['config'] // Add if it depends on another plugin, e.g., a config loader
});