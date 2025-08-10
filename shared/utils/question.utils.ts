/**
 * Shared question utilities for EveryTriv
 * Used by both client and server for question validation and processing
 */

import type { TriviaQuestion } from '../types/core.types';

export interface QuestionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validate question structure and content
export function validateQuestion(question: TriviaQuestion): QuestionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic structure validation
  if (!question.question || question.question.trim().length < 10) {
    errors.push("Question text must be at least 10 characters long");
  }

  if (!question.answers || question.answers.length < 2) {
    errors.push("Question must have at least 2 answer options");
  }

  // Validate correct answer
  const correctAnswers = question.answers.filter(a => a.isCorrect);
  if (correctAnswers.length !== 1) {
    errors.push("Question must have exactly one correct answer");
  }

  // Check answer length consistency
  if (question.answers && question.answers.length > 0) {
    const avgLength = question.answers.reduce((sum, a) => sum + a.text.length, 0) / question.answers.length;
    const hasVeryShortAnswer = question.answers.some(a => a.text.length < avgLength * 0.3);
    const hasVeryLongAnswer = question.answers.some(a => a.text.length > avgLength * 3);
    
    if (hasVeryShortAnswer || hasVeryLongAnswer) {
      warnings.push("Answer lengths vary significantly - may indicate quality issues");
    }
  }

  // Check for duplicate answers
  if (question.answers) {
    const answerTexts = question.answers.map(a => a.text.toLowerCase().trim());
    const uniqueAnswers = new Set(answerTexts);
    if (uniqueAnswers.size !== answerTexts.length) {
      errors.push("Question contains duplicate answer options");
    }
  }

  // Check question quality indicators
  if (question.question.includes("?") && !question.question.endsWith("?")) {
    warnings.push("Question contains multiple question marks or doesn't end with one");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Sanitize and clean question text
export function sanitizeQuestion(question: TriviaQuestion): TriviaQuestion {
  return {
    ...question,
    question: question.question.trim(),
    answers: question.answers.map(answer => ({
      ...answer,
      text: answer.text.trim()
    }))
  };
}

// Shuffle answers while maintaining correctAnswerIndex consistency
export function shuffleAnswers(question: TriviaQuestion): TriviaQuestion {
  const answers = [...question.answers];
  const correctAnswerText = answers[question.correctAnswerIndex].text;
  
  // Fisher-Yates shuffle algorithm
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  
  // Find new position of correct answer
  const newCorrectIndex = answers.findIndex(answer => answer.text === correctAnswerText);
  
  return {
    ...question,
    answers,
    correctAnswerIndex: newCorrectIndex
  };
}

// Calculate basic question difficulty score based on content
export function calculateQuestionComplexity(question: TriviaQuestion): number {
  let complexity = 0;
  
  // Question length contributes to complexity
  complexity += Math.min(question.question.length / 50, 2);
  
  // Number of answers affects complexity
  complexity += question.answers.length * 0.5;
  
  // Answer length variance indicates complexity
  if (question.answers.length > 0) {
    const avgLength = question.answers.reduce((sum, a) => sum + a.text.length, 0) / question.answers.length;
    const variance = question.answers.reduce((sum, a) => sum + Math.pow(a.text.length - avgLength, 2), 0) / question.answers.length;
    complexity += Math.sqrt(variance) / 10;
  }
  
  return Math.round(complexity * 10) / 10; // Round to 1 decimal place
}

// Check if answers are well-balanced (no obvious correct answer)
export function analyzeAnswerBalance(question: TriviaQuestion): {
  isBalanced: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let isBalanced = true;
  
  if (question.answers.length < 2) {
    return { isBalanced: false, suggestions: ['Need at least 2 answer options'] };
  }
  
  // Check for very short correct answer among long ones
  const correctAnswer = question.answers[question.correctAnswerIndex];
  const otherAnswers = question.answers.filter((_, i) => i !== question.correctAnswerIndex);
  const avgOtherLength = otherAnswers.reduce((sum, a) => sum + a.text.length, 0) / otherAnswers.length;
  
  if (correctAnswer.text.length < avgOtherLength * 0.5) {
    isBalanced = false;
    suggestions.push('Correct answer is much shorter than other options');
  }
  
  if (correctAnswer.text.length > avgOtherLength * 2) {
    isBalanced = false;
    suggestions.push('Correct answer is much longer than other options');
  }
  
  return { isBalanced, suggestions };
}
