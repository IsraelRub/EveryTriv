import { TriviaQuestion } from "@shared/types/trivia.types";
import { LLMProvider } from "../../types/trivia.types";
import axios from "axios";
import { STRUCTURED_PROMPT } from './prompt';

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
