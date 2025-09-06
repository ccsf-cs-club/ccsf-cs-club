import { describe, it, expect, vi, beforeEach } from 'vitest';
import { experimental_AstroContainer } from 'astro/container';
import ResultsPage from '../../pages/results.astro';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Results Page Integration Tests', () => {
  let container: any;

  beforeEach(async () => {
    container = await experimental_AstroContainer.create();
    vi.clearAllMocks();
  });

  describe('Client-side JavaScript runtime errors', () => {
    it('should handle finalRoundScore.toFixed errors gracefully', async () => {
      // Mock API response that triggers the original bug
      const mockApiResponse = {
        success: true,
        format: 'star',
        candidates: [
          {
            candidate: { id: 'web-development', name: 'Web Development' },
            averageScore: 4.2,
            totalStars: 21,
            voteCount: 5,
            finalRoundScore: 8 // Valid number
          },
          {
            candidate: { id: 'artificial-intelligence', name: 'AI' },
            averageScore: 3.8,
            totalStars: 19,
            voteCount: 5,
            finalRoundScore: 7 // Valid number
          },
          {
            candidate: { id: 'cybersecurity', name: 'Cybersecurity' },
            averageScore: 3.2,
            totalStars: 16,
            voteCount: 5,
            finalRoundScore: undefined // This was causing the bug!
          }
        ],
        winner: { id: 'web-development', name: 'Web Development' },
        totalVotes: 5,
        totalCandidates: 3
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      // Render the results page
      const result = await container.renderToString(ResultsPage);

      // Verify the page renders without runtime errors
      expect(result).toBeDefined();
      expect(result).toContain('STAR Voting Results');

      // Check that the fix is applied - look for null-safe toFixed usage
      expect(result).toContain('finalRoundScore?.toFixed(2) || \'N/A\'');
      
      // Verify it doesn't contain the unsafe version
      expect(result).not.toContain('finalRoundScore.toFixed(2)');
    });

    it('should properly render candidates without finalRoundScore', async () => {
      const mockApiResponse = {
        success: true,
        format: 'simple', // Simple format has no runoff scores
        candidates: [
          {
            candidate: { id: 'web-development', name: 'Web Development' },
            averageScore: 4.2,
            totalStars: 21,
            voteCount: 5,
            finalRoundScore: undefined // No runoff in simple format
          },
          {
            candidate: { id: 'artificial-intelligence', name: 'AI' },
            averageScore: 3.8,
            totalStars: 19,
            voteCount: 5,
            finalRoundScore: undefined // No runoff in simple format
          }
        ],
        winner: { id: 'web-development', name: 'Web Development' },
        totalVotes: 5,
        totalCandidates: 2
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const result = await container.renderToString(ResultsPage);

      // Page should render successfully even with all undefined finalRoundScore values
      expect(result).toContain('STAR Voting Results');
      expect(result).toContain('Web Development');
      expect(result).toContain('AI');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await container.renderToString(ResultsPage);

      // Page should still render with error handling
      expect(result).toContain('STAR Voting Results');
      expect(result).toContain('Failed to load voting results');
      expect(result).toContain('Retry');
    });

    it('should handle malformed API responses', async () => {
      // Response missing required fields
      const malformedResponse = {
        success: true,
        candidates: null, // This could break things
        winner: undefined
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(malformedResponse)
      });

      const result = await container.renderToString(ResultsPage);

      // Should render without crashing
      expect(result).toContain('STAR Voting Results');
    });
  });

  describe('Frontend JavaScript behavior validation', () => {
    it('should contain proper null-safe JavaScript for finalRoundScore', async () => {
      const result = await container.renderToString(ResultsPage);

      // Verify the JavaScript contains the fixed null-safe version
      expect(result).toMatch(/finalRoundScore\?\s*\.\s*toFixed\s*\(\s*2\s*\)\s*\|\|\s*['"']N\/A['"']/);
      
      // And make sure we don't have any unsafe .toFixed calls
      expect(result).not.toMatch(/finalRoundScore\.toFixed\(2\)/);
    });

    it('should have consistent finalRoundScore handling in both locations', async () => {
      const result = await container.renderToString(ResultsPage);

      // Count occurrences of the safe pattern
      const safePatternMatches = result.match(/finalRoundScore\?\s*\.\s*toFixed\s*\(\s*2\s*\)\s*\|\|\s*['"']N\/A['"']/g) || [];
      
      // Should have at least 2 occurrences (candidates grid and stats table)
      expect(safePatternMatches.length).toBeGreaterThanOrEqual(2);
    });

    it('should validate TypeScript interfaces match API response', async () => {
      const result = await container.renderToString(ResultsPage);

      // Check that TypeScript interfaces are properly defined
      expect(result).toContain('interface VoteResult');
      expect(result).toContain('finalRoundScore?: number');
      expect(result).toContain('interface VotingResults');
    });
  });

  describe('Visual rendering with different data scenarios', () => {
    it('should render winner announcement correctly', async () => {
      const mockApiResponse = {
        success: true,
        format: 'star',
        candidates: [
          {
            candidate: { id: 'web-development', name: 'Web Development' },
            averageScore: 4.2,
            totalStars: 21,
            voteCount: 5,
            finalRoundScore: 8
          }
        ],
        winner: { id: 'web-development', name: 'Web Development' },
        totalVotes: 5,
        totalCandidates: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const result = await container.renderToString(ResultsPage);

      expect(result).toContain('🏆 Winner');
      expect(result).toContain('Web Development');
    });

    it('should handle empty results gracefully', async () => {
      const emptyResponse = {
        success: true,
        format: 'star',
        candidates: [],
        winner: null,
        totalVotes: 0,
        totalCandidates: 0
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyResponse)
      });

      const result = await container.renderToString(ResultsPage);

      expect(result).toContain('STAR Voting Results');
      // Should not crash with empty data
    });
  });
});