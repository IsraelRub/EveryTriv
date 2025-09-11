/**
 * Point Calculation Service
 *
 * @module PointCalculationService
 * @description Advanced point calculation and mathematical operations
 * @author EveryTriv Team
 */

import type { PointBalance, PointPurchaseOption } from '../../types';

/**
 * Service for advanced point calculations and mathematical operations
 */
export class PointCalculationService {
	/**
	 * Calculate bonus points based on performance
	 * @param baseScore - Base score achieved
	 * @param difficulty - Game difficulty
	 * @param timeBonus - Time-based bonus multiplier
	 * @returns Bonus points to award
	 */
	calculateBonusPoints(
		baseScore: number,
		difficulty: string,
		timeBonus: number = 1
	): number {
		// Base bonus calculation
		let bonusMultiplier = 1;

		// Difficulty-based bonus
		switch (difficulty.toLowerCase()) {
			case 'easy':
				bonusMultiplier = 0.5;
				break;
			case 'medium':
				bonusMultiplier = 1;
				break;
			case 'hard':
				bonusMultiplier = 1.5;
				break;
			case 'expert':
				bonusMultiplier = 2;
				break;
			default:
				bonusMultiplier = 1;
		}

		// Time bonus (faster completion = higher bonus)
		const timeMultiplier = Math.min(timeBonus, 2); // Cap at 2x

		// Calculate final bonus
		const bonusPoints = Math.floor(baseScore * bonusMultiplier * timeMultiplier * 0.1);
		return Math.max(bonusPoints, 0); // Ensure non-negative
	}

	/**
	 * Calculate streak bonus for consecutive correct answers
	 * @param streakLength - Number of consecutive correct answers
	 * @param basePoints - Base points per question
	 * @returns Streak bonus points
	 */
	calculateStreakBonus(streakLength: number, basePoints: number): number {
		if (streakLength < 3) return 0; // No bonus for short streaks

		// Exponential growth for streaks
		const streakMultiplier = Math.pow(1.2, Math.min(streakLength - 2, 10)); // Cap at 10 questions
		const bonusPoints = Math.floor(basePoints * (streakMultiplier - 1));

		return Math.max(bonusPoints, 0);
	}

	/**
	 * Calculate daily point limit and reset time
	 * @param currentBalance - Current point balance
	 * @param lastResetTime - Last time daily limit was reset
	 * @param dailyLimit - Daily point limit
	 * @returns Daily limit information
	 */
	calculateDailyLimit(
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
		nextReset.setHours(24, 0, 0, 0); // Next midnight

		// If last reset was today, use remaining points
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

	/**
	 * Calculate optimal point package for user's needs
	 * @param availablePackages - Available point packages
	 * @param targetPoints - Target number of points needed
	 * @param budget - Maximum budget available
	 * @returns Optimal package recommendation
	 */
	calculateOptimalPackage(
		availablePackages: PointPurchaseOption[],
		targetPoints: number,
		budget: number
	): {
		recommendedPackage: PointPurchaseOption;
		valueForMoney: number;
		reason: string;
	} {
		// Filter packages within budget
		const affordablePackages = availablePackages.filter(pkg => pkg.price <= budget);

		if (affordablePackages.length === 0) {
			throw new Error('No packages available within budget');
		}

		// Calculate value for money (points per dollar)
		const packagesWithValue = affordablePackages.map(pkg => ({
			...pkg,
			valueForMoney: pkg.points / pkg.price,
		}));

		// Sort by value for money (descending)
		packagesWithValue.sort((a, b) => b.valueForMoney - a.valueForMoney);

		// Find package that meets target points
		const targetPackage = packagesWithValue.find(pkg => pkg.points >= targetPoints);

		if (targetPackage) {
			return {
				recommendedPackage: targetPackage,
				valueForMoney: targetPackage.valueForMoney,
				reason: `Meets target of ${targetPoints} points with best value for money`,
			};
		}

		// If no package meets target, recommend best value package
		const bestValuePackage = packagesWithValue[0];
		return {
			recommendedPackage: bestValuePackage,
			valueForMoney: bestValuePackage.valueForMoney,
			reason: `Best value for money, though only provides ${bestValuePackage.points} points`,
		};
	}

	/**
	 * Calculate point decay over time (for unused points)
	 * @param points - Number of points
	 * @param daysUnused - Days since points were last used
	 * @param decayRate - Daily decay rate (default: 0.1%)
	 * @returns Remaining points after decay
	 */
	calculatePointDecay(
		points: number,
		daysUnused: number,
		decayRate: number = 0.001
	): number {
		if (daysUnused <= 30) return points; // No decay for first 30 days

		const decayDays = daysUnused - 30;
		const decayMultiplier = Math.pow(1 - decayRate, decayDays);
		const remainingPoints = Math.floor(points * decayMultiplier);

		return Math.max(remainingPoints, 0); // Ensure non-negative
	}

	/**
	 * Calculate compound interest on points (for long-term holders)
	 * @param points - Initial number of points
	 * @param daysHeld - Days points have been held
	 * @param interestRate - Daily interest rate (default: 0.05%)
	 * @returns Points with accumulated interest
	 */
	calculatePointInterest(
		points: number,
		daysHeld: number,
		interestRate: number = 0.0005
	): number {
		if (daysHeld <= 90) return points; // No interest for first 90 days

		const interestDays = daysHeld - 90;
		const interestMultiplier = Math.pow(1 + interestRate, interestDays);
		const pointsWithInterest = Math.floor(points * interestMultiplier);

		return pointsWithInterest;
	}

	/**
	 * Calculate point efficiency score
	 * @param pointsSpent - Points spent on games
	 * @param gamesWon - Number of games won
	 * @param totalGames - Total number of games played
	 * @returns Efficiency score (0-100)
	 */
	calculatePointEfficiency(
		pointsSpent: number,
		gamesWon: number,
		totalGames: number
	): number {
		if (totalGames === 0 || pointsSpent === 0) return 0;

		const winRate = gamesWon / totalGames;
		const pointsPerGame = pointsSpent / totalGames;
		const efficiencyScore = (winRate * 100) / pointsPerGame;

		return Math.min(Math.max(efficiencyScore, 0), 100); // Clamp between 0-100
	}
}
