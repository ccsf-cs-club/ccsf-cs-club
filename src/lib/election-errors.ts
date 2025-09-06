// Error classes for election utilities
export class ElectionNotFoundError extends Error {
  constructor(slug: string) {
    super(`Election with slug "${slug}" not found`);
    this.name = 'ElectionNotFoundError';
  }
}

export class InvalidElectionError extends Error {
  constructor(slug: string, errors: string[]) {
    super(`Election "${slug}" is invalid: ${errors.join(', ')}`);
    this.name = 'InvalidElectionError';
  }
}

export class VotingNotAllowedError extends Error {
  constructor(reason: string) {
    super(`Voting not allowed: ${reason}`);
    this.name = 'VotingNotAllowedError';
  }
}