export const VALIDATE_TEXT_CONTEXT = ['topic', 'customDifficulty'] as const;

export type ValidateTextContext = (typeof VALIDATE_TEXT_CONTEXT)[number];
