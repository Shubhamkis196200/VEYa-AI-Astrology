/**
 * Simple client-side rate limiter for API calls
 * Prevents excessive API usage and protects against runaway costs
 */

interface RateLimitConfig {
  maxRequests: number;  // Max requests allowed
  windowMs: number;     // Time window in milliseconds
  cooldownMs: number;   // Cooldown period when limit is hit
}

interface RateLimitState {
  requests: number[];
  cooldownUntil: number;
}

// Rate limit configurations per service
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // AI Chat - 20 requests per minute
  'ai.chat': { maxRequests: 20, windowMs: 60000, cooldownMs: 30000 },
  // AI Reading generation - 5 per minute
  'ai.reading': { maxRequests: 5, windowMs: 60000, cooldownMs: 60000 },
  // AI Compatibility - 5 per minute
  'ai.compatibility': { maxRequests: 5, windowMs: 60000, cooldownMs: 60000 },
  // Voice transcription - 10 per minute
  'voice.transcribe': { maxRequests: 10, windowMs: 60000, cooldownMs: 30000 },
  // Voice TTS - 10 per minute
  'voice.speak': { maxRequests: 10, windowMs: 60000, cooldownMs: 30000 },
  // Supabase writes - 30 per minute
  'db.write': { maxRequests: 30, windowMs: 60000, cooldownMs: 10000 },
  // Default fallback
  'default': { maxRequests: 50, windowMs: 60000, cooldownMs: 10000 },
};

// In-memory state storage
const rateLimitState: Map<string, RateLimitState> = new Map();

/**
 * Check if a request can proceed under rate limits
 */
export function canMakeRequest(service: string): boolean {
  const config = RATE_LIMITS[service] || RATE_LIMITS.default;
  const state = getOrCreateState(service);
  const now = Date.now();

  // Check if in cooldown
  if (state.cooldownUntil > now) {
    return false;
  }

  // Clean old requests outside window
  state.requests = state.requests.filter(t => now - t < config.windowMs);

  return state.requests.length < config.maxRequests;
}

/**
 * Record a request and check if rate limited
 * Returns true if request can proceed, false if rate limited
 */
export function trackRequest(service: string): boolean {
  const config = RATE_LIMITS[service] || RATE_LIMITS.default;
  const state = getOrCreateState(service);
  const now = Date.now();

  // Check if in cooldown
  if (state.cooldownUntil > now) {
    console.warn(`[RateLimiter] ${service} is in cooldown until ${new Date(state.cooldownUntil).toISOString()}`);
    return false;
  }

  // Clean old requests outside window
  state.requests = state.requests.filter(t => now - t < config.windowMs);

  // Check if at limit
  if (state.requests.length >= config.maxRequests) {
    state.cooldownUntil = now + config.cooldownMs;
    console.warn(`[RateLimiter] ${service} rate limit exceeded. Cooldown for ${config.cooldownMs}ms`);
    return false;
  }

  // Record this request
  state.requests.push(now);
  return true;
}

/**
 * Get remaining requests before rate limit
 */
export function getRemainingRequests(service: string): number {
  const config = RATE_LIMITS[service] || RATE_LIMITS.default;
  const state = getOrCreateState(service);
  const now = Date.now();

  // Check if in cooldown
  if (state.cooldownUntil > now) {
    return 0;
  }

  // Clean old requests
  state.requests = state.requests.filter(t => now - t < config.windowMs);
  
  return Math.max(0, config.maxRequests - state.requests.length);
}

/**
 * Get time until rate limit resets (in ms)
 */
export function getTimeUntilReset(service: string): number {
  const config = RATE_LIMITS[service] || RATE_LIMITS.default;
  const state = getOrCreateState(service);
  const now = Date.now();

  // If in cooldown, return cooldown time
  if (state.cooldownUntil > now) {
    return state.cooldownUntil - now;
  }

  // If requests exist, return time until oldest expires
  if (state.requests.length > 0) {
    const oldest = Math.min(...state.requests);
    return Math.max(0, (oldest + config.windowMs) - now);
  }

  return 0;
}

/**
 * Reset rate limit for a service (for testing)
 */
export function resetRateLimit(service: string): void {
  rateLimitState.delete(service);
}

/**
 * Higher-order function to wrap async functions with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  service: string,
  fn: T,
  fallback?: (...args: Parameters<T>) => ReturnType<T>
): T {
  return (async (...args: Parameters<T>) => {
    if (!trackRequest(service)) {
      const remaining = getTimeUntilReset(service);
      const error = new Error(`Rate limit exceeded for ${service}. Try again in ${Math.ceil(remaining / 1000)}s`);
      (error as any).isRateLimited = true;
      (error as any).retryAfter = remaining;
      
      if (fallback) {
        console.warn(`[RateLimiter] Using fallback for ${service}`);
        return fallback(...args);
      }
      
      throw error;
    }
    return fn(...args);
  }) as T;
}

// Helper to get or create state
function getOrCreateState(service: string): RateLimitState {
  if (!rateLimitState.has(service)) {
    rateLimitState.set(service, { requests: [], cooldownUntil: 0 });
  }
  return rateLimitState.get(service)!;
}

// Export for debugging
export function getRateLimitStatus(): Record<string, { remaining: number; cooldown: boolean }> {
  const status: Record<string, { remaining: number; cooldown: boolean }> = {};
  const now = Date.now();
  
  for (const [service] of rateLimitState) {
    const state = rateLimitState.get(service)!;
    status[service] = {
      remaining: getRemainingRequests(service),
      cooldown: state.cooldownUntil > now,
    };
  }
  
  return status;
}
