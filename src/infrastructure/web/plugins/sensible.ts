// File: src/infrastructure/web/plugins/sensible.ts
import fp from 'fastify-plugin';
import sensible, { SensibleOptions } from '@fastify/sensible';
import { FastifyInstance } from 'fastify';

/**
 * This plugin adds essential utilities like standardized HTTP errors,
 * assertions (`request.assert`), and `reply.vary` to Fastify.
 * It's highly recommended for robust error handling.
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp(async function (fastify: FastifyInstance, opts: SensibleOptions) {
    await fastify.register(sensible, {
        // You can customize the default error handler if needed
        // errorHandler: (error, request, reply) => { ... }
        // Defaults are generally good.
    });
    fastify.log.info('🔌 Registered @fastify/sensible plugin.');

    // Add common HTTP error schemas for Swagger documentation
    // This assumes you haven't already defined schemas with these $id values
    try {
        fastify.addSchema({
            $id: 'httpErrorNotFound',
            type: 'object',
            properties: {
                statusCode: { type: 'number', const: 404 },
                error: { type: 'string', const: 'Not Found' },
                message: { type: 'string' }
            },
            required: ['statusCode', 'error', 'message']
        });
         fastify.addSchema({
            $id: 'httpErrorBadRequest',
            type: 'object',
            properties: {
                statusCode: { type: 'number', const: 400 },
                error: { type: 'string', const: 'Bad Request' },
                message: { type: 'string' }
            },
            required: ['statusCode', 'error', 'message']
        });
        fastify.addSchema({
            $id: 'httpErrorConflict',
            type: 'object',
            properties: {
                statusCode: { type: 'number', const: 409 },
                error: { type: 'string', const: 'Conflict' },
                message: { type: 'string' }
            },
            required: ['statusCode', 'error', 'message']
        });
        fastify.addSchema({
            $id: 'httpErrorInternalServerError',
            type: 'object',
            properties: {
                statusCode: { type: 'number', const: 500 },
                error: { type: 'string', const: 'Internal Server Error' },
                message: { type: 'string' }
            },
             required: ['statusCode', 'error', 'message']
        });
        // Add more common error schemas (401 Unauthorized, 403 Forbidden, etc.) as needed
        fastify.log.info('📝 Added common HTTP error schemas for Swagger.');
    } catch (e: any) {
        // Handle cases where schemas might already be added (e.g., during hot reload)
        if (e.code !== 'FST_ERR_SCH_ALREADY_PRESENT') {
            fastify.log.error({ err: e }, '❌ Failed to add common error schemas');
            throw e; // Rethrow if it's not an "already present" error
        } else {
            fastify.log.warn('⚠️ Common HTTP error schemas already present, skipping addition.');
        }
    }


}, {
    name: 'sensible', // Plugin name
    // Ensure this plugin runs before routes that use its features (like error schemas)
    // dependencies: []
});

// Augment FastifyReply interface to include sensible methods for better typing
declare module 'fastify' {
    interface FastifyReply {
        // These are added by @fastify/sensible
        notFound(message?: string): FastifyReply;
        badRequest(message?: string): FastifyReply;
        internalServerError(message?: string): FastifyReply;
        conflict(message?: string): FastifyReply;
        // Add others like unauthorized(), forbidden(), etc. if needed
    }
}