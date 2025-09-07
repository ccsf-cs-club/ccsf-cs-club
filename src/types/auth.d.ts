import { DefaultSession, DefaultUser } from '@auth/core/types';

declare module '@auth/core/types' {
  interface Session {
    user: {
      id: string;
      role: string;
      studentId?: string;
      isVerified: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    studentId?: string;
    isVerified: boolean;
  }

  interface JWT {
    role?: string;
    studentId?: string;
    isVerified?: boolean;
  }
}

declare global {
  namespace App {
    interface Locals {
      session: Session | null;
      user: Session['user'] | null;
    }
  }
}