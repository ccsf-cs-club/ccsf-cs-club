import type { APIRoute } from 'astro';
import { getVoteResults, getStarResults, healthCheck } from '../../lib/db';
import { getCandidatesForElection } from '../../lib/elections';

export const prerender = false;

// Legacy static candidate data for backward compatibility
const legacyCandidates = [
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Learn modern web technologies like React, Vue, and TypeScript for building responsive websites and web applications'
  },
  {
    id: 'artificial-intelligence',
    name: 'Artificial Intelligence',
    description: 'Explore machine learning, neural networks, and AI algorithms to build intelligent systems and applications'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Master security principles, ethical hacking, and defense strategies to protect digital systems and data'
  },
  {
    id: 'data-science',
    name: 'Data Science',
    description: 'Analyze big data, create visualizations, and extract insights using Python, R, and statistical methods'
  },
  {
    id: 'mobile-development',
    name: 'Mobile Development',
    description: 'Build iOS and Android apps using native frameworks or cross-platform solutions like React Native'
  },
  {
    id: 'game-development',
    name: 'Game Development',
    description: 'Create engaging games using engines like Unity or Unreal, covering graphics, physics, and gameplay mechanics'
  }
];

// Function to get candidate data from election or fallback to legacy
async function getCandidateMetadata(electionSlug?: string) {
  if (electionSlug) {
    try {
      const candidates = await getCandidatesForElection(electionSlug);
      return candidates.map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        description: candidate.description,
        category: candidate.category,
        order: candidate.order
      }));
    } catch (error) {
      console.warn(`Failed to load candidates for election ${electionSlug}, falling back to legacy`);
    }
  }
  return legacyCandidates;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 100;

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const connectingIP = request.headers.get('cf-connecting-ip');
  
  return forwardedFor?.split(',')[0] || realIP || connectingIP || 'unknown';
}

function checkRateLimit(clientIP: string, electionId?: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  // Include election in rate limit key for per-election rate limiting if needed
  const key = electionId ? `rate_limit:${clientIP}:${electionId}` : `rate_limit:${clientIP}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true };
}

export const GET: APIRoute = async ({ request, url }) => {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  try {
    // Parse query parameters
    const format = url.searchParams.get('format') || 'star'; // 'star' or 'simple'
    const includeDetails = url.searchParams.get('include_details') === 'true';
    const candidateFilter = url.searchParams.get('candidate_id');
    const electionSlug = url.searchParams.get('election');
    
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(clientIP, electionSlug || undefined);
    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime ? new Date(rateLimitCheck.resetTime).toISOString() : 'unknown';
      
      return new Response(JSON.stringify({
        error: 'Too many requests. Please try again later.',
        resetTime: resetTime
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000).toString()
        }
      });
    }

    if (format && !['star', 'simple'].includes(format)) {
      return new Response(JSON.stringify({
        error: 'Invalid format. Use "star" or "simple".'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get candidate metadata from election or fallback to legacy
    const candidateMetadata = await getCandidateMetadata(electionSlug || undefined);

    // Get results based on format
    if (format === 'star') {
      // STAR voting results with runoff calculation
      const starResults = await getStarResults(electionSlug || undefined);
      
      // Filter by candidate if specified
      const filteredResults = candidateFilter 
        ? starResults.filter(result => result.candidate_id === candidateFilter)
        : starResults;

      // Transform to match frontend expectations
      const candidatesWithResults = filteredResults.map(result => {
        const candidate = candidateMetadata.find(c => c.id === result.candidate_id);
        return {
          candidate: candidate || {
            id: result.candidate_id,
            name: result.candidate_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: electionSlug ? 'Election Candidate' : 'CS Topic'
          },
          averageScore: result.average_score,
          totalStars: result.total_score,
          voteCount: result.vote_count,
          finalRoundScore: result.runoff_votes
        };
      });

      // Find winner candidate object
      const winnerResult = filteredResults.find(result => result.winner);
      const winnerCandidate = winnerResult ? candidateMetadata.find(c => c.id === winnerResult.candidate_id) : null;

      const response = {
        success: true,
        format: 'star',
        election: electionSlug || null,
        timestamp: new Date().toISOString(),
        candidates: candidatesWithResults.sort((a, b) => b.averageScore - a.averageScore),
        totalCandidates: candidatesWithResults.length,
        totalVotes: Math.max(...candidatesWithResults.map(c => c.voteCount), 0),
        winner: winnerCandidate || null,
        metadata: includeDetails ? {
          explanation: 'STAR voting uses score totals to select top 2 candidates, then automatic runoff between them based on pairwise preferences.',
          scoring_range: '0-5 stars per candidate',
          runoff_method: 'Automatic runoff between top 2 candidates by total score',
          election_info: electionSlug ? `Results for election: ${electionSlug}` : 'Legacy results (no election specified)'
        } : undefined
      };

      const processingTime = Date.now() - startTime;
      console.info(`STAR results retrieved from IP: ${clientIP} in ${processingTime}ms (${filteredResults.length} candidates)`);

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // Cache for 1 minute
        }
      });

    } else {
      // Simple score totals without runoff
      const simpleResults = await getVoteResults(electionSlug || undefined);
      
      // Filter by candidate if specified
      const filteredResults = candidateFilter 
        ? simpleResults.filter(result => result.candidate_id === candidateFilter)
        : simpleResults;

      // Transform to match frontend expectations
      const candidatesWithResults = filteredResults.map(result => {
        const candidate = candidateMetadata.find(c => c.id === result.candidate_id);
        return {
          candidate: candidate || {
            id: result.candidate_id,
            name: result.candidate_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: electionSlug ? 'Election Candidate' : 'CS Topic'
          },
          averageScore: result.average_score,
          totalStars: result.total_score,
          voteCount: result.vote_count,
          finalRoundScore: undefined
        };
      });

      // Winner is first (highest scoring) candidate
      const winnerCandidate = filteredResults.length > 0 ? candidateMetadata.find(c => c.id === filteredResults[0].candidate_id) : null;

      const response = {
        success: true,
        format: 'simple',
        election: electionSlug || null,
        timestamp: new Date().toISOString(),
        candidates: candidatesWithResults.sort((a, b) => b.totalStars - a.totalStars),
        totalCandidates: candidatesWithResults.length,
        totalVotes: Math.max(...candidatesWithResults.map(c => c.voteCount), 0),
        winner: winnerCandidate || null,
        metadata: includeDetails ? {
          explanation: 'Simple scoring results ranked by total score points.',
          scoring_range: '0-5 stars per candidate',
          ranking_method: 'Highest total score wins',
          election_info: electionSlug ? `Results for election: ${electionSlug}` : 'Legacy results (no election specified)'
        } : undefined
      };

      const processingTime = Date.now() - startTime;
      console.info(`Simple results retrieved from IP: ${clientIP} in ${processingTime}ms (${filteredResults.length} candidates)`);

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // Cache for 1 minute
        }
      });
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error(`Results retrieval error for IP: ${clientIP} in ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack,
      clientIP
    });

    return new Response(JSON.stringify({
      error: 'Internal server error. Please try again later.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Health check endpoint to verify results system is working
export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  try {
    // Rate limiting check (using default rate limit for health checks)
    const rateLimitCheck = checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime ? new Date(rateLimitCheck.resetTime).toISOString() : 'unknown';
      
      return new Response(JSON.stringify({
        error: 'Too many requests. Please try again later.',
        resetTime: resetTime
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000).toString()
        }
      });
    }

    // Test database connectivity and basic query performance
    const isHealthy = await healthCheck();
    
    if (!isHealthy) {
      return new Response(JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test vote results retrieval (legacy and election-scoped)
    const [legacySimpleResults, legacyStarResults] = await Promise.all([
      getVoteResults().catch(() => []),
      getStarResults().catch(() => [])
    ]);

    const processingTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime,
      available_formats: ['star', 'simple'],
      current_candidates: legacySimpleResults.length,
      star_algorithm_working: legacyStarResults.length > 0,
      supports_election_scoped_voting: true,
      version: '2.0.0'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error(`Results health check error for IP: ${clientIP} in ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack,
      clientIP
    });

    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime,
      error: 'Health check failed'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};