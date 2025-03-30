// File: src/application/services/UserService.ts
import { User } from '@/domain/user';
import { IUserRepository, CreateUserDTO } from '../interfaces/IUserRepository';

// Custom Error class for Application layer specific errors
class ApplicationError extends Error {
  public readonly code: number;
  constructor(message: string, code: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UserService {
  // Dependency Injection: The service depends on the repository interface,
  // not the concrete implementation.
  constructor(private userRepository: IUserRepository) {}

  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    // Basic validation (can be more sophisticated)
    if (!id || typeof id !== 'string' || id.length < 1) { // Simple UUID check approximation
       throw new ApplicationError('Invalid user ID format provided.', 400); // Bad Request
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
       // Consistent handling: Service can return null or throw a specific "NotFound" error
       // Returning null is often simpler for the handler to manage.
       return null;
    }
    return user;
  }

  async createUser(userData: CreateUserDTO): Promise<User> {
    // Add business logic / validation before saving
    console.log('userData: ', userData);
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      // Throw an application-specific error that the handler can catch
      throw new ApplicationError('User with this email already exists.', 409); // Conflict
    }

    // --- Placeholder for more complex logic ---
    // - Hash password if userData included it (use bcrypt, argon2)
    // - Validate other fields based on business rules
    // - Generate default values if needed
    // - Could interact with other services (e.g., send welcome email - maybe via events later)
    // -----------------------------------------

    try {
        const newUser = await this.userRepository.create(userData);
        return newUser;
    } catch (dbError: any) {
        // Log the underlying database error for debugging
        console.error("Database error during user creation:", dbError);
        // Re-throw a generic application error or a more specific one if possible
        throw new ApplicationError("Failed to create user due to a database issue.", 500);
    }
  }

  // --- Add other service methods ---
  // async updateUser(id: string, updateData: UpdateUserDTO): Promise<User | null> { ... }
  // async deleteUser(id: string): Promise<boolean> { ... }
  // -------------------------------
}
