import Redis from 'ioredis';

// Configure the Redis client with Upstash Redis credentials
export const redisClient = new Redis(process.env.UPSTASH_REDIS_URL!, {
  password: process.env.UPSTASH_REDIS_TOKEN, // Use the token for authentication
  tls: {}, // Upstash requires TLS for secure connections
});
