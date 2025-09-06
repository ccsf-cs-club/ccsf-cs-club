# Testing Guide for CCSF CS Club

This project now includes comprehensive testing to catch runtime API integration errors that the build process cannot detect.

## Quick Start

```bash
# Run all tests
npm run test:run

# Run tests in watch mode 
npm test

# Run specific test file
npm run test:run -- src/test/finalRoundScore.test.ts

# Run tests with UI
npm run test:ui
```

## What Tests Solve

**Problem**: Issue #95 identified that `npm run build` only catches TypeScript/build errors, but runtime API integration errors only surface in deployed environment with real database.

**Solution**: These tests catch runtime errors locally during development:

### 1. Core Bug Validation (`src/test/finalRoundScore.test.ts`)

Tests the specific `finalRoundScore.toFixed` TypeError:

```typescript
// ❌ This was causing runtime errors:
result.finalRoundScore.toFixed(2) // TypeError when undefined

// ✅ Fixed with null-safe handling:
result.finalRoundScore?.toFixed(2) || 'N/A'
```

### 2. API Integration Tests (`src/test/api/results.test.ts`)

- Tests STAR voting API with proper `finalRoundScore` handling
- Validates undefined/null `finalRoundScore` values don't crash API  
- Tests rate limiting, error handling, malformed data scenarios
- Ensures API response structure matches frontend expectations

### 3. Frontend Runtime Tests (`src/test/pages/results.test.ts`) 

- Tests Astro Container API rendering with problematic data
- Validates `finalRoundScore.toFixed` errors are handled gracefully
- Tests client-side JavaScript behavior validation

## Key Test Cases

### Data Structure Edge Cases
- ✅ `finalRoundScore: 8` (valid number)
- ✅ `finalRoundScore: undefined` (non-runoff candidates) 
- ✅ `finalRoundScore: null` (malformed data)
- ✅ `finalRoundScore: NaN` (edge case)

### API Response Validation
- ✅ STAR voting format with runoff scores
- ✅ Simple voting format without runoff scores  
- ✅ Empty results (no candidates)
- ✅ Database connection failures
- ✅ Rate limiting behavior

## Development Workflow

1. **Write code** → 2. **Run tests** → 3. **Run build**

```bash
# Development cycle
npm test                    # Catch runtime errors
npm run build              # Catch TypeScript/build errors  
```

## Testing Framework

- **Vitest**: Fast Vite-native testing framework
- **Astro Container API**: Server-side component rendering for tests
- **Happy-DOM**: Lightweight DOM implementation for browser-like testing

## Test Organization

```
src/test/
├── setup.ts              # Global test configuration
├── api/results.test.ts    # API endpoint integration tests  
├── pages/results.test.ts  # Frontend component tests
└── finalRoundScore.test.ts # Core bug validation tests
```

## Why These Tests Matter

1. **Catch Runtime Errors Early**: No more discovering TypeError in production
2. **API-Frontend Contract**: Tests ensure API response structure matches frontend expectations
3. **Data Edge Cases**: Validates handling of undefined/null/malformed data
4. **Development Confidence**: Safe to refactor knowing tests catch regressions

---

*Generated as part of resolving Issue #95: Results page runtime error*