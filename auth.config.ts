import { defineConfig } from 'auth-astro';
import Google from '@auth/core/providers/google';
import GitHub from '@auth/core/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineConfig({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Restrict to CCSF domain for student verification
          hd: 'mail.ccsf.edu',
        },
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Verify CCSF student email
        const email = user.email;
        if (!email) return false;
        
        const isValidDomain = email.endsWith('@mail.ccsf.edu') || email.endsWith('@ccsf.edu');
        const emailPrefix = email.split('@')[0];
        const studentIdPattern = /^[a-z]\d{7}$/; // CCSF student ID format
        
        // Allow sign in if it's a valid CCSF domain
        if (isValidDomain) {
          // Extract student ID if it matches the pattern
          if (studentIdPattern.test(emailPrefix)) {
            // Store student ID for later use
            user.studentId = emailPrefix;
          }
          return true;
        }
        return false;
      }
      
      return true; // Allow other providers
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || 'member';
        token.studentId = user.studentId;
        token.isVerified = user.isVerified || false;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.studentId = token.studentId as string;
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: 'ccsf-cs-session',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      },
    },
  },
});