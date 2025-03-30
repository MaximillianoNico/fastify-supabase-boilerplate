import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI, { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { config } from '@/config'; // Use path alias

/**
 * This plugin sets up Swagger (OpenAPI) documentation generation
 * using `@fastify/swagger` and serves the Swagger UI
 * using `@fastify/swagger-ui`.
 */
async function swaggerPlugin(
  fastify: FastifyInstance,
  options: FastifyPluginOptions, // Options passed during registration (if any)
) {
  // --- Swagger Core Registration ---
  // Registers the /documentation/json and /documentation/yaml endpoints
  await fastify.register(fastifySwagger, {
    mode: 'dynamic', // Or 'static' if you generate swagger.json at build time
    swagger: config.swagger.swagger, // Pass the core swagger definition from config
  });

  const swaggerUiOptions: FastifySwaggerUiOptions = {
    routePrefix: config.swagger.routePrefix, // URL prefix for the UI (e.g., /docs)
    uiConfig: config.swagger.uiConfig,       // UI display options from config
    // Add other relevant options from your config that belong at this root level, if any
    // Example: uncomment and add to config/index.ts if needed
    // staticCSP: config.swagger.staticCSP,
    // transformStaticCSP: config.swagger.transformStaticCSP,
    // uiHooks: config.swagger.uiHooks
  };

  // Register Swagger UI with the explicitly typed options
  await fastify.register(fastifySwaggerUI, swaggerUiOptions);

  fastify.log.info(`🔌 Registered Swagger & SwaggerUI plugins. Docs available at ${config.swagger.routePrefix}`);
}

export default fp(swaggerPlugin, {
  name: 'swagger',
  // Dependencies: Ensure sensible runs first if using its error schemas ($ref)
  dependencies: ['sensible']
});