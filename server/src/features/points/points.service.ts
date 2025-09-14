import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { formatCurrency,PointBalance, PointPurchaseOption, POINTS_PRICING_TIERS, serverLogger as logger,UrlResponse  } from '@shared';
import { PointTransactionEntity, UserEntity } from 'src/internal/entities';
import { CacheService } from 'src/internal/modules/cache';
import { Repository } from 'typeorm';

import { ValidationService } from '../../common/validation/validation.service';
import { PointSource, PointTransactionType } from '../../internal/constants';
import { PaymentService } from '../payment';
import { BasePointsService } from '@shared/services/points/basePoints.service';

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

	/**
	 * Get user's current point balance
	 */
	async getPointBalance(userId: string): Promise<PointBalance> {
		try {
			// Validate user ID
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException('Invalid user ID');
			}

			const cacheKey = `points:balance:${userId}`;

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					const user = await this.userRepository.findOne({ where: { id: userId } });
					if (!user) {
						throw new NotFoundException('User not found');
					}

					const balance: PointBalance = {
						total_points: user.credits,
						purchased_points: user.purchasedPoints,
						free_questions: user.remainingFreeQuestions,
						daily_limit: user.dailyFreeQuestions,
						can_play_free: user.remainingFreeQuestions > 0,
						next_reset_time: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
					};

					logger.databaseInfo('Point balance retrieved', {
						userId,
						total_points: balance.total_points,
						purchased_points: balance.purchased_points,
						free_questions: balance.free_questions,
						can_play_free: balance.can_play_free,
					});
					return balance;
				},
				1800 // Cache for 30 minutes - balance changes less frequently
			);
		} catch (error) {
			logger.errorWithStack(error instanceof Error ? error : new Error(String(error)), 'Failed to get point balance', {
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

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					const packages: PointPurchaseOption[] = POINTS_PRICING_TIERS.map(tier => ({
						id: `package_${tier.points}`,
						points: tier.points,
						price: tier.price,
						price_display: formatCurrency(tier.price),
						price_per_point: tier.pricePerPoint,
					}));

					logger.databaseInfo('Point packages retrieved', { count: packages.length });
					return packages;
				},
				3600 // Cache for 1 hour - packages don't change often
			);
		} catch (error) {
			logger.errorWithStack(error instanceof Error ? error : new Error(String(error)), 'Failed to get point packages');
			throw error;
		}
	}

	/**
	 * Check if user can play with current points
	 */
	async canPlay(userId: string, questionCount: number): Promise<{ canPlay: boolean; reason?: string }> {
		try {
			// Validate user ID
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException('Invalid user ID');
			}

			// Validate question count
			if (!questionCount || questionCount < 1 || questionCount > 50) {
				throw new BadRequestException('Question count must be between 1 and 50');
			}

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			const totalAvailable = user.credits + user.remainingFreeQuestions;

			if (totalAvailable >= questionCount) {
				return { canPlay: true };
			}

			return {
				canPlay: false,
				reason: `Insufficient points. You have ${totalAvailable} points available but need ${questionCount} points.`,
			};
		} catch (error) {
			logger.errorWithStack(
				error instanceof Error ? error : new Error(String(error)),
				'Failed to check if user can play',
				{ userId, questionCount }
			);
			throw error;
		}
	}

	/**
	 * Deduct points from user's balance
	 */
	async deductPoints(userId: string, questionCount: number, gameMode: string = 'standard'): Promise<PointBalance> {
		try {
			// Validate user ID
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException('Invalid user ID');
			}

			// Validate question count
			if (!questionCount || questionCount < 1 || questionCount > 50) {
				throw new BadRequestException('Question count must be between 1 and 50');
			}

			// Validate game mode
			const gameModeValidation = await this.validationService.validateInputContent(gameMode);
			if (!gameModeValidation.isValid) {
				throw new BadRequestException('Invalid game mode');
			}

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Check if user can play
			const canPlayResult = await this.canPlay(userId, questionCount);
			if (!canPlayResult.canPlay) {
				throw new BadRequestException(canPlayResult.reason);
			}

			// Use deduction logic
			const currentBalance: PointBalance = {
				total_points: user.credits + user.purchasedPoints + (user.remainingFreeQuestions * 0.1),
				purchased_points: user.purchasedPoints,
				free_questions: user.remainingFreeQuestions,
				can_play_free: user.remainingFreeQuestions > 0,
				daily_limit: 10,
				next_reset_time: null,
			};

			const deductionResult = this.calculateNewBalance(currentBalance, questionCount, gameMode);
			
			// Update user with new balance
			user.remainingFreeQuestions = deductionResult.newBalance.free_questions;
			user.purchasedPoints = deductionResult.newBalance.purchased_points;
			user.credits = deductionResult.newBalance.total_points - deductionResult.newBalance.purchased_points - (deductionResult.newBalance.free_questions * 0.1);

			await this.userRepository.save(user);

			// Invalidate points cache
			await this.cacheService.delete(`points:balance:${userId}`);

			// Create transaction record
			const transaction = this.pointTransactionRepository.create({
				userId,
				type: PointTransactionType.DEDUCTION,
				source: PointSource.PURCHASE,
				amount: -questionCount,
				balanceAfter: user.credits,
				freeQuestionsAfter: user.remainingFreeQuestions,
				purchasedPointsAfter: user.purchasedPoints,
				description: `Points deducted for ${gameMode} game: ${questionCount} points`,
				metadata: {
					gameMode,
					freeQuestionsUsed: deductionResult.deductionDetails.freeQuestionsUsed,
					purchasedPointsUsed: deductionResult.deductionDetails.purchasedPointsUsed,
					creditsUsed: deductionResult.deductionDetails.creditsUsed,
				},
			});

			await this.pointTransactionRepository.save(transaction);
			logger.databaseCreate('point_transaction', {
				transactionId: transaction.id,
				userId,
				type: PointTransactionType.DEDUCTION,
				amount: -questionCount,
			});

			const balance: PointBalance = {
				total_points: user.credits,
				purchased_points: user.purchasedPoints,
				free_questions: user.remainingFreeQuestions,
				daily_limit: user.dailyFreeQuestions,
				can_play_free: user.remainingFreeQuestions > 0,
				next_reset_time: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
			};

			logger.databaseInfo('Points deducted successfully', {
				userId,
				questionCount,
				gameMode,
				total_points: balance.total_points,
				purchased_points: balance.purchased_points,
				free_questions: balance.free_questions,
			});

			return balance;
		} catch (error) {
			logger.databaseError('Failed to deduct points', {
				userId,
				questionCount,
				gameMode,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get point transaction history for user
	 */
	async getPointHistory(userId: string, limit: number = 50): Promise<PointTransactionEntity[]> {
		try {
			// Validate user ID
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
			logger.databaseError('Failed to get point history', {
				userId,
				limit,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Purchase points package
	 */
	async purchasePoints(userId: string, packageId: string): Promise<UrlResponse & { paymentUrl?: string }> {
		try {
			// Validate purchase request
			const purchaseValidation = await this.validationService.validatePointsPurchase(userId, packageId);
			if (!purchaseValidation.isValid) {
				throw new BadRequestException({
					message: 'Invalid purchase request',
					errors: purchaseValidation.errors,
				});
			}

			// Extract points from package ID
			const pointsMatch = packageId.match(/package_(\d+)/);
			if (!pointsMatch) {
				throw new BadRequestException('Invalid package ID');
			}

			const points = parseInt(pointsMatch[1]);
			const packageInfo = POINTS_PRICING_TIERS.find(tier => tier.points === points);

			if (!packageInfo) {
				throw new BadRequestException('Invalid points package');
			}

			// Create payment session using PaymentService
			const paymentResult = await this.paymentService.processPayment(userId, {
				amount: packageInfo.price,
				currency: 'USD',
				description: `Points purchase: ${points} points`,
				planType: 'points',
				numberOfPayments: 1,
				metadata: {
					packageId,
					points,
					price: packageInfo.price,
				},
			});

			logger.databaseInfo('Points purchase initiated', {
				userId,
				packageId,
				points,
				price: packageInfo.price,
				paymentId: paymentResult.paymentId,
			});

			return {
				success: true,
				paymentUrl: `/payment/process/${paymentResult.paymentId}`,
			};
		} catch (error) {
			logger.databaseError('Failed to purchase points', {
				userId,
				packageId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Confirm point purchase after payment
	 */
	async confirmPointPurchase(userId: string, paymentIntentId: string, points: number): Promise<PointBalance> {
		try {
			// Validate user ID
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
				source: PointSource.PURCHASE,
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
				total_points: user.credits,
				purchased_points: user.purchasedPoints,
				free_questions: user.remainingFreeQuestions,
				daily_limit: user.dailyFreeQuestions,
				can_play_free: user.remainingFreeQuestions > 0,
				next_reset_time: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
			};

			logger.databaseInfo('Point purchase confirmed', {
				userId,
				paymentIntentId,
				points,
				total_points: balance.total_points,
				purchased_points: balance.purchased_points,
				free_questions: balance.free_questions,
			});

			return balance;
		} catch (error) {
			logger.databaseError('Failed to confirm point purchase', {
				userId,
				paymentIntentId,
				points,
				error: error instanceof Error ? error.message : 'Unknown error',
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
			logger.databaseError('Failed to reset daily free questions', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
