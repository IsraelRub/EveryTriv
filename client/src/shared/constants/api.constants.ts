/**
 * API-related constants for EveryTriv
 */

// Base API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/update',
    DELETE: '/user',
    STATS: '/user/stats',
  },
  TRIVIA: {
    GENERATE: '/trivia/generate',
    VALIDATE: '/trivia/validate',
  },
  GAME_HISTORY: {
    CREATE: '/game-history',
    GET_ALL: '/game-history',
    GET_BY_ID: '/game-history/:id',
    DELETE: '/game-history/:id',
    LEADERBOARD: '/game-history/leaderboard',
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Request timeouts
export const REQUEST_TIMEOUTS = {
  DEFAULT: 5000,
  UPLOAD: 30000,
  LONG_RUNNING: 60000,
} as const;

// Cookie names
export const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
} as const;
