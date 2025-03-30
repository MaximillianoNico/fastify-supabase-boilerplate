// File: src/infrastructure/web/routes/user/user.schema.ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema'; // Utility to convert Zod to JSON Schema

// ----- Base Schemas -----

// Core User representation used in responses
const userCoreSchema = z.object({
  id: z.string().uuid({ message: "ID must be a valid UUID" }),
  email: z.string().email({ message: "Invalid email format" }),
  created_at: z.union([z.date(), z.string().datetime({ message: "Invalid datetime string for created_at" })])
             .describe("The date and time when the user was created"),
  // Add other fields returned in API responses (e.g., name, roles)
}).describe("Represents a user account");


// ----- Input Schemas (Request Validation) -----

// Schema for the request body when creating a new user
export const createUserBodySchema = z.object({
  email: z.string().email("Valid email is required"),
  username: z.string().email("Username is required"),
  password: z.string().min(8).email("Password is required"),
}).describe("Data required to create a new user");

// Schema for URL parameters when targeting a specific user (e.g., /users/:userId)
export const userIdParamsSchema = z.object({
  userId: z.string(), // Remove .uuid() temporarily
});


// ----- Output Schemas (Response Serialization & Documentation) -----

// Schema for the response when successfully creating or retrieving a user
export const userResponseSchema = userCoreSchema;

// ----- Types Inferred from Schemas -----

export type CreateUserInput = z.infer<typeof createUserBodySchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;


// ----- JSON Schema Conversion for Fastify -----
// Convert Zod schemas to JSON Schemas suitable for Fastify's `schema` option
// Naming them helps with $ref resolution in Swagger if needed, but is optional
// if you don't reference them elsewhere in the Swagger definition.
export const jsonSchema = {
    createUserBody: zodToJsonSchema(createUserBodySchema, "createUserBodySchema"),
    userIdParams: zodToJsonSchema(userIdParamsSchema, "userIdParamsSchema"),
    userResponse: zodToJsonSchema(userResponseSchema, "userResponseSchema"),
};


// --- Optional: Using fastify-zod's buildJsonSchemas ---
/*
import { buildJsonSchemas } from 'fastify-zod';

export const { schemas: userSchemas, $ref } = buildJsonSchemas({
  createUserBodySchema,
  userIdParamsSchema,
  userResponseSchema,
}, { $id: 'userApiSchemas' }); // Use a unique $id prefix
*/
// If using buildJsonSchemas, you'd use `$ref('schemaName')` in the route definitions
// and register `userSchemas` in the route plugin (index.ts).

export const createUserBodyJsonSchema = {
  $id: 'createUserBody', // Optional: ID for potential reuse/ref
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', description: 'User email address' },
    password: { type: 'string', minLength: 8, description: 'User password' }, // Example
  },
  required: ['email'], // Specify required fields
  description: 'Data required to create a new user',
  additionalProperties: false, // Disallow extra properties not defined
};

// JSON Schema for URL parameters when targeting a specific user
export const userIdParamsJsonSchema = {
  $id: 'userIdParams',
  type: 'object',
  properties: {
      userId: { type: 'string', format: 'uuid', description: 'User ID (UUID format)' },
  },
  required: ['userId'],
  additionalProperties: false,
};

// JSON Schema for the response when successfully creating or retrieving a user
export const userResponseJsonSchema = {
  $id: 'userResponse',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'User unique ID' },
    email: { type: 'string', format: 'email', description: 'User email address' },
    // Use string with date-time format for JSON representation
    // created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp (ISO 8601)' },
  },
  required: ['id', 'email', 'created_at'],
  description: 'User representation',
  additionalProperties: true, // Allow extra properties unless specified otherwise
};