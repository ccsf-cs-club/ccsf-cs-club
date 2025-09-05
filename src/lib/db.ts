import { neon } from '@neondatabase/serverless';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export type CreateUserData = Omit<User, 'id' | 'created_at'>;

class DatabaseConnection {
  private sql: ReturnType<typeof neon>;
  private connectionUrl: string;

  constructor() {
    this.connectionUrl = process.env.DATABASE_URL || '';
    if (!this.connectionUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    this.sql = neon(this.connectionUrl);
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const result = await this.sql`
        INSERT INTO users (name, email)
        VALUES (${userData.name}, ${userData.email})
        RETURNING id, name, email, created_at
      ` as any[];
      
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Failed to create user');
      }

      return {
        id: result[0].id,
        name: result[0].name,
        email: result[0].email,
        created_at: new Date(result[0].created_at)
      };
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new Error('Email already exists');
      }
      
      console.error('Database error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const result = await this.sql`
        SELECT 1 FROM users WHERE email = ${email} LIMIT 1
      ` as any[];
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Database error checking email:', error);
      throw new Error('Failed to check email');
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const result = await this.sql`
        SELECT COUNT(*) as count FROM users
      `;
      return parseInt(result[0].count, 10);
    } catch (error) {
      console.error('Database error getting user count:', error);
      return 0;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.sql`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

let dbInstance: DatabaseConnection | null = null;

export function getDatabase(): DatabaseConnection {
  if (!dbInstance) {
    dbInstance = new DatabaseConnection();
  }
  return dbInstance;
}

export { DatabaseConnection };