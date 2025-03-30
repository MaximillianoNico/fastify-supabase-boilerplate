// File: src/infrastructure/database/SupabaseUserRepository.ts
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { IUserRepository, CreateUserDTO, UpdateUserDTO } from '@/application/interfaces/IUserRepository';
import { User } from '@/domain/user';

// Custom error for database interactions
class DatabaseError extends Error {
  public readonly originalError?: Error | PostgrestError;
  constructor(message: string, originalError?: Error | PostgrestError) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

export class SupabaseUserRepository implements IUserRepository {
  // Define the table name used in Supabase
  private readonly tableName = 'users'; // IMPORTANT: Replace with your actual table name

  // Inject the Supabase client via the constructor
  constructor(private supabase: SupabaseClient) {}

  // Helper to map a Supabase database row (potentially snake_case)
  // to our domain User object (camelCase, specific types).
  private mapToDomain(dbUser: any): User | null {
    if (!dbUser) {
      return null;
    }
    // Perform mapping and type conversions
    return {
      id: dbUser.id, // Assuming 'id' column exists and is UUID
      email: dbUser.email, // Assuming 'email' column exists
      username: dbUser.username, // Assuming 'email' column exists
      password: dbUser.password,
      updated_at: new Date(dbUser.updated_at),
      created_at: new Date(dbUser.created_at), // Convert timestamp string to Date object
      // Map other fields as needed, e.g., dbUser.full_name -> name
    };
  }

    // Helper to handle Supabase errors consistently
    private handleError(error: PostgrestError | null, context: string): void {
        if (error) {
            console.error(`Supabase error during ${context}:`, error.message, `(Code: ${error.code})`);
            // You might want to map specific Postgrest error codes (like '23505' for unique violation)
            // to more specific application errors here if needed.
            throw new DatabaseError(`Database operation failed: ${context}`, error);
        }
    }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*') // Select specific columns in production for performance: 'id, email, created_at'
      .eq('id', id)
      .maybeSingle(); // Returns data as object or null, doesn't throw error if not found

    this.handleError(error, `findById ${id}`);
    return this.mapToDomain(data);
  }

  async findByEmail(email: string): Promise<Omit<User, 'password'> | null> {
      const { data, error } = await this.supabase
          .from(this.tableName)
          .select('*') // Select specific columns: 'id, email, created_at'
          .eq('email', email)
          .maybeSingle();

      this.handleError(error, `findByEmail ${email}`);
      return this.mapToDomain(data);
  }

  async create(userData: CreateUserDTO): Promise<User> {
      // Map DTO to the database structure if needed (e.g., camelCase to snake_case)
      // Supabase client often handles basic mapping if column names match.
      // If your DB uses snake_case (e.g., created_at), Supabase handles it.
      // If your DTO has different names, map them here:
      const dbData = {
         email: userData.email,
         username: userData.username,
         password: userData.password,
         // Map other DTO fields to database column names if necessary
         // e.g., fullName: userData.name -> if DB column is full_name
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(dbData)
        .select("*") // Select the newly created row(s)
        .single(); // Expect exactly one row to be returned after insert

      // Check for error *or* if data is unexpectedly null/undefined
      if (error || !data) {
        console.error('Supabase error during create:', error?.message);
         // Check for unique constraint violation (example)
        if (error?.code === '23505') { // PostgreSQL unique violation code
             throw new DatabaseError('Unique constraint violation (e.g., email already exists)', error);
        }
        this.handleError(error, `create user with email ${userData.email}`);
        // If no error but data is null, something unexpected happened
        if (!data) throw new DatabaseError('User creation failed: No data returned from database');
      }

      const mappedUser = this.mapToDomain(data);
      if (!mappedUser) {
          // This should ideally not happen if data was returned and mapToDomain is correct
          throw new DatabaseError('Failed to map created user data to domain object.');
      }
      return mappedUser;
  }

  // --- Implement other IUserRepository methods ---

  // Example: Update (requires UpdateUserDTO in interface)
  /*
  async update(id: string, userData: UpdateUserDTO): Promise<User | null> {
      // Map UpdateUserDTO fields to database column names if needed
      const dbUpdateData = { ...userData }; // Simple mapping assumed here

      const { data, error } = await this.supabase
          .from(this.tableName)
          .update(dbUpdateData)
          .eq('id', id)
          .select()
          .single(); // Or maybeSingle() if update might not find the row

      this.handleError(error, `update user ${id}`);
      return this.mapToDomain(data); // Returns the updated user or null
  }
  */

  // Example: Delete (requires delete method in interface)
  /*
  async delete(id: string): Promise<boolean> {
      const { error, count } = await this.supabase
          .from(this.tableName)
          .delete()
          .eq('id', id);

      this.handleError(error, `delete user ${id}`);
      return count !== null && count > 0; // Return true if one or more rows were deleted
  }
  */

  // --------------------------------------------
}