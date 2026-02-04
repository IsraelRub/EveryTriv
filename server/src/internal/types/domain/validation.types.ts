export interface LanguageToolCheckOptions {
	enableSpellCheck?: boolean;
	enableGrammarCheck?: boolean;
	useExternalAPI?: boolean;
	language?: string;
}

export interface LanguageToolResponse {
	matches: Array<{
		message: string;
		shortMessage: string;
		replacements: Array<{ value: string }>;
		rule: {
			id: string;
			description: string;
			category: {
				id: string;
				name: string;
			};
		};
	}>;
}
