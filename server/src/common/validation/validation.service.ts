/**
 * Validation Service
 *
 * @module validation.service
 * @description Service for server-side validation using shared validation functions
 */
import { Injectable } from '@nestjs/common';
import type { AnalyticsEventData, PersonalPaymentData } from 'everytriv-shared/types';
import type { LanguageValidationOptions, LanguageValidationResult } from 'everytriv-shared/types/language.types';
import { sanitizeCardNumber, sanitizeEmail, sanitizeInput } from 'everytriv-shared/utils';
import {
	validateCustomDifficultyText,
	validateEmail,
	validateInputContent,
	validateInputWithLanguageTool,
	validatePassword,
	validateTopicLength,
	validateUsername,
} from 'everytriv-shared/validation';

import { LoggerService } from '../../shared/controllers';
import type { ValidationResult, ValidationServiceOptions } from '../../shared/types/validation.types';
import { LanguageToolService } from './languageTool.service';

@Injectable()
export class ValidationService {
	constructor(
		private readonly logger: LoggerService,
		private readonly languageToolService: LanguageToolService
	) {}

	/**
	 * Validate username
	 */
	async validateUsername(value: string, options: ValidationServiceOptions = {}): Promise<ValidationResult> {
		try {
			this.logger.validationDebug('username', value, 'validation_start', options);

			// Sanitize input first
			const sanitizedValue = sanitizeInput(value);

			// Use shared validation function
			const result = validateUsername(sanitizedValue);

			// Log validation result
			if (result.isValid) {
				this.logger.validationInfo('username', value, 'validation_success', options);
			} else {
				this.logger.validationWarn('username', value, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			this.logger.validationError('username', value, 'validation_error', {
				...options,
				error: error instanceof Error ? error.message : 'Unknown error',
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
	async validateEmail(value: string, options: ValidationServiceOptions = {}): Promise<ValidationResult> {
		try {
			this.logger.validationDebug('email', value, 'validation_start', options);

			// Sanitize input first
			const sanitizedValue = sanitizeInput(value);

			// Sanitize email specifically
			const sanitizedEmail = sanitizeEmail(sanitizedValue);

			// Use shared validation function
			const result = validateEmail(sanitizedEmail);

			// Log validation result
			if (result.isValid) {
				this.logger.validationInfo('email', value, 'validation_success', options);
			} else {
				this.logger.validationWarn('email', value, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			this.logger.validationError('email', value, 'validation_error', {
				...options,
				error: error instanceof Error ? error.message : 'Unknown error',
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
	async validatePassword(value: string, options: ValidationServiceOptions = {}): Promise<ValidationResult> {
		try {
			this.logger.validationDebug('password', '[REDACTED]', 'validation_start', options);

			// Use shared validation function
			const result = validatePassword(value);

			// Log validation result (without password)
			if (result.isValid) {
				this.logger.validationInfo('password', '[REDACTED]', 'validation_success', {
					...options,
					strength: result.strength,
					score: result.score,
				});
			} else {
				this.logger.validationWarn('password', '[REDACTED]', 'validation_failed', {
					...options,
					errors: result.errors,
					strength: result.strength,
					score: result.score,
				});
			}

			return result;
		} catch (error) {
			this.logger.validationError('password', '[REDACTED]', 'validation_error', {
				...options,
				error: error instanceof Error ? error.message : 'Unknown error',
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
	async validateInputContent(value: string, options: ValidationServiceOptions = {}): Promise<ValidationResult> {
		try {
			this.logger.validationDebug('input_content', value, 'validation_start', options);

			// Sanitize input first (already removes HTML tags)
			const sanitizedValue = sanitizeInput(value);

			// Use shared validation function
			const result = await validateInputContent(sanitizedValue);

			// Log validation result
			if (result.isValid) {
				this.logger.validationInfo('input_content', value, 'validation_success', options);
			} else {
				this.logger.validationWarn('input_content', value, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			this.logger.validationError('input_content', value, 'validation_error', {
				...options,
				error: error instanceof Error ? error.message : 'Unknown error',
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
	async validateCustomDifficultyText(value: string, options: ValidationServiceOptions = {}): Promise<ValidationResult> {
		try {
			this.logger.validationDebug('custom_difficulty', value, 'validation_start', options);

			// Sanitize input first
			const sanitizedValue = sanitizeInput(value);

			// Use shared validation function
			const result = validateCustomDifficultyText(sanitizedValue);

			// Log validation result
			if (result.isValid) {
				this.logger.validationInfo('custom_difficulty', value, 'validation_success', options);
			} else {
				this.logger.validationWarn('custom_difficulty', value, 'validation_failed', {
					...options,
					errors: result.error ? [result.error] : ['Invalid custom difficulty'],
				});
			}

			return {
				isValid: result.isValid,
				errors: result.isValid ? [] : [result.error || 'Invalid custom difficulty'],
			};
		} catch (error) {
			this.logger.validationError('custom_difficulty', value, 'validation_error', {
				...options,
				error: error instanceof Error ? error.message : 'Unknown error',
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
	async validateTopicLength(value: string, options: ValidationServiceOptions = {}): Promise<ValidationResult> {
		try {
			this.logger.validationDebug('topic_length', value, 'validation_start', options);

			// Sanitize input first
			const sanitizedValue = sanitizeInput(value);

			// Use shared validation function
			const result = validateTopicLength(sanitizedValue);

			// Log validation result
			if (result.isValid) {
				this.logger.validationInfo('topic_length', value, 'validation_success', options);
			} else {
				this.logger.validationWarn('topic_length', value, 'validation_failed', {
					...options,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			this.logger.validationError('topic_length', value, 'validation_error', {
				...options,
				error: error instanceof Error ? error.message : 'Unknown error',
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
			this.logger.validationDebug('trivia_request', `${topic} (${difficulty})`, 'validation_start', {
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
				this.logger.validationInfo('trivia_request', `${topic} (${difficulty})`, 'validation_success', {
					topic,
					difficulty,
					count,
				});
			} else {
				this.logger.validationWarn('trivia_request', `${topic} (${difficulty})`, 'validation_failed', {
					topic,
					difficulty,
					count,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			this.logger.validationError('trivia_request', `${topic} (${difficulty})`, 'validation_error', {
				error: error instanceof Error ? error.message : 'Unknown error',
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
			this.logger.validationDebug('points_purchase', packageId, 'validation_start', { userId });

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
				this.logger.validationInfo('points_purchase', packageId, 'validation_success', { userId });
			} else {
				this.logger.validationWarn('points_purchase', packageId, 'validation_failed', {
					userId,
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			this.logger.validationError('points_purchase', packageId, 'validation_error', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
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
	async validatePhone(phone: string, options: ValidationServiceOptions = {}): Promise<ValidationResult> {
		try {
			this.logger.validationDebug('phone', phone, 'validation_start', options);

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

			this.logger.validationInfo('phone', phone, 'validation_success', options);
			return {
				isValid: true,
				errors: [],
			};
		} catch (error) {
			this.logger.validationError('phone', phone, 'validation_error', {
				...options,
				error: error instanceof Error ? error.message : 'Unknown error',
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
			this.logger.validationDebug('payment_data', '[REDACTED]', 'validation_start');

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
				this.logger.validationInfo('payment_data', '[REDACTED]', 'validation_success');
			} else {
				this.logger.validationWarn('payment_data', '[REDACTED]', 'validation_failed', {
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			this.logger.validationError('payment_data', '[REDACTED]', 'validation_error', {
				error: error instanceof Error ? error.message : 'Unknown error',
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
			this.logger.validationDebug('analytics_event', JSON.stringify(eventData), 'validation_start');

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
				this.logger.validationInfo('analytics_event', JSON.stringify(eventData), 'validation_success');
			} else {
				this.logger.validationWarn('analytics_event', JSON.stringify(eventData), 'validation_failed', {
					errors: result.errors,
				});
			}

			return result;
		} catch (error) {
			this.logger.validationError('analytics_event', JSON.stringify(eventData), 'validation_error', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return {
				isValid: false,
				errors: ['Analytics event validation failed'],
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
			this.logger.validationDebug('language_validation', value, 'validation_start', options);

			// Check if LanguageTool service is available
			const isAvailable = await this.languageToolService.isAvailable();

			if (isAvailable && options.useExternalAPI !== false) {
				// Use LanguageTool service
				this.logger.validationDebug('language_validation', value, 'using_external_api');

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
					this.logger.validationInfo('language_validation', value, 'validation_success_external', {
						...options,
						language: languageToolResult.language?.detectedLanguage?.code || options.language,
						confidence: 0.95,
						externalService: 'LanguageTool',
					});
				} else {
					this.logger.validationWarn('language_validation', value, 'validation_failed_external', {
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
				this.logger.validationDebug('language_validation', value, 'using_local_validation');

				const result: LanguageValidationResult = await validateInputWithLanguageTool(value, {
					...options,
					useExternalAPI: false, // Force local validation
				});

				// Log validation result
				if (result.isValid) {
					this.logger.validationInfo('language_validation', value, 'validation_success_local', {
						...options,
						language: result.language,
						confidence: result.confidence,
						externalService: 'Local',
					});
				} else {
					this.logger.validationWarn('language_validation', value, 'validation_failed_local', {
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
			this.logger.validationError('language_validation', value, 'validation_error', {
				...options,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return {
				isValid: false,
				errors: ['Language validation failed'],
			};
		}
	}
}
