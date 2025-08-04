// קבועים לטיפול ברמת קושי מותאמת
export const CUSTOM_DIFFICULTY_PREFIX = 'custom:';

// פונקציה לבדיקה אם רמת קושי היא מותאמת אישית
export const isCustomDifficulty = (difficulty: string): boolean => {
  return difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX);
};

// פונקציה לחילוץ הטקסט המותאם מרמת הקושי
export const extractCustomDifficultyText = (difficulty: string): string => {
  if (!isCustomDifficulty(difficulty)) return '';
  return difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length);
};

// פונקציה ליצירת רמת קושי מותאמת
export const createCustomDifficulty = (text: string): string => {
  return `${CUSTOM_DIFFICULTY_PREFIX}${text.trim()}`;
};

// פונקציה להצגת רמת קושי בצורה ידידותית
export const displayDifficulty = (difficulty: string, maxLength: number = 50): string => {
  if (isCustomDifficulty(difficulty)) {
    const customText = extractCustomDifficultyText(difficulty);
    const displayText = customText.length > maxLength 
      ? `${customText.substring(0, maxLength)}...` 
      : customText;
    return `Custom: ${displayText}`;
  }
  
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'hard':
      return 'Hard';
    default:
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }
};

// פונקציה לקבלת צבע תג לפי רמת קושי
export const getDifficultyBadgeClass = (difficulty: string): string => {
  if (isCustomDifficulty(difficulty)) {
    return 'bg-info';
  }
  
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-success';
    case 'medium':
      return 'bg-warning';
    case 'hard':
      return 'bg-danger';
    default:
      return 'bg-primary';
  }
};

// פונקציה לולידציה של טקסט רמת קושי מותאמת
export const validateCustomDifficultyText = (text: string): { 
  isValid: boolean; 
  error?: string; 
  suggestions?: string[] 
} => {
  const trimmedText = text.trim();
  
  if (trimmedText.length === 0) {
    return {
      isValid: false,
      error: 'Please enter a difficulty description',
      suggestions: ['Example: "university level physics"']
    };
  }
  
  if (trimmedText.length < 3) {
    return {
      isValid: false,
      error: 'Description must be at least 3 characters long',
      suggestions: ['Be more specific about the difficulty level']
    };
  }
  
  if (trimmedText.length > 200) {
    return {
      isValid: false,
      error: 'Description must be less than 200 characters',
      suggestions: ['Try to be more concise']
    };
  }

  // בדיקה למילות מפתח מומלצות
  const recommendedKeywords = [
    'beginner', 'elementary', 'basic', 'simple', 'easy',
    'intermediate', 'moderate', 'medium', 'standard', 'average',
    'advanced', 'expert', 'professional', 'complex', 'difficult', 'hard',
    'university', 'college', 'school', 'academic', 'graduate',
    'level', 'grade', 'knowledge', 'skills', 'phd', 'master', 'bachelor'
  ];

  const lowerText = trimmedText.toLowerCase();
  const hasKeyword = recommendedKeywords.some(keyword => lowerText.includes(keyword));

  if (!hasKeyword) {
    return {
      isValid: true, // עדיין תקין, אבל עם הצעות
      suggestions: [
        'Consider adding difficulty indicators like "beginner", "advanced", "professional"',
        'Examples: "beginner cooking", "professional sports", "university physics"'
      ]
    };
  }

  return { isValid: true };
};

// הצעות לרמות קושי מותאמות לפי נושא
export const getCustomDifficultySuggestions = (topic?: string): string[] => {
  const generalSuggestions = [
    'beginner level',
    'elementary school level',
    'high school level', 
    'college level',
    'university level',
    'professional level',
    'expert level'
  ];

  if (!topic) return generalSuggestions;

  const topicLower = topic.toLowerCase();
  const topicSpecific: Record<string, string[]> = {
    science: [
      'elementary science facts',
      'high school chemistry',
      'university physics',
      'graduate level biology',
      'research scientist knowledge'
    ],
    sports: [
      'casual fan knowledge',
      'sports enthusiast level',
      'professional athlete knowledge',
      'sports analyst expertise'
    ],
    history: [
      'basic historical facts',
      'high school world history',
      'university historical analysis',
      'professional historian level'
    ],
    cooking: [
      'beginner home cook',
      'intermediate cooking skills',
      'professional chef level',
      'culinary expert knowledge'
    ],
    music: [
      'casual music fan',
      'music student level', 
      'professional musician',
      'music theory expert'
    ],
    technology: [
      'basic computer user',
      'IT professional level',
      'software developer',
      'computer science expert'
    ],
    art: [
      'art appreciation level',
      'art student knowledge',
      'professional artist',
      'art historian expert'
    ]
  };

  // חיפוש קטגוריה מתאימה
  const matchingCategory = Object.keys(topicSpecific).find(category => 
    topicLower.includes(category)
  );

  if (matchingCategory) {
    return [
      ...topicSpecific[matchingCategory],
      ...generalSuggestions.slice(0, 3)
    ];
  }

  // אם אין התאמה ספציפית, ניצור הצעות כלליות עם הנושא
  return [
    `beginner ${topic}`,
    `intermediate ${topic}`,
    `advanced ${topic}`,
    `professional ${topic} knowledge`,
    ...generalSuggestions.slice(0, 3)
  ];
};

import { EasyIcon, MediumIcon, HardIcon, CustomIcon } from '../components/icons';
import { FC } from 'react';

// Function to get icon component by difficulty
export const getDifficultyIcon = (difficulty: string): FC => {
  if (isCustomDifficulty(difficulty)) {
    return CustomIcon;
  }
  
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return EasyIcon;
    case 'medium':
      return MediumIcon;
    case 'hard':
      return HardIcon;
    default:
      return MediumIcon;
  }
};

// פונקציה לפורמט רמת קושי לשמירה
export const formatDifficultyForStorage = (difficulty: string): string => {
  return difficulty.trim();
};

// פונקציה להשוואת רמות קושי
export const compareDifficulties = (diff1: string, diff2: string): boolean => {
  return formatDifficultyForStorage(diff1) === formatDifficultyForStorage(diff2);
};

// פונקציה לקבלת כותרת מתאימה לרמת קושי
export const getDifficultyTitle = (difficulty: string): string => {
  if (isCustomDifficulty(difficulty)) {
    const customText = extractCustomDifficultyText(difficulty);
    return `Custom difficulty: ${customText}`;
  }
  
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'Easy difficulty - Perfect for beginners';
    case 'medium': 
      return 'Medium difficulty - General knowledge level';
    case 'hard':
      return 'Hard difficulty - Expert level questions';
    default:
      return `${difficulty} difficulty level`;
  }
};