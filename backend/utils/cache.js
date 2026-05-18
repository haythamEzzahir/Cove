import Redis from "ioredis";

let redis = null;
let redisFailed = false;
let redisConnecting = false;

// Try to connect to Redis, silently fall back to in-memory cache on failure
async function initRedis() {
  if (redis || redisFailed || !process.env.REDIS_URL || redisConnecting) return;

  redisConnecting = true;
  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 2) return null;
      return Math.min(times * 300, 1000);
    },
    lazyConnect: true,
    connectTimeout: 3000
  });

  try {
    await client.connect();
    redis = client;
    console.log("Redis connected successfully");
  } catch (err) {
    console.warn("Redis unavailable — falling back to in-memory cache");
    redis = null;
    redisFailed = true;
    client.disconnect();
  } finally {
    redisConnecting = false;
  }
}

// Start connection attempt once on import
initRedis();

// In-memory fallback (single-process only)
const memoryStore = new Map();

// Get a cached value by key (Redis first, then in-memory fallback)
export async function getCache(key) {
  try {
    if (redis && redis.status === "ready") {
      const raw = await redis.get(key);
      if (raw) return JSON.parse(raw);
      return null;
    }
  } catch (err) {
    console.error("Redis getCache error:", err.message);
  }

  // Fallback to memory
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data;
}

// Store a value in cache with TTL (Redis first, then in-memory fallback)
export async function setCache(key, data, ttlSeconds) {
  try {
    if (redis && redis.status === "ready") {
      await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
      return;
    }
  } catch (err) {
    console.error("Redis setCache error:", err.message);
  }

  // Fallback to memory
  memoryStore.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

// Delete a cached value by key
export async function deleteCache(key) {
  try {
    if (redis && redis.status === "ready") {
      await redis.del(key);
      return;
    }
  } catch (err) {
    console.error("Redis deleteCache error:", err.message);
  }

  memoryStore.delete(key);
}
