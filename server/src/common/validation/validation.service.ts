/**
 * Validation Service
 *
 * @module validation.service
 * @description Service for server-side validation using shared validation functions
 */
import { Injectable } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import { createStringLengthValidationError, createValidationError } from '@internal/utils';
import type {
	AnalyticsEventData,
	LanguageValidationOptions,
	LanguageValidationResult,
	PersonalPaymentData,
	UserFieldUpdate,
	UserProfileUpdateData,
	ValidationOptions,
	ValidationResult,
} from '@shared/types';
import {
	getErrorMessage,
	sanitizeCardNumber,
	sanitizeEmail,
	sanitizeInput,
	validateCustomDifficultyText,
	validateEmail,
	validateInputContent,
	validateInputWithLanguageTool,
	validatePassword,
	validateTopicLength,
	validateUsername,
} from '@shared/utils';
import { UserEntity } from 'src/internal/entities';

import { LanguageToolService } from './languageTool.service';

// import type { ValidationServiceInterface, ValidationContext } from '../types'; // Reserved for future use

@Injectable()
export class ValidationService {
	constructor(private readonly languageToolService: LanguageToolService) {}

	/**
	 * Validate username
	 */
	async validateUsername(value: string, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('username', value, 'validation_start', options);

			// Sanitize input first
			const sanitizedValue = sanitizeInput(value);

			// Use shared validation function
			const result = validateUsername(sanitizedValue);

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('username', value, 'validation_success', options);
			} else {
				logger.validationWarn('username', value, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('username', value, 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Username validation failed'],
			};
		}
	}

	/**
	 * Validate email
	 */
	async validateEmail(value: string, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('email', value, 'validation_start', options);

			// Sanitize input first
			const sanitizedValue = sanitizeInput(value);

			// Sanitize email specifically
			const sanitizedEmail = sanitizeEmail(sanitizedValue);

			// Use shared validation function
			const result = validateEmail(sanitizedEmail);

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('email', value, 'validation_success', options);
			} else {
				logger.validationWarn('email', value, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('email', value, 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Email validation failed'],
			};
		}
	}

	/**
	 * Validate password
	 */
	async validatePassword(value: string, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('password', '[REDACTED]', 'validation_start', options);

			// Use shared validation function
			const result = validatePassword(value);

			// Log validation result (without password)
			if (result.isValid) {
				logger.validationInfo('password', '[REDACTED]', 'validation_success', {
					...options,
					strength: result.strength,
					score: result.score,
				});
			} else {
				logger.validationWarn('password', '[REDACTED]', 'validation_failed', {
					...options,
					errors: result.errors,
					strength: result.strength,
					score: result.score,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('password', '[REDACTED]', 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Password validation failed'],
			};
		}
	}

	/**
	 * Validate input content
	 */
	async validateInputContent(value: string, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('input_content', value, 'validation_start', options);

			// Sanitize input first (already removes HTML tags)
			const sanitizedValue = sanitizeInput(value);

			// Use shared validation function
			const result = await validateInputContent(sanitizedValue);

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('input_content', value, 'validation_success', options);
			} else {
				logger.validationWarn('input_content', value, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('input_content', value, 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Content validation failed'],
			};
		}
	}

	/**
	 * Validate custom difficulty text
	 */
	async validateCustomDifficultyText(value: string, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('customDifficulty', value, 'validation_start', options);

			// Sanitize input first
			const sanitizedValue = sanitizeInput(value);

			// Use shared validation function
			const result = validateCustomDifficultyText(sanitizedValue);

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('customDifficulty', value, 'validation_success', options);
			} else {
				logger.validationWarn('customDifficulty', value, 'validation_failed', {
					...options,
					errors: result.error ? [result.error] : ['Invalid custom difficulty'],
				});
			}

			return {
				isValid: result.isValid,
				errors: result.isValid ? [] : [result.error || 'Invalid custom difficulty'],
			};
		} catch (error) {
			logger.validationError('customDifficulty', value, 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Custom difficulty validation failed'],
			};
		}
	}

	/**
	 * Validate topic length
	 */
	async validateTopicLength(value: string, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('topic_length', value, 'validation_start', options);

			// Sanitize input first
			const sanitizedValue = sanitizeInput(value);

			// Use shared validation function
			const result = validateTopicLength(sanitizedValue);

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('topic_length', value, 'validation_success', options);
			} else {
				logger.validationWarn('topic_length', value, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('topic_length', value, 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Topic length validation failed'],
			};
		}
	}

	/**
	 * Validate trivia request
	 * @param topic Topic
	 * @param difficulty Difficulty level
	 * @param count Number of questions
	 * @returns Validation result
	 */
	async validateTriviaRequest(topic: string, difficulty: string, count: number): Promise<ValidationResult> {
		try {
			logger.validationDebug('trivia_request', `${topic} (${difficulty})`, 'validation_start', {
				topic,
				difficulty,
				count,
			});

			const errors: string[] = [];

			// Validate topic using shared function
			const topicValidation = await this.validateTopicLength(topic);
			if (!topicValidation.isValid) {
				errors.push(...topicValidation.errors);
			}

			// Validate difficulty
			if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
				errors.push('Difficulty must be one of: easy, medium, hard');
			}

			// Validate count
			if (!count || count < 1 || count > 50) {
				errors.push('Question count must be between 1 and 50');
			}

			const result = {
				isValid: errors.length === 0,
				errors,
			};

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('trivia_request', `${topic} (${difficulty})`, 'validation_success', {
					topic,
					difficulty,
					count,
				});
			} else {
				logger.validationWarn('trivia_request', `${topic} (${difficulty})`, 'validation_failed', {
					topic,
					difficulty,
					count,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('trivia_request', `${topic} (${difficulty})`, 'validation_error', {
				error: getErrorMessage(error),
				topic,
				difficulty,
				count,
			});
			return {
				isValid: false,
				errors: ['Trivia request validation failed'],
			};
		}
	}

	/**
	 * Validate points purchase request
	 * @param userId User ID
	 * @param packageId Package ID
	 * @returns Validation result
	 */
	async validatePointsPurchase(userId: string, packageId: string): Promise<ValidationResult> {
		try {
			logger.validationDebug('points_purchase', packageId, 'validation_start', { userId });

			const errors: string[] = [];

			// Validate user ID
			if (!userId || userId.trim().length === 0) {
				errors.push('User ID is required');
			}

			// Validate package ID format
			const pointsMatch = packageId.match(/package_(\d+)/);
			if (!pointsMatch) {
				errors.push('Invalid package ID format');
			} else {
				const points = parseInt(pointsMatch[1]);
				if (points <= 0 || points > 10000) {
					errors.push('Invalid points amount');
				}
			}

			const result = {
				isValid: errors.length === 0,
				errors,
			};

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('points_purchase', packageId, 'validation_success', { userId });
			} else {
				logger.validationWarn('points_purchase', packageId, 'validation_failed', {
					userId,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('points_purchase', packageId, 'validation_error', {
				userId,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Points purchase validation failed'],
			};
		}
	}

	/**
	 * Validate phone number
	 * @param phone Phone number to validate
	 * @returns Validation result
	 */
	async validatePhone(phone: string, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('phone', phone, 'validation_start', options);

			// Remove non-digit characters
			const digitsOnly = phone.replace(/\D/g, '');

			// Basic phone validation
			if (!digitsOnly || digitsOnly.length < 7) {
				return {
					isValid: false,
					errors: ['Phone number must be at least 7 digits long'],
				};
			}

			if (digitsOnly.length > 15) {
				return {
					isValid: false,
					errors: ['Phone number must not exceed 15 digits'],
				};
			}

			logger.validationInfo('phone', phone, 'validation_success', options);
			return {
				isValid: true,
				errors: [],
			};
		} catch (error) {
			logger.validationError('phone', phone, 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Phone validation failed'],
			};
		}
	}

	/**
	 * Validate payment data
	 * @param paymentData Payment data object
	 * @returns Validation result
	 */
	async validatePaymentData(paymentData: PersonalPaymentData): Promise<ValidationResult> {
		try {
			logger.validationDebug('payment_data', '[REDACTED]', 'validation_start');

			const errors: string[] = [];

			// Validate required fields
			if (!paymentData.planType) {
				errors.push('Plan type is required');
			}

			if (!paymentData.email) {
				errors.push('Email is required');
			} else {
				const emailValidation = await this.validateEmail(paymentData.email);
				if (!emailValidation.isValid) {
					errors.push(...emailValidation.errors);
				}
			}

			if (!paymentData.first_name || paymentData.first_name.trim().length === 0) {
				errors.push('First name is required');
			}

			if (!paymentData.last_name || paymentData.last_name.trim().length === 0) {
				errors.push('Last name is required');
			}

			// Validate card details (basic validation)
			const sanitizedCardNumber = sanitizeCardNumber(paymentData.cardNumber || '');
			if (!sanitizedCardNumber || sanitizedCardNumber.length < 13) {
				errors.push('Valid card number is required');
			}

			if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
				errors.push('Valid expiry date is required (MM/YY format)');
			}

			if (!paymentData.cvv || paymentData.cvv.length < 3) {
				errors.push('Valid CVV is required');
			}

			const result = {
				isValid: errors.length === 0,
				errors,
			};

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('payment_data', '[REDACTED]', 'validation_success');
			} else {
				logger.validationWarn('payment_data', '[REDACTED]', 'validation_failed', {
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('payment_data', '[REDACTED]', 'validation_error', {
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Payment data validation failed'],
			};
		}
	}

	/**
	 * Validate analytics event data
	 * @param eventData Analytics event data
	 * @returns Validation result
	 */
	async validateAnalyticsEvent(eventData: AnalyticsEventData): Promise<ValidationResult> {
		try {
			logger.validationDebug('analytics_event', JSON.stringify(eventData), 'validation_start');

			const errors: string[] = [];

			// Validate required fields
			if (!eventData.eventType) {
				errors.push('Event type is required');
			}

			if (!eventData.timestamp) {
				errors.push('Timestamp is required');
			}

			// Validate timestamp format
			if (eventData.timestamp && isNaN(new Date(eventData.timestamp).getTime())) {
				errors.push('Invalid timestamp format');
			}

			// Validate properties if present
			if (eventData.properties && typeof eventData.properties !== 'object') {
				errors.push('Properties must be an object');
			}

			const result = {
				isValid: errors.length === 0,
				errors,
			};

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('analytics_event', JSON.stringify(eventData), 'validation_success');
			} else {
				logger.validationWarn('analytics_event', JSON.stringify(eventData), 'validation_failed', {
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('analytics_event', JSON.stringify(eventData), 'validation_error', {
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Analytics event validation failed'],
			};
		}
	}

	/**
	 * Validate game answer format
	 * @param answer Answer text to validate
	 * @param options Validation options
	 * @returns Validation result
	 */
	async validateGameAnswer(answer: string, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('game_answer', answer, 'validation_start', options);

			const errors: string[] = [];

			// Basic validation
			if (!answer || answer.trim().length === 0) {
				errors.push('Answer cannot be empty');
			}

			if (answer && answer.length > 1000) {
				errors.push('Answer cannot exceed 1000 characters');
			}

			// Check for inappropriate content
			const inappropriateWords = ['spam', 'fake', 'dummy'];
			const lowerAnswer = answer.toLowerCase();
			for (const word of inappropriateWords) {
				if (lowerAnswer.includes(word)) {
					errors.push('Answer contains inappropriate content');
					break;
				}
			}

			// Check for excessive repetition
			const words = answer.split(/\s+/);
			const wordCount = words.length;
			const uniqueWords = new Set(words.map(w => w.toLowerCase()));
			if (wordCount > 10 && uniqueWords.size < wordCount * 0.3) {
				errors.push('Answer appears to have excessive repetition');
			}

			const result = {
				isValid: errors.length === 0,
				errors,
			};

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('game_answer', answer, 'validation_success', options);
			} else {
				logger.validationWarn('game_answer', answer, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('game_answer', answer, 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Game answer validation failed'],
			};
		}
	}

	/**
	 * Validate user profile data
	 * @param profileData Profile data object
	 * @param options Validation options
	 * @returns Validation result
	 */
	async validateUserProfile(
		profileData: UserProfileUpdateData,
		options: ValidationOptions = {}
	): Promise<ValidationResult> {
		try {
			logger.validationDebug('user_profile', '[REDACTED]', 'validation_start', options);

			const errors: string[] = [];

			// Validate username if provided
			if (profileData.username && typeof profileData.username === 'string') {
				const usernameValidation = await this.validateUsername(profileData.username);
				if (!usernameValidation.isValid) {
					errors.push(...usernameValidation.errors);
				}
			}

			// Validate email if provided
			if (profileData.email && typeof profileData.email === 'string') {
				const emailValidation = await this.validateEmail(profileData.email);
				if (!emailValidation.isValid) {
					errors.push(...emailValidation.errors);
				}
			}

			// Validate first name
			if (profileData.first_name && typeof profileData.first_name === 'string') {
				if (profileData.first_name.length > 50) {
					errors.push('First name cannot exceed 50 characters');
				}
				if (!/^[a-zA-Z\s'-]+$/.test(profileData.first_name)) {
					errors.push('First name can only contain letters, spaces, apostrophes, and hyphens');
				}
			}

			// Validate last name
			if (profileData.last_name && typeof profileData.last_name === 'string') {
				if (profileData.last_name.length > 50) {
					errors.push('Last name cannot exceed 50 characters');
				}
				if (!/^[a-zA-Z\s'-]+$/.test(profileData.last_name)) {
					errors.push('Last name can only contain letters, spaces, apostrophes, and hyphens');
				}
			}

			// Validate bio
			if (profileData.bio && typeof profileData.bio === 'string') {
				if (profileData.bio.length > 500) {
					errors.push('Bio cannot exceed 500 characters');
				}
			}

			// Validate website URL
			if (profileData.website && typeof profileData.website === 'string') {
				const urlPattern = /^https?:\/\/.+\..+/;
				if (!urlPattern.test(profileData.website)) {
					errors.push('Website must be a valid URL starting with http:// or https://');
				}
			}

			const result = {
				isValid: errors.length === 0,
				errors,
			};

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('user_profile', '[REDACTED]', 'validation_success', options);
			} else {
				logger.validationWarn('user_profile', '[REDACTED]', 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('user_profile', '[REDACTED]', 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['User profile validation failed'],
			};
		}
	}

	/**
	 * Validate subscription plan
	 * @param plan Plan name to validate
	 * @param options Validation options
	 * @returns Validation result
	 */
	async validateSubscriptionPlan(plan: string, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('subscription_plan', plan, 'validation_start', options);

			const validPlans = ['basic', 'premium', 'pro', 'enterprise'];
			const isValid = validPlans.includes(plan.toLowerCase());

			const result = {
				isValid,
				errors: isValid ? [] : [`Invalid plan. Must be one of: ${validPlans.join(', ')}`],
			};

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('subscription_plan', plan, 'validation_success', options);
			} else {
				logger.validationWarn('subscription_plan', plan, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('subscription_plan', plan, 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Subscription plan validation failed'],
			};
		}
	}

	/**
	 * Validate points amount
	 * @param amount Points amount to validate
	 * @param options Validation options
	 * @returns Validation result
	 */
	async validatePointsAmount(amount: number, options: ValidationOptions = {}): Promise<ValidationResult> {
		try {
			logger.validationDebug('points_amount', amount.toString(), 'validation_start', options);

			const errors: string[] = [];

			if (amount < 0) {
				errors.push('Points amount cannot be negative');
			}

			if (amount > 100000) {
				errors.push('Points amount cannot exceed 100,000');
			}

			if (!Number.isInteger(amount)) {
				errors.push('Points amount must be a whole number');
			}

			const result = {
				isValid: errors.length === 0,
				errors,
			};

			// Log validation result
			if (result.isValid) {
				logger.validationInfo('points_amount', amount.toString(), 'validation_success', options);
			} else {
				logger.validationWarn('points_amount', amount.toString(), 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			logger.validationError('points_amount', amount.toString(), 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Points amount validation failed'],
			};
		}
	}

	/**
	 * Validate input with language tool (spell check and grammar)
	 * @param value Input text to validate
	 * @param options Language validation options
	 * @returns Validation result with language suggestions
	 */
	async validateInputWithLanguageTool(
		value: string,
		options: LanguageValidationOptions = {}
	): Promise<ValidationResult> {
		try {
			logger.validationDebug('language_validation', value, 'validation_start', options);

			// Check if LanguageTool service is available
			const isAvailable = await this.languageToolService.isAvailable();

			if (isAvailable && options.useExternalAPI !== false) {
				// Use LanguageTool service
				logger.validationDebug('language_validation', value, 'using_external_api');

				const languageToolResult = await this.languageToolService.checkText(value, {
					language: options.language || 'auto',
					enableSpellCheck: options.enableSpellCheck ?? true,
					enableGrammarCheck: options.enableGrammarCheck ?? true,
					enableLanguageDetection: options.enableLanguageDetection ?? true,
				});

				// Process LanguageTool results
				const errors: string[] = [];
				const suggestions: string[] = [];

				// Process matches (errors found by LanguageTool)
				if (languageToolResult.matches && Array.isArray(languageToolResult.matches)) {
					for (const match of languageToolResult.matches) {
						// Add error message
						errors.push(match.message || match.shortMessage || 'Language issue detected');

						// Add suggestions from replacements
						if (match.replacements && Array.isArray(match.replacements)) {
							const replacementSuggestions = match.replacements
								.slice(0, 3) // Limit to first 3 suggestions
								.map(replacement => replacement.value)
								.filter(value => value && value.trim());

							suggestions.push(...replacementSuggestions);
						}
					}
				}

				const isValid = errors.length === 0;

				// Log validation result
				if (isValid) {
					logger.validationInfo('language_validation', value, 'validation_success_external', {
						...options,
						language: languageToolResult.language?.detectedLanguage?.code || options.language,
						confidence: 0.95,
						externalService: 'LanguageTool',
					});
				} else {
					logger.validationWarn('language_validation', value, 'validation_failed_external', {
						...options,
						errors,
						suggestions,
						language: languageToolResult.language?.detectedLanguage?.code || options.language,
						externalService: 'LanguageTool',
					});
				}

				return {
					isValid,
					errors,
					suggestion: suggestions.length > 0 ? suggestions[0] : undefined,
				};
			} else {
				// Fall back to shared validation function
				logger.validationDebug('language_validation', value, 'using_local_validation');

				const result: LanguageValidationResult = await validateInputWithLanguageTool(value, {
					...options,
					useExternalAPI: false, // Force local validation
				});

				// Log validation result
				if (result.isValid) {
					logger.validationInfo('language_validation', value, 'validation_success_local', {
						...options,
						language: result.language,
						confidence: result.confidence,
						externalService: 'Local',
					});
				} else {
					logger.validationWarn('language_validation', value, 'validation_failed_local', {
						...options,
						errors: result.errors,
						suggestions: result.suggestions,
						language: result.language,
						externalService: 'Local',
					});
				}

				return {
					isValid: result.isValid,
					errors: result.errors,
					suggestion: result.suggestions.length > 0 ? result.suggestions[0] : undefined,
				};
			}
		} catch (error) {
			logger.validationError('language_validation', value, 'validation_error', {
				...options,
				error: getErrorMessage(error),
			});
			return {
				isValid: false,
				errors: ['Language validation failed'],
			};
		}
	}

	/**
	 * Helper function to validate and set string field
	 * @param user User entity
	 * @param field Field name
	 * @param value Value to set
	 * @param minLength Minimum length (optional)
	 * @param maxLength Maximum length (optional)
	 */
	validateAndSetStringField(
		user: UserEntity,
		field: string,
		value: unknown,
		minLength?: number,
		maxLength?: number
	): void {
		if (typeof value !== 'string') {
			throw createValidationError(field, 'string');
		}
		if (minLength && value.length < minLength) {
			throw createStringLengthValidationError(field, minLength);
		}
		if (maxLength && value.length > maxLength) {
			throw createStringLengthValidationError(field, undefined, maxLength);
		}
		Object.assign(user, { [field]: value });
	}

	/**
	 * Helper function to validate and set number field
	 * @param user User entity
	 * @param field Field name
	 * @param value Value to set
	 */
	validateAndSetNumberField(user: UserEntity, field: string, value: unknown): void {
		if (typeof value !== 'number') {
			throw createValidationError(field, 'number');
		}
		Object.assign(user, { [field]: value });
	}

	/**
	 * Helper function to validate and set boolean field
	 * @param user User entity
	 * @param field Field name
	 * @param value Value to set
	 */
	validateAndSetBooleanField(user: UserEntity, field: keyof UserFieldUpdate, value: unknown): void {
		if (typeof value !== 'boolean') {
			throw createValidationError(field, 'boolean');
		}
		Object.assign(user, { [field]: value });
	}
}
