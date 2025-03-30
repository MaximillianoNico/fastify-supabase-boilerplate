# Fastify Supabase Boilerplate

A clean-architecture inspired boilerplate for building Node.js services using Fastify, Supabase (PostgreSQL), Zod, and Swagger.

**Features:**

*   **Fastify v4 (LTS):** High-performance Node.js web framework.
*   **Node.js >= 20:** Uses modern Node.js features and ES Modules (`type: "module"`).
*   **TypeScript:** Strongly typed codebase.
*   **Supabase:** Integration with Supabase for PostgreSQL database access (using `@supabase/supabase-js`).
*   **Zod:** Schema validation for request inputs and defining response shapes.
*   **Swagger UI:** Automatic API documentation generation via `@fastify/swagger` and `@fastify/swagger-ui`, integrated with Zod schemas.
*   **Clean Architecture Inspired:** Separation of concerns with distinct layers:
    *   `domain`: Core business entities.
    *   `application`: Use cases/services and repository interfaces.
    *   `infrastructure`: Framework-specific details (Fastify routes/plugins, Supabase repository implementation).
*   **Repository Pattern:** Abstracts data access logic.
*   **ESLint & Prettier:** Code linting and formatting configured.
*   **Environment Variables:** Configuration managed via `.env` files and Zod validation (`dotenv`).
*   **Graceful Shutdown:** Handles `SIGINT` and `SIGTERM` signals.
*   **Structured Logging:** Uses Fastify's built-in Pino logger with `pino-pretty` for development.
*   **Code Generation:** Script to quickly scaffold new modules (domain, application, infrastructure).

## Prerequisites

*   Node.js (v20.0.0 or higher)
*   npm or yarn
*   A Supabase project ([https://supabase.com/](https://supabase.com/))

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and add your Supabase Project URL and Anon Key:
        ```ini
        NODE_ENV=development
        PORT=3000
        SUPABASE_URL=YOUR_SUPABASE_URL
        SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
        *(Get these from your Supabase project: Settings -> API)*

4.  **Database Setup:**
    *   Ensure you have a table in your Supabase database that matches the structure expected by the `SupabaseUserRepository`. By default, it looks for a `users` table with at least `id (uuid)`, `email (text)`, and `created_at (timestamp with time zone)`. You can create one using the Supabase SQL editor:
        ```sql
        -- Example minimal users table
        CREATE TABLE public.users (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            email text UNIQUE NOT NULL,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
            -- Add other columns as needed (e.g., name, password_hash)
        );

        -- Optional: Enable Row Level Security (Recommended!)
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Define RLS policies based on your auth rules
        -- Example: Allow authenticated users to select their own profile
        -- CREATE POLICY "Allow individual user select access"
        -- ON public.users FOR SELECT
        -- USING (auth.uid() = id);
        ```

## Running the Service

*   **Development Mode (with hot-reloading):**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The server will restart automatically when you make changes in the `src` directory.

*   **Production Mode:**
    1.  Build the TypeScript code:
        ```bash
        npm run build
        # or
        yarn build
        ```
    2.  Start the server:
        ```bash
        npm start
        # or
        yarn start
        ```

## Code Generation

This boilerplate includes a code generator script to quickly scaffold the basic files for a new module following the clean architecture structure.

**Usage:**

```bash
yarn generate:module --name=<module_name>