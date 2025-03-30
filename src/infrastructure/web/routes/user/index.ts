// File: src/infrastructure/web/routes/user/index.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

// Application Layer
import { UserService } from '@/application/services/UserService';
// Infrastructure Layer (Database Implementation)
import { SupabaseUserRepository } from '@/infrastructure/database/SupabaseUserRepository';
// Infrastructure Layer (Web/Handler)
import { UserHandler } from './user.handler';
// Infrastructure Layer (Web/Schema) - Import the JSON schema conversions
import { jsonSchema } from './user.schema';

/**
 * Encapsulates routes related to the User resource.
 * Uses Fastify plugin structure for modularity.
 */
export default async function userRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions, // Options passed from `register` (e.g., prefix)
) {
  // --- Dependency Injection Setup (Manual) ---
  // In a real app, consider a DI container (e.g., Awilix, Tsyringe, InversifyJS)
  // or Fastify's built-in decorator capabilities for managing dependencies.

  // 1. Get the Supabase client instance decorated onto Fastify by the plugin
  const supabaseClient = fastify.supabase;

  // 2. Create the repository instance, injecting the Supabase client
  const userRepository = new SupabaseUserRepository(supabaseClient);

  // 3. Create the service instance, injecting the repository
  const userService = new UserService(userRepository);

  // 4. Create the handler instance, injecting the service
  const userHandler = new UserHandler(userService);
  // --- End Dependency Injection Setup ---


  // --- Route Definitions ---

  // POST /api/v1/users
  fastify.post(
    '/',
    {
      // Use a minimal, direct JSON schema - NOT from zodToJsonSchema
      schema: {
        summary: 'Create User Minimal Test',
        description: 'Testing with basic inline schema.',
        tags: ['Users'], // Keep tags simple
        body: { // Simplest possible body schema
          type: 'object',
          properties: {
            email: { type: 'string', description: 'User email address' } // Basic property
          },
          required: ['email'] // Mark it required
        },
        response: { // Simplest possible success response
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'New user ID' }, // Basic property
              email: { type: 'string', description: 'User email address' }
            },
            required: ['id', 'email']
          },
          // Include references to common errors if needed, these should be fine
          400: { $ref: 'httpErrorBadRequest' },
          409: { $ref: 'httpErrorConflict' },
          500: { $ref: 'httpErrorInternalServerError' },
        }
      } // End of minimal schema object
    },
    userHandler.createUser,
  );

  // GET /api/v1/users/:userId
  fastify.get(
      '/:userId',
      {
          schema: {
              summary: 'Get User by ID',
              description: 'Retrieves details for a specific user by their unique ID.',
              tags: ['Users'],
              
              // params: jsonSchema.userIdParams, // Schema for URL parameters
              response: {
                  200: jsonSchema.userResponse, // Success response
                  400: { $ref: 'httpErrorBadRequest' }, // Invalid UUID format
                  404: { $ref: 'httpErrorNotFound' }, // User not found
                  500: { $ref: 'httpErrorInternalServerError' }, // Server errors
              },
              // security: [{ apiKey: [] }]
          },
      },
      userHandler.getUserById,
  );

  // --- Add other user routes here ---
  // GET /
  // PUT /:userId
  // DELETE /:userId
  // ---------------------------------

  fastify.log.info(`✅ Registered User routes under prefix '${options.prefix}'`);
}