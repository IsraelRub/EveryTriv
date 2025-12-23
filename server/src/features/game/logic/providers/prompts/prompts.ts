/**
 * Prompt templates for trivia question generation
 * Centralized prompt management for all LLM providers
 */
import { extractCustomDifficultyText } from '@shared/validation';

import type { PromptParams } from '@internal/types';

export class PromptTemplates {
	/**
	 * Generate trivia question prompt with advanced quality guidelines
	 */
	static generateTriviaQuestion(params: PromptParams): string {
		const { topic, difficulty, answerCount, isCustomDifficulty } = params;
		// Extract the actual difficulty text without the "custom:" prefix for AI
		const difficultyDescription = isCustomDifficulty ? extractCustomDifficultyText(difficulty) : difficulty;

		return `You must emit exactly one JSON object describing a trivia question. Only emit the JSON—no markdown, code fences, comments, or explanations.

INPUT
- Topic: "${topic}"
- Difficulty request: "${difficultyDescription}"
- Answer count: ${answerCount}

MANDATORY RULES
1. Output must contain ONLY the fields "question" and "answers" in that order. Never include mappedDifficulty, excludeQuestions, explanations, or extra metadata.
2. "question" must be a single factual sentence under 150 characters, end with "?", and be answerable without external context.
3. "answers" must contain exactly ${answerCount} unique strings under 100 characters. The first string is the correct answer; the rest must be plausible but wrong.
4. Do not reference or describe the excluded questions. Use them only to avoid duplicates.
5. Produce only ASCII double quotes ("). No smart quotes or non-ASCII punctuation.
6. If you cannot produce a compliant question, output {"question":"","answers":[]} with nothing else.

OUTPUT FORMAT (NO CODE FENCE, NO EXTRA TEXT)
{"question":"<question ending with ?>","answers":["<correct answer>","<wrong answer 1>", "..."]}

Violating any rule makes the response invalid.`;
	}

	/**
	 * Generate system prompt for providers
	 */
	static getSystemPrompt(): string {
		return 'You are a trivia question generator that can handle both standard difficulty levels (easy, medium, hard) and custom difficulty descriptions.';
	}
}
