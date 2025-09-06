/**
 * Prisma Client Setup for CCSF CS Club
 * 
 * This module provides a singleton Prisma client instance with proper
 * connection pooling for serverless environments like Netlify.
 */

import { PrismaClient } from '../generated/prisma';

declare global {
  // Prevent multiple instances during hot reload in development
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern for Prisma client
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export default prisma;

/**
 * User-related database operations
 * 
 * These functions provide type-safe database operations using Prisma
 */
export const userOperations = {
  async create(userData: { name: string; email: string }) {
    try {
      const user = await prisma.user.create({
        data: userData,
      });
      return user;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new Error('Email already exists');
      }
      console.error('Database error creating user:', error);
      throw new Error('Failed to create user');
    }
  },

  async findByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Database error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  },

  async count() {
    try {
      return await prisma.user.count();
    } catch (error) {
      console.error('Database error counting users:', error);
      return 0;
    }
  },
};

/**
 * Contact form operations
 */
export const contactOperations = {
  async create(contactData: { name: string; email: string; message: string }) {
    try {
      const contact = await prisma.contact.create({
        data: contactData,
      });
      return contact;
    } catch (error) {
      console.error('Database error creating contact:', error);
      throw new Error('Failed to create contact');
    }
  },
};

/**
 * STAR Voting operations
 */
export const voteOperations = {
  async upsert(voteData: { voterId: string; candidateId: string; score: number }) {
    // Validate score range for STAR voting (0-5)
    if (voteData.score < 0 || voteData.score > 5) {
      throw new Error('Vote score must be between 0 and 5');
    }

    try {
      const vote = await prisma.vote.upsert({
        where: {
          voterId_candidateId: {
            voterId: voteData.voterId,
            candidateId: voteData.candidateId,
          },
        },
        update: {
          score: voteData.score,
          createdAt: new Date(), // Update timestamp on vote change
        },
        create: voteData,
      });
      return vote;
    } catch (error) {
      console.error('Database error upserting vote:', error);
      throw new Error('Failed to save vote');
    }
  },

  async findByVoter(voterId: string) {
    try {
      return await prisma.vote.findMany({
        where: { voterId },
        orderBy: { candidateId: 'asc' },
      });
    } catch (error) {
      console.error('Database error finding votes by voter:', error);
      throw new Error('Failed to find votes');
    }
  },

  async getResults() {
    try {
      // Get all votes grouped by candidate for STAR voting calculation
      const votes = await prisma.vote.groupBy({
        by: ['candidateId'],
        _avg: {
          score: true,
        },
        _count: {
          score: true,
        },
        _sum: {
          score: true,
        },
      });

      return votes.map(vote => ({
        candidateId: vote.candidateId,
        averageScore: vote._avg.score || 0,
        totalVotes: vote._count.score,
        totalScore: vote._sum.score || 0,
      }));
    } catch (error) {
      console.error('Database error getting vote results:', error);
      throw new Error('Failed to get vote results');
    }
  },
};

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Graceful shutdown for Prisma client
 * Useful for serverless environments
 */
export async function disconnect() {
  await prisma.$disconnect();
}