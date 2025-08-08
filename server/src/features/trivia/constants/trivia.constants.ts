/**
 * Constants related to the trivia feature
 */
export const TRIVIA_CONSTANTS = {
  DIFFICULTIES: ["easy", "medium", "hard", "custom"] as const,
  CUSTOM_DIFFICULTY_PREFIX: "custom:",
  QUEUE: {
    MAX_ITEMS: 1000,
    PROCESS_INTERVAL: 1000,
    RETRY_DELAY: 5000,
  },
  PRIORITIES: {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  },
} as const;
