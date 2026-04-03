import { DifficultyLevel } from '@shared/constants';

export const DIFFICULTY_PROMPT_GUIDANCE: Record<string, string> = {
	[DifficultyLevel.EASY]:
		'Use well-known, commonly known facts that most people would know. Simple, straightforward questions.',
	[DifficultyLevel.MEDIUM]:
		'Use moderately known facts that require some knowledge of the topic. Balance between common and specialized knowledge.',
	[DifficultyLevel.HARD]:
		'Use specialized, less commonly known facts that require deeper knowledge or expertise in the topic.',
};

export const SURPRISE_PICK_SYSTEM_PROMPT =
	'You respond only with valid JSON. No markdown, no code fences, no explanation.';

export const TRIVIA_GENERATION_SYSTEM_PROMPT =
	'You are a trivia question generator that can handle standard (easy, medium, hard) and custom difficulty descriptions. Always provide factual, concise questions (<150 chars) with clear wording and balanced answer options. Questions must be genuine interrogative sentences using clear question words, never statements with question marks appended. Never use yes/no questions. Never include the correct answer or obvious hints within the question text. Keep answers aligned to the topic, ensure only one correct answer, and create plausible distractors that test genuine knowledge. Vary question types and topics to avoid repetition. Only use well-established, verifiable facts. Never invent, guess, or use uncertain information. If you are unsure about factual accuracy, return an empty question.';
