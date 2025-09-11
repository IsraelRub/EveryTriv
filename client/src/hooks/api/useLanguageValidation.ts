/**
 * Language Validation Hook
 *
 * @module UseLanguageValidation
 * @description React Query hooks for language validation functionality
 */
import { useMutation } from '@tanstack/react-query';

import { apiService } from '../../services/api';
import { clientLogger } from '@shared';

/**
 * Hook for validating language
 * @returns Mutation for validating language
 */
export const useValidateLanguage = () => {
	return useMutation({
		mutationFn: async ({ 
			text, 
			options 
		}: { 
			text: string; 
			options?: { 
				language?: string; 
				enableSpellCheck?: boolean; 
				enableGrammarCheck?: boolean; 
			} 
		}) => {
			clientLogger.userInfo('Validating language', { text: text.substring(0, 50), options });
			return apiService.validateLanguage(text, options);
		},
		onSuccess: (data) => {
			clientLogger.userInfo('Language validation completed', { 
				isValid: data.isValid,
				errorsCount: data.errors.length,
				suggestionsCount: data.suggestions.length
			});
		},
		onError: (error) => {
			clientLogger.userError('Failed to validate language', { error });
		},
	});
};
