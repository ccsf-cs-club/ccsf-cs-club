-- Migration: Add votes table for STAR voting system
-- Date: 2025-09-06 01:15:00
-- Description: Creates the votes table with proper constraints and indexes for STAR voting functionality

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  voter_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, candidate_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);

-- Comments for documentation
COMMENT ON TABLE votes IS 'Stores STAR voting scores for candidates';
COMMENT ON COLUMN votes.voter_id IS 'Unique identifier for the voter (can be session ID, user ID, etc.)';
COMMENT ON COLUMN votes.candidate_id IS 'Unique identifier for the candidate being voted on';
COMMENT ON COLUMN votes.score IS 'STAR voting score from 0-5 (0=worst, 5=best)';
COMMENT ON CONSTRAINT votes_voter_id_candidate_id_key ON votes IS 'Prevents duplicate votes from same voter for same candidate';

-- Rollback instructions (to be run manually if needed):
-- DROP INDEX IF EXISTS idx_votes_voter_id;
-- DROP INDEX IF EXISTS idx_votes_candidate_id;
-- DROP TABLE IF EXISTS votes;