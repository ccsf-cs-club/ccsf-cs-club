import { neon } from '@neondatabase/serverless';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export type CreateUserData = Omit<User, 'id' | 'created_at'>;

export interface Vote {
  id: number;
  voter_id: string;
  candidate_id: string;
  score: number;
  election_id?: string;
  created_at: Date;
}

export type CreateVoteData = Omit<Vote, 'id' | 'created_at'>;

export interface VoteResult {
  candidate_id: string;
  total_score: number;
  vote_count: number;
  average_score: number;
  election_id?: string;
}

export interface StarResult {
  candidate_id: string;
  total_score: number;
  vote_count: number;
  average_score: number;
  runoff_votes?: number;
  winner?: boolean;
  election_id?: string;
}

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

  async upsertVote(voteData: CreateVoteData): Promise<Vote> {
    try {
      // Handle both legacy votes (without election_id) and new election-scoped votes
      const hasElectionId = voteData.election_id !== undefined;
      
      if (hasElectionId) {
        // Election-scoped voting with composite key including election_id
        const result = await this.sql`
          INSERT INTO votes (voter_id, candidate_id, score, election_id)
          VALUES (${voteData.voter_id}, ${voteData.candidate_id}, ${voteData.score}, ${voteData.election_id})
          ON CONFLICT (voter_id, candidate_id, COALESCE(election_id, ''))
          DO UPDATE SET 
            score = EXCLUDED.score,
            created_at = NOW()
          RETURNING id, voter_id, candidate_id, score, election_id, created_at
        ` as any[];
        
        if (!Array.isArray(result) || result.length === 0) {
          throw new Error('Failed to create vote');
        }

        return {
          id: result[0].id,
          voter_id: result[0].voter_id,
          candidate_id: result[0].candidate_id,
          score: result[0].score,
          election_id: result[0].election_id,
          created_at: new Date(result[0].created_at)
        };
      } else {
        // Legacy voting without election_id (backward compatibility)
        const result = await this.sql`
          INSERT INTO votes (voter_id, candidate_id, score)
          VALUES (${voteData.voter_id}, ${voteData.candidate_id}, ${voteData.score})
          ON CONFLICT (voter_id, candidate_id) WHERE election_id IS NULL
          DO UPDATE SET 
            score = EXCLUDED.score,
            created_at = NOW()
          RETURNING id, voter_id, candidate_id, score, election_id, created_at
        ` as any[];
        
        if (!Array.isArray(result) || result.length === 0) {
          throw new Error('Failed to create vote');
        }

        return {
          id: result[0].id,
          voter_id: result[0].voter_id,
          candidate_id: result[0].candidate_id,
          score: result[0].score,
          election_id: result[0].election_id,
          created_at: new Date(result[0].created_at)
        };
      }
    } catch (error: any) {
      console.error('Database error creating/updating vote:', error);
      throw new Error('Failed to save vote');
    }
  }

  async getVoteResults(electionId?: string): Promise<VoteResult[]> {
    try {
      let result;
      
      if (electionId) {
        // Get results for specific election
        result = await this.sql`
          SELECT 
            candidate_id,
            SUM(score) as total_score,
            COUNT(*) as vote_count,
            AVG(score::numeric) as average_score,
            election_id
          FROM votes
          WHERE score > 0 AND election_id = ${electionId}
          GROUP BY candidate_id, election_id
          ORDER BY total_score DESC, average_score DESC
        ` as any[];
      } else {
        // Legacy behavior: get results for votes without election_id (backward compatibility)
        result = await this.sql`
          SELECT 
            candidate_id,
            SUM(score) as total_score,
            COUNT(*) as vote_count,
            AVG(score::numeric) as average_score,
            election_id
          FROM votes
          WHERE score > 0 AND election_id IS NULL
          GROUP BY candidate_id, election_id
          ORDER BY total_score DESC, average_score DESC
        ` as any[];
      }

      return result.map(row => ({
        candidate_id: row.candidate_id,
        total_score: parseInt(row.total_score, 10),
        vote_count: parseInt(row.vote_count, 10),
        average_score: parseFloat(row.average_score),
        election_id: row.election_id
      }));
    } catch (error) {
      console.error('Database error getting vote results:', error);
      throw new Error('Failed to get vote results');
    }
  }

  async getStarResults(electionId?: string): Promise<StarResult[]> {
    try {
      // Get initial vote totals
      const voteResults = await this.getVoteResults(electionId);
      
      if (voteResults.length < 2) {
        return voteResults.map(result => ({
          ...result,
          winner: true
        }));
      }

      // Get top 2 candidates by total score
      const topTwo = voteResults.slice(0, 2);
      const [first, second] = topTwo;

      // Build runoff query based on whether we have election_id
      let runoffResult;
      if (electionId) {
        runoffResult = await this.sql`
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
        ` as any[];
      } else {
        // Legacy runoff for votes without election_id
        runoffResult = await this.sql`
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
              (SELECT voter_id, score FROM votes WHERE candidate_id = ${first.candidate_id} AND election_id IS NULL) first
            FULL OUTER JOIN
              (SELECT voter_id, score FROM votes WHERE candidate_id = ${second.candidate_id} AND election_id IS NULL) second
            ON first.voter_id = second.voter_id
            WHERE 
              first.score IS NOT NULL AND second.score IS NOT NULL
              AND first.score != second.score
          ) runoff
          WHERE candidate_id IS NOT NULL
          GROUP BY candidate_id
          ORDER BY runoff_votes DESC
        ` as any[];
      }

      // Determine winner
      const runoffWinner = runoffResult.length > 0 ? runoffResult[0].candidate_id : first.candidate_id;

      return voteResults.map(result => ({
        ...result,
        runoff_votes: runoffResult.find(r => r.candidate_id === result.candidate_id)?.runoff_votes || 0,
        winner: result.candidate_id === runoffWinner
      }));
    } catch (error) {
      console.error('Database error getting STAR results:', error);
      throw new Error('Failed to get STAR results');
    }
  }

  async getVotesByVoter(voterId: string, electionId?: string): Promise<Vote[]> {
    try {
      let result;
      
      if (electionId) {
        result = await this.sql`
          SELECT id, voter_id, candidate_id, score, election_id, created_at
          FROM votes
          WHERE voter_id = ${voterId} AND election_id = ${electionId}
          ORDER BY created_at DESC
        ` as any[];
      } else {
        // Get all votes for voter across all elections
        result = await this.sql`
          SELECT id, voter_id, candidate_id, score, election_id, created_at
          FROM votes
          WHERE voter_id = ${voterId}
          ORDER BY created_at DESC
        ` as any[];
      }

      return result.map(row => ({
        id: row.id,
        voter_id: row.voter_id,
        candidate_id: row.candidate_id,
        score: row.score,
        election_id: row.election_id,
        created_at: new Date(row.created_at)
      }));
    } catch (error) {
      console.error('Database error getting votes by voter:', error);
      throw new Error('Failed to get voter history');
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