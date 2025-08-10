import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SystemMessage, HumanMessage, AIMessage as LangChainAIMessage } from "@langchain/core/messages";
import { SupportedModel } from '../../types/llm.types';
import { AIMessage } from '../../types/ai.types';
import { LoggerService } from '../../modules/logger/logger.service';

@Injectable()
export class AIService {
  constructor(private readonly logger: LoggerService) {}

  private getChatModel(modelName: SupportedModel): BaseChatModel {
    if (modelName.startsWith('gpt-')) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
      return new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelName,
        temperature: 0.7
      });
    }

    if (modelName.startsWith('claude-')) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
      return new ChatAnthropic({
        anthropicApiKey: apiKey,
        modelName: modelName,
        temperature: 0.7
      });
    }

    if (modelName.startsWith('gemini-')) {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY is not set');
      return new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        model: modelName,
        temperature: 0.7
      });
    }

    if (modelName.startsWith('mistral-')) {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) throw new Error('MISTRAL_API_KEY is not set');
      return new ChatMistralAI({
        apiKey: apiKey,
        modelName: modelName,
        temperature: 0.7
      });
    }

    throw new Error(`Unsupported model: ${modelName}`);
  }

  private convertToLangChainMessages(messages: AIMessage[]) {
    return messages.map(msg => {
      if (msg.isUser) {
        return new HumanMessage(msg.content);
      } else {
        return new LangChainAIMessage(msg.content);
      }
    });
  }

  /**
   * Generate an AI response with conversation history support
   */
  async getResponse(
    message: string,
    systemPrompt: string,
    conversationHistory: AIMessage[] = [],
    model: SupportedModel = 'gpt-3.5-turbo',
    maxHistoryLength: number = 20
  ): Promise<string> {
    try {
      this.logger.debug('Getting AI response', { model, messageLength: message.length });
      
      const chatModel = this.getChatModel(model);
      const recentHistory = conversationHistory.slice(-maxHistoryLength);

      const messages = [
        new SystemMessage(systemPrompt),
        ...this.convertToLangChainMessages(recentHistory),
        new HumanMessage(message)
      ];

      const response = await chatModel.invoke(messages);
      return response.content.toString();
    } catch (error) {
      this.logger.error(`Failed to get AI response from ${model}`, { error });
      throw new Error(`Failed to get response from ${model}: ${error}`);
    }
  }

  /**
   * Create a formatted chat message
   */
  createMessage(
    content: string,
    isUser: boolean,
    metadata?: Record<string, any>
  ): AIMessage {
    return {
      id: `${isUser ? 'user' : 'ai'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      isUser,
      timestamp: Date.now(),
      metadata
    };
  }

  /**
   * Generate trivia questions using AI
   */
  async generateTriviaQuestions(
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard',
    count: number = 1,
    model: SupportedModel = 'gpt-3.5-turbo'
  ): Promise<string[]> {
    const systemPrompt = `You are a trivia question generator. Create ${count} ${difficulty} difficulty questions about ${topic}. 
    Each question should:
    1. Be challenging but fair
    2. Have a clear, unambiguous answer
    3. Be factually accurate
    4. Be engaging and interesting
    Format each question on a new line.`;

    try {
      const response = await this.getResponse(
        `Generate ${count} ${difficulty} trivia questions about ${topic}.`,
        systemPrompt,
        [],
        model
      );

      // Split response into individual questions
      return response.split('\n').filter(q => q.trim());
    } catch (error) {
      this.logger.error('Failed to generate trivia questions', { error, topic, difficulty });
      throw new Error('Failed to generate trivia questions');
    }
  }

  /**
   * Validate and score a trivia answer using AI
   */
  async validateAnswer(
    question: string,
    expectedAnswer: string,
    userAnswer: string,
    model: SupportedModel = 'gpt-3.5-turbo'
  ): Promise<{ isCorrect: boolean; explanation: string; score: number }> {
    const systemPrompt = `You are a trivia answer validator. Compare the user's answer to the expected answer and:
    1. Determine if it's correct (allowing for minor variations in wording)
    2. Provide a brief explanation
    3. Assign a score from 0-100 based on accuracy
    Format response as JSON with isCorrect (boolean), explanation (string), and score (number) fields.`;

    try {
      const response = await this.getResponse(
        `Question: ${question}\nExpected Answer: ${expectedAnswer}\nUser Answer: ${userAnswer}`,
        systemPrompt,
        [],
        model
      );

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to validate answer', { error, question, userAnswer });
      throw new Error('Failed to validate answer');
    }
  }
}