import { env } from './env';

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
  },
  swagger: {
    routePrefix: '/docs',
    exposeRoute: true,
    swagger: {
      info: {
        title: 'Fastify Supabase API Boilerplate',
        description: 'API documentation for the service',
        version: '1.0.0',
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here',
      },
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Users', description: 'User related end-points' },
        { name: 'Health', description: 'Health check endpoints' }
      ],
    },
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    } as const,
  },
};
