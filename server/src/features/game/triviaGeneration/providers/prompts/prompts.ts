import { DIFFICULTY_CONFIG } from '@shared/constants';
import { extractCustomDifficultyText } from '@shared/validation';

import type { PromptParams } from '@internal/types';

export function generateTriviaQuestion(params: PromptParams): string {
	const { topic, difficulty, answerCount, isCustomDifficulty, excludeQuestions } = params;
	const difficultyDescription = isCustomDifficulty ? extractCustomDifficultyText(difficulty) : difficulty;
	const key = difficultyDescription.toLowerCase().trim();
	const difficultyGuidance = DIFFICULTY_CONFIG[key]?.promptGuidance;

	// Build exclude questions section if provided
	const excludeSection =
		excludeQuestions && excludeQuestions.length > 0
			? `\n- Exclude these questions (do not generate similar or identical questions):\n${excludeQuestions
					.slice(0, 50)
					.map((q, i) => `  ${i + 1}. "${q}"`)
					.join('\n')}`
			: '';

	return `You must emit exactly one JSON object describing a trivia question. Only emit the JSON—no markdown, code fences, comments, or explanations.

INPUT
- Topic: "${topic}"
- Difficulty request: "${difficultyDescription}"
- Answer count: ${answerCount}${difficultyGuidance ? `\n- Difficulty guidance: ${difficultyGuidance}` : ''}${excludeSection}

MANDATORY RULES
1. Output must contain ONLY the fields "question" and "answers" in that order. Never include mappedDifficulty, excludeQuestions, explanations, or extra metadata.
2. Output format: {"question":"<question ending with ?>","answers":["<correct answer>","<wrong answer 1>", "..."]}
3. Prefer standard ASCII double quotes ("); if you emit smart quotes, they will be normalized downstream.
4. If you cannot produce a compliant question with verified factual information, output {"question":"","answers":[]} with nothing else.

QUESTION REQUIREMENTS
- The question MUST be a genuine interrogative sentence using clear, direct question words (What, Which, Who, Where, When, How, Why)
- Must be a single factual sentence under 150 characters, end with "?", and be answerable without external context
- Must be based on well-established, verifiable facts
- Ensure the question is unambiguous and has exactly one correct answer
- The question must test knowledge appropriate for difficulty level "${difficultyDescription}" without revealing the answer
- CRITICAL: Match the requested difficulty level exactly
- NEVER: statements with question marks, yes/no questions (Is/Are/Do/Does/Did/Was/Were/Can/Could/Will/Would/Has/Have/Had), including the answer in the question, inventing or guessing information

ANSWER REQUIREMENTS
- Must contain EXACTLY ${answerCount} unique strings under 100 characters
- The first string is the correct answer and must be factually accurate and verifiable
- All answers should be roughly similar in length (within 20% of each other) and format
- Every incorrect answer must be a plausible distractor that references the same general topic or domain as "${topic}", uses similar terminology, and is factually incorrect but believable
- Balance the difficulty of distractors to match difficulty level "${difficultyDescription}"
- Ensure only one answer is definitively correct
- Test genuine knowledge appropriate for difficulty level "${difficultyDescription}"
- NEVER: more or fewer than ${answerCount} answers, obviously wrong unrelated answers, ambiguous wording, trick wording, obscure trivia

DIVERSITY REQUIREMENTS
- Generate a question on a DIFFERENT aspect, subtopic, or specific fact within "${topic}"
- Vary question types to avoid repetition
- Use different entities within "${topic}"
- Explore different angles and perspectives relevant to "${topic}"
- If excluded questions are provided, generate a completely different question and check against the excluded list before outputting

Violating any rule makes the response invalid.`;
}

export const SYSTEM_PROMPT =
	'You are a trivia question generator that can handle standard (easy, medium, hard) and custom difficulty descriptions. Always provide factual, concise questions (<150 chars) with clear wording and balanced answer options. Questions must be genuine interrogative sentences using clear question words, never statements with question marks appended. Never use yes/no questions. Never include the correct answer or obvious hints within the question text. Keep answers aligned to the topic, ensure only one correct answer, and create plausible distractors that test genuine knowledge. Vary question types and topics to avoid repetition. Only use well-established, verifiable facts. Never invent, guess, or use uncertain information. If you are unsure about factual accuracy, return an empty question.';
