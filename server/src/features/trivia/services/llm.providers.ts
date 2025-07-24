import { TriviaQuestion } from "@shared/types/trivia.types";
import { LLMProvider } from "../../../shared/types/llm.types";
import axios from "axios";

const STRUCTURED_PROMPT = (
  topic: string,
  difficulty: string
) => `Generate a trivia question about "${topic}" with difficulty "${difficulty}". Respond in the following JSON format:
{
  "question": "<question text>",
  "answers": ["<answer1>", "<answer2>", "<answer3>", "<answer4>", "<answer5>"],
  "correctAnswerIndex": <index of correct answer (0-4)>
}
Only respond with valid JSON.`;

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
          { role: "system", content: "You are a trivia question generator." },
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
    // TODO: Implement Anthropic API call
    throw new Error("Anthropic integration not implemented");
  }
}
