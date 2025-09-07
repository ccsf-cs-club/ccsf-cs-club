import { PrismaClient } from '../../generated/prisma'

// Define types manually based on schema
export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

export type Contact = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
};

export type Vote = {
  id: number;
  voterId: number; // Changed to number to match User.id
  candidateId: string;
  electionId: string | null;
  score: number;
  createdAt: Date;
};

export type Election = {
  id: string;
  slug: string;
  title: string;
  status: string;
  startDate: Date;
  endDate: Date;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
  candidates?: Candidate[];
  votes?: Vote[];
};

export type Candidate = {
  id: string;
  electionId: string;
  candidateId: string;
  name: string;
  description: string | null;
  order: number;
};

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
  voterId: number; // Changed to number to match User.id
  candidateId: string;
  electionId?: string;
  score: number;
};

export type CreateElectionData = {
  id: string;
  slug: string;
  title: string;
  status: string;
  startDate: Date;
  endDate: Date;
  settings: any;
};

export type CreateCandidateData = {
  id: string;
  electionId: string;
  candidateId: string;
  name: string;
  description?: string;
  order?: number;
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
      // Handle null electionId case properly for legacy votes
      if (!voteData.electionId) {
        // For legacy votes without electionId, search for existing vote and update or create
        const existingVote = await this.prisma.vote.findFirst({
          where: {
            voterId: voteData.voterId,
            candidateId: voteData.candidateId,
            electionId: null
          }
        });

        if (existingVote) {
          return await this.prisma.vote.update({
            where: { id: existingVote.id },
            data: {
              score: voteData.score,
              createdAt: new Date()
            }
          });
        } else {
          return await this.prisma.vote.create({
            data: voteData
          });
        }
      } else {
        // For votes with electionId, use the unique constraint
        return await this.prisma.vote.upsert({
          where: {
            voterId_candidateId_electionId: {
              voterId: voteData.voterId,
              candidateId: voteData.candidateId,
              electionId: voteData.electionId
            }
          },
          update: {
            score: voteData.score,
            createdAt: new Date()
          },
          create: voteData
        });
      }
    } catch (error: any) {
      console.error('Prisma error creating/updating vote:', error);
      throw new Error('Failed to save vote');
    }
  }

  async getVoteResults(electionId?: string): Promise<VoteResult[]> {
    try {
      const results = await this.prisma.vote.groupBy({
        by: ['candidateId'],
        where: {
          score: {
            gt: 0
          },
          ...(electionId && { electionId })
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

  async getStarResults(electionId?: string): Promise<StarResult[]> {
    try {
      const voteResults = await this.getVoteResults(electionId);
      
      if (voteResults.length < 2) {
        return voteResults.map(result => ({
          ...result,
          winner: true
        }));
      }

      const topTwo = voteResults.slice(0, 2);
      const [first, second] = topTwo;

      // Get runoff results using raw SQL for complex query
      const runoffResult = electionId 
        ? await this.prisma.$queryRaw<Array<{
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
              (SELECT voter_id, score FROM votes WHERE candidate_id = ${first.candidate_id} AND election_id = ${electionId}) first
            FULL OUTER JOIN
              (SELECT voter_id, score FROM votes WHERE candidate_id = ${second.candidate_id} AND election_id = ${electionId}) second
            ON first.voter_id = second.voter_id
            WHERE 
              first.score IS NOT NULL AND second.score IS NOT NULL
              AND first.score != second.score
          ) runoff
          WHERE candidate_id IS NOT NULL
          GROUP BY candidate_id
          ORDER BY runoff_votes DESC
        `
        : await this.prisma.$queryRaw<Array<{
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

  async getVotesByVoter(voterId: number): Promise<Vote[]> {
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

  async createElection(electionData: CreateElectionData): Promise<Election> {
    try {
      return await this.prisma.election.create({
        data: electionData
      });
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('slug')) {
        throw new Error('Election slug already exists');
      }
      console.error('Prisma error creating election:', error);
      throw new Error('Failed to create election');
    }
  }

  async getElection(id: string): Promise<Election | null> {
    try {
      return await this.prisma.election.findUnique({
        where: { id },
        include: {
          candidates: {
            orderBy: { order: 'asc' }
          }
        }
      });
    } catch (error) {
      console.error('Prisma error getting election:', error);
      throw new Error('Failed to get election');
    }
  }

  async getElectionBySlug(slug: string): Promise<Election | null> {
    try {
      return await this.prisma.election.findUnique({
        where: { slug },
        include: {
          candidates: {
            orderBy: { order: 'asc' }
          }
        }
      });
    } catch (error) {
      console.error('Prisma error getting election by slug:', error);
      throw new Error('Failed to get election');
    }
  }

  async getActiveElections(): Promise<Election[]> {
    try {
      return await this.prisma.election.findMany({
        where: { 
          status: 'active',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        include: {
          candidates: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { startDate: 'desc' }
      });
    } catch (error) {
      console.error('Prisma error getting active elections:', error);
      throw new Error('Failed to get active elections');
    }
  }

  async updateElectionStatus(id: string, status: string): Promise<Election> {
    try {
      return await this.prisma.election.update({
        where: { id },
        data: { status }
      });
    } catch (error) {
      console.error('Prisma error updating election status:', error);
      throw new Error('Failed to update election status');
    }
  }

  async createCandidate(candidateData: CreateCandidateData): Promise<Candidate> {
    try {
      return await this.prisma.candidate.create({
        data: candidateData
      });
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('candidateId')) {
        throw new Error('Candidate already exists in this election');
      }
      console.error('Prisma error creating candidate:', error);
      throw new Error('Failed to create candidate');
    }
  }

  async getCandidatesByElection(electionId: string): Promise<Candidate[]> {
    try {
      return await this.prisma.candidate.findMany({
        where: { electionId },
        orderBy: { order: 'asc' }
      });
    } catch (error) {
      console.error('Prisma error getting candidates:', error);
      throw new Error('Failed to get candidates');
    }
  }

  async validateCandidate(electionId: string, candidateId: string): Promise<boolean> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          electionId_candidateId: {
            electionId,
            candidateId
          }
        }
      });
      return candidate !== null;
    } catch (error) {
      console.error('Prisma error validating candidate:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

let prismaInstance: PrismaConnection | null = null;

const prisma = new PrismaClient();

export function getPrismaClient(): typeof prisma {
  return prisma;
}

// NOTE: Database operations have been moved to src/lib/db.ts using Neon
// This file is kept minimal for type exports only
// All actual database operations should use the Neon-based functions from db.ts

export { PrismaConnection };