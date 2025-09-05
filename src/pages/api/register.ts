import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getDatabase } from '../../lib/db';

export const prerender = false;

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 100;

// Request deduplication store
const deduplicationStore = new Map<string, { timestamp: number; response: any }>();
const DEDUPLICATION_WINDOW = 5 * 60 * 1000; // 5 minutes

// Validation schema
const registrationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim()
});

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

function createDeduplicationKey(clientIP: string, name: string, email: string): string {
  return `${clientIP}:${name.toLowerCase()}:${email.toLowerCase()}`;
}

function checkDeduplication(deduplicationKey: string): any | null {
  const now = Date.now();
  const record = deduplicationStore.get(deduplicationKey);

  if (record && (now - record.timestamp) < DEDUPLICATION_WINDOW) {
    return record.response;
  }

  // Clean up old records
  for (const [key, value] of deduplicationStore.entries()) {
    if ((now - value.timestamp) >= DEDUPLICATION_WINDOW) {
      deduplicationStore.delete(key);
    }
  }

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
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(clientIP);
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

    // Parse form data
    const formData = await request.formData();
    const rawData = {
      name: formData.get('name')?.toString() || '',
      email: formData.get('email')?.toString() || ''
    };

    // Validate input data
    const validationResult = registrationSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ');
      
      console.warn(`Validation failed for IP: ${clientIP}. Errors: ${errors}`);
      
      return new Response(JSON.stringify({
        error: `Validation failed: ${errors}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validData = validationResult.data;

    // Check for request deduplication
    const deduplicationKey = createDeduplicationKey(clientIP, validData.name, validData.email);
    const existingResponse = checkDeduplication(deduplicationKey);
    
    if (existingResponse) {
      console.info(`Duplicate request detected from IP: ${clientIP} for email: ${validData.email}`);
      return new Response(JSON.stringify(existingResponse), {
        status: existingResponse.error ? 400 : 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Database operations
    const db = getDatabase();

    // Check if email already exists
    const emailExists = await db.checkEmailExists(validData.email);
    if (emailExists) {
      const response = { error: 'This email is already registered.' };
      storeDeduplicationResponse(deduplicationKey, response);
      
      console.info(`Registration attempt with existing email: ${validData.email} from IP: ${clientIP}`);
      
      return new Response(JSON.stringify(response), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user
    const newUser = await db.createUser({
      name: validData.name,
      email: validData.email
    });

    const response = {
      success: true,
      message: 'Registration successful! Welcome to the CS Club!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    };

    // Store successful response for deduplication
    storeDeduplicationResponse(deduplicationKey, response);

    // Log successful registration
    const processingTime = Date.now() - startTime;
    console.info(`Successful registration: ${validData.email} from IP: ${clientIP} in ${processingTime}ms`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    // Handle specific database errors
    if (error.message === 'Email already exists') {
      const response = { error: 'This email is already registered.' };
      
      console.warn(`Database constraint violation for email from IP: ${clientIP} in ${processingTime}ms`);
      
      return new Response(JSON.stringify(response), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log unexpected errors with context
    console.error(`Registration error for IP: ${clientIP} in ${processingTime}ms:`, {
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

// Health check endpoint
export const GET: APIRoute = async () => {
  try {
    const db = getDatabase();
    const isHealthy = await db.healthCheck();
    const userCount = await db.getUserCount();
    
    if (isHealthy) {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        userCount,
        version: '1.0.0'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Health check error:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};