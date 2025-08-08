import { TriviaQuestion } from "@shared/types/trivia.types";
import { LLMProvider } from "../../types/trivia.types";
import axios from "axios";
import { STRUCTURED_PROMPT } from './prompt';

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
