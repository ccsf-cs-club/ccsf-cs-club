// Global test setup
import { vi } from 'vitest';

// Mock environment variables for testing
process.env.DATABASE_URL = process.env.DATABASE_URL || 'test-db-url';

// Global test utilities can be added here
global.testUtils = {
  // Add any global test helpers
};