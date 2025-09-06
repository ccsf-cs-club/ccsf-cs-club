import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPrismaClient, userOperations, voteOperations, systemOperations, electionOperations, candidateOperations } from '../lib/prisma';

describe('Prisma Database Operations', () => {
  beforeAll(async () => {
    // Ensure we have database connectivity
    const isHealthy = await systemOperations.healthCheck();
    expect(isHealthy).toBe(true);
  });

  afterAll(async () => {
    await systemOperations.disconnect();
  });

  it('should perform health check successfully', async () => {
    const result = await systemOperations.healthCheck();
    expect(result).toBe(true);
  });

  it('should check if email exists', async () => {
    const exists = await userOperations.checkEmailExists('test@example.com');
    expect(typeof exists).toBe('boolean');
  });

  it('should get user count', async () => {
    const count = await userOperations.count();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should upsert votes (STAR voting)', async () => {
    const testVoteData = {
      voterId: 'test-voter-' + Date.now(),
      candidateId: 'candidate-1',
      score: 5
    };

    // Create initial vote
    const vote1 = await voteOperations.upsert(testVoteData);
    expect(vote1.score).toBe(5);
    expect(vote1.voterId).toBe(testVoteData.voterId);
    expect(vote1.candidateId).toBe(testVoteData.candidateId);

    // Update the same vote (upsert functionality)
    const updatedVoteData = { ...testVoteData, score: 3 };
    const vote2 = await voteOperations.upsert(updatedVoteData);
    expect(vote2.score).toBe(3);
    expect(vote2.id).toBe(vote1.id); // Same vote, just updated
  });

  it('should get vote results', async () => {
    const results = await voteOperations.getResults();
    expect(Array.isArray(results)).toBe(true);
    
    if (results.length > 0) {
      const firstResult = results[0];
      expect(firstResult).toHaveProperty('candidate_id');
      expect(firstResult).toHaveProperty('total_score');
      expect(firstResult).toHaveProperty('vote_count');
      expect(firstResult).toHaveProperty('average_score');
      expect(typeof firstResult.total_score).toBe('number');
      expect(typeof firstResult.vote_count).toBe('number');
      expect(typeof firstResult.average_score).toBe('number');
    }
  });

  it('should get STAR voting results with runoff calculation', async () => {
    const results = await voteOperations.getStarResults();
    expect(Array.isArray(results)).toBe(true);
    
    if (results.length > 0) {
      const firstResult = results[0];
      expect(firstResult).toHaveProperty('candidate_id');
      expect(firstResult).toHaveProperty('total_score');
      expect(firstResult).toHaveProperty('vote_count');
      expect(firstResult).toHaveProperty('average_score');
      expect(firstResult).toHaveProperty('runoff_votes');
      expect(firstResult).toHaveProperty('winner');
      expect(typeof firstResult.winner).toBe('boolean');
    }
  });

  it('should get votes by voter', async () => {
    const testVoterId = 'test-voter-history';
    
    // Create a test vote first
    await voteOperations.upsert({
      voterId: testVoterId,
      candidateId: 'candidate-history-test',
      score: 4
    });

    const votes = await voteOperations.getByVoter(testVoterId);
    expect(Array.isArray(votes)).toBe(true);
    
    const testVote = votes.find(v => v.candidateId === 'candidate-history-test');
    expect(testVote).toBeDefined();
    expect(testVote?.score).toBe(4);
  });

  describe('Election Operations', () => {
    const testElectionId = 'test-election-' + Date.now();
    const testElectionSlug = 'test-slug-' + Date.now();

    it('should create an election', async () => {
      const electionData = {
        id: testElectionId,
        slug: testElectionSlug,
        title: 'Test Election',
        status: 'draft',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // 1 day from now
        settings: { votingType: 'STAR' }
      };

      const election = await electionOperations.create(electionData);
      expect(election.id).toBe(testElectionId);
      expect(election.title).toBe('Test Election');
      expect(election.status).toBe('draft');
    });

    it('should get election by ID', async () => {
      const election = await electionOperations.getById(testElectionId);
      expect(election).toBeDefined();
      expect(election?.id).toBe(testElectionId);
      expect(election?.slug).toBe(testElectionSlug);
    });

    it('should get election by slug', async () => {
      const election = await electionOperations.getBySlug(testElectionSlug);
      expect(election).toBeDefined();
      expect(election?.id).toBe(testElectionId);
      expect(election?.slug).toBe(testElectionSlug);
    });

    it('should update election status', async () => {
      const updatedElection = await electionOperations.updateStatus(testElectionId, 'active');
      expect(updatedElection.status).toBe('active');
    });

    it('should create candidates for election', async () => {
      const candidateData = {
        id: 'test-candidate-' + Date.now(),
        electionId: testElectionId,
        candidateId: 'alice',
        name: 'Alice Smith',
        description: 'Test candidate',
        order: 1
      };

      const candidate = await candidateOperations.create(candidateData);
      expect(candidate.name).toBe('Alice Smith');
      expect(candidate.electionId).toBe(testElectionId);
    });

    it('should get candidates by election', async () => {
      const candidates = await candidateOperations.getByElection(testElectionId);
      expect(Array.isArray(candidates)).toBe(true);
      expect(candidates.length).toBeGreaterThan(0);
      
      const alice = candidates.find(c => c.candidateId === 'alice');
      expect(alice).toBeDefined();
      expect(alice?.name).toBe('Alice Smith');
    });

    it('should validate candidate exists in election', async () => {
      const isValid = await candidateOperations.validate(testElectionId, 'alice');
      expect(isValid).toBe(true);
      
      const isInvalid = await candidateOperations.validate(testElectionId, 'nonexistent');
      expect(isInvalid).toBe(false);
    });

    it('should handle votes with election ID', async () => {
      const voteData = {
        voterId: 'test-voter-' + Date.now(),
        candidateId: 'alice',
        electionId: testElectionId,
        score: 5
      };

      const vote = await voteOperations.upsert(voteData);
      expect(vote.electionId).toBe(testElectionId);
      expect(vote.score).toBe(5);
    });

    it('should get vote results by election', async () => {
      const results = await voteOperations.getResults(testElectionId);
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const aliceResult = results.find(r => r.candidate_id === 'alice');
        expect(aliceResult).toBeDefined();
        expect(aliceResult?.total_score).toBeGreaterThan(0);
      }
    });

    it('should get STAR results by election', async () => {
      const results = await voteOperations.getStarResults(testElectionId);
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const aliceResult = results.find(r => r.candidate_id === 'alice');
        expect(aliceResult).toBeDefined();
        expect(typeof aliceResult?.winner).toBe('boolean');
      }
    });
  });
});