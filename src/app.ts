// File: src/app.ts
import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { config } from './config'; // Use .js extension

// Import Plugins (Infrastructure Layer)
import sensiblePlugin from './infrastructure/web/plugins/sensible';
import supabasePlugin from './infrastructure/web/plugins/supabase';
import swaggerPlugin from './infrastructure/web/plugins/swagger';

// Import Route Handlers (Infrastructure Layer)
import userRoutes from './infrastructure/web/routes/user';


// Main application builder function
export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {

  // Initialize Fastify instance with options (including logger passed from server.ts)
  const app = Fastify(opts);

  // --- Register Core Plugins ---
  // Order can matter, sensible is good to have early for error handling
  await app.register(sensiblePlugin);
  // Register Supabase plugin to make `app.supabase` available
  await app.register(supabasePlugin);
  // Register Swagger *after* sensible if referencing its error schemas ($ref)
  // and generally after other plugins routes might depend on (like supabase)
  if (config.env !== 'production') { // Often disable Swagger UI in production
    await app.register(swaggerPlugin);
  } else {
      app.log.info('Swagger UI is disabled in production environment.');
  }


  // --- Register Application Routes ---
  // Group routes under a prefix (e.g., /api/v1)
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  // Register other resource routes here...
  // await app.register(productRoutes, { prefix: '/api/v1/products' });


  // --- Simple Health Check Endpoint ---
  app.get('/health',
    {
        // Add schema for Swagger documentation
        schema: {
            summary: 'Health Check',
            description: 'Checks if the service is running.',
            tags: ['Health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                         status: { type: 'string', example: 'ok' },
                         timestamp: { type: 'string', format: 'date-time' }
                    },
                },
                 503: { // Example: Service Unavailable if DB connection fails
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                 }
            },
        },
        logLevel: 'warn', // Optionally reduce logging for frequent health checks
    },
    async (request, reply) => {
        try {
            // Optional: Add a quick check to ensure essential services (like DB) are reachable
            // Example: Check Supabase connection (doesn't actually authenticate, just checks reachability)
            // await app.supabase.rpc('is_current_user_in_role', { role_name: 'any_role' }); // Or a simpler check
             const { data, error } = await app.supabase.from('users').select('id', { count: 'exact', head: true }).limit(1); // Quick check
             if (error) throw new Error(`Supabase reachability check failed: ${error.message}`);

            reply.code(200).send({ status: 'ok', timestamp: new Date().toISOString() });
        } catch (err: any) {
            request.log.error({ err }, "Health check failed");
            reply.code(503).send({ status: 'error', message: 'Service unavailable', error: err.message, timestamp: new Date().toISOString() });
        }
    });


  // --- Request/Response Logging Hooks (Optional) ---
  // Log basic info about incoming requests
  app.addHook('onRequest', async (request, reply) => {
    // Log less for health checks to reduce noise
    if (request.url !== '/health') {
        request.log.info({ req: { method: request.method, url: request.url, id: request.id } }, 'Incoming request');
    }
  });

  // Log info about the response
  app.addHook('onResponse', async (request, reply) => {
     if (request.url !== '/health') {
        request.log.info({ res: { statusCode: reply.statusCode }, reqId: request.id }, 'Request completed');
     }
  });

  // --- Ready Hook ---
  // Useful for signaling when the server is fully ready to accept connections
  // (after all plugins and routes are loaded)
  app.addHook('onReady', async () => {
     app.log.info('Server is ready and accepting connections.');
     // You can print available routes here if desired (useful for debugging)
     // console.log(app.printRoutes());
  });

  return app;
}