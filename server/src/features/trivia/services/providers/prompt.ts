/**
 * Generate a structured prompt for LLM to create trivia questions
 */
export const STRUCTURED_PROMPT = (topic: string, difficulty: string) => {
  // אם זה רמת קושי מותאמת, נשתמש בתיאור המלא
  const difficultyDescription = difficulty;
    
  return `Generate a trivia question about "${topic}" with difficulty level: "${difficultyDescription}". 

If the difficulty is a custom description (not just "easy", "medium", or "hard"), interpret it carefully to create an appropriately challenging question that matches the described level of expertise or knowledge.

For example:
- "university level physics" should be much harder than "high school physics"
- "professional chef knowledge" should include advanced culinary techniques
- "elementary school geography" should be basic and age-appropriate

Respond in the following JSON format:
{
  "question": "<question text>",
  "answers": ["<answer1>", "<answer2>", "<answer3>", "<answer4>", "<answer5>"],
  "correctAnswerIndex": <index of correct answer (0-4)>
}
Only respond with valid JSON.`;
};
