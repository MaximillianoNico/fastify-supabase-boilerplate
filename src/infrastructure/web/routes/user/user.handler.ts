// File: src/infrastructure/web/routes/user/user.handler.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '@/application/services/UserService'; // Use path alias
import { CreateUserInput, UserIdParams, UserResponse } from './user.schema'; // Import types
import { User } from '@/domain/user'; // Import domain type if needed

// Map Domain User to API Response DTO (UserResponse)
// This is useful if the response structure differs from the internal domain model
function mapUserToResponse(user: Omit<User, "password">): UserResponse {
    return {
      id: user.id,
      email: user.email,
      created_at: new Date(user.created_at)
    };
}


export class UserHandler {
  // Inject the UserService dependency
  constructor(private userService: UserService) {
      // Bind methods to ensure 'this' context is correct when passed as route handlers
      this.createUser = this.createUser.bind(this);
      this.getUserById = this.getUserById.bind(this);
      // Bind other handlers here...
  }

  // Handler for POST /users
  async createUser(
    // Type the request based on the expected Body and potentially other parts (Params, Querystring)
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply,
  ): Promise<void> { // Return type is often void or Promise<void> for handlers
    try {
      // request.body is already validated by Fastify if the schema is attached to the route
      const newUserDomain = await this.userService.createUser(request.body);

      // Map the domain object to the response schema format before sending
      const responseUser = mapUserToResponse(newUserDomain);

      // Send the successful response
      reply.code(201).send(responseUser);

    } catch (error: any) {
        request.log.error({ err: error, body: request.body }, 'Error creating user');

        // Handle specific application errors thrown by the service
        if (error.name === 'ApplicationError') {
            switch (error.code) {
                case 409: // Conflict (e.g., user exists)
                    return reply.conflict(error.message); // Use sensible helper
                case 400: // Bad Request (e.g., invalid input beyond basic format)
                    return reply.badRequest(error.message);
                default:
                    // Fallthrough to internal server error for other app errors
                    break;
            }
        }
        // Handle potential DatabaseErrors separately if needed
        if (error.name === 'DatabaseError') {
            // Log more details, but return a generic error to the client
             return reply.internalServerError('A database error occurred while creating the user.');
        }

        // Default to internal server error for unexpected issues
        reply.internalServerError('An unexpected error occurred while creating the user.');
    }
  }

  // Handler for GET /users/:userId
  async getUserById(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = request.params.userId;
      const userDomain = await this.userService.getUserById(userId);

      if (!userDomain) {
          // User not found, use the sensible helper
          return reply.notFound(`User with ID ${userId} not found.`);
      }

      // Map to response format and send
      request.log.debug('DATA: ', userDomain);
      const responseUser = mapUserToResponse(userDomain);
      reply.code(200).send(responseUser);
    } catch (error: any) {
      request.log.error({ err: error, params: request.params }, 'Error fetching user by ID');

      // Handle specific application errors (like invalid ID format from service)
      if (error.name === 'ApplicationError' && error.code === 400) {
        return reply.badRequest(error.message);
      }
      if (error.name === 'DatabaseError') {
          return reply.internalServerError('A database error occurred while fetching the user.');
      }

      // Default to internal server error
      reply.internalServerError('An unexpected error occurred while fetching the user.');
    }
  }

  // --- Add handlers for other routes ---
  // async getAllUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> { ... }
  // async updateUser(request: FastifyRequest<{ Params: UserIdParams, Body: UpdateUserInput }>, reply: FastifyReply): Promise<void> { ... }
  // async deleteUser(request: FastifyRequest<{ Params: UserIdParams }>, reply: FastifyReply): Promise<void> { ... }
  // ------------------------------------
}