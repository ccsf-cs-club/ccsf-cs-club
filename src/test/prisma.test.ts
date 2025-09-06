import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPrismaClient, userOperations, voteOperations, systemOperations } from '../lib/prisma';

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
});