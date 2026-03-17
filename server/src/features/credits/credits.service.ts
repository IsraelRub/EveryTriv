import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import {
	CREDIT_PURCHASE_PACKAGES,
	CREDITS_CONFIG_KEY_PACKAGES,
	CreditSource,
	CreditTransactionType,
	ERROR_MESSAGES,
	ErrorCode,
	GameMode,
	PaymentMethod,
	TIME_DURATIONS_SECONDS,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { CanPlayResponse, CreditBalance, CreditPurchaseOption } from '@shared/types';
import {
	calculateNewBalance,
	calculateRequiredCredits,
	ensureErrorObject,
	getErrorMessage,
	isNonEmptyString,
	isRecord,
	validateGameMode,
} from '@shared/utils';
import { isUuid, VALIDATORS } from '@shared/validation';

import { SERVER_CACHE_KEYS } from '@internal/constants';
import { CreditsConfigEntity, CreditTransactionEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { CreditPackageConfigItem } from '@internal/types';
import { isCreditBalanceCacheEntry, isCreditPurchaseOptionArray } from '@internal/utils';

function isCreditPackageConfigItem(value: unknown): value is CreditPackageConfigItem {
	if (!isRecord(value) || Array.isArray(value)) return false;
	const id = value.id;
	const credits = value.credits;
	const price = value.price;
	const tier = value.tier;
	return (
		isNonEmptyString(id) &&
		VALIDATORS.number(credits) &&
		credits > 0 &&
		VALIDATORS.number(price) &&
		price > 0 &&
		(tier === undefined || VALIDATORS.string(tier))
	);
}

function isCreditPackageConfigItemArray(value: unknown): value is CreditPackageConfigItem[] {
	return Array.isArray(value) && value.length > 0 && value.every(isCreditPackageConfigItem);
}

@Injectable()
export class CreditsService {
	constructor(
		@InjectRepository(CreditTransactionEntity)
		private readonly creditTransactionRepository: Repository<CreditTransactionEntity>,
		@InjectRepository(CreditsConfigEntity)
		private readonly creditsConfigRepository: Repository<CreditsConfigEntity>,
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
			throw new BadRequestException(ERROR_MESSAGES.validation.QUESTIONS_PER_REQUEST_RANGE(MIN, MAX, UNLIMITED));
		}
	}

	async getCreditBalance(userId: string): Promise<CreditBalance> {
		try {
			if (!isUuid(userId)) {
				throw new BadRequestException(ErrorCode.INVALID_USER_ID);
			}

			const cacheKey = SERVER_CACHE_KEYS.CREDITS.BALANCE(userId);

			return await this.cacheService.getOrSet<CreditBalance>(
				cacheKey,
				async () => {
					const user = await this.userRepository.findOne({
						where: { id: userId },
					});
					if (!user) {
						throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
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

	private mapConfigToPurchaseOption(pkg: CreditPackageConfigItem): CreditPurchaseOption {
		const priceDisplay = `$${Number(pkg.price).toFixed(2)}`;
		const pricePerCredit = pkg.credits > 0 ? pkg.price / pkg.credits : 0;
		return {
			id: pkg.id,
			credits: pkg.credits,
			price: pkg.price,
			priceDisplay,
			pricePerCredit,
			paypalProductId: `everytriv_credits_${pkg.credits}`,
			paypalPrice: Number(pkg.price).toFixed(2),
			supportedMethods: [PaymentMethod.MANUAL_CREDIT, PaymentMethod.PAYPAL],
		};
	}

	private async getCreditPackagesFromDb(): Promise<CreditPurchaseOption[] | null> {
		const row = await this.creditsConfigRepository.findOne({
			where: { key: CREDITS_CONFIG_KEY_PACKAGES },
		});
		if (!row?.value || !isCreditPackageConfigItemArray(row.value)) return null;
		return row.value.map(pkg => this.mapConfigToPurchaseOption(pkg));
	}

	async getCreditPackages(): Promise<CreditPurchaseOption[]> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.CREDITS.PACKAGES_ALL;

			return await this.cacheService.getOrSet<CreditPurchaseOption[]>(
				cacheKey,
				async () => {
					const fromDb = await this.getCreditPackagesFromDb();
					if (fromDb && fromDb.length > 0) return fromDb;
					return CREDIT_PURCHASE_PACKAGES.map(pkg => ({
						id: pkg.id,
						credits: pkg.credits,
						price: pkg.price,
						priceDisplay: pkg.priceDisplay,
						pricePerCredit: pkg.pricePerCredit,
						paypalProductId: pkg.paypalProductId,
						paypalPrice: pkg.paypalPrice,
						supportedMethods: pkg.supportedMethods,
					}));
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

	async setCreditPackages(packages: CreditPackageConfigItem[]): Promise<void> {
		if (!isCreditPackageConfigItemArray(packages)) {
			throw new BadRequestException(ERROR_MESSAGES.validation.INVALID_INPUT_DATA);
		}
		let row = await this.creditsConfigRepository.findOne({
			where: { key: CREDITS_CONFIG_KEY_PACKAGES },
		});
		if (row) {
			row.value = packages;
			await this.creditsConfigRepository.save(row);
		} else {
			row = this.creditsConfigRepository.create({ key: CREDITS_CONFIG_KEY_PACKAGES, value: packages });
			await this.creditsConfigRepository.save(row);
		}
		await this.cacheService.invalidate(SERVER_CACHE_KEYS.CREDITS.PACKAGES_ALL);
	}

	async getPackageById(packageId: string): Promise<CreditPurchaseOption | null> {
		const packages = await this.getCreditPackages();
		const creditsMatch = packageId.match(/package_(\d+)/);
		if (creditsMatch?.[1]) {
			const credits = parseInt(creditsMatch[1], 10);
			return packages.find(p => p.credits === credits) ?? null;
		}
		return packages.find(p => p.id === packageId) ?? null;
	}

	async getCreditPackagesForAdmin(): Promise<{ packages: CreditPurchaseOption[]; isDefault: boolean }> {
		const fromDb = await this.getCreditPackagesFromDb();
		if (fromDb && fromDb.length > 0) {
			return { packages: fromDb, isDefault: false };
		}
		const packages = CREDIT_PURCHASE_PACKAGES.map(pkg => ({
			id: pkg.id,
			credits: pkg.credits,
			price: pkg.price,
			priceDisplay: pkg.priceDisplay,
			pricePerCredit: pkg.pricePerCredit,
			paypalProductId: pkg.paypalProductId,
			paypalPrice: pkg.paypalPrice,
			supportedMethods: pkg.supportedMethods,
		}));
		return { packages, isDefault: true };
	}

	async canPlay(
		userId: string,
		questionsPerRequest: number,
		gameMode: GameMode = GameMode.QUESTION_LIMITED
	): Promise<CanPlayResponse> {
		try {
			if (!isUuid(userId)) {
				throw new BadRequestException(ErrorCode.INVALID_USER_ID);
			}

			// For TIME_LIMITED mode, validate time in seconds (30-300)
			// For other modes, validate as questions (1-10 or -1)
			if (gameMode === GameMode.TIME_LIMITED) {
				const { MIN, MAX } = VALIDATION_COUNT.TIME_LIMIT;
				if (!Number.isFinite(questionsPerRequest) || questionsPerRequest < MIN || questionsPerRequest > MAX) {
					throw new BadRequestException(ERROR_MESSAGES.validation.TIME_LIMIT_RANGE(MIN, MAX));
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
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Users with NULL credits (admins) can always play without credits
			if (user.credits === null) {
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
				reason: ERROR_MESSAGES.game.INSUFFICIENT_CREDITS_DETAIL(
					totalAvailable,
					requiredCredits,
					`${normalizedQuestionsPerRequest} questions × ${gameMode} mode`
				),
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
			if (!isUuid(userId)) {
				throw new BadRequestException(ErrorCode.INVALID_USER_ID);
			}

			// For TIME_LIMITED mode, validate time in seconds (30-300)
			// For MULTIPLAYER, validate total credits (questions × players) in allowed range
			// For other modes, validate as questions (1-50 or -1)
			if (gameMode === GameMode.TIME_LIMITED) {
				const { MIN, MAX } = VALIDATION_COUNT.TIME_LIMIT;
				if (!Number.isFinite(questionsPerRequest) || questionsPerRequest < MIN || questionsPerRequest > MAX) {
					throw new BadRequestException(ERROR_MESSAGES.validation.TIME_LIMIT_RANGE(MIN, MAX));
				}
			} else if (gameMode === GameMode.MULTIPLAYER) {
				const minTotal = VALIDATION_COUNT.PLAYERS.MIN * VALIDATION_COUNT.QUESTIONS.MIN;
				const maxTotal = VALIDATION_COUNT.QUESTIONS.MAX * VALIDATION_COUNT.PLAYERS.MAX;
				if (!Number.isFinite(questionsPerRequest) || questionsPerRequest < minTotal || questionsPerRequest > maxTotal) {
					throw new BadRequestException(ERROR_MESSAGES.validation.QUESTIONS_PER_REQUEST_RANGE(minTotal, maxTotal, -1));
				}
			} else {
				this.assertQuestionsPerRequestWithinLimits(questionsPerRequest);
			}

			// For TIME_LIMITED, use questionsPerRequest directly as time in seconds
			// For MULTIPLAYER, use as total credits (already questions × players)
			// For other modes, convert UNLIMITED_QUESTIONS (-1) to MAX for credit calculation
			const { UNLIMITED, MAX } = VALIDATION_COUNT.QUESTIONS;
			const normalizedQuestionsPerRequest =
				gameMode === GameMode.TIME_LIMITED
					? questionsPerRequest
					: gameMode === GameMode.MULTIPLAYER
						? questionsPerRequest
						: questionsPerRequest === UNLIMITED
							? MAX
							: questionsPerRequest;

			if (!validateGameMode(gameMode)) {
				throw new BadRequestException(ErrorCode.INVALID_GAME_MODE);
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
					throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
				}

				// Users with NULL credits (admins) don't need credit deduction
				if (user.credits === null) {
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
						ERROR_MESSAGES.game.INSUFFICIENT_CREDITS_DETAIL(
							totalCredits,
							requiredCredits,
							`${normalizedQuestionsPerRequest} questions × ${gameMode} mode`
						)
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
					throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
				}

				const creditTransaction = transactionalEntityManager.create(CreditTransactionEntity, {
					userId,
					type: CreditTransactionType.GAME_USAGE,
					source:
						deductionResult.deductionDetails.purchasedCreditsUsed > 0
							? CreditSource.PURCHASED
							: CreditSource.FREE_DAILY,
					amount: -totalCreditsDeducted,
					balanceAfter: updatedUser.credits ?? 0,
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
				this.invalidateCreditsCacheAsync(userId);

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

	async hasCreditsAddedForPayment(paymentId: string): Promise<boolean> {
		if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
			return false;
		}
		const existing = await this.creditTransactionRepository.findOne({
			where: {
				paymentId: paymentId.trim(),
				type: CreditTransactionType.PURCHASE,
			},
		});
		return existing != null;
	}

	async addCredits(
		entityManager: EntityManager | null,
		userId: string,
		credits: number,
		paymentId: string
	): Promise<CreditBalance> {
		try {
			if (!isUuid(userId)) {
				throw new BadRequestException(ErrorCode.INVALID_USER_ID);
			}

			// Validate credits amount
			if (!credits || credits <= 0 || credits > 10000) {
				throw new BadRequestException(ErrorCode.INVALID_CREDITS_AMOUNT);
			}

			const userRepo = entityManager ? entityManager.getRepository(UserEntity) : this.userRepository;
			const transactionRepo = entityManager
				? entityManager.getRepository(CreditTransactionEntity)
				: this.creditTransactionRepository;

			const user = await userRepo.findOne({ where: { id: userId } });
			if (!user) {
				throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED);
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
				balanceAfter: user.credits ?? 0,
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

	private invalidateCreditsCacheAsync(userId: string): void {
		const handleInvalidation = async () => {
			try {
				await this.cacheService.delete(SERVER_CACHE_KEYS.CREDITS.BALANCE(userId));
			} catch (error) {
				logger.cacheError('Failed to invalidate credits cache', SERVER_CACHE_KEYS.CREDITS.BALANCE(userId), {
					errorInfo: { message: getErrorMessage(error) },
					userId,
				});
			}
		};
		handleInvalidation();
	}
}
