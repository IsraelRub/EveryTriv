import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import {
	CREDIT_PURCHASE_PACKAGES,
	CreditTransactionType,
	ERROR_CODES,
	GameMode,
	SERVER_CACHE_KEYS,
	TIME_DURATIONS_SECONDS,
	UserRole,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { CanPlayResponse, CreditBalance, CreditPurchaseOption } from '@shared/types';
import { calculateNewBalance, calculateRequiredCredits, ensureErrorObject } from '@shared/utils';
import { isCreditBalanceCacheEntry, isCreditPurchaseOptionArray } from '@shared/utils/domain';
import { validateInputContent } from '@shared/validation';

import { CreditSource } from '@internal/constants';
import { CreditTransactionEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';

@Injectable()
export class CreditsService {
	constructor(
		@InjectRepository(CreditTransactionEntity)
		private readonly creditTransactionRepository: Repository<CreditTransactionEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly cacheService: CacheService
	) {}

	private assertQuestionsPerRequestWithinLimits(questionsPerRequest: number): void {
		const { MIN, MAX, UNLIMITED } = VALIDATION_COUNT.QUESTIONS;
		if (
			!Number.isFinite(questionsPerRequest) ||
			(questionsPerRequest !== UNLIMITED && (questionsPerRequest < MIN || questionsPerRequest > MAX))
		) {
			throw new BadRequestException(
				`Questions per request must be between ${MIN} and ${MAX}, or ${UNLIMITED} for unlimited mode`
			);
		}
	}

	async getCreditBalance(userId: string): Promise<CreditBalance> {
		try {
			const userValidation = await validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
			}

			const cacheKey = SERVER_CACHE_KEYS.CREDITS.BALANCE(userId);

			return await this.cacheService.getOrSet<CreditBalance>(
				cacheKey,
				async () => {
					const user = await this.userRepository.findOne({
						where: { id: userId },
					});
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
						userId: user.id,
					};

					return balance;
				},
				TIME_DURATIONS_SECONDS.HOUR,
				isCreditBalanceCacheEntry
			);
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), {
				contextMessage: 'Failed to get credit balance',
				userId,
			});
			throw error;
		}
	}

	async getCreditPackages(): Promise<CreditPurchaseOption[]> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.CREDITS.PACKAGES_ALL;

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

					return packages;
				},
				TIME_DURATIONS_SECONDS.HOUR,
				isCreditPurchaseOptionArray
			);
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), {
				contextMessage: 'Failed to get credit packages',
			});
			throw error;
		}
	}

	async canPlay(
		userId: string,
		questionsPerRequest: number,
		gameMode: GameMode = GameMode.QUESTION_LIMITED
	): Promise<CanPlayResponse> {
		try {
			const userValidation = await validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
			}

			// For TIME_LIMITED mode, validate time in seconds (30-300)
			// For other modes, validate as questions (1-10 or -1)
			if (gameMode === GameMode.TIME_LIMITED) {
				const { MIN, MAX } = VALIDATION_COUNT.TIME_LIMIT;
				if (!Number.isFinite(questionsPerRequest) || questionsPerRequest < MIN || questionsPerRequest > MAX) {
					throw new BadRequestException(`Time limit must be between ${MIN} and ${MAX} seconds for TIME_LIMITED mode`);
				}
			} else {
				this.assertQuestionsPerRequestWithinLimits(questionsPerRequest);
			}

			// For TIME_LIMITED, use questionsPerRequest directly as time in seconds
			// For other modes, convert UNLIMITED_QUESTIONS (-1) to MAX for credit calculation
			const { UNLIMITED, MAX } = VALIDATION_COUNT.QUESTIONS;
			const normalizedQuestionsPerRequest =
				gameMode === GameMode.TIME_LIMITED
					? questionsPerRequest
					: questionsPerRequest === UNLIMITED
						? MAX
						: questionsPerRequest;

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

			// Calculate required credits based on game mode (uses new methodology)
			// TIME_LIMITED = 10 fixed, QUESTION_LIMITED/UNLIMITED/MULTIPLAYER = 1 per question
			const requiredCredits = calculateRequiredCredits(normalizedQuestionsPerRequest, gameMode);

			// Check if user has free questions available (free questions cover the required credits)
			if (freeQuestions >= requiredCredits) {
				return { canPlay: true, reason: 'Free questions available' };
			}

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
			logger.databaseError(ensureErrorObject(error), {
				contextMessage: 'Failed to check if user can play',
				userId,
				questionsPerRequest,
				gameMode,
			});
			throw error;
		}
	}

	async deductCredits(
		userId: string,
		questionsPerRequest: number,
		gameMode: GameMode = GameMode.QUESTION_LIMITED,
		reason?: string
	): Promise<CreditBalance> {
		try {
			const userValidation = await validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
			}

			// For TIME_LIMITED mode, validate time in seconds (30-300)
			// For other modes, validate as questions (1-10 or -1)
			if (gameMode === GameMode.TIME_LIMITED) {
				const { MIN, MAX } = VALIDATION_COUNT.TIME_LIMIT;
				if (!Number.isFinite(questionsPerRequest) || questionsPerRequest < MIN || questionsPerRequest > MAX) {
					throw new BadRequestException(`Time limit must be between ${MIN} and ${MAX} seconds for TIME_LIMITED mode`);
				}
			} else {
				this.assertQuestionsPerRequestWithinLimits(questionsPerRequest);
			}

			// For TIME_LIMITED, use questionsPerRequest directly as time in seconds
			// For other modes, convert UNLIMITED_QUESTIONS (-1) to MAX for credit calculation
			const { UNLIMITED, MAX } = VALIDATION_COUNT.QUESTIONS;
			const normalizedQuestionsPerRequest =
				gameMode === GameMode.TIME_LIMITED
					? questionsPerRequest
					: questionsPerRequest === UNLIMITED
						? MAX
						: questionsPerRequest;

			const gameModeValidation = await validateInputContent(gameMode);
			if (!gameModeValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_GAME_MODE);
			}

			// Use atomic transaction with optimistic locking to prevent race conditions
			// Optimistic locking via WHERE conditions is more performant than pessimistic locks
			// canPlay validation is now inside transaction to prevent race conditions
			return await this.userRepository.manager.transaction(async transactionalEntityManager => {
				// Get user without lock (optimistic approach)
				const user = await transactionalEntityManager.findOne(UserEntity, {
					where: { id: userId },
				});

				if (!user) {
					throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
				}

				// Re-check admin status (shouldn't change, but defensive)
				if (user.role === UserRole.ADMIN) {
					const nextResetTime = user.lastFreeQuestionsReset
						? new Date(user.lastFreeQuestionsReset).toISOString()
						: null;
					const credits = user.credits ?? 0;
					const purchasedCredits = user.purchasedCredits ?? 0;
					const freeQuestions = user.remainingFreeQuestions ?? 0;
					const totalCredits = credits + purchasedCredits + freeQuestions;

					return {
						totalCredits,
						credits,
						purchasedCredits,
						freeQuestions,
						dailyLimit: user.dailyFreeQuestions,
						canPlayFree: freeQuestions > 0,
						nextResetTime,
						userId: user.id,
					};
				}

				// Calculate current balance from user
				const nextResetTime = user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null;
				const credits = user.credits ?? 0;
				const purchasedCredits = user.purchasedCredits ?? 0;
				const freeQuestions = user.remainingFreeQuestions ?? 0;
				const totalCredits = credits + purchasedCredits + freeQuestions;

				// Validate canPlay inside transaction to prevent race conditions
				// This ensures we check the balance atomically with the update
				const requiredCredits = calculateRequiredCredits(normalizedQuestionsPerRequest, gameMode);

				// Check if user has sufficient credits (same logic as canPlay, but inside transaction)
				if (freeQuestions < requiredCredits && purchasedCredits < requiredCredits && totalCredits < requiredCredits) {
					throw new BadRequestException(
						`Insufficient credits. You have ${totalCredits} credits available but need ${requiredCredits} credits (${normalizedQuestionsPerRequest} questions × ${gameMode} mode).`
					);
				}

				const currentBalance: CreditBalance = {
					totalCredits,
					credits,
					purchasedCredits,
					freeQuestions,
					canPlayFree: freeQuestions > 0,
					dailyLimit: user.dailyFreeQuestions,
					nextResetTime,
					userId: user.id,
				};

				const deductionResult = calculateNewBalance(currentBalance, normalizedQuestionsPerRequest, gameMode);

				// Calculate total credits actually deducted (purchased credits + credits, excluding free questions)
				// requiredCredits is already calculated above (line 287) for canPlay validation
				const totalCreditsDeducted =
					deductionResult.deductionDetails.purchasedCreditsUsed + deductionResult.deductionDetails.creditsUsed;

				// Atomic update with WHERE conditions for optimistic locking
				// This ensures values haven't changed since we read them
				const updateResult = await transactionalEntityManager
					.createQueryBuilder()
					.update(UserEntity)
					.set({
						remainingFreeQuestions: deductionResult.newBalance.freeQuestions,
						purchasedCredits: deductionResult.newBalance.purchasedCredits,
						credits: deductionResult.newBalance.credits,
					})
					.where('id = :userId', { userId })
					.andWhere('credits = :currentCredits', { currentCredits: credits })
					.andWhere('purchased_credits = :currentPurchased', {
						currentPurchased: purchasedCredits,
					})
					.andWhere('remaining_free_questions = :currentFree', {
						currentFree: freeQuestions,
					})
					.execute();

				if (updateResult.affected === 0) {
					throw new BadRequestException('Credit balance changed during transaction. Please retry.');
				}

				// Get updated user for final balance
				const updatedUser = await transactionalEntityManager.findOne(UserEntity, {
					where: { id: userId },
				});

				if (!updatedUser) {
					throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
				}

				const creditTransaction = transactionalEntityManager.create(CreditTransactionEntity, {
					userId,
					type: CreditTransactionType.GAME_USAGE,
					source:
						deductionResult.deductionDetails.purchasedCreditsUsed > 0
							? CreditSource.PURCHASED
							: CreditSource.FREE_DAILY,
					amount: -totalCreditsDeducted,
					balanceAfter: updatedUser.credits,
					freeQuestionsAfter: updatedUser.remainingFreeQuestions,
					purchasedCreditsAfter: updatedUser.purchasedCredits,
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

				await transactionalEntityManager.save(CreditTransactionEntity, creditTransaction);
				logger.databaseCreate('credit_transaction', {
					id: creditTransaction.id,
					userId,
					type: CreditTransactionType.GAME_USAGE,
					amount: -totalCreditsDeducted,
					credits: requiredCredits,
					questionsPerRequest,
					gameMode,
					reason: reason ?? 'not_provided',
				});

				// Invalidate credits cache (outside transaction for performance)
				this.cacheService.delete(SERVER_CACHE_KEYS.CREDITS.BALANCE(userId)).catch(error => {
					logger.cacheError('Failed to invalidate credits cache', SERVER_CACHE_KEYS.CREDITS.BALANCE(userId), {
						errorInfo: { message: String(error) },
						userId,
					});
				});

				const finalCredits = updatedUser.credits ?? 0;
				const finalPurchasedCredits = updatedUser.purchasedCredits ?? 0;
				const finalFreeQuestions = updatedUser.remainingFreeQuestions ?? 0;
				const finalTotalCredits = finalCredits + finalPurchasedCredits + finalFreeQuestions;

				const balance: CreditBalance = {
					totalCredits: finalTotalCredits,
					credits: finalCredits,
					purchasedCredits: finalPurchasedCredits,
					freeQuestions: finalFreeQuestions,
					dailyLimit: updatedUser.dailyFreeQuestions,
					canPlayFree: finalFreeQuestions > 0,
					nextResetTime,
					userId: updatedUser.id,
				};

				return balance;
			});
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), {
				contextMessage: 'Failed to deduct credits',
				userId,
				questionsPerRequest,
				gameMode,
			});
			throw error;
		}
	}

	async getCreditHistory(userId: string, limit: number = 50): Promise<CreditTransactionEntity[]> {
		try {
			const userValidation = await validateInputContent(userId);
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

			return transactions;
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), {
				contextMessage: 'Failed to get credit history',
				userId,
				limit,
			});
			throw error;
		}
	}

	async addCredits(
		entityManager: EntityManager | null,
		userId: string,
		credits: number,
		paymentId: string
	): Promise<CreditBalance> {
		try {
			const userValidation = await validateInputContent(userId);
			if (!userValidation.isValid) {
				throw new BadRequestException(ERROR_CODES.INVALID_USER_ID);
			}

			// Validate credits amount
			if (!credits || credits <= 0 || credits > 10000) {
				throw new BadRequestException(ERROR_CODES.INVALID_CREDITS_AMOUNT);
			}

			const userRepo = entityManager ? entityManager.getRepository(UserEntity) : this.userRepository;
			const transactionRepo = entityManager
				? entityManager.getRepository(CreditTransactionEntity)
				: this.creditTransactionRepository;

			const user = await userRepo.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Update user credits
			user.credits = (user.credits ?? 0) + credits;
			user.purchasedCredits = (user.purchasedCredits ?? 0) + credits;
			await userRepo.save(user);

			const creditTransaction = transactionRepo.create({
				userId,
				type: CreditTransactionType.PURCHASE,
				source: CreditSource.PURCHASED,
				amount: credits,
				balanceAfter: user.credits,
				freeQuestionsAfter: user.remainingFreeQuestions,
				purchasedCreditsAfter: user.purchasedCredits,
				description: `Credits purchase: ${credits} credits`,
				paymentId,
				metadata: {
					originalAmount: credits,
				},
			});
			await transactionRepo.save(creditTransaction);

			// Invalidate cache
			await this.cacheService.delete(SERVER_CACHE_KEYS.CREDITS.BALANCE(userId));

			return this.buildCreditBalance(user);
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), {
				contextMessage: 'Failed to add credits',
				userId,
				credits,
				paymentId,
			});
			throw error;
		}
	}

	private buildCreditBalance(user: UserEntity): CreditBalance {
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
			userId: user.id,
		};
	}

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
				}
			}
		} catch (error) {
			logger.databaseError(ensureErrorObject(error), {
				contextMessage: 'Failed to reset daily free questions',
			});
			throw error;
		}
	}
}
