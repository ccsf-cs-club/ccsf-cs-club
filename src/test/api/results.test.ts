import { describe, it, expect, vi, beforeEach } from 'vitest';
import { experimental_AstroContainer } from 'astro/container';
import { GET, POST } from '../../pages/api/results.ts';

// Mock database module
const mockDb = {
  getStarResults: vi.fn(),
  getVoteResults: vi.fn(),
  healthCheck: vi.fn(),
};

vi.mock('../../lib/db', () => ({
  getDatabase: () => mockDb
}));

describe('/api/results API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET endpoint', () => {
    it('should return STAR voting results with proper finalRoundScore handling', async () => {
      // Mock database response that simulates real data structure
      const mockStarResults = [
        {
          candidate_id: 'web-development',
          average_score: 4.2,
          total_score: 21,
          vote_count: 5,
          runoff_votes: 8, // Top candidate with runoff votes
          winner: true
        },
        {
          candidate_id: 'artificial-intelligence', 
          average_score: 3.8,
          total_score: 19,
          vote_count: 5,
          runoff_votes: 7, // Second place with runoff votes
          winner: false
        },
        {
          candidate_id: 'cybersecurity',
          average_score: 3.2,
          total_score: 16,
          vote_count: 5,
          runoff_votes: undefined, // This is the problematic case that caused the bug
          winner: false
        }
      ];

      mockDb.getStarResults.mockResolvedValue(mockStarResults);

      // Create test request
      const request = new Request('http://localhost:4321/api/results?format=star');
      const url = new URL(request.url);

      // Call the API endpoint
      const response = await GET({ request, url });
      const data = await response.json();

      // Verify response structure
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.format).toBe('star');
      expect(data.candidates).toHaveLength(3);

      // Test finalRoundScore handling - this is the key test for our bug fix
      const candidates = data.candidates;
      
      // Winner should have finalRoundScore
      const winner = candidates.find((c: any) => c.candidate.id === 'web-development');
      expect(winner.finalRoundScore).toBe(8);

      // Second place should have finalRoundScore  
      const secondPlace = candidates.find((c: any) => c.candidate.id === 'artificial-intelligence');
      expect(secondPlace.finalRoundScore).toBe(7);

      // Non-runoff candidate should have undefined finalRoundScore (this was causing the bug)
      const nonRunoff = candidates.find((c: any) => c.candidate.id === 'cybersecurity');
      expect(nonRunoff.finalRoundScore).toBeUndefined();

      // Verify winner is properly identified
      expect(data.winner).toBeTruthy();
      expect(data.winner.id).toBe('web-development');
    });

    it('should handle simple voting results without runoff scores', async () => {
      const mockSimpleResults = [
        {
          candidate_id: 'web-development',
          average_score: 4.2,
          total_score: 21,
          vote_count: 5
        },
        {
          candidate_id: 'artificial-intelligence',
          average_score: 3.8, 
          total_score: 19,
          vote_count: 5
        }
      ];

      mockDb.getVoteResults.mockResolvedValue(mockSimpleResults);

      const request = new Request('http://localhost:4321/api/results?format=simple');
      const url = new URL(request.url);

      const response = await GET({ request, url });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.format).toBe('simple');
      
      // All candidates should have undefined finalRoundScore in simple format
      data.candidates.forEach((candidate: any) => {
        expect(candidate.finalRoundScore).toBeUndefined();
      });
    });

    it('should handle database errors gracefully', async () => {
      mockDb.getStarResults.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost:4321/api/results?format=star');
      const url = new URL(request.url);

      const response = await GET({ request, url });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error. Please try again later.');
    });

    it('should handle rate limiting', async () => {
      // Create many requests quickly to trigger rate limiting
      const requests = Array.from({ length: 101 }, (_, i) => {
        const request = new Request('http://localhost:4321/api/results?format=star', {
          headers: { 'x-forwarded-for': '127.0.0.1' }
        });
        const url = new URL(request.url);
        return GET({ request, url });
      });

      // Wait for all requests
      const responses = await Promise.all(requests);
      
      // Some should be rate limited (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('POST endpoint (health check)', () => {
    it('should return healthy status when database is working', async () => {
      mockDb.healthCheck.mockResolvedValue(true);
      mockDb.getVoteResults.mockResolvedValue([]);
      mockDb.getStarResults.mockResolvedValue([]);

      const request = new Request('http://localhost:4321/api/results', { method: 'POST' });

      const response = await POST({ request });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.available_formats).toEqual(['star', 'simple']);
    });

    it('should return unhealthy status when database fails', async () => {
      mockDb.healthCheck.mockResolvedValue(false);

      const request = new Request('http://localhost:4321/api/results', { method: 'POST' });

      const response = await POST({ request });
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.error).toBe('Database connection failed');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty results gracefully', async () => {
      mockDb.getStarResults.mockResolvedValue([]);

      const request = new Request('http://localhost:4321/api/results?format=star');
      const url = new URL(request.url);

      const response = await GET({ request, url });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.candidates).toHaveLength(0);
      expect(data.totalVotes).toBe(0);
      expect(data.winner).toBeNull();
    });

    it('should validate format parameter', async () => {
      const request = new Request('http://localhost:4321/api/results?format=invalid');
      const url = new URL(request.url);

      const response = await GET({ request, url });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid format. Use "star" or "simple".');
    });

    it('should handle malformed runoff_votes data', async () => {
      const mockMalformedResults = [
        {
          candidate_id: 'web-development',
          average_score: 4.2,
          total_score: 21,
          vote_count: 5,
          runoff_votes: null, // null instead of undefined
          winner: false
        },
        {
          candidate_id: 'artificial-intelligence',
          average_score: 3.8,
          total_score: 19,
          vote_count: 5,
          runoff_votes: "not-a-number", // string instead of number
          winner: false
        }
      ];

      mockDb.getStarResults.mockResolvedValue(mockMalformedResults);

      const request = new Request('http://localhost:4321/api/results?format=star');
      const url = new URL(request.url);

      const response = await GET({ request, url });
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Verify API handles malformed data gracefully
      const candidates = data.candidates;
      expect(candidates[0].finalRoundScore).toBeNull();
      expect(candidates[1].finalRoundScore).toBe("not-a-number");
    });
  });
});