// Represents the core User entity within your application's domain.
// Keep this focused on business properties, not database specifics.
export interface User {
  id: string; // Usually a UUID from Supabase Auth or your DB primary key
  username: string;
  email: string;
  password: string;
  created_at: Date; // Use Date object for easier manipulation in JS/TS
  updated_at: Date;
  // Add other core domain fields here, e.g.:
  // name?: string;
  // roles?: string[];
  // last_login_at?: Date;
}