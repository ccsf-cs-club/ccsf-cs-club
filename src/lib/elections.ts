import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
// Removed Prisma dependencies - using content collections only

export type ElectionContent = CollectionEntry<'elections'>;
export type ElectionCandidate = ElectionContent['data']['candidates'][0];

export interface ElectionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ElectionStatus {
  phase: 'draft' | 'nomination' | 'voting' | 'completed' | 'cancelled';
  isActive: boolean;
  canVote: boolean;
  daysRemaining: number | null;
}

/**
 * Load all election configurations from Astro content collections
 */
export async function getActiveElections(): Promise<ElectionContent[]> {
  try {
    const elections = await getCollection('elections');
    const now = new Date();
    
    return elections.filter(election => {
      const { data } = election;
      return data.status === 'voting' &&
             data.startDate <= now &&
             data.endDate >= now;
    });
  } catch (error) {
    console.error('Failed to load active elections:', error);
    throw new Error('Unable to load active elections');
  }
}

/**
 * Get election by slug from content collections
 */
export async function getElectionBySlug(slug: string): Promise<ElectionContent | null> {
  try {
    const election = await getEntry('elections', slug);
    return election || null;
  } catch (error) {
    console.error(`Failed to load election with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Validate election status and configuration
 */
export async function validateElectionStatus(election: ElectionContent): Promise<ElectionValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { data } = election;

  // Date validation
  const now = new Date();
  if (data.startDate > data.endDate) {
    errors.push('Start date must be before end date');
  }

  if (data.nominationStartDate && data.nominationEndDate) {
    if (data.nominationStartDate > data.nominationEndDate) {
      errors.push('Nomination start date must be before nomination end date');
    }
    if (data.nominationEndDate > data.startDate) {
      warnings.push('Nomination period overlaps with voting period');
    }
  }

  // Status validation
  const validStatuses = ['draft', 'nomination', 'voting', 'completed', 'cancelled'];
  if (!validStatuses.includes(data.status)) {
    errors.push(`Invalid status: ${data.status}`);
  }

  // Status-date consistency
  if (data.status === 'voting' && data.startDate > now) {
    warnings.push('Election marked as voting but start date is in the future');
  }
  if (data.status === 'completed' && data.endDate > now) {
    warnings.push('Election marked as completed but end date is in the future');
  }

  // Candidate validation
  if (data.candidates.length === 0) {
    errors.push('Election must have at least one candidate');
  }

  // Check for duplicate candidate IDs
  const candidateIds = data.candidates.map(c => c.id);
  const duplicateIds = candidateIds.filter((id, index) => candidateIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate candidate IDs found: ${duplicateIds.join(', ')}`);
  }

  // Voting method validation
  if (data.votingMethod === 'multi-choice' && !data.maxChoices) {
    errors.push('Multi-choice voting requires maxChoices setting');
  }
  if (data.votingMethod === 'score-based' && data.maxScore > 5) {
    warnings.push('Score-based voting with maxScore > 5 may not work with database schema');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get candidates for a specific election
 */
export async function getCandidatesForElection(electionSlug: string): Promise<ElectionCandidate[]> {
  try {
    const election = await getElectionBySlug(electionSlug);
    if (!election) {
      throw new Error(`Election with slug "${electionSlug}" not found`);
    }

    return election.data.candidates.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error(`Failed to get candidates for election "${electionSlug}":`, error);
    throw new Error(`Unable to load candidates for election: ${electionSlug}`);
  }
}

/**
 * Validate if a candidate ID exists in an election
 */
export async function validateCandidateId(electionSlug: string, candidateId: string): Promise<boolean> {
  try {
    const candidates = await getCandidatesForElection(electionSlug);
    return candidates.some(candidate => candidate.id === candidateId);
  } catch (error) {
    console.error(`Failed to validate candidate "${candidateId}" in election "${electionSlug}":`, error);
    return false;
  }
}

/**
 * Get election status and phase information
 */
export function getElectionStatus(election: ElectionContent): ElectionStatus {
  const { data } = election;
  const now = new Date();
  
  // Calculate days remaining
  const endTime = data.endDate.getTime();
  const nowTime = now.getTime();
  const daysRemaining = endTime > nowTime ? Math.ceil((endTime - nowTime) / (1000 * 60 * 60 * 24)) : null;

  // Determine phase
  let phase: ElectionStatus['phase'] = data.status as ElectionStatus['phase'];
  
  // Override phase based on dates if status is not manually set
  if (data.status === 'draft' || data.status === 'voting') {
    if (data.nominationStartDate && data.nominationEndDate) {
      if (now >= data.nominationStartDate && now <= data.nominationEndDate) {
        phase = 'nomination';
      }
    }
    
    if (now >= data.startDate && now <= data.endDate && phase !== 'nomination') {
      phase = 'voting';
    }
    
    if (now > data.endDate) {
      phase = 'completed';
    }
  }

  const isActive = phase === 'voting' || phase === 'nomination';
  const canVote = phase === 'voting';

  return {
    phase,
    isActive,
    canVote,
    daysRemaining
  };
}

/**
 * Sync election content to database - REMOVED
 * Elections now work purely with Astro content collections
 */
// export async function syncElectionToDatabase() - removed for Neon-only approach

/**
 * Get election configuration from content collections only
 */
export async function getElectionConfiguration(slug: string): Promise<{
  content: ElectionContent;
  status: ElectionStatus;
  validation: ElectionValidationResult;
} | null> {
  try {
    // Get content from Astro collections
    const content = await getElectionBySlug(slug);
    if (!content) {
      return null;
    }

    // Get election status
    const status = getElectionStatus(content);
    
    // Validate election
    const validation = await validateElectionStatus(content);

    return {
      content,
      status,
      validation
    };
  } catch (error) {
    console.error(`Failed to get election configuration for "${slug}":`, error);
    return null;
  }
}

/**
 * Get all elections with their status
 */
export async function getAllElections(): Promise<Array<{
  content: ElectionContent;
  status: ElectionStatus;
  validation: ElectionValidationResult;
}>> {
  try {
    const elections = await getCollection('elections');
    
    return await Promise.all(
      elections.map(async (election) => ({
        content: election,
        status: getElectionStatus(election),
        validation: await validateElectionStatus(election)
      }))
    );
  } catch (error) {
    console.error('Failed to load all elections:', error);
    throw new Error('Unable to load elections');
  }
}

/**
 * Check if voting is allowed for an election
 */
export function canVoteInElection(election: ElectionContent, voterId?: string): {
  canVote: boolean;
  reason?: string;
} {
  const status = getElectionStatus(election);
  
  if (!status.canVote) {
    return { 
      canVote: false, 
      reason: status.phase === 'completed' ? 'Election has ended' :
              status.phase === 'draft' ? 'Election has not started' :
              status.phase === 'nomination' ? 'Currently in nomination phase' :
              status.phase === 'cancelled' ? 'Election was cancelled' :
              'Voting is not currently allowed'
    };
  }

  const { voterEligibility } = election.data;
  
  // Check membership requirements
  if (voterEligibility.requireMembership && !voterId) {
    return { canVote: false, reason: 'Membership required to vote' };
  }

  return { canVote: true };
}

// Re-export error classes
export { ElectionNotFoundError, InvalidElectionError, VotingNotAllowedError } from './election-errors';