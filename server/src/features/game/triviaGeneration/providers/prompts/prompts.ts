import { extractCustomDifficultyText } from '@shared/validation';

import type { PromptParams } from '@internal/types';

function getDifficultyGuidance(difficulty: string): string {
	switch (difficulty.toLowerCase().trim()) {
		case 'easy':
			return 'Use well-known, commonly known facts that most people would know. Simple, straightforward questions.';
		case 'medium':
			return 'Use moderately known facts that require some knowledge of the topic. Balance between common and specialized knowledge.';
		case 'hard':
			return 'Use specialized, less commonly known facts that require deeper knowledge or expertise in the topic.';
		default:
			return ''; // For custom difficulties, return empty string to let the AI interpret it
	}
}

export function generateTriviaQuestion(params: PromptParams): string {
	const { topic, difficulty, answerCount, isCustomDifficulty } = params;
	// Extract the actual difficulty text without the "custom:" prefix for AI
	const difficultyDescription = isCustomDifficulty ? extractCustomDifficultyText(difficulty) : difficulty;

	const difficultyGuidance = getDifficultyGuidance(difficultyDescription);

	return `You must emit exactly one JSON object describing a trivia question. Only emit the JSON—no markdown, code fences, comments, or explanations.

INPUT
- Topic: "${topic}"
- Difficulty request: "${difficultyDescription}"
- Answer count: ${answerCount}${difficultyGuidance ? `\n- Difficulty guidance: ${difficultyGuidance}` : ''}

MANDATORY RULES
1. Output must contain ONLY the fields "question" and "answers" in that order. Never include mappedDifficulty, excludeQuestions, explanations, or extra metadata.
2. "question" must be a single factual sentence under 150 characters, end with "?", and be answerable without external context. The question must be based on well-established, verifiable facts. Never invent or guess information.
3. "answers" must contain EXACTLY ${answerCount} unique strings under 100 characters. DO NOT return more or fewer than ${answerCount} answers. The first string is the correct answer; every incorrect answer must reference the same entity or concept as the question but still be wrong. All incorrect answers must be plausible but clearly incorrect.
4. Prefer standard ASCII double quotes ("); if you emit smart quotes, they will be normalized downstream.
5. If you cannot produce a compliant question with verified factual information, output {"question":"","answers":[]} with nothing else.

QUALITY REQUIREMENTS
- The correct answer must be factually accurate and verifiable
- All answers should be roughly similar in length and format
- Incorrect answers should be plausible distractors related to the topic
- Avoid ambiguous wording that could make multiple answers seem correct
- Ensure the question tests genuine knowledge, not trick wording

OUTPUT FORMAT (NO CODE FENCE, NO EXTRA TEXT)
{"question":"<question ending with ?>","answers":["<correct answer>","<wrong answer 1>", "..."]}

Violating any rule makes the response invalid.`;
}

export const SYSTEM_PROMPT =
	'You are a trivia question generator that can handle standard (easy, medium, hard) and custom difficulty descriptions. Always provide factual, concise questions (<150 chars) with clear wording and balanced answer options. Keep answers aligned to the topic and ensure only one correct answer. Only use well-established, verifiable facts. Never invent, guess, or use uncertain information. If you are unsure about factual accuracy, return an empty question.';
