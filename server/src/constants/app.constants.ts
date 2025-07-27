export const APP_CONSTANTS = {
  API_VERSION: "v1",
  CACHE_TTL: 3600,
  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 30000,
  PROCESSING_TIMEOUT: 30000,
  DEFAULT_PAGE_SIZE: 10,
  RATE_LIMIT: {
    windowMs: 60000,
    max: 100,
  },
  DIFFICULTIES: ["easy", "medium", "hard", "custom"] as const,
  CUSTOM_DIFFICULTY_PREFIX: "custom:",
  QUEUE: {
    MAX_ITEMS: 1000,
    PROCESS_INTERVAL: 1000,
    RETRY_DELAY: 5000,
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  PRIORITIES: {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  },
} as const;