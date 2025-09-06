import type { APIRoute } from 'astro';
import { z } from 'zod';
import { upsertVote, getVotesByVoter } from '../../lib/db';
import { getElectionBySlug, validateCandidateId, canVoteInElection } from '../../lib/elections';

export const prerender = false;

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 100;

// Request deduplication store
const deduplicationStore = new Map<string, { timestamp: number; response: any }>();
const DEDUPLICATION_WINDOW = 5 * 60 * 1000; // 5 minutes

// Validation schema for vote submission
const voteSchema = z.object({
  voter_id: z.string()
    .min(1, 'Voter ID is required')
    .max(255, 'Voter ID must be less than 255 characters')
    .trim(),
  candidate_id: z.string()
    .min(1, 'Candidate ID is required')
    .max(255, 'Candidate ID must be less than 255 characters')
    .trim(),
  score: z.coerce.number()
    .int('Score must be an integer')
    .min(0, 'Score must be between 0 and 5')
    .max(5, 'Score must be between 0 and 5'),
  election: z.string()
    .min(1, 'Election slug is required')
    .max(255, 'Election slug must be less than 255 characters')
    .trim()
    .optional()
});

// Validation schema for batch vote submission
const batchVoteSchema = z.object({
  voter_id: z.string()
    .min(1, 'Voter ID is required')
    .max(255, 'Voter ID must be less than 255 characters')
    .trim(),
  votes: z.array(z.object({
    candidate_id: z.string()
      .min(1, 'Candidate ID is required')
      .max(255, 'Candidate ID must be less than 255 characters')
      .trim(),
    score: z.coerce.number()
      .int('Score must be an integer')
      .min(0, 'Score must be between 0 and 5')
      .max(5, 'Score must be between 0 and 5')
  }))
  .min(1, 'At least one vote is required')
  .max(50, 'Cannot submit more than 50 votes at once'),
  election: z.string()
    .min(1, 'Election slug is required')
    .max(255, 'Election slug must be less than 255 characters')
    .trim()
    .optional()
});

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const connectingIP = request.headers.get('cf-connecting-ip');
  
  return forwardedFor?.split(',')[0] || realIP || connectingIP || 'unknown';
}

function checkRateLimit(clientIP: string, electionId?: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  // Include election in rate limit key to allow per-election limits if needed
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

function createDeduplicationKey(clientIP: string, voterId: string, candidateId: string, electionId?: string): string {
  return electionId ? `${clientIP}:${voterId}:${candidateId}:${electionId}` : `${clientIP}:${voterId}:${candidateId}`;
}

function checkDeduplication(deduplicationKey: string): any | null {
  const now = Date.now();
  const record = deduplicationStore.get(deduplicationKey);

  if (record && (now - record.timestamp) < DEDUPLICATION_WINDOW) {
    return record.response;
  }

  // Clean up old records
  Array.from(deduplicationStore.entries()).forEach(([key, value]) => {
    if ((now - value.timestamp) >= DEDUPLICATION_WINDOW) {
      deduplicationStore.delete(key);
    }
  });

  return null;
}

function storeDeduplicationResponse(deduplicationKey: string, response: any): void {
  deduplicationStore.set(deduplicationKey, {
    timestamp: Date.now(),
    response: response
  });
}

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Parse request data early to get election for rate limiting
    const contentType = request.headers.get('content-type') || '';
    let rawData: any;

    if (contentType.includes('application/json')) {
      rawData = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      rawData = {
        voter_id: formData.get('voter_id')?.toString() || '',
        candidate_id: formData.get('candidate_id')?.toString() || '',
        score: formData.get('score')?.toString() || '',
        election: formData.get('election')?.toString() || undefined
      };
    } else {
      return new Response(JSON.stringify({
        error: 'Unsupported content type. Use application/json or form data.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const requestElectionSlug = rawData.election || rawData.votes?.[0]?.election;
    
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(clientIP, requestElectionSlug);
    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime ? new Date(rateLimitCheck.resetTime).toISOString() : 'unknown';
      
      console.warn(`Rate limit exceeded for IP: ${clientIP}. Reset time: ${resetTime}`);
      
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

    // Basic user agent validation
    if (userAgent === 'unknown' || userAgent.length < 10) {
      console.warn(`Suspicious user agent from IP: ${clientIP}, UA: ${userAgent}`);
    }

    // Request data already parsed above for rate limiting

    // Determine if this is a batch or single vote
    const isBatch = rawData.votes && Array.isArray(rawData.votes);
    
    // Validate input data
    const validationResult = isBatch 
      ? batchVoteSchema.safeParse(rawData)
      : voteSchema.safeParse(rawData);
      
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      
      console.warn(`Vote validation failed for IP: ${clientIP}. Errors: ${errors}`);
      
      return new Response(JSON.stringify({
        error: `Validation failed: ${errors}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validData = validationResult.data;
    
    // Election validation and candidate validation
    let election = null;
    const electionSlug = validData.election || (validData as any).votes?.[0]?.election;
    
    if (electionSlug) {
      election = await getElectionBySlug(electionSlug);
      if (!election) {
        return new Response(JSON.stringify({
          error: `Election '${electionSlug}' not found`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Check if voting is allowed
      const votingCheck = canVoteInElection(election, validData.voter_id);
      if (!votingCheck.canVote) {
        return new Response(JSON.stringify({
          error: votingCheck.reason || 'Voting not allowed in this election'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Database operations using Prisma

    if (isBatch) {
      // Handle batch vote submission
      const batchData = validData as z.infer<typeof batchVoteSchema>;
      const results = [];
      
      for (const vote of batchData.votes) {
        // Validate candidate exists in election if election is specified
        if (election && batchData.election) {
          const candidateExists = election.candidates?.some(c => c.id === vote.candidate_id);
          if (!candidateExists) {
            results.push({
              success: false,
              error: `Candidate '${vote.candidate_id}' not found in election '${batchData.election}'`,
              candidate_id: vote.candidate_id
            });
            continue;
          }
        }
        
        const deduplicationKey = createDeduplicationKey(clientIP, batchData.voter_id, vote.candidate_id, batchData.election);
        const existingResponse = checkDeduplication(deduplicationKey);
        
        if (existingResponse) {
          console.info(`Duplicate vote detected from IP: ${clientIP} for voter: ${batchData.voter_id}, candidate: ${vote.candidate_id}`);
          results.push(existingResponse);
          continue;
        }

        try {
          const savedVote = await upsertVote({
            voter_id: batchData.voter_id,
            candidate_id: vote.candidate_id,
            score: vote.score,
            election_id: batchData.election
          });

          const response = {
            success: true,
            message: 'Vote recorded successfully',
            vote: {
              id: savedVote.id,
              voter_id: savedVote.voter_id,
              candidate_id: savedVote.candidate_id,
              score: savedVote.score,
              created_at: savedVote.created_at
            }
          };

          storeDeduplicationResponse(deduplicationKey, response);
          results.push(response);
        } catch (error: any) {
          console.error(`Error saving vote for candidate ${vote.candidate_id}:`, error);
          results.push({
            success: false,
            error: `Failed to save vote for candidate ${vote.candidate_id}`,
            candidate_id: vote.candidate_id
          });
        }
      }

      const processingTime = Date.now() - startTime;
      console.info(`Batch vote submission: ${batchData.voter_id} from IP: ${clientIP} in ${processingTime}ms (${results.length} votes)`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch vote processing complete',
        results: results,
        total_votes: results.length,
        successful_votes: results.filter(r => r.success).length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // Handle single vote submission
      const singleData = validData as z.infer<typeof voteSchema>;
      
      // Validate candidate exists in election if election is specified
      if (election && singleData.election) {
        const candidateExists = election.candidates?.some(c => c.id === singleData.candidate_id);
        if (!candidateExists) {
          return new Response(JSON.stringify({
            error: `Candidate '${singleData.candidate_id}' not found in election '${singleData.election}'`
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      const deduplicationKey = createDeduplicationKey(clientIP, singleData.voter_id, singleData.candidate_id, singleData.election);
      const existingResponse = checkDeduplication(deduplicationKey);
      
      if (existingResponse) {
        console.info(`Duplicate vote detected from IP: ${clientIP} for voter: ${singleData.voter_id}, candidate: ${singleData.candidate_id}`);
        return new Response(JSON.stringify(existingResponse), {
          status: existingResponse.error ? 400 : 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const savedVote = await upsertVote({
        voter_id: singleData.voter_id,
        candidate_id: singleData.candidate_id,
        score: singleData.score,
        election_id: singleData.election
      });

      const response = {
        success: true,
        message: 'Vote recorded successfully',
        vote: {
          id: savedVote.id,
          voter_id: savedVote.voter_id,
          candidate_id: savedVote.candidate_id,
          score: savedVote.score,
          created_at: savedVote.created_at
        }
      };

      storeDeduplicationResponse(deduplicationKey, response);

      const processingTime = Date.now() - startTime;
      console.info(`Successful vote: voter ${singleData.voter_id}, candidate ${singleData.candidate_id} from IP: ${clientIP} in ${processingTime}ms`);

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    // Log unexpected errors with context
    console.error(`Vote submission error for IP: ${clientIP} in ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack,
      userAgent,
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

// Get votes for a specific voter
export const GET: APIRoute = async ({ request, url }) => {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  try {
    const voterId = url.searchParams.get('voter_id');
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
    
    if (!voterId) {
      return new Response(JSON.stringify({
        error: 'voter_id parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (voterId.length > 255) {
      return new Response(JSON.stringify({
        error: 'voter_id must be less than 255 characters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const votes = await getVotesByVoter(voterId);
    
    // Filter by election if specified
    const filteredVotes = electionSlug 
      ? votes.filter(vote => vote.election_id === electionSlug)
      : votes;

    const processingTime = Date.now() - startTime;
    console.info(`Vote history retrieved for voter: ${voterId}${electionSlug ? ` in election: ${electionSlug}` : ''} from IP: ${clientIP} in ${processingTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      voter_id: voterId,
      election: electionSlug || null,
      votes: filteredVotes.map(vote => ({
        id: vote.id,
        voter_id: vote.voter_id,
        candidate_id: vote.candidate_id,
        score: vote.score,
        election_id: vote.election_id,
        created_at: vote.created_at
      })),
      total_votes: filteredVotes.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error(`Vote history error for IP: ${clientIP} in ${processingTime}ms:`, {
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