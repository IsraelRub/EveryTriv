/**
 * Prompt templates for trivia question generation
 * Centralized prompt management for all LLM providers
 */
import { DifficultyLevel } from '@shared';
import { PromptParams } from '@shared';

export class PromptTemplates {
	/**
	 * Generate trivia question prompt with advanced quality guidelines
	 */
	static generateTriviaQuestion(params: PromptParams): string {
		const { topic, difficulty, answerCount, isCustomDifficulty } = params;
		const difficultyDescription = difficulty;

		return `Generate a high-quality trivia question about "${topic}" with difficulty level: "${difficultyDescription}". 

QUALITY REQUIREMENTS:
- Question must be factual and verifiable from reliable sources
- All answer options must be plausible but only one correct
- Avoid ambiguous wording, trick questions, or subjective opinions
- Use clear, concise language appropriate for the difficulty level
- Keep questions under 150 characters when possible
- Keep individual answers under 100 characters when possible
- Ensure answer options are roughly similar in length and style
- Questions should test knowledge, not reading comprehension
- Avoid questions that require external context or recent events
- Ensure questions can be answered without additional information
- Use specific, concrete facts rather than vague generalizations

DIFFICULTY GUIDELINES:
- "easy": Basic knowledge, widely known facts, general awareness
- "medium": Requires some specific knowledge, reasoning, or context
- "hard": Specialized knowledge, complex reasoning, or obscure facts required
- Custom levels: Match the specified expertise level exactly

If the difficulty is a custom description (not just "easy", "medium", or "hard"), interpret it carefully to create an appropriately challenging question that matches the described level of expertise or knowledge.

Examples:
- Advanced levels should include complex concepts, formulas, or theoretical knowledge
- Professional levels should include advanced techniques, methods, or specialized knowledge
- Basic levels should be fundamental, age-appropriate, and widely known

ANSWER DISTRIBUTION:
- Generate exactly ${answerCount} answer options
- Make incorrect answers plausible but clearly wrong to someone with the appropriate knowledge level
- Avoid obviously incorrect answers (like impossible dates, nonsensical options, or completely unrelated topics)
- Vary answer lengths reasonably (avoid one very short answer among long ones)
- Put the correct answer first in the answers array (we will shuffle the answers later)
- Ensure all answers are grammatically correct and properly formatted
- Avoid using "all of the above" or "none of the above" as answer options
- Make sure incorrect answers are factually wrong, not just less specific

${
	isCustomDifficulty
		? `DIFFICULTY MAPPING:
Since this is a custom difficulty, please map it to one of the standard difficulty levels (easy, medium, hard) based on the complexity and expertise level required. Include this mapping in your response.`
		: ''
}

Respond in the following JSON format with exactly ${answerCount} answer options:
{
  "question": "<clear, well-formed question ending with ?>",
		"answers": ["<correct answer first>", ${Array.from({ length: (answerCount || 4) - 1 }, (_, index) => `"<plausible wrong answer ${index + 1}>"`).join(', ')}],
  "explanation": "<brief explanation of why the correct answer is right and why others are wrong>"
  ${isCustomDifficulty ? `,\n  "mappedDifficulty": "<${DifficultyLevel.EASY}|${DifficultyLevel.MEDIUM}|${DifficultyLevel.HARD}>"` : ''}
}

IMPORTANT: Only respond with valid JSON. Do not include any additional text, formatting, or explanations outside the JSON structure.

ERROR HANDLING:
If you cannot generate a valid question for any reason (topic too specific, difficulty too complex, etc.), respond with this exact JSON structure:
{
  "question": null,
  "answers": [],
  "explanation": "Unable to generate question for this topic/difficulty combination"
  ${isCustomDifficulty ? `,\n  "mappedDifficulty": null` : ''}
}

This will help us provide appropriate feedback to the user.`;
	}

	/**
	 * Generate system prompt for providers
	 */
	static getSystemPrompt(): string {
		return 'You are a trivia question generator that can handle both standard difficulty levels (easy, medium, hard) and custom difficulty descriptions.';
	}
}
