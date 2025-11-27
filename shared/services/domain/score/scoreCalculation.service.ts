/**
 * Score Calculation Service
 *
 * @module ScoreCalculationService
 * @description Advanced score calculation and mathematical operations for game scoring
 * @author EveryTriv Team
 */
import { DifficultyLevel } from '@shared/constants';
import type { CreditBalance, CreditPurchaseOption } from '@shared/types';

/**
 * Service for advanced score calculations and mathematical operations
 */
export class ScoreCalculationService {
	/**
	 * Calculate score for a correct answer (ALGORITHM)
	 * @param difficulty - Difficulty level (easy, medium, hard)
	 * @param timeSpent - Time spent on question in milliseconds
	 * @param streak - Current correct answer streak
	 * @param isCorrect - Whether the answer is correct
	 * @returns Calculated score
	 */
	calculateAnswerScore(difficulty: DifficultyLevel, timeSpent: number, streak: number, isCorrect: boolean): number {
		if (!isCorrect) return 0;

		// Base score by difficulty
		const baseScore: Record<DifficultyLevel, number> = {
			[DifficultyLevel.EASY]: 10,
			[DifficultyLevel.MEDIUM]: 20,
			[DifficultyLevel.HARD]: 30,
			[DifficultyLevel.CUSTOM]: 20, // Default to medium for custom difficulties
		};

		const base = baseScore[difficulty] || 10;

		// Time bonus (faster = more score, max 10 seconds for full bonus)
		const timeInSeconds = timeSpent / 1000;
		const timeBonus = Math.max(0, 10 - Math.floor(timeInSeconds));

		// Streak bonus (exponential growth, capped at 20 score)
		const streakBonus = Math.min(streak * 2, 20);

		return base + timeBonus + streakBonus;
	}
	/**
	 * Calculate bonus score based on performance
	 * @param baseScore - Base score achieved
	 * @param difficulty - Game difficulty
	 * @param timeBonus - Time-based bonus multiplier
	 * @returns Bonus score to award
	 */
	calculateBonusScore(baseScore: number, difficulty: DifficultyLevel, timeBonus: number = 1): number {
		// Base bonus calculation
		let bonusMultiplier = 1;

		// Difficulty-based bonus
		switch (difficulty) {
			case DifficultyLevel.EASY:
				bonusMultiplier = 0.5;
				break;
			case DifficultyLevel.MEDIUM:
				bonusMultiplier = 1;
				break;
			case DifficultyLevel.HARD:
				bonusMultiplier = 1.5;
				break;
			default:
				bonusMultiplier = 1;
		}

		// Time bonus (faster completion = higher bonus)
		const timeMultiplier = Math.min(timeBonus, 2); // Cap at 2x

		// Calculate final bonus
		const bonusScore = Math.floor(baseScore * bonusMultiplier * timeMultiplier * 0.1);
		return Math.max(bonusScore, 0); // Ensure non-negative
	}

	/**
	 * Calculate streak bonus for consecutive correct answers
	 * @param streakLength - Number of consecutive correct answers
	 * @param baseScore - Base score per question
	 * @returns Streak bonus score
	 */
	calculateStreakBonus(streakLength: number, baseScore: number): number {
		if (streakLength < 3) return 0; // No bonus for short streaks

		// Exponential growth for streaks
		const streakMultiplier = Math.pow(1.2, Math.min(streakLength - 2, 10)); // Cap at 10 questions
		const bonusScore = Math.floor(baseScore * (streakMultiplier - 1));

		return Math.max(bonusScore, 0);
	}

	/**
	 * Calculate daily credit limit and reset time
	 * @param currentBalance - Current credit balance
	 * @param lastResetTime - Last time daily limit was reset
	 * @param dailyLimit - Daily credit limit
	 * @returns Daily limit information
	 */
	calculateDailyLimit(
		currentBalance: CreditBalance,
		lastResetTime: Date | null,
		dailyLimit: number
	): {
		remainingCredits: number;
		nextResetTime: Date;
		timeUntilReset: number;
	} {
		const now = new Date();
		const nextReset = new Date(now);
		nextReset.setHours(24, 0, 0, 0); // Next midnight

		// If last reset was today, use remaining credits
		let remainingCredits = dailyLimit;
		if (lastResetTime) {
			const lastReset = new Date(lastResetTime);
			if (lastReset.toDateString() === now.toDateString()) {
				remainingCredits = Math.max(0, dailyLimit - (dailyLimit - currentBalance.freeQuestions));
			}
		}

		const timeUntilReset = nextReset.getTime() - now.getTime();

		return {
			remainingCredits,
			nextResetTime: nextReset,
			timeUntilReset,
		};
	}

	/**
	 * Calculate optimal credit package for user's needs
	 * @param availablePackages - Available credit packages
	 * @param targetCredits - Target number of credits needed
	 * @param budget - Maximum budget available
	 * @returns Optimal package recommendation
	 */
	calculateOptimalPackage(
		availablePackages: CreditPurchaseOption[],
		targetCredits: number,
		budget: number
	): {
		recommendedPackage: CreditPurchaseOption;
		valueForMoney: number;
		reason: string;
	} {
		// Filter packages within budget
		const affordablePackages = availablePackages.filter(pkg => pkg.price <= budget);

		if (affordablePackages.length === 0) {
			throw new Error('No packages available within budget');
		}

		// Calculate value for money (credits per dollar)
		const packagesWithValue = affordablePackages.map(pkg => ({
			...pkg,
			valueForMoney: pkg.credits / pkg.price,
		}));

		// Sort by value for money (descending)
		packagesWithValue.sort((a, b) => b.valueForMoney - a.valueForMoney);

		// Find package that meets target credits
		const targetPackage = packagesWithValue.find(pkg => pkg.credits >= targetCredits);

		if (targetPackage) {
			return {
				recommendedPackage: targetPackage,
				valueForMoney: targetPackage.valueForMoney,
				reason: `Meets target of ${targetCredits} credits with best value for money`,
			};
		}

		// If no package meets target, recommend best value package
		const bestValuePackage = packagesWithValue[0];
		return {
			recommendedPackage: bestValuePackage,
			valueForMoney: bestValuePackage.valueForMoney,
			reason: `Best value for money, though only provides ${bestValuePackage.credits} credits`,
		};
	}
}
