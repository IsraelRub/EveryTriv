import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	GameMode,
	PaymentMethod,
	PaymentStatus,
	POINT_PURCHASE_PACKAGES,
	PointSource,
	PointTransactionType,
	VALIDATION_LIMITS,
} from '@shared/constants';
import { BasePointsService, serverLogger as logger } from '@shared/services';
import type {
	CanPlayResponse,
	ManualPaymentDetails,
	PaymentResult,
	PointBalance,
	PointPurchaseOption,
} from '@shared/types';
import { ensureErrorObject, isPointBalanceCacheEntry, isPointPurchaseOptionArray } from '@shared/utils';

import { PointTransactionEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';

import { ValidationService } from '../../common';
import { PaymentService } from '../payment';

type PointsPurchaseRequest = {
	packageId: string;
	paymentMethod: PaymentMethod;
	paypalOrderId?: string;
	paypalPaymentId?: string;
	manualPayment?: ManualPaymentDetails;
};

@Injectable()
export class PointsService extends BasePointsService {
	constructor(
		@InjectRepository(PointTransactionEntity)
		private readonly pointTransactionRepository: Repository<PointTransactionEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly cacheService: CacheService,
		private readonly paymentService: PaymentService,
		private readonly validationService: ValidationService
	) {
		super();
	}

	private assertQuestionCountWithinLimits(questionCount: number): void {
		const { MIN, MAX } = VALIDATION_LIMITS.QUESTION_COUNT;
		if (!Number.isFinite(questionCount) || questionCount < MIN || questionCount > MAX) {
			throw new BadRequestException(`Question count must be between ${MIN} and ${MAX}`);
		}
	}

	/**
	 * Get user's current point balance
	 */
	async getPointBalance(userId: string): Promise<PointBalance> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException('Invalid user ID');
			}

			const cacheKey = `points:balance:${userId}`;

			return await this.cacheService.getOrSet<PointBalance>(
				cacheKey,
				async () => {
					const user = await this.userRepository.findOne({ where: { id: userId } });
					if (!user) {
						throw new NotFoundException('User not found');
					}

					const balance: PointBalance = {
						totalPoints: user.credits,
						purchasedPoints: user.purchasedPoints,
						freeQuestions: user.remainingFreeQuestions,
						dailyLimit: user.dailyFreeQuestions,
						canPlayFree: user.remainingFreeQuestions > 0,
						nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
					};

					logger.databaseInfo('Point balance retrieved', {
						userId,
						totalPoints: balance.totalPoints,
						purchasedPoints: balance.purchasedPoints,
						freeQuestions: balance.freeQuestions,
						canPlayFree: balance.canPlayFree,
					});
					return balance;
				},
				1800,
				isPointBalanceCacheEntry
			);
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to get point balance', {
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get available point packages for purchase
	 */
	async getPointPackages(): Promise<PointPurchaseOption[]> {
		try {
			const cacheKey = 'points:packages:all';

			return await this.cacheService.getOrSet<PointPurchaseOption[]>(
				cacheKey,
				async () => {
					const packages: PointPurchaseOption[] = POINT_PURCHASE_PACKAGES.map(pkg => ({
						id: pkg.id,
						points: pkg.points,
						price: pkg.price,
						priceDisplay: pkg.priceDisplay,
						pricePerPoint: pkg.pricePerPoint,
					}));

					logger.databaseInfo('Point packages retrieved', { count: packages.length });
					return packages;
				},
				3600,
				isPointPurchaseOptionArray
			);
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to get point packages');
			throw error;
		}
	}

	/**
	 * Check if user can play with current points
	 */
	async canPlay(userId: string, questionCount: number): Promise<CanPlayResponse> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException('Invalid user ID');
			}

			this.assertQuestionCountWithinLimits(questionCount);

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			const totalAvailable = user.credits + user.purchasedPoints + user.remainingFreeQuestions;

			if (totalAvailable >= questionCount) {
				return { canPlay: true };
			}

			return {
				canPlay: false,
				reason: `Insufficient points. You have ${totalAvailable} points available but need ${questionCount} points.`,
			};
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to check if user can play', { userId, questionCount });
			throw error;
		}
	}

	/**
	 * Deduct points from user's balance
	 */
	async deductPoints(
		userId: string,
		questionCount: number,
		gameMode: GameMode = GameMode.QUESTION_LIMITED,
		reason?: string
	): Promise<PointBalance> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException('Invalid user ID');
			}

			this.assertQuestionCountWithinLimits(questionCount);

			const gameModeValidation = await this.validationService.validateInputContent(gameMode);
			if (!gameModeValidation.isValid) {
				throw new BadRequestException('Invalid game mode');
			}

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			const canPlayResult = await this.canPlay(userId, questionCount);
			if (!canPlayResult.canPlay) {
				throw new BadRequestException(canPlayResult.reason);
			}

			// Use deduction logic
			const nextResetTime = user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null;
			const currentBalance: PointBalance = {
				totalPoints: user.credits,
				purchasedPoints: user.purchasedPoints,
				freeQuestions: user.remainingFreeQuestions,
				canPlayFree: user.remainingFreeQuestions > 0,
				dailyLimit: user.dailyFreeQuestions,
				nextResetTime,
			};

			const deductionResult = this.calculateNewBalance(currentBalance, questionCount, gameMode);

			// Update user with new balance
			user.remainingFreeQuestions = deductionResult.newBalance.freeQuestions;
			user.purchasedPoints = deductionResult.newBalance.purchasedPoints;
			user.credits = deductionResult.newBalance.totalPoints;

			await this.userRepository.save(user);

			// Invalidate points cache
			await this.cacheService.delete(`points:balance:${userId}`);

			// Create transaction record
			const transaction = this.pointTransactionRepository.create({
				userId,
				type: PointTransactionType.GAME_USAGE,
				source:
					deductionResult.deductionDetails.purchasedPointsUsed > 0 ? PointSource.PURCHASED : PointSource.FREE_DAILY,
				amount: -questionCount,
				balanceAfter: user.credits,
				freeQuestionsAfter: user.remainingFreeQuestions,
				purchasedPointsAfter: user.purchasedPoints,
				description: reason
					? `Points deducted (${reason}): ${questionCount} points`
					: `Points deducted for ${gameMode} game: ${questionCount} points`,
				metadata: {
					gameMode,
					freeQuestionsUsed: deductionResult.deductionDetails.freeQuestionsUsed,
					purchasedPointsUsed: deductionResult.deductionDetails.purchasedPointsUsed,
					creditsUsed: deductionResult.deductionDetails.creditsUsed,
					reason: reason ?? null,
				},
			});

			await this.pointTransactionRepository.save(transaction);
			logger.databaseCreate('point_transaction', {
				id: transaction.id,
				userId,
				type: PointTransactionType.GAME_USAGE,
				amount: -questionCount,
				reason: reason ?? 'not_provided',
			});

			const balance: PointBalance = {
				totalPoints: user.credits,
				purchasedPoints: user.purchasedPoints,
				freeQuestions: user.remainingFreeQuestions,
				dailyLimit: user.dailyFreeQuestions,
				canPlayFree: user.remainingFreeQuestions > 0,
				nextResetTime,
			};

			logger.databaseInfo('Points deducted successfully', {
				userId,
				questionCount,
				gameMode,
				reason,
				totalPoints: balance.totalPoints,
				purchasedPoints: balance.purchasedPoints,
				freeQuestions: balance.freeQuestions,
			});

			return balance;
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to deduct points', {
				userId,
				questionCount,
				gameMode,
			});
			throw error;
		}
	}

	/**
	 * Get point transaction history for user
	 */
	async getPointHistory(userId: string, limit: number = 50): Promise<PointTransactionEntity[]> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException('Invalid user ID');
			}

			// Validate limit
			if (!limit || limit < 1 || limit > 100) {
				throw new BadRequestException('Limit must be between 1 and 100');
			}

			const transactions = await this.pointTransactionRepository.find({
				where: { userId },
				order: { createdAt: 'DESC' },
				take: limit,
			});

			logger.databaseInfo('Point history retrieved', { userId, count: transactions.length });
			return transactions;
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to get point history', {
				userId,
				limit,
			});
			throw error;
		}
	}

	/**
	 * Purchase points package
	 */
	async purchasePoints(
		userId: string,
		request: PointsPurchaseRequest
	): Promise<PaymentResult & { balance?: PointBalance }> {
		try {
			// Validate purchase request
			const purchaseValidation = await this.validationService.validatePointsPurchase(userId, request.packageId);
			if (!purchaseValidation.isValid) {
				throw new BadRequestException({
					message: 'Invalid purchase request',
					errors: purchaseValidation.errors,
				});
			}

			// Extract points from package ID
			const pointsMatch = request.packageId.match(/package_(\d+)/);
			if (!pointsMatch) {
				throw new BadRequestException('Invalid package ID');
			}

			const points = parseInt(pointsMatch[1]);
			const packageInfo = POINT_PURCHASE_PACKAGES.find(pkg => pkg.points === points);

			if (!packageInfo) {
				throw new BadRequestException('Invalid points package');
			}

			// Create payment session using PaymentService
			const paymentResult = await this.paymentService.processPayment(userId, {
				amount: packageInfo.price,
				currency: 'USD',
				description: `Points purchase: ${points} points`,
				numberOfPayments: 1,
				type: 'points_purchase',
				metadata: {
					packageId: request.packageId,
					points,
					price: packageInfo.price,
				},
				method: request.paymentMethod,
				paypalOrderId: request.paypalOrderId,
				paypalPaymentId: request.paypalPaymentId,
				manualPayment: request.manualPayment,
			});

			if (paymentResult.status !== PaymentStatus.COMPLETED) {
				logger.databaseInfo('Points purchase pending completion', {
					userId,
					id: request.packageId,
					points,
					price: packageInfo.price,
					status: paymentResult.status,
					paymentId: paymentResult.transactionId,
				});

				return paymentResult;
			}

			logger.databaseInfo('Points purchase completed', {
				userId,
				id: request.packageId,
				points,
				price: packageInfo.price,
				paymentId: paymentResult.transactionId,
			});

			const packageDetails = packageInfo as PointPurchaseOption;
			const balance = await this.applyPointsPurchase(userId, points, packageDetails.bonus ?? 0);

			return {
				...paymentResult,
				balance,
			};
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to purchase points', {
				userId,
				id: request.packageId,
			});
			throw error;
		}
	}

	private async applyPointsPurchase(userId: string, points: number, bonus: number): Promise<PointBalance> {
		const user = await this.userRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new NotFoundException('User not found');
		}

		const totalPoints = points + bonus;
		user.credits = (user.credits ?? 0) + totalPoints;
		user.purchasedPoints = (user.purchasedPoints ?? 0) + totalPoints;

		await this.userRepository.save(user);

		// Invalidate points cache
		await this.cacheService.delete(`points:balance:${userId}`);

		return {
			totalPoints: user.credits ?? 0,
			freeQuestions: user.remainingFreeQuestions ?? 0,
			purchasedPoints: user.purchasedPoints ?? 0,
			dailyLimit: user.dailyFreeQuestions ?? 0,
			canPlayFree: (user.remainingFreeQuestions ?? 0) > 0,
			nextResetTime: user.lastFreeQuestionsReset ? user.lastFreeQuestionsReset.toISOString() : null,
			userId,
			balance: user.credits,
		};
	}

	/**
	 * Confirm point purchase after payment
	 */
	async confirmPointPurchase(userId: string, paymentIntentId: string, points: number): Promise<PointBalance> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException('Invalid user ID');
			}

			// Validate payment intent ID
			const paymentValidation = await this.validationService.validateInputContent(paymentIntentId);
			if (!paymentValidation.isValid) {
				throw new BadRequestException('Invalid payment intent ID');
			}

			// Validate points amount
			if (!points || points <= 0 || points > 10000) {
				throw new BadRequestException('Invalid points amount');
			}

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Add points to user's balance
			user.purchasedPoints += points;
			await this.userRepository.save(user);

			// Create transaction record
			const transaction = this.pointTransactionRepository.create({
				userId,
				type: PointTransactionType.PURCHASE,
				source: PointSource.PURCHASED,
				amount: points,
				balanceAfter: user.credits,
				freeQuestionsAfter: user.remainingFreeQuestions,
				purchasedPointsAfter: user.purchasedPoints,
				description: `Points purchase: ${points} points`,
				paymentId: paymentIntentId,
				metadata: {
					originalAmount: points,
				},
			});

			await this.pointTransactionRepository.save(transaction);

			// Invalidate points cache
			await this.cacheService.delete(`points:balance:${userId}`);

			const balance: PointBalance = {
				totalPoints: user.credits,
				purchasedPoints: user.purchasedPoints,
				freeQuestions: user.remainingFreeQuestions,
				dailyLimit: user.dailyFreeQuestions,
				canPlayFree: user.remainingFreeQuestions > 0,
				nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
			};

			logger.databaseInfo('Point purchase confirmed', {
				userId,
				id: paymentIntentId,
				points,
				totalPoints: balance.totalPoints,
				purchasedPoints: balance.purchasedPoints,
				freeQuestions: balance.freeQuestions,
			});

			return balance;
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to confirm point purchase', {
				userId,
				id: paymentIntentId,
				points,
			});
			throw error;
		}
	}

	/**
	 * Reset daily free questions
	 */
	async resetDailyFreeQuestions(): Promise<void> {
		try {
			const users = await this.userRepository.find();
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			for (const user of users) {
				const lastReset = user.lastFreeQuestionsReset;
				const lastResetDate = lastReset ? new Date(lastReset) : null;
				lastResetDate?.setHours(0, 0, 0, 0);

				// Reset if it's a new day
				if (!lastResetDate || lastResetDate.getTime() !== today.getTime()) {
					user.remainingFreeQuestions = user.dailyFreeQuestions;
					user.lastFreeQuestionsReset = new Date();
					await this.userRepository.save(user);

					logger.databaseInfo('Daily free questions reset', {
						userId: user.id,
						newFreeQuestions: user.remainingFreeQuestions,
					});
				}
			}
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to reset daily free questions');
			throw error;
		}
	}
}
