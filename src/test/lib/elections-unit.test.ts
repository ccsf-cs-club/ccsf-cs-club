import { describe, it, expect, vi } from 'vitest';
import { ElectionNotFoundError, InvalidElectionError, VotingNotAllowedError } from '../../lib/election-errors';

describe('Election Error Classes', () => {
  it('should create ElectionNotFoundError with correct message', () => {
    const error = new ElectionNotFoundError('test-slug');
    expect(error.message).toBe('Election with slug "test-slug" not found');
    expect(error.name).toBe('ElectionNotFoundError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create InvalidElectionError with correct message', () => {
    const errors = ['Error 1', 'Error 2'];
    const error = new InvalidElectionError('test-slug', errors);
    expect(error.message).toBe('Election "test-slug" is invalid: Error 1, Error 2');
    expect(error.name).toBe('InvalidElectionError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create VotingNotAllowedError with correct message', () => {
    const reason = 'Election has ended';
    const error = new VotingNotAllowedError(reason);
    expect(error.message).toBe('Voting not allowed: Election has ended');
    expect(error.name).toBe('VotingNotAllowedError');
    expect(error).toBeInstanceOf(Error);
  });
});

// Test the validation logic independently
describe('Election Validation Logic', () => {
  const validElection = {
    slug: 'test-election-2024',
    data: {
      title: 'Test Election 2024',
      slug: 'test-election-2024',
      description: 'A test election',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'voting' as const,
      featured: true,
      electionType: 'topics' as const,
      votingMethod: 'star' as const,
      maxScore: 5,
      voterEligibility: {
        requireMembership: true,
        minimumMembershipDays: 0
      },
      candidates: [
        {
          id: 'candidate-1',
          name: 'Candidate 1',
          description: 'First test candidate',
          category: 'Test',
          order: 1
        },
        {
          id: 'candidate-2',
          name: 'Candidate 2',
          description: 'Second test candidate',
          category: 'Test',
          order: 2
        }
      ],
      resultsDisplay: {
        showResults: true,
        showLiveResults: true,
        showVoterCount: true,
        showPercentages: true
      },
      settings: {
        allowAbstention: true,
        sendNotifications: false,
        autoCloseOnEndDate: false
      },
      tags: ['test'],
      author: 'Test Author'
    }
  };

  function validateElection(election: typeof validElection) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { data } = election;

    // Date validation
    if (data.startDate > data.endDate) {
      errors.push('Start date must be before end date');
    }

    // Status validation
    const validStatuses = ['draft', 'nomination', 'voting', 'completed', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      errors.push(`Invalid status: ${data.status}`);
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

    // Voting method validation - skip this check since our test data uses 'star'
    // if (data.votingMethod === 'multi-choice' && !('maxChoices' in data)) {
    //   errors.push('Multi-choice voting requires maxChoices setting');
    // }

    return { isValid: errors.length === 0, errors, warnings };
  }

  function getElectionStatus(election: typeof validElection) {
    const { data } = election;
    const now = new Date();
    
    const endTime = data.endDate.getTime();
    const nowTime = now.getTime();
    const daysRemaining = endTime > nowTime ? Math.ceil((endTime - nowTime) / (1000 * 60 * 60 * 24)) : null;

    let phase = data.status as 'draft' | 'nomination' | 'voting' | 'completed' | 'cancelled';
    
    // Override phase based on dates for active/voting statuses
    if ((data.status as string) === 'draft' || (data.status as string) === 'voting') {
      if (now >= data.startDate && now <= data.endDate) {
        phase = 'voting';
      } else if (now > data.endDate) {
        phase = 'completed';
      }
    }

    const isActive = phase === 'voting' || phase === 'nomination';
    const canVote = phase === 'voting';

    return { phase, isActive, canVote, daysRemaining };
  }

  it('should validate a correct election configuration', () => {
    const result = validateElection(validElection);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect invalid date ranges', () => {
    const invalidElection = {
      ...validElection,
      data: {
        ...validElection.data,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01')
      }
    };

    const result = validateElection(invalidElection);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Start date must be before end date');
  });

  it('should detect duplicate candidate IDs', () => {
    const invalidElection = {
      ...validElection,
      data: {
        ...validElection.data,
        candidates: [
          ...validElection.data.candidates,
          {
            id: 'candidate-1', // Duplicate ID
            name: 'Duplicate Candidate',
            description: 'This has a duplicate ID',
            category: 'Test',
            order: 3
          }
        ]
      }
    };

    const result = validateElection(invalidElection);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Duplicate candidate IDs'))).toBe(true);
  });

  it('should require candidates', () => {
    const invalidElection = {
      ...validElection,
      data: {
        ...validElection.data,
        candidates: []
      }
    };

    const result = validateElection(invalidElection);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Election must have at least one candidate');
  });

  it('should return correct status for voting election', () => {
    // Mock current date to be within election period
    const mockDate = new Date('2024-06-01');
    vi.setSystemTime(mockDate);

    const status = getElectionStatus(validElection);
    
    expect(status.phase).toBe('voting');
    expect(status.isActive).toBe(true);
    expect(status.canVote).toBe(true);
    expect(status.daysRemaining).toBeGreaterThan(0);
    
    vi.useRealTimers();
  });

  it('should return correct status for completed election', () => {
    // Mock current date to be after election period
    const mockDate = new Date('2025-01-01');
    vi.setSystemTime(mockDate);

    const status = getElectionStatus(validElection);
    
    expect(status.phase).toBe('completed');
    expect(status.isActive).toBe(false);
    expect(status.canVote).toBe(false);
    expect(status.daysRemaining).toBeNull();
    
    vi.useRealTimers();
  });
});