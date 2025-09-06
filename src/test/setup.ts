// Global test setup
import { vi } from 'vitest';
import 'dotenv/config';

// Ensure DATABASE_URL is loaded from .env
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'test-db-url') {
  throw new Error('DATABASE_URL must be set in .env file for tests');
}

// Global test utilities can be added here
global.testUtils = {
  // Add any global test helpers
};