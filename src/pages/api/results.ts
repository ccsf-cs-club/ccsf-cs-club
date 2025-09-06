import type { APIRoute } from 'astro';
import { getDatabase } from '../../lib/db';

export const prerender = false;

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

function checkRateLimit(clientIP: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const key = `rate_limit:${clientIP}`;
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
    // Rate limiting check
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

    // Parse query parameters
    const format = url.searchParams.get('format') || 'star'; // 'star' or 'simple'
    const includeDetails = url.searchParams.get('include_details') === 'true';
    const candidateFilter = url.searchParams.get('candidate_id');

    if (format && !['star', 'simple'].includes(format)) {
      return new Response(JSON.stringify({
        error: 'Invalid format. Use "star" or "simple".'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = getDatabase();

    // Get results based on format
    if (format === 'star') {
      // STAR voting results with runoff calculation
      const starResults = await db.getStarResults();
      
      // Filter by candidate if specified
      const filteredResults = candidateFilter 
        ? starResults.filter(result => result.candidate_id === candidateFilter)
        : starResults;

      const response = {
        success: true,
        format: 'star',
        timestamp: new Date().toISOString(),
        results: filteredResults,
        total_candidates: filteredResults.length,
        winner: filteredResults.find(result => result.winner) || null,
        metadata: includeDetails ? {
          explanation: 'STAR voting uses score totals to select top 2 candidates, then automatic runoff between them based on pairwise preferences.',
          scoring_range: '0-5 stars per candidate',
          runoff_method: 'Automatic runoff between top 2 candidates by total score'
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
      const simpleResults = await db.getVoteResults();
      
      // Filter by candidate if specified
      const filteredResults = candidateFilter 
        ? simpleResults.filter(result => result.candidate_id === candidateFilter)
        : simpleResults;

      const response = {
        success: true,
        format: 'simple',
        timestamp: new Date().toISOString(),
        results: filteredResults,
        total_candidates: filteredResults.length,
        winner: filteredResults[0] || null,
        metadata: includeDetails ? {
          explanation: 'Simple scoring results ranked by total score points.',
          scoring_range: '0-5 stars per candidate',
          ranking_method: 'Highest total score wins'
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
    // Rate limiting check
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

    const db = getDatabase();
    
    // Test database connectivity and basic query performance
    const isHealthy = await db.healthCheck();
    
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

    // Test vote results retrieval
    const [simpleResults, starResults] = await Promise.all([
      db.getVoteResults().catch(() => []),
      db.getStarResults().catch(() => [])
    ]);

    const processingTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime,
      available_formats: ['star', 'simple'],
      current_candidates: simpleResults.length,
      star_algorithm_working: starResults.length > 0,
      version: '1.0.0'
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