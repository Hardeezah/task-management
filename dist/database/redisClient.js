"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("@upstash/redis");
exports.redisClient = new redis_1.Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
});
console.log('Redis URL:', process.env.UPSTASH_REDIS_URL);
console.log('Redis Token:', process.env.UPSTASH_REDIS_TOKEN);
/* import { Redis } from '@upstash/redis';
// Configure Redis client with Upstash Redis credentials
export const redisClient = new Redis(process.env.UPSTASH_REDIS_URL!, {
  password: process.env.UPSTASH_REDIS_TOKEN, // Use token for authentication
  tls: {}, // Secure TLS connection
});

// Error handling
redisClient.on('error', (err: any) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

// Export for use in the application
export default redisClient;
 */ 
//# sourceMappingURL=redisClient.js.map