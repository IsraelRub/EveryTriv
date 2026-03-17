import { DIFFICULTY_CONFIG, SurpriseScope } from '@shared/constants';
import { extractCustomDifficultyText } from '@shared/validation';

import { SURPRISE_PICK_SYSTEM_PROMPT, TRIVIA_GENERATION_SYSTEM_PROMPT } from '@internal/constants';
import type { PromptParams } from '@internal/types';

export { SURPRISE_PICK_SYSTEM_PROMPT, TRIVIA_GENERATION_SYSTEM_PROMPT };

export function buildSurprisePickPrompt(options: {
	excludeTopics: string[];
	scope: SurpriseScope;
	outputLanguage: string;
}): string {
	const { excludeTopics, scope, outputLanguage } = options;
	const languageRule = `You must return the topic and/or difficulty text in ${outputLanguage} only. Use only ${outputLanguage} for the values.`;
	const excludeSection =
		excludeTopics.length > 0
			? `\n- Do NOT choose any of these topics the user has already played (choose something different):\n${excludeTopics
					.slice(0, 50)
					.map((t, i) => `  ${i + 1}. "${t}"`)
					.join('\n')}\n`
			: '';

	switch (scope) {
		case SurpriseScope.TOPIC:
			return `Pick one trivia topic for a "surprise me" game round.
${languageRule}${excludeSection}
- "topic": Choose any interesting, knowledge-testable topic (e.g. a subject, era, field, or theme). Be specific and varied.

Return a single JSON object with exactly one key: "topic". Emit only that JSON, nothing else.`;

		case SurpriseScope.DIFFICULTY:
			return `Pick one difficulty level for a "surprise me" trivia game round.
${languageRule}
- "difficulty": Use a short custom description that fits the round (e.g. for beginners, challenging, mixed). Keep it to a few words in ${outputLanguage}. Do not use "easy", "medium", "hard" as literal words unless the output language is English.

Return a single JSON object with exactly one key: "difficulty". Emit only that JSON, nothing else.`;

		case SurpriseScope.BOTH:
		default:
			return `Pick one trivia topic and one difficulty for a single "surprise me" game round.
${languageRule}${excludeSection}
- "topic": Choose any interesting, knowledge-testable topic. Be specific and varied.
- "difficulty": Use a short custom description in ${outputLanguage} (a few words). Do not use "easy", "medium", "hard" unless the output language is English.

Return a single JSON object with exactly two keys: "topic" and "difficulty". Emit only that JSON, nothing else.`;
	}
}

export function buildTriviaPrompt(params: PromptParams): string {
	const { topic, difficulty, answerCount, isCustomDifficulty, excludeQuestions, outputLanguageLabel } = params;

	const difficultyDescription = isCustomDifficulty ? extractCustomDifficultyText(difficulty) : difficulty;
	const key = difficultyDescription.toLowerCase().trim();
	const difficultyGuidance = DIFFICULTY_CONFIG[key]?.promptGuidance;
	const excludeSection =
		excludeQuestions && excludeQuestions.length > 0
			? `\n- Exclude these questions (do not generate similar or identical questions):\n${excludeQuestions
					.slice(0, 50)
					.map((q, i) => `  ${i + 1}. "${q}"`)
					.join('\n')}`
			: '';

	return `You must emit exactly one JSON object describing a trivia question. Only emit the JSON—no markdown, code fences, comments, or explanations.

OUTPUT LANGUAGE
- You must write the question and every answer in ${outputLanguageLabel}. Use only ${outputLanguageLabel} for the "question" field and for each string in the "answers" array. Do not mix languages.

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
