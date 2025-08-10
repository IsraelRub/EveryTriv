/**
 * User-related types for the server
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string; // Optional for DTOs
  avatar?: string;
  score: number;
  credits: number;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database entity
export interface UserEntity {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  score: number;
  credits: number;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  id: string;
  userId: string;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  totalQuestions: number;
  correctAnswers: number;
  lastPlayed: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

// DTOs
export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  score: number;
  credits: number;
  achievements: Achievement[];
  stats: UserStats;
}


// Profile management DTOs (user-facing)
export interface UpdateProfileDto {
  username?: string;
  avatar?: string;
  // Users can't change email directly (requires verification)
}

// DTO for creating/updating user profile without authentication (external systems like Google OAuth)
export interface SaveUserProfileDto {
  userId: string;
  username: string;
  email?: string;
  avatar?: string;
}
