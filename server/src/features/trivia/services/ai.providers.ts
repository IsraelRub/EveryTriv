import { TriviaQuestion } from "@shared/types/trivia.types";
import { LLMProvider } from "../../../shared/types/llm.types";
import axios from "axios";
import { QuestionValidator } from "../utils/question-validator";
import { AnswerShuffler } from "../utils/answer-shuffler";
import { QuestionCache } from "../utils/question-cache";
import { triviaAnalytics } from "../utils/trivia-analytics";

const STRUCTURED_PROMPT = (topic: string, difficulty: string, questionCount: number = 5) => {
  // אם זה רמת קושי מותאמת, נשתמש בתיאור המלא
  const difficultyDescription = difficulty;
  const answerCount = Math.max(3, Math.min(5, questionCount)); // Ensure answer count is between 3-5
    
  // Enhanced prompt with quality guidelines
  return `Generate a high-quality trivia question about "${topic}" with difficulty level: "${difficultyDescription}". 

QUALITY REQUIREMENTS:
- Question must be factual and verifiable
- All answer options must be plausible but only one correct
- Avoid ambiguous wording or trick questions
- Use clear, concise language appropriate for the difficulty level
- Ensure answer options are roughly similar in length and style

If the difficulty is a custom description (not just "easy", "medium", or "hard"), interpret it carefully to create an appropriately challenging question that matches the described level of expertise or knowledge.

DIFFICULTY GUIDELINES:
- "easy": Basic knowledge, widely known facts
- "medium": Requires some specific knowledge or reasoning
- "hard": Specialized knowledge or complex reasoning required
- Custom levels (e.g., "university level physics"): Match the specified expertise level

ANSWER DISTRIBUTION:
- Generate exactly ${answerCount} answer options
- Make incorrect answers plausible but clearly wrong
- Avoid obviously incorrect answers (like impossible dates or nonsensical options)
- Vary answer lengths reasonably (avoid one very short answer among long ones)

Respond in the following JSON format with exactly ${answerCount} answer options:
{
  "question": "<clear, well-formed question ending with ?>",
  "answers": [${Array.from({length: answerCount}, (_, i) => `"<plausible answer ${i + 1}>"`).join(', ')}],
  "correctAnswerIndex": <index of correct answer (0-${answerCount - 1})>,
  "explanation": "<brief explanation of why the correct answer is right (optional)>"
}
Only respond with valid JSON.`;
};

export class OpenAIProvider implements LLMProvider {
  name = "OpenAI";
  private apiKey: string;
  private questionCache = new QuestionCache();

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
  }

  async generateTriviaQuestion(
    topic: string,
    difficulty: string,
    questionCount: number = 5
  ): Promise<TriviaQuestion> {
    const startTime = Date.now();
    
    try {
      const actualQuestionCount = Math.max(3, Math.min(5, questionCount));
      const prompt = STRUCTURED_PROMPT(topic, difficulty, actualQuestionCount);
      
      // Determine if this is a custom difficulty
      const isCustomDifficulty = difficulty.startsWith('custom:');
      const actualDifficulty = isCustomDifficulty 
        ? difficulty.substring(7) // Remove 'custom:' prefix
        : difficulty;

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { 
              role: "system", 
              content: `You are a trivia question generator that can handle both standard difficulty levels (easy, medium, hard) and custom difficulty descriptions. Always create exactly ${actualQuestionCount} answer options.` 
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 512,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      // Parse the LLM response
      let data;
      try {
        data = JSON.parse(response.data.choices[0].message.content);
      } catch (err) {
        triviaAnalytics.recordError();
        throw new Error("Failed to parse LLM response");
      }

      // Validate that we have exactly the requested number of answers
      if (!data.answers || data.answers.length !== actualQuestionCount) {
        triviaAnalytics.recordError();
        throw new Error(`LLM response must contain exactly ${actualQuestionCount} answer options`);
      }

      // Calculate custom difficulty multiplier if applicable
      let customDifficultyMultiplier = 1;
      if (isCustomDifficulty) {
        customDifficultyMultiplier = this.calculateCustomDifficultyMultiplier(actualDifficulty);
      }

      // Create the initial question object
      let question: TriviaQuestion = {
        id: Math.random().toString(36).substring(2),
        topic,
        difficulty,
        question: data.question,
        answers: data.answers.map((text: string, i: number) => ({
          text,
          isCorrect: i === data.correctAnswerIndex,
        })),
        correctAnswerIndex: data.correctAnswerIndex,
        createdAt: new Date(),
        metadata: {
          actualDifficulty: isCustomDifficulty ? actualDifficulty : difficulty,
          questionCount: actualQuestionCount,
          customDifficultyMultiplier: isCustomDifficulty ? customDifficultyMultiplier : undefined,
        }
      };

      // Validate the question quality
      const validation = QuestionValidator.validateQuestion(question);
      if (!validation.isValid) {
        console.warn(`Question validation failed: ${validation.errors.join(', ')}`);
        // Could potentially retry generation here or apply fixes
      }

      // Sanitize and shuffle the question
      question = QuestionValidator.sanitizeQuestion(question);
      question = AnswerShuffler.shuffleAnswers(question);

      // Check for duplicates and cache the question
      if (!this.questionCache.isDuplicate(question)) {
        this.questionCache.addQuestion(question);
      } else {
        console.warn(`Potential duplicate question detected for topic: ${topic}`);
      }

      // Record analytics
      const responseTime = Date.now() - startTime;
      triviaAnalytics.recordQuestion(question, responseTime);

      return question;
    } catch (error) {
      triviaAnalytics.recordError();
      throw error;
    }
  }

  private calculateCustomDifficultyMultiplier(customDifficulty: string): number {
    const keywords = customDifficulty.toLowerCase();
    
    // Expert/Professional level
    if (keywords.includes('expert') || 
        keywords.includes('professional') || 
        keywords.includes('advanced') ||
        keywords.includes('phd') || 
        keywords.includes('doctorate') ||
        keywords.includes('master') ||
        keywords.includes('graduate')) {
      return 2.5;
    }
    
    // University/College level  
    if (keywords.includes('university') || 
        keywords.includes('college') ||
        keywords.includes('bachelor') ||
        keywords.includes('undergraduate')) {
      return 2.0;
    }
    
    // High school level
    if (keywords.includes('high school') || 
        keywords.includes('secondary') ||
        keywords.includes('advanced') ||
        keywords.includes('intermediate')) {
      return 1.5;
    }
    
    // Elementary/Beginner level
    if (keywords.includes('elementary') || 
        keywords.includes('beginner') || 
        keywords.includes('basic') ||
        keywords.includes('simple') ||
        keywords.includes('easy')) {
      return 1.0;
    }
    
    // Default for custom difficulties without clear indicators
    return 1.3;
  }
}

export class AnthropicProvider implements LLMProvider {
  name = "Anthropic";
  private apiKey: string;
  private questionCache = new QuestionCache();

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || "";
  }

  async generateTriviaQuestion(
    topic: string,
    difficulty: string,
    questionCount: number = 5
  ): Promise<TriviaQuestion> {
    if (!this.apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const startTime = Date.now();

    try {
      const actualQuestionCount = Math.max(3, Math.min(5, questionCount));
      const prompt = STRUCTURED_PROMPT(topic, difficulty, actualQuestionCount);
      
      // Determine if this is a custom difficulty
      const isCustomDifficulty = difficulty.startsWith('custom:');
      const actualDifficulty = isCustomDifficulty 
        ? difficulty.substring(7) // Remove 'custom:' prefix
        : difficulty;
      
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-3-sonnet-20240229",
          max_tokens: 512,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
        }
      );

      let data;
      try {
        const content = response.data.content[0].text;
        data = JSON.parse(content);
      } catch (err) {
        triviaAnalytics.recordError();
        throw new Error("Failed to parse Anthropic response");
      }

      // Validate that we have exactly the requested number of answers
      if (!data.answers || data.answers.length !== actualQuestionCount) {
        triviaAnalytics.recordError();
        throw new Error(`Anthropic response must contain exactly ${actualQuestionCount} answer options`);
      }

      // Calculate custom difficulty multiplier if applicable
      let customDifficultyMultiplier = 1;
      if (isCustomDifficulty) {
        customDifficultyMultiplier = this.calculateCustomDifficultyMultiplier(actualDifficulty);
      }

      // Create the initial question object
      let question: TriviaQuestion = {
        id: Math.random().toString(36).substring(2),
        topic,
        difficulty,
        question: data.question,
        answers: data.answers.map((text: string, i: number) => ({
          text,
          isCorrect: i === data.correctAnswerIndex,
        })),
        correctAnswerIndex: data.correctAnswerIndex,
        createdAt: new Date(),
        metadata: {
          actualDifficulty: isCustomDifficulty ? actualDifficulty : difficulty,
          questionCount: actualQuestionCount,
          customDifficultyMultiplier: isCustomDifficulty ? customDifficultyMultiplier : undefined,
        }
      };

      // Validate the question quality
      const validation = QuestionValidator.validateQuestion(question);
      if (!validation.isValid) {
        console.warn(`Anthropic question validation failed: ${validation.errors.join(', ')}`);
      }

      // Sanitize and shuffle the question
      question = QuestionValidator.sanitizeQuestion(question);
      question = AnswerShuffler.shuffleAnswers(question);

      // Check for duplicates and cache the question
      if (!this.questionCache.isDuplicate(question)) {
        this.questionCache.addQuestion(question);
      } else {
        console.warn(`Potential duplicate question detected for topic: ${topic}`);
      }

      // Record analytics
      const responseTime = Date.now() - startTime;
      triviaAnalytics.recordQuestion(question, responseTime);

      return question;
    } catch (error) {
      triviaAnalytics.recordError();
      console.error("Anthropic API error:", error);
      throw new Error("Failed to generate question using Anthropic");
    }
  }

  private calculateCustomDifficultyMultiplier(customDifficulty: string): number {
    const keywords = customDifficulty.toLowerCase();
    
    // Expert/Professional level
    if (keywords.includes('expert') || 
        keywords.includes('professional') || 
        keywords.includes('advanced') ||
        keywords.includes('phd') || 
        keywords.includes('doctorate') ||
        keywords.includes('master') ||
        keywords.includes('graduate')) {
      return 2.5;
    }
    
    // University/College level  
    if (keywords.includes('university') || 
        keywords.includes('college') ||
        keywords.includes('bachelor') ||
        keywords.includes('undergraduate')) {
      return 2.0;
    }
    
    // High school level
    if (keywords.includes('high school') || 
        keywords.includes('secondary') ||
        keywords.includes('advanced') ||
        keywords.includes('intermediate')) {
      return 1.5;
    }
    
    // Elementary/Beginner level
    if (keywords.includes('elementary') || 
        keywords.includes('beginner') || 
        keywords.includes('basic') ||
        keywords.includes('simple') ||
        keywords.includes('easy')) {
      return 1.0;
    }
    
    // Default for custom difficulties without clear indicators
    return 1.3;
  }
}