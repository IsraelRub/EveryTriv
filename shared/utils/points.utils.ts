/**
 * Points Utilities (pure functions, browser-safe)
 *
 * @module PointsUtils
 * @description A set of pure utility functions for points calculations that can be safely used
 * @used_by both client (browser) and server (Node). No NestJS or platform-specific deps.
 */

import type { PointBalance, PointPurchaseOption } from '../types';

export function calculateAnswerPoints(
  difficulty: string,
  timeSpentMs: number,
  streak: number,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0;

  const basePointsByDifficulty: Record<string, number> = {
    easy: 10,
    medium: 20,
    hard: 30,
  };

  const basePoints = basePointsByDifficulty[difficulty.toLowerCase()] ?? 10;

  const timeInSeconds = timeSpentMs / 1000;
  const timeBonus = Math.max(0, 10 - Math.floor(timeInSeconds));

  const streakBonus = Math.min(streak * 2, 20);

  return basePoints + timeBonus + streakBonus;
}

export function calculateBonusPoints(
  baseScore: number,
  difficulty: string,
  timeBonus: number = 1
): number {
  let difficultyMultiplier = 1;
  switch (difficulty.toLowerCase()) {
    case 'easy':
      difficultyMultiplier = 0.5;
      break;
    case 'medium':
      difficultyMultiplier = 1;
      break;
    case 'hard':
      difficultyMultiplier = 1.5;
      break;
    case 'expert':
      difficultyMultiplier = 2;
      break;
    default:
      difficultyMultiplier = 1;
  }

  const timeMultiplier = Math.min(timeBonus, 2);
  const bonusPoints = Math.floor(baseScore * difficultyMultiplier * timeMultiplier * 0.1);
  return Math.max(bonusPoints, 0);
}

export function calculateStreakBonus(streakLength: number, basePoints: number): number {
  if (streakLength < 3) return 0;
  const effectiveLength = Math.min(streakLength - 2, 10);
  const streakMultiplier = Math.pow(1.2, effectiveLength);
  const bonusPoints = Math.floor(basePoints * (streakMultiplier - 1));
  return Math.max(bonusPoints, 0);
}

export function calculateDailyLimit(
  currentBalance: PointBalance,
  lastResetTime: Date | null,
  dailyLimit: number
): {
  remainingPoints: number;
  nextResetTime: Date;
  timeUntilReset: number;
} {
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setHours(24, 0, 0, 0);

  let remainingPoints = dailyLimit;
  if (lastResetTime) {
    const lastReset = new Date(lastResetTime);
    if (lastReset.toDateString() === now.toDateString()) {
      remainingPoints = Math.max(0, dailyLimit - (dailyLimit - currentBalance.free_questions));
    }
  }

  const timeUntilReset = nextReset.getTime() - now.getTime();

  return {
    remainingPoints,
    nextResetTime: nextReset,
    timeUntilReset,
  };
}

export function calculateOptimalPackage(
  availablePackages: PointPurchaseOption[],
  targetPoints: number,
  budget: number
): {
  recommendedPackage: PointPurchaseOption;
  valueForMoney: number;
  reason: string;
} {
  const affordable = availablePackages.filter(pkg => pkg.price <= budget);
  if (affordable.length === 0) {
    throw new Error('No packages available within budget');
  }

  const withValue = affordable
    .map(pkg => ({ ...pkg, valueForMoney: pkg.points / pkg.price }))
    .sort((a, b) => b.valueForMoney - a.valueForMoney);

  const meetsTarget = withValue.find(pkg => pkg.points >= targetPoints);
  if (meetsTarget) {
    return {
      recommendedPackage: meetsTarget,
      valueForMoney: meetsTarget.valueForMoney,
      reason: `Meets target of ${targetPoints} points with best value for money`,
    };
  }

  const best = withValue[0];
  return {
    recommendedPackage: best,
    valueForMoney: best.valueForMoney,
    reason: `Best value for money, though only provides ${best.points} points`,
  };
}

export function calculatePointDecay(points: number, daysUnused: number, decayRate: number = 0.001): number {
  if (daysUnused <= 30) return points;
  const decayDays = daysUnused - 30;
  const decayMultiplier = Math.pow(1 - decayRate, decayDays);
  const remainingPoints = Math.floor(points * decayMultiplier);
  return Math.max(remainingPoints, 0);
}

export function calculatePointInterest(points: number, daysHeld: number, interestRate: number = 0.0005): number {
  if (daysHeld <= 90) return points;
  const interestDays = daysHeld - 90;
  const interestMultiplier = Math.pow(1 + interestRate, interestDays);
  return Math.floor(points * interestMultiplier);
}

export function calculatePointEfficiency(pointsSpent: number, gamesWon: number, totalGames: number): number {
  if (totalGames === 0 || pointsSpent === 0) return 0;
  const winRate = gamesWon / totalGames;
  const pointsPerGame = pointsSpent / totalGames;
  const efficiencyScore = (winRate * 100) / pointsPerGame;
  return Math.min(Math.max(efficiencyScore, 0), 100);
}


