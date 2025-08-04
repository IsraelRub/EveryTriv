import { TriviaQuestion } from "@shared/types/trivia.types";
import { LLMProvider } from "../../../shared/types/llm.types";
import axios from "axios";

const STRUCTURED_PROMPT = (topic: string, difficulty: string) => {
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

export class OpenAIProvider implements LLMProvider {
  name = "OpenAI";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
  }

  async generateTriviaQuestion(
    topic: string,
    difficulty: string
  ): Promise<TriviaQuestion> {
    const prompt = STRUCTURED_PROMPT(topic, difficulty);
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a trivia question generator that can handle both standard difficulty levels (easy, medium, hard) and custom difficulty descriptions. Always create exactly 5 answer options." },
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
      throw new Error("Failed to parse LLM response");
    }

    // Validate that we have exactly 5 answers
    if (!data.answers || data.answers.length !== 5) {
      throw new Error("LLM response must contain exactly 5 answer options");
    }

    return {
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
    };
  }
}

export class AnthropicProvider implements LLMProvider {
  name = "Anthropic";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || "";
  }

  async generateTriviaQuestion(
    topic: string,
    difficulty: string
  ): Promise<TriviaQuestion> {
    if (!this.apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const prompt = STRUCTURED_PROMPT(topic, difficulty);
    
    try {
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
        throw new Error("Failed to parse Anthropic response");
      }

      // Validate that we have exactly 5 answers
      if (!data.answers || data.answers.length !== 5) {
        throw new Error("Anthropic response must contain exactly 5 answer options");
      }

      return {
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
      };
    } catch (error) {
      console.error("Anthropic API error:", error);
      throw new Error("Failed to generate question using Anthropic");
    }
  }
}