import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	CREDIT_PURCHASE_PACKAGES,
	CreditTransactionType,
	ERROR_CODES,
	GameMode,
	PaymentStatus,
	UserRole,
	VALIDATION_CONFIG,
} from '@shared/constants';
import type {
	CanPlayResponse,
	CreditBalance,
	CreditPurchaseOption,
	CreditsPurchaseRequest,
	PaymentResult,
} from '@shared/types';
import { calculateNewBalance, ensureErrorObject } from '@shared/utils';
import { isCreditBalanceCacheEntry, isCreditPurchaseOptionArray } from '@shared/utils/domain';

import { CreditSource, SERVER_GAME_CONSTANTS } from '@internal/constants';
import { CreditTransactionEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { BaseCreditsService, serverLogger as logger } from '@internal/services';

import { ValidationService } from '../../common';
import { PaymentService } from '../payment';

@Injectable()
export class CreditsService extends BaseCreditsService {
	constructor(
		@InjectRepository(CreditTransactionEntity)
		private readonly creditTransactionRepository: Repository<CreditTransactionEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly cacheService: CacheService,
		private readonly paymentService: PaymentService,
		private readonly validationService: ValidationService
	) {
		super();
	}

	private assertQuestionsPerRequestWithinLimits(questionsPerRequest: number): void {
		const { MIN, MAX, UNLIMITED } = VALIDATION_CONFIG.limits.QUESTIONS;
		if (
			!Number.isFinite(questionsPerRequest) ||
			(questionsPerRequest !== UNLIMITED && (questionsPerRequest < MIN || questionsPerRequest > MAX))
		) {
			throw new BadRequestException(
				`Questions per request must be between ${MIN} and ${MAX}, or ${UNLIMITED} for unlimited mode`
			);
		}
	}

	/**
	 * Get user's current credit balance
	 */
	async getCreditBalance(userId: string): Promise<CreditBalance> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
			}

			const cacheKey = `credits:balance:${userId}`;

			return await this.cacheService.getOrSet<CreditBalance>(
				cacheKey,
				async () => {
					const user = await this.userRepository.findOne({ where: { id: userId } });
					if (!user) {
						throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
					}

					const credits = user.credits ?? 0;
					const purchasedCredits = user.purchasedCredits ?? 0;
					const freeQuestions = user.remainingFreeQuestions ?? 0;
					const totalCredits = credits + purchasedCredits + freeQuestions;

					const balance: CreditBalance = {
						totalCredits,
						credits,
						purchasedCredits,
						freeQuestions,
						dailyLimit: user.dailyFreeQuestions,
						canPlayFree: freeQuestions > 0,
						nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
					};

					logger.databaseInfo('Credit balance retrieved', {
						userId,
						credits: balance.totalCredits,
						purchasedCredits: balance.purchasedCredits,
						freeQuestions: balance.freeQuestions,
						canPlayFree: balance.canPlayFree,
					});
					return balance;
				},
				1800,
				isCreditBalanceCacheEntry
			);
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to get credit balance', {
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get available credit packages for purchase
	 */
	async getCreditPackages(): Promise<CreditPurchaseOption[]> {
		try {
			const cacheKey = 'credits:packages:all';

			return await this.cacheService.getOrSet<CreditPurchaseOption[]>(
				cacheKey,
				async () => {
					const packages: CreditPurchaseOption[] = CREDIT_PURCHASE_PACKAGES.map(pkg => ({
						id: pkg.id,
						credits: pkg.credits,
						price: pkg.price,
						priceDisplay: pkg.priceDisplay,
						pricePerCredit: pkg.pricePerCredit,
					}));

					logger.databaseInfo('Credit packages retrieved', { count: packages.length });
					return packages;
				},
				3600,
				isCreditPurchaseOptionArray
			);
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to get credit packages');
			throw error;
		}
	}

	/**
	 * Check if user can play with current credits
	 */
	async canPlay(
		userId: string,
		questionsPerRequest: number,
		gameMode: GameMode = GameMode.QUESTION_LIMITED
	): Promise<CanPlayResponse> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
			}

			this.assertQuestionsPerRequestWithinLimits(questionsPerRequest);

			// Convert UNLIMITED_QUESTIONS (-1) to MAX_QUESTIONS_PER_REQUEST for credit calculation
			const { UNLIMITED } = VALIDATION_CONFIG.limits.QUESTIONS;
			const maxQuestions = SERVER_GAME_CONSTANTS.MAX_QUESTIONS_PER_REQUEST;
			const normalizedQuestionsPerRequest = questionsPerRequest === UNLIMITED ? maxQuestions : questionsPerRequest;

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Admin users can always play without credits
			if (user.role === UserRole.ADMIN) {
				return { canPlay: true };
			}

			const credits = user.credits ?? 0;
			const purchasedCredits = user.purchasedCredits ?? 0;
			const freeQuestions = user.remainingFreeQuestions ?? 0;
			const totalAvailable = credits + purchasedCredits + freeQuestions;

			// Check if user has free questions available
			if (freeQuestions >= normalizedQuestionsPerRequest) {
				return { canPlay: true, reason: 'Free questions available' };
			}

			// Calculate required credits based on game mode
			const requiredCredits = this.calculateRequiredCredits(normalizedQuestionsPerRequest, gameMode);

			// Check if user has enough purchased credits
			if (purchasedCredits >= requiredCredits) {
				return { canPlay: true, reason: 'Sufficient purchased credits' };
			}

			// Check if user has enough total credits
			if (totalAvailable >= requiredCredits) {
				return { canPlay: true, reason: 'Sufficient total credits' };
			}

			return {
				canPlay: false,
				reason: `Insufficient credits. You have ${totalAvailable} credits available but need ${requiredCredits} credits (${normalizedQuestionsPerRequest} questions × ${gameMode} mode).`,
			};
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to check if user can play', {
				userId,
				questionsPerRequest,
				gameMode,
			});
			throw error;
		}
	}

	/**
	 * Deduct credits from user's balance
	 */
	async deductCredits(
		userId: string,
		questionsPerRequest: number,
		gameMode: GameMode = GameMode.QUESTION_LIMITED,
		reason?: string
	): Promise<CreditBalance> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
			}

			this.assertQuestionsPerRequestWithinLimits(questionsPerRequest);

			// Convert UNLIMITED_QUESTIONS (-1) to MAX_QUESTIONS_PER_REQUEST for credit calculation
			const { UNLIMITED } = VALIDATION_CONFIG.limits.QUESTIONS;
			const maxQuestions = SERVER_GAME_CONSTANTS.MAX_QUESTIONS_PER_REQUEST;
			const normalizedQuestionsPerRequest = questionsPerRequest === UNLIMITED ? maxQuestions : questionsPerRequest;

			const gameModeValidation = await this.validationService.validateInputContent(gameMode);
			if (!gameModeValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_GAME_MODE);
			}

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Admin users can play without deducting credits
			if (user.role === UserRole.ADMIN) {
				const nextResetTime = user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null;
				const credits = user.credits ?? 0;
				const purchasedCredits = user.purchasedCredits ?? 0;
				const freeQuestions = user.remainingFreeQuestions ?? 0;
				const totalCredits = credits + purchasedCredits + freeQuestions;

				const balance: CreditBalance = {
					totalCredits,
					credits,
					purchasedCredits,
					freeQuestions,
					dailyLimit: user.dailyFreeQuestions,
					canPlayFree: freeQuestions > 0,
					nextResetTime,
				};

				logger.databaseInfo('Admin user - credits deduction skipped', {
					userId,
					questionsPerRequest,
					gameMode,
					reason,
				});

				return balance;
			}

			const canPlayResult = await this.canPlay(userId, questionsPerRequest, gameMode);
			if (!canPlayResult.canPlay) {
				throw new BadRequestException(canPlayResult.reason);
			}

			// Use deduction logic
			const nextResetTime = user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null;
			const credits = user.credits ?? 0;
			const purchasedCredits = user.purchasedCredits ?? 0;
			const freeQuestions = user.remainingFreeQuestions ?? 0;
			const totalCredits = credits + purchasedCredits + freeQuestions;

			const currentBalance: CreditBalance = {
				totalCredits,
				credits,
				purchasedCredits,
				freeQuestions,
				canPlayFree: freeQuestions > 0,
				dailyLimit: user.dailyFreeQuestions,
				nextResetTime,
			};

			const deductionResult = calculateNewBalance(currentBalance, normalizedQuestionsPerRequest, gameMode);

			// Calculate total credits actually deducted (purchased credits + credits, excluding free questions)
			const totalCreditsDeducted =
				deductionResult.deductionDetails.purchasedCreditsUsed + deductionResult.deductionDetails.creditsUsed;
			const requiredCredits = this.calculateRequiredCredits(normalizedQuestionsPerRequest, gameMode);

			// Update user with new balance
			user.remainingFreeQuestions = deductionResult.newBalance.freeQuestions;
			user.purchasedCredits = deductionResult.newBalance.purchasedCredits;
			user.credits = deductionResult.newBalance.credits;

			await this.userRepository.save(user);

			// Invalidate credits cache
			await this.cacheService.delete(`credits:balance:${userId}`);

			// Create transaction record
			const transaction = this.creditTransactionRepository.create({
				userId,
				type: CreditTransactionType.GAME_USAGE,
				source:
					deductionResult.deductionDetails.purchasedCreditsUsed > 0 ? CreditSource.PURCHASED : CreditSource.FREE_DAILY,
				amount: -totalCreditsDeducted,
				balanceAfter: user.credits,
				freeQuestionsAfter: user.remainingFreeQuestions,
				purchasedCreditsAfter: user.purchasedCredits,
				description: reason
					? `Credits deducted (${reason}): ${requiredCredits} credits required, ${totalCreditsDeducted} credits deducted`
					: `Credits deducted for ${gameMode} game: ${requiredCredits} credits required, ${totalCreditsDeducted} credits deducted`,
				metadata: {
					gameMode,
					questionsPerRequest,
					requiredCredits,
					freeQuestionsUsed: deductionResult.deductionDetails.freeQuestionsUsed,
					purchasedCreditsUsed: deductionResult.deductionDetails.purchasedCreditsUsed,
					creditsUsed: deductionResult.deductionDetails.creditsUsed,
					reason: reason ?? null,
				},
			});

			await this.creditTransactionRepository.save(transaction);
			logger.databaseCreate('credit_transaction', {
				id: transaction.id,
				userId,
				type: CreditTransactionType.GAME_USAGE,
				amount: -totalCreditsDeducted,
				credits: requiredCredits,
				questionsPerRequest,
				gameMode,
				reason: reason ?? 'not_provided',
			});

			const finalCredits = user.credits ?? 0;
			const finalPurchasedCredits = user.purchasedCredits ?? 0;
			const finalFreeQuestions = user.remainingFreeQuestions ?? 0;
			const finalTotalCredits = finalCredits + finalPurchasedCredits + finalFreeQuestions;

			const balance: CreditBalance = {
				totalCredits: finalTotalCredits,
				credits: finalCredits,
				purchasedCredits: finalPurchasedCredits,
				freeQuestions: finalFreeQuestions,
				dailyLimit: user.dailyFreeQuestions,
				canPlayFree: finalFreeQuestions > 0,
				nextResetTime,
			};

			logger.databaseInfo('Credits deducted successfully', {
				userId,
				questionsPerRequest,
				gameMode,
				reason,
				credits: balance.totalCredits,
				purchasedCredits: balance.purchasedCredits,
				freeQuestions: balance.freeQuestions,
			});

			return balance;
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to deduct credits', {
				userId,
				questionsPerRequest,
				gameMode,
			});
			throw error;
		}
	}

	/**
	 * Get credit transaction history for user
	 */
	async getCreditHistory(userId: string, limit: number = 50): Promise<CreditTransactionEntity[]> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
			}

			// Validate limit
			if (!limit || limit < 1 || limit > 100) {
				throw new BadRequestException(ERROR_CODES.LIMIT_OUT_OF_RANGE);
			}

			const transactions = await this.creditTransactionRepository.find({
				where: { userId },
				order: { createdAt: 'DESC' },
				take: limit,
			});

			logger.databaseInfo('Credit history retrieved', { userId, count: transactions.length });
			return transactions;
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to get credit history', {
				userId,
				limit,
			});
			throw error;
		}
	}

	/**
	 * Purchase credits package
	 */
	async purchaseCredits(
		userId: string,
		request: CreditsPurchaseRequest
	): Promise<PaymentResult & { balance?: CreditBalance }> {
		try {
			// Validate purchase request
			const purchaseValidation = await this.validationService.validateCreditsPurchase(userId, request.packageId);
			if (!purchaseValidation.isValid) {
				throw new BadRequestException({
					message: 'Invalid purchase request',
					errors: purchaseValidation.errors,
				});
			}

			// Extract credits from package ID
			const creditsMatch = request.packageId.match(/package_(\d+)/);
			if (!creditsMatch) {
				throw new BadRequestException(ERROR_CODES.INVALID_PACKAGE_ID);
			}

			const credits = parseInt(creditsMatch[1]);
			const packageInfo = CREDIT_PURCHASE_PACKAGES.find(pkg => pkg.credits === credits);

			if (!packageInfo) {
				throw new BadRequestException(ERROR_CODES.INVALID_CREDITS_PACKAGE);
			}

			// Create payment session using PaymentService
			const paymentResult = await this.paymentService.processPayment(userId, {
				amount: packageInfo.price,
				currency: 'USD',
				description: `Credits purchase: ${credits} credits`,
				type: 'credits_purchase',
				metadata: {
					packageId: request.packageId,
					credits,
					price: packageInfo.price,
				},
				method: request.paymentMethod,
				paypalOrderId: request.paypalOrderId,
				paypalPaymentId: request.paypalPaymentId,
				manualPayment: request.manualPayment,
			});

			if (paymentResult.status !== PaymentStatus.COMPLETED) {
				logger.databaseInfo('Credits purchase pending completion', {
					userId,
					id: request.packageId,
					credits,
					price: packageInfo.price,
					status: paymentResult.status,
					paymentId: paymentResult.transactionId,
				});

				return paymentResult;
			}

			logger.databaseInfo('Credits purchase completed', {
				userId,
				id: request.packageId,
				credits,
				price: packageInfo.price,
				paymentId: paymentResult.transactionId,
			});

			const bonus = 0;
			const balance = await this.applyCreditsPurchase(userId, credits, bonus);

			return {
				...paymentResult,
				balance,
			};
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to purchase credits', {
				userId,
				id: request.packageId,
			});
			throw error;
		}
	}

	private async applyCreditsPurchase(userId: string, credits: number, bonus: number): Promise<CreditBalance> {
		const user = await this.userRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
		}

		const creditsToAdd = credits + bonus;
		user.credits = (user.credits ?? 0) + creditsToAdd;
		user.purchasedCredits = (user.purchasedCredits ?? 0) + creditsToAdd;

		await this.userRepository.save(user);

		// Create transaction record for purchased credits
		if (credits > 0) {
			const purchaseTransaction = this.creditTransactionRepository.create({
				userId,
				type: CreditTransactionType.PURCHASE,
				source: CreditSource.PURCHASED,
				amount: credits,
				balanceAfter: user.credits,
				freeQuestionsAfter: user.remainingFreeQuestions,
				purchasedCreditsAfter: user.purchasedCredits,
				description: `Credits purchase: ${credits} credits`,
				metadata: {
					originalAmount: credits,
				},
			});
			await this.creditTransactionRepository.save(purchaseTransaction);
		}

		// Create transaction record for bonus credits
		if (bonus > 0) {
			const bonusTransaction = this.creditTransactionRepository.create({
				userId,
				type: CreditTransactionType.PURCHASE,
				source: CreditSource.BONUS,
				amount: bonus,
				balanceAfter: user.credits,
				freeQuestionsAfter: user.remainingFreeQuestions,
				purchasedCreditsAfter: user.purchasedCredits,
				description: `Bonus credits: ${bonus} credits`,
				metadata: {
					originalAmount: bonus,
					isBonus: true,
				},
			});
			await this.creditTransactionRepository.save(bonusTransaction);
		}

		// Invalidate credits cache
		await this.cacheService.delete(`credits:balance:${userId}`);

		const creditsBalance = user.credits ?? 0;
		const purchasedCredits = user.purchasedCredits ?? 0;
		const freeQuestions = user.remainingFreeQuestions ?? 0;
		const totalCredits = creditsBalance + purchasedCredits + freeQuestions;

		return {
			totalCredits,
			credits: creditsBalance,
			purchasedCredits,
			freeQuestions,
			dailyLimit: user.dailyFreeQuestions ?? 0,
			canPlayFree: freeQuestions > 0,
			nextResetTime: user.lastFreeQuestionsReset ? user.lastFreeQuestionsReset.toISOString() : null,
			userId,
		};
	}

	/**
	 * Confirm credit purchase after payment
	 */
	async confirmCreditPurchase(userId: string, paymentIntentId: string, credits: number): Promise<CreditBalance> {
		try {
			const userValidation = await this.validationService.validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
			}

			// Validate payment intent ID
			const paymentValidation = await this.validationService.validateInputContent(paymentIntentId);
			if (!paymentValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_PAYMENT_INTENT_ID);
			}

			// Validate credits amount
			if (!credits || credits <= 0 || credits > 10000) {
				throw new BadRequestException(ERROR_CODES.INVALID_CREDITS_AMOUNT);
			}

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Add credits to user's balance
			user.purchasedCredits += credits;
			await this.userRepository.save(user);

			// Create transaction record
			const transaction = this.creditTransactionRepository.create({
				userId,
				type: CreditTransactionType.PURCHASE,
				source: CreditSource.PURCHASED,
				amount: credits,
				balanceAfter: user.credits,
				freeQuestionsAfter: user.remainingFreeQuestions,
				purchasedCreditsAfter: user.purchasedCredits,
				description: `Credits purchase: ${credits} credits`,
				paymentId: paymentIntentId,
				metadata: {
					originalAmount: credits,
				},
			});

			await this.creditTransactionRepository.save(transaction);

			// Invalidate credits cache
			await this.cacheService.delete(`credits:balance:${userId}`);

			const creditsBalance = user.credits ?? 0;
			const purchasedCredits = user.purchasedCredits ?? 0;
			const freeQuestions = user.remainingFreeQuestions ?? 0;
			const totalCredits = creditsBalance + purchasedCredits + freeQuestions;

			const balance: CreditBalance = {
				totalCredits,
				credits: creditsBalance,
				purchasedCredits,
				freeQuestions,
				dailyLimit: user.dailyFreeQuestions,
				canPlayFree: freeQuestions > 0,
				nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
			};

			logger.databaseInfo('Credit purchase confirmed', {
				userId,
				id: paymentIntentId,
				credits,
				purchasedCredits: balance.purchasedCredits,
				freeQuestions: balance.freeQuestions,
			});

			return balance;
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), 'Failed to confirm credit purchase', {
				userId,
				id: paymentIntentId,
				credits,
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
