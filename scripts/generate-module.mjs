// File: scripts/generate-module.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..'); // Assumes script is in project_root/scripts

// --- Helper Functions ---
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelCase(str) {
    if (!str) return str;
    // Basic camel case (e.g., user-profile -> userProfile) - adjust if needed
    const parts = str.split(/[-_\s]/);
    return parts[0].toLowerCase() + parts.slice(1).map(capitalize).join('');
}

// Simple pluralization (add 's'), adjust if needed for complex cases
function pluralize(str) {
    if (!str) return str;
    if (str.endsWith('s')) return str; // Avoid double 's'
    if (str.endsWith('y') && !['a','e','i','o','u'].includes(str.charAt(str.length - 2).toLowerCase())) {
        return str.slice(0, -1) + 'ies'; // e.g. category -> categories
    }
    return str + 's';
}


// --- Main Generator Logic ---

// 1. Parse Arguments
const args = process.argv.slice(2); // Skip 'node' and script path
const nameArg = args.find(arg => arg.startsWith('--name='));

if (!nameArg) {
  console.error('❌ Error: Please provide the module name using --name=ModuleName');
  process.exit(1);
}

const moduleNameRaw = nameArg.split('=')[1];
if (!moduleNameRaw || !/^[a-zA-Z0-9-_]+$/.test(moduleNameRaw)) {
    console.error(`❌ Error: Invalid module name "${moduleNameRaw}". Use letters, numbers, hyphens, underscores.`);
    process.exit(1);
}

// 2. Derive Names (using basic conventions)
const moduleNameLower = moduleNameRaw.toLowerCase();
const moduleNameSingularLower = moduleNameLower.endsWith('s') ? moduleNameLower.slice(0, -1) : moduleNameLower; // basic singular
const moduleNamePascal = capitalize(camelCase(moduleNameSingularLower)); // e.g., Subscription
const moduleNameCamel = camelCase(moduleNameSingularLower);             // e.g., subscription
const moduleNamePluralLower = pluralize(moduleNameSingularLower);       // e.g., subscriptions

console.log(`⚙️  Generating module: ${moduleNamePascal} (plural: ${moduleNamePluralLower})`);

// 3. Define Paths
const basePath = path.join(projectRoot, 'src');
const paths = {
  domain: path.join(basePath, 'domain'),
  interface: path.join(basePath, 'application', 'interfaces'),
  service: path.join(basePath, 'application', 'services'),
  repository: path.join(basePath, 'infrastructure', 'database'),
  route: path.join(basePath, 'infrastructure', 'web', 'routes', moduleNamePluralLower),
  // Note: schemas and handlers are usually within the route folder
};

// 4. Define File Templates
const templates = {
  // --- Domain ---
  domain: `// File: src/domain/${moduleNameSingularLower}.ts
// Represents the core ${moduleNamePascal} entity

export interface ${moduleNamePascal} {
  id: string; // Or number, uuid, etc.
  // TODO: Define core properties of ${moduleNamePascal}
  // exampleProperty: string;
  created_at: Date;
  updated_at: Date;
}
`,

  // --- Application Layer ---
  interface: `// File: src/application/interfaces/I${moduleNamePascal}Repository.ts
import { ${moduleNamePascal} } from '@/domain/${moduleNameSingularLower}'; // Adjust if domain file name differs

// Define DTOs if needed (Data Transfer Objects)
// export type Create${moduleNamePascal}DTO = Omit<${moduleNamePascal}, 'id' | 'created_at' | 'updated_at'>;
// export type Update${moduleNamePascal}DTO = Partial<Create${moduleNamePascal}DTO>;

export interface I${moduleNamePascal}Repository {
  findById(id: string): Promise<${moduleNamePascal} | null>;
  // TODO: Define other data access methods needed
  // findAll(options?: any): Promise<${moduleNamePascal}[]>;
  // create(data: Create${moduleNamePascal}DTO): Promise<${moduleNamePascal}>;
  // update(id: string, data: Update${moduleNamePascal}DTO): Promise<${moduleNamePascal} | null>;
  // delete(id: string): Promise<boolean>;
}
`,

  service: `// File: src/application/services/${moduleNamePascal}Service.ts
import { ${moduleNamePascal} } from '@/domain/${moduleNameSingularLower}';
import { I${moduleNamePascal}Repository } from '../interfaces/I${moduleNamePascal}Repository';
// import { Create${moduleNamePascal}DTO, Update${moduleNamePascal}DTO } from '../interfaces/I${moduleNamePascal}Repository'; // Import DTOs if defined

// Define potential Application-level errors
class ${moduleNamePascal}ServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = '${moduleNamePascal}ServiceError';
    }
}

export class ${moduleNamePascal}Service {
  constructor(private ${moduleNameCamel}Repository: I${moduleNamePascal}Repository) {}

  async get${moduleNamePascal}ById(id: string): Promise<${moduleNamePascal} | null> {
    console.log(\`Service: Fetching ${moduleNamePascal} with ID: \${id}\`);
    // TODO: Add authorization checks or business logic if needed
    const result = await this.${moduleNameCamel}Repository.findById(id);
    if (!result) {
        // Handle not found case appropriately
        console.warn(\`${moduleNamePascal} with ID \${id} not found\`);
        return null;
    }
    return result;
  }

  // TODO: Implement other service methods corresponding to use cases
  // async create${moduleNamePascal}(data: Create${moduleNamePascal}DTO): Promise<${moduleNamePascal}> {
  //   // Add validation, business logic
  //   console.log('Service: Creating ${moduleNamePascal}');
  //   return this.${moduleNameCamel}Repository.create(data);
  // }
  //
  // async update${moduleNamePascal}(id: string, data: Update${moduleNamePascal}DTO): Promise<${moduleNamePascal} | null> {
  //    console.log(\`Service: Updating ${moduleNamePascal} with ID: \${id}\`);
  //    // Add validation, business logic
  //    return this.${moduleNameCamel}Repository.update(id, data);
  // }
  //
  // async delete${moduleNamePascal}(id: string): Promise<boolean> {
  //    console.log(\`Service: Deleting ${moduleNamePascal} with ID: \${id}\`);
  //    return this.${moduleNameCamel}Repository.delete(id);
  // }
}
`,

  // --- Infrastructure Layer ---
  repository: `// File: src/infrastructure/database/Supabase${moduleNamePascal}Repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { I${moduleNamePascal}Repository } from '@/application/interfaces/I${moduleNamePascal}Repository';
import { ${moduleNamePascal} } from '@/domain/${moduleNameSingularLower}';
// import { Create${moduleNamePascal}DTO, Update${moduleNamePascal}DTO } from '@/application/interfaces/I${moduleNamePascal}Repository'; // Import DTOs if defined

// Define potential Database-level errors
class ${moduleNamePascal}RepositoryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = '${moduleNamePascal}RepositoryError';
    }
}

export class Supabase${moduleNamePascal}Repository implements I${moduleNamePascal}Repository {
  // TODO: Replace with your actual table name in Supabase
  private readonly tableName = '${moduleNamePluralLower}';

  constructor(private supabase: SupabaseClient) {}

  // Helper to map Supabase row to Domain object (handle snake_case vs camelCase etc.)
  private mapToDomain(dbRecord: any): ${moduleNamePascal} | null {
    if (!dbRecord) {
      return null;
    }
    return {
      id: dbRecord.id,
      // TODO: Map other fields from dbRecord to ${moduleNamePascal} domain fields
      // exampleProperty: dbRecord.example_property,
      created_at: new Date(dbRecord.created_at),
      updated_at: new Date(dbRecord.updated_at),
    };
  }

  async findById(id: string): Promise<${moduleNamePascal} | null> {
    console.log(\`Repository: Finding ${moduleNamePascal} by ID: \${id}\`);
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*') // Consider selecting specific columns: 'id, name, created_at...'
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching ${moduleNamePascal} by ID:', error);
      throw new ${moduleNamePascal}RepositoryError(\`Database error: \${error.message}\`);
    }

    return this.mapToDomain(data);
  }

  // TODO: Implement other repository methods defined in I${moduleNamePascal}Repository
  // async findAll(options?: any): Promise<${moduleNamePascal}[]> {
  //   console.log('Repository: Finding all ${moduleNamePluralLower}');
  //   const { data, error } = await this.supabase.from(this.tableName).select('*'); // Add pagination/filtering based on options
  //   if (error) { /* ... error handling ... */ }
  //   return data ? data.map(this.mapToDomain).filter(Boolean) as ${moduleNamePascal}[] : [];
  // }
  //
  // async create(data: Create${moduleNamePascal}DTO): Promise<${moduleNamePascal}> {
  //   console.log('Repository: Creating ${moduleNamePascal}');
  //   const dbData = { /* map DTO to db structure if needed */ ...data };
  //   const { data: newRecord, error } = await this.supabase
  //       .from(this.tableName)
  //       .insert(dbData)
  //       .select()
  //       .single();
  //   if (error || !newRecord) { /* ... error handling ... */ throw new ${moduleNamePascal}RepositoryError('Failed to create record'); }
  //   const domainObject = this.mapToDomain(newRecord);
  //   if (!domainObject) { throw new ${moduleNamePascal}RepositoryError('Failed map created record'); }
  //   return domainObject;
  // }
  //
  // // ... implement update, delete ...
}
`,

  // --- Web Route Layer ---
  schema: `// File: src/infrastructure/web/routes/${moduleNamePluralLower}/${moduleNameSingularLower}.schema.ts
import { z } from 'zod';

// --- Zod Schemas (for Type Inference & Validation) ---

// Schema for the core ${moduleNamePascal} data returned in responses
export const ${moduleNameCamel}ResponseSchema = z.object({
  id: z.string().uuid(), // Or z.string(), z.number()
  // TODO: Define properties matching the ${moduleNamePascal} domain object for API responses
  // exampleProperty: z.string(),
  created_at: z.string().datetime(), // Usually ISO string in JSON
  updated_at: z.string().datetime(),
}).describe('${moduleNamePascal} representation in API responses');

// Schema for URL parameters when targeting a specific ${moduleNamePascal}
export const ${moduleNameCamel}IdParamsSchema = z.object({
    ${moduleNameCamel}Id: z.string().uuid({ message: 'Invalid ${moduleNamePascal} ID format in URL' }), // Adjust if ID is not UUID
});

// TODO: Add schemas for request bodies (POST/PUT) if needed
// export const create${moduleNamePascal}BodySchema = z.object({ ... });
// export const update${moduleNamePascal}BodySchema = z.object({ ... }).partial();


// --- Types Inferred from Zod Schemas ---
export type ${moduleNamePascal}Response = z.infer<typeof ${moduleNameCamel}ResponseSchema>;
export type ${moduleNamePascal}IdParams = z.infer<typeof ${moduleNameCamel}IdParamsSchema>;
// export type Create${moduleNamePascal}Input = z.infer<typeof create${moduleNamePascal}BodySchema>;
// export type Update${moduleNamePascal}Input = z.infer<typeof update${moduleNamePascal}BodySchema>;

// --- JSON Schemas (for Fastify Validation/Swagger) ---
// Manually define or use a helper function if preferred
// Remember to handle date formats appropriately for JSON schema (type: 'string', format: 'date-time')

export const ${moduleNameCamel}IdParamsJsonSchema = {
    $id: '${moduleNameCamel}IdParams',
    type: 'object',
    properties: {
        ${moduleNameCamel}Id: { type: 'string', format: 'uuid', description: '${moduleNamePascal} ID (UUID format)' },
    },
    required: ['${moduleNameCamel}Id'],
};

export const ${moduleNameCamel}ResponseJsonSchema = {
    $id: '${moduleNameCamel}Response',
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        // TODO: Define corresponding JSON schema properties
        // exampleProperty: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
    },
    required: ['id', /* TODO: Add required response fields */ 'created_at', 'updated_at'],
};

// TODO: Define JSON Schemas for request bodies if needed
// export const create${moduleNamePascal}BodyJsonSchema = { ... };
// export const update${moduleNamePascal}BodyJsonSchema = { ... };

`,

  handler: `// File: src/infrastructure/web/routes/${moduleNamePluralLower}/${moduleNameSingularLower}.handler.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { ${moduleNamePascal}Service } from '@/application/services/${moduleNamePascal}Service';
// Import types inferred from Zod schemas
import { ${moduleNamePascal}IdParams, ${moduleNamePascal}Response } from './${moduleNameSingularLower}.schema';
import { ${moduleNamePascal} } from '@/domain/${moduleNameSingularLower}'; // Import domain type

// Helper to map Domain object to API Response DTO
function mapDomainToResponse(${moduleNameCamel}: ${moduleNamePascal}): ${moduleNamePascal}Response {
    return {
        id: ${moduleNameCamel}.id,
        // TODO: Map domain fields to response fields
        // exampleProperty: ${moduleNameCamel}.exampleProperty,
        created_at: ${moduleNameCamel}.created_at.toISOString(),
        updated_at: ${moduleNameCamel}.updated_at.toISOString(),
    };
}

export class ${moduleNamePascal}Handler {
  constructor(private ${moduleNameCamel}Service: ${moduleNamePascal}Service) {
    // Bind methods to ensure 'this' context is correct
    this.get${moduleNamePascal}ById = this.get${moduleNamePascal}ById.bind(this);
    // TODO: Bind other handlers (create, update, delete)
  }

  // Handler for GET /${moduleNamePluralLower}/:${moduleNameCamel}Id
  async get${moduleNamePascal}ById(
    request: FastifyRequest<{ Params: ${moduleNamePascal}IdParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const id = request.params.${moduleNameCamel}Id; // Access validated param
      const result = await this.${moduleNameCamel}Service.get${moduleNamePascal}ById(id);

      if (!result) {
        return reply.notFound(\`${moduleNamePascal} with ID \${id} not found.\`);
      }

      const responseData = mapDomainToResponse(result);
      reply.code(200).send(responseData);

    } catch (error: any) {
      request.log.error({ err: error, params: request.params }, 'Error fetching ${moduleNamePascal} by ID');
      // TODO: Handle specific errors from service/repository if needed
      reply.internalServerError('An unexpected error occurred while fetching the ${moduleNameSingularLower}.');
    }
  }

  // TODO: Implement handlers for other routes (POST, PUT, DELETE)
  // async create${moduleNamePascal}(request: FastifyRequest<{ Body: Create${moduleNamePascal}Input }>, reply: FastifyReply): Promise<void> { ... }
  // async update${moduleNamePascal}(request: FastifyRequest<{ Params: ${moduleNamePascal}IdParams, Body: Update${moduleNamePascal}Input }>, reply: FastifyReply): Promise<void> { ... }
  // async delete${moduleNamePascal}(request: FastifyRequest<{ Params: ${moduleNamePascal}IdParams }>, reply: FastifyReply): Promise<void> { ... }
}
`,

  route: `// File: src/infrastructure/web/routes/${moduleNamePluralLower}/index.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ${moduleNamePascal}Service } from '@/application/services/${moduleNamePascal}Service';
import { Supabase${moduleNamePascal}Repository } from '@/infrastructure/database/Supabase${moduleNamePascal}Repository';
import { ${moduleNamePascal}Handler } from './${moduleNameSingularLower}.handler';

// Import the JSON Schemas for validation/Swagger
import {
    ${moduleNameCamel}IdParamsJsonSchema,
    ${moduleNameCamel}ResponseJsonSchema,
    // create${moduleNamePascal}BodyJsonSchema, // Import body schemas if needed
} from './${moduleNameSingularLower}.schema';

export default async function ${moduleNameCamel}Routes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // --- Dependency Injection Setup ---
  // TODO: Choose the appropriate client (admin or anon) based on required permissions
  const supabaseClient = fastify.supabase;
  const ${moduleNameCamel}Repository = new Supabase${moduleNamePascal}Repository(supabaseClient);
  const ${moduleNameCamel}Service = new ${moduleNamePascal}Service(${moduleNameCamel}Repository);
  const ${moduleNameCamel}Handler = new ${moduleNamePascal}Handler(${moduleNameCamel}Service);
  // --- End Dependency Injection ---

  // --- Add Schemas to Fastify Instance (Optional but good practice) ---
  try {
    fastify.addSchema(${moduleNameCamel}IdParamsJsonSchema);
    fastify.addSchema(${moduleNameCamel}ResponseJsonSchema);
    // fastify.addSchema(create${moduleNamePascal}BodyJsonSchema); // Add body schemas if needed
  } catch (e: any) {
      if (e.code !== 'FST_ERR_SCH_ALREADY_PRESENT') throw e;
      fastify.log.warn('${moduleNamePascal} route JSON schemas already present.');
  }

  // --- Route Definitions ---

  // GET /${moduleNamePluralLower}/:${moduleNameCamel}Id
  fastify.get(
    '/:${moduleNameCamel}Id',
    {
      schema: {
        summary: 'Get ${moduleNamePascal} by ID',
        tags: ['${moduleNamePascal}s'], // Tag for Swagger grouping
        params: ${moduleNameCamel}IdParamsJsonSchema, // Use imported JSON schema
        response: {
          200: ${moduleNameCamel}ResponseJsonSchema,   // Use imported JSON schema
          400: { $ref: 'httpErrorBadRequest' },
          404: { $ref: 'httpErrorNotFound' },
          500: { $ref: 'httpErrorInternalServerError' },
        },
        // security: [{ apiKey: [] }] // Add security if needed
      },
    },
    ${moduleNameCamel}Handler.get${moduleNamePascal}ById
  );

  // TODO: Add other routes (POST, PUT, DELETE) here
  // fastify.post('/', { schema: { body: create${moduleNamePascal}BodyJsonSchema, response: { 201: ${moduleNameCamel}ResponseJsonSchema } } }, ${moduleNameCamel}Handler.create${moduleNamePascal});
  // fastify.put('/:userId', { schema: { params:..., body: ..., response: { 200: ... } } }, ${moduleNameCamel}Handler.update${moduleNamePascal});
  // fastify.delete('/:userId', { schema: { params: ..., response: { 204: { type: 'null' } } } }, ${moduleNameCamel}Handler.delete${moduleNamePascal});


  fastify.log.info(\`✅ Registered ${moduleNamePascal} routes under prefix '\${options.prefix}'\`);
}
`
};

// 5. Create Directories and Files
function createDirAndFile(dirPath, fileName, content) {
  const fullPath = path.join(dirPath, fileName);
  if (fs.existsSync(fullPath)) {
    console.warn(`⚠️  File already exists: ${fullPath} (Skipping)`);
    return;
  }
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Created: ${path.relative(projectRoot, fullPath)}`);
  } catch (err) {
    console.error(`❌ Error creating file ${fullPath}:`, err);
  }
}

createDirAndFile(paths.domain, `${moduleNameSingularLower}.ts`, templates.domain);
createDirAndFile(paths.interface, `I${moduleNamePascal}Repository.ts`, templates.interface);
createDirAndFile(paths.service, `${moduleNamePascal}Service.ts`, templates.service);
createDirAndFile(paths.repository, `Supabase${moduleNamePascal}Repository.ts`, templates.repository);
createDirAndFile(paths.route, `${moduleNameSingularLower}.schema.ts`, templates.schema);
createDirAndFile(paths.route, `${moduleNameSingularLower}.handler.ts`, templates.handler);
createDirAndFile(paths.route, `index.ts`, templates.route);

console.log(`\n🎉 Module '${moduleNamePascal}' generated successfully!`);
console.log(`\n👉 Next Steps:`);
console.log(`   1. Update the generated files (domain models, repository methods, service logic, schemas, handlers).`);
console.log(`   2. Create the corresponding table ('${moduleNamePluralLower}'?) in Supabase and run migrations.`);
console.log(`   3. Register the new routes in 'src/app.ts':`);
console.log(`      import ${moduleNameCamel}Routes from './infrastructure/web/routes/${moduleNamePluralLower}/index';`);
console.log(`      await app.register(${moduleNameCamel}Routes, { prefix: '/api/v1/${moduleNamePluralLower}' });`);