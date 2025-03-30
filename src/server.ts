import { buildApp } from './app'; // Use .js extension
import { config } from './config'; // Use .js extension
import { FastifyInstance } from 'fastify';

// --- Logger Configuration ---
// Define logger settings based on environment
const loggerConfig = {
    development: {
        // Use pino-pretty for human-readable logs in development
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z', // Format timestamp
                ignore: 'pid,hostname', // Fields to hide
                colorize: true, // Enable colors
            },
        },
        level: 'debug', // Log debug messages and above in dev
    },
    production: {
        level: 'info', // Log info, warn, error, fatal in production
        // In production, you might want to log JSON and send it to a log aggregation service
        // formatters: { level: (label) => ({ level: label }) }, // Standard JSON format
    },
    test: {
        // Silence logs during tests or use a minimal level
        transport: { target: 'pino-pretty' }, // Pretty for test output if needed
        level: 'warn',
    },
};


// --- Graceful Shutdown Handler ---
// Sets up listeners for termination signals to shut down the server gracefully.
const setupGracefulShutdown = (app: FastifyInstance) => {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    let shuttingDown = false;

    const shutdown = async (signal: NodeJS.Signals) => {
        if (shuttingDown) return; // Prevent multiple shutdowns
        shuttingDown = true;

        app.log.warn(`Received ${signal}, starting graceful shutdown...`);

        try {
            // Ask Fastify to close listeners and run 'onClose' hooks
            await app.close();
            app.log.info('✅ Server closed gracefully.');
            process.exit(0); // Exit successfully
        } catch (err) {
            app.log.error({ err }, '❌ Error during graceful shutdown.');
            process.exit(1); // Exit with error code
        }
    };

    signals.forEach(signal => {
        process.on(signal, () => shutdown(signal));
    });

    // Optional: Catch unhandled promise rejections and uncaught exceptions
    // process.on('uncaughtException', (err) => {
    //     app.log.fatal({ err }, '💥 Uncaught Exception');
    //     // Consider attempting graceful shutdown here too, but it might be risky
    //     shutdown('uncaughtException').catch(() => process.exit(1));
    // });
    // process.on('unhandledRejection', (reason, promise) => {
    //     app.log.fatal({ reason, promise }, '💥 Unhandled Rejection');
    //     shutdown('unhandledRejection').catch(() => process.exit(1));
    // });
};


// --- Server Start Function ---
// Builds the Fastify app and starts listening for connections.
async function startServer() {
  let app: FastifyInstance | undefined;

  try {
    // Determine logger options based on the current environment
    const loggerOptions = loggerConfig[config.env] ?? loggerConfig.development;

    // Build the Fastify application instance
    app = await buildApp({
      logger: loggerOptions,
      // trustProxy: true, // Enable if behind a proxy (like Nginx, ELB, Heroku) to trust X-Forwarded-* headers
      // disableRequestLogging: true, // Disable Fastify's default request logging if using custom hooks
    });

    // Start listening on the configured port and host
    // '0.0.0.0' makes it listen on all available network interfaces (important for Docker/containers)
    await app.listen({ port: config.port, host: '0.0.0.0' });

    // Log is available *after* app.listen() completes if logger is enabled
    // A more reliable place is the 'onReady' hook in app.ts

    // Setup graceful shutdown *after* the server has successfully started
    setupGracefulShutdown(app);

  } catch (err) {
    // Log any errors that occur during startup
    if (app) {
      app.log.error({ err }, '❌ Server failed to start');
    } else {
      // Logger might not be initialized if buildApp failed early
      console.error('❌ Server failed to start:', err);
    }
    process.exit(1); // Exit with error code if startup fails
  }
}

// --- Run the Server ---
startServer();