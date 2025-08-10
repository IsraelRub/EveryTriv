/**
 * AI-related types for the server
 */

export interface AIMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
}