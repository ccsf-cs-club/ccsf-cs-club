import { PrismaClient } from '../generated/prisma';
import type { User, Contact, Vote } from '../generated/prisma';

export type CreateUserData = {
  name: string;
  email: string;
};

export type CreateContactData = {
  name: string;
  email: string;
  message: string;
};

export type CreateVoteData = {
  voterId: string;
  candidateId: string;
  score: number;
};

export interface VoteResult {
  candidate_id: string;
  total_score: number;
  vote_count: number;
  average_score: number;
}

export interface StarResult {
  candidate_id: string;
  total_score: number;
  vote_count: number;
  average_score: number;
  runoff_votes?: number;
  winner?: boolean;
}

class PrismaConnection {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: userData
      });
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new Error('Email already exists');
      }
      
      console.error('Prisma error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async createContact(contactData: CreateContactData): Promise<Contact> {
    try {
      return await this.prisma.contact.create({
        data: contactData
      });
    } catch (error) {
      console.error('Prisma error creating contact:', error);
      throw new Error('Failed to create contact');
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email }
      });
      return user !== null;
    } catch (error) {
      console.error('Prisma error checking email:', error);
      throw new Error('Failed to check email');
    }
  }

  async getUserCount(): Promise<number> {
    try {
      return await this.prisma.user.count();
    } catch (error) {
      console.error('Prisma error getting user count:', error);
      return 0;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Prisma health check failed:', error);
      return false;
    }
  }

  async upsertVote(voteData: CreateVoteData): Promise<Vote> {
    try {
      return await this.prisma.vote.upsert({
        where: {
          voterId_candidateId: {
            voterId: voteData.voterId,
            candidateId: voteData.candidateId
          }
        },
        update: {
          score: voteData.score,
          createdAt: new Date()
        },
        create: voteData
      });
    } catch (error: any) {
      console.error('Prisma error creating/updating vote:', error);
      throw new Error('Failed to save vote');
    }
  }

  async getVoteResults(): Promise<VoteResult[]> {
    try {
      const results = await this.prisma.vote.groupBy({
        by: ['candidateId'],
        where: {
          score: {
            gt: 0
          }
        },
        _sum: {
          score: true
        },
        _count: {
          _all: true
        },
        _avg: {
          score: true
        },
        orderBy: [
          {
            _sum: {
              score: 'desc'
            }
          },
          {
            _avg: {
              score: 'desc'
            }
          }
        ]
      });

      return results.map(result => ({
        candidate_id: result.candidateId,
        total_score: result._sum.score || 0,
        vote_count: result._count._all,
        average_score: result._avg.score || 0
      }));
    } catch (error) {
      console.error('Prisma error getting vote results:', error);
      throw new Error('Failed to get vote results');
    }
  }

  async getStarResults(): Promise<StarResult[]> {
    try {
      const voteResults = await this.getVoteResults();
      
      if (voteResults.length < 2) {
        return voteResults.map(result => ({
          ...result,
          winner: true
        }));
      }

      const topTwo = voteResults.slice(0, 2);
      const [first, second] = topTwo;

      // Get runoff results using raw SQL for complex query
      const runoffResult = await this.prisma.$queryRaw<Array<{
        candidate_id: string;
        runoff_votes: bigint;
      }>>`
        SELECT 
          candidate_id,
          COUNT(*) as runoff_votes
        FROM (
          SELECT 
            CASE 
              WHEN first.score > second.score THEN ${first.candidate_id}
              WHEN second.score > first.score THEN ${second.candidate_id}
              ELSE NULL
            END as candidate_id
          FROM 
            (SELECT voter_id, score FROM votes WHERE candidate_id = ${first.candidate_id}) first
          FULL OUTER JOIN
            (SELECT voter_id, score FROM votes WHERE candidate_id = ${second.candidate_id}) second
          ON first.voter_id = second.voter_id
          WHERE 
            first.score IS NOT NULL AND second.score IS NOT NULL
            AND first.score != second.score
        ) runoff
        WHERE candidate_id IS NOT NULL
        GROUP BY candidate_id
        ORDER BY runoff_votes DESC
      `;

      const runoffWinner = runoffResult.length > 0 ? runoffResult[0].candidate_id : first.candidate_id;

      return voteResults.map(result => ({
        ...result,
        runoff_votes: Number(runoffResult.find(r => r.candidate_id === result.candidate_id)?.runoff_votes || 0),
        winner: result.candidate_id === runoffWinner
      }));
    } catch (error) {
      console.error('Prisma error getting STAR results:', error);
      throw new Error('Failed to get STAR results');
    }
  }

  async getVotesByVoter(voterId: string): Promise<Vote[]> {
    try {
      return await this.prisma.vote.findMany({
        where: { voterId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Prisma error getting votes by voter:', error);
      throw new Error('Failed to get voter history');
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

let prismaInstance: PrismaConnection | null = null;

export function getPrismaClient(): PrismaConnection {
  if (!prismaInstance) {
    prismaInstance = new PrismaConnection();
  }
  return prismaInstance;
}

// Type-safe database operations
export const userOperations = {
  create: (data: CreateUserData) => getPrismaClient().createUser(data),
  checkEmailExists: (email: string) => getPrismaClient().checkEmailExists(email),
  count: () => getPrismaClient().getUserCount()
};

export const contactOperations = {
  create: (data: CreateContactData) => getPrismaClient().createContact(data)
};

export const voteOperations = {
  upsert: (data: CreateVoteData) => getPrismaClient().upsertVote(data),
  getResults: () => getPrismaClient().getVoteResults(),
  getStarResults: () => getPrismaClient().getStarResults(),
  getByVoter: (voterId: string) => getPrismaClient().getVotesByVoter(voterId)
};

export const systemOperations = {
  healthCheck: () => getPrismaClient().healthCheck(),
  disconnect: () => getPrismaClient().disconnect()
};

export { PrismaConnection, User, Contact, Vote };