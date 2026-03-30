
export interface LanguageToolError {
	message: string;
	shortMessage: string;
	replacements: { value: string }[];
	offset: number;
	length: number;
	rule: {
		id: string;
		description: string;
		category: {
			id: string;
			name: string;
		};
	};
}

export interface LanguageToolResponse {
	software?: {
		name: string;
		version: string;
		buildDate: string;
		apiVersion: number;
		status: string;
	};
	warnings?: {
		incompleteResults: boolean;
	};
	language?: {
		name?: string;
		code?: string;
		detectedLanguage?: {
			name: string;
			code: string;
			confidence: number;
		};
	};
	matches: LanguageToolError[];
}

export interface LanguageToolCheckOptions {
	enableSpellCheck?: boolean;
	enableGrammarCheck?: boolean;
	useExternalAPI?: boolean;
	detectLanguage?: boolean;
	language?: string;
}
