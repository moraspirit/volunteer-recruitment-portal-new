import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize the Redis client using the edge-compatible REST API
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter for the public application form: 5 requests per 10 minutes
export const applyRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/apply',
});

// Rate limiter for the admin login: 20 requests per hour
export const loginRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit/login',
});