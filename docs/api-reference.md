# API Reference

## Trivia API

### Generate Trivia Question
```typescript
POST /api/v1/trivia

Request:
{
  topic: string;          // Topic for the question
  difficulty: string;     // 'easy', 'medium', 'hard', or 'custom:...'
  questionCount: number;  // 3, 4, or 5
  userId?: string;        // Optional user ID
}

Response:
{
  data: {
    id: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    topic: string;
    difficulty: string;
  };
  status: number;
  message: string;
}
```

### Save Quiz History
```typescript
POST /api/v1/trivia/history

Request:
{
  userId: string;
  question: string;
  answers: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswerIndex: number;
  isCorrect: boolean;
  topic: string;
  difficulty: string;
}

Response:
{
  data: {
    id: string;
    // ... saved history data
  };
  status: number;
  message: string;
}
```

### Get User Score
```typescript
GET /api/v1/trivia/score?userId={userId}

Response:
{
  data: number;  // Total correct answers
  status: number;
  message: string;
}
```

### Get Leaderboard
```typescript
GET /api/v1/trivia/leaderboard?limit={limit}

Response:
{
  data: Array<{
    userId: string;
    score: number;
  }>;
  status: number;
  message: string;
  meta: {
    limit: number;
    total: number;
  };
}
```

### Get Difficulty Stats
```typescript
GET /api/v1/trivia/difficulty-stats?userId={userId}

Response:
{
  data: {
    [difficulty: string]: {
      correct: number;
      total: number;
    };
  };
  status: number;
  message: string;
}
```

### Get Custom Difficulty Suggestions
```typescript
GET /api/v1/trivia/custom-difficulty-suggestions?topic={topic}

Response:
{
  data: {
    suggestions: string[];
    examples: string[];
  };
  status: number;
  message: string;
}
```

## User API

### Create User
```typescript
POST /api/v1/user

Request:
{
  username: string;
  email: string;
  password: string;
}

Response:
{
  data: {
    id: string;
    username: string;
    email: string;
  };
  status: number;
  message: string;
}
```

### Get User Profile
```typescript
GET /api/v1/user/{userId}

Response:
{
  data: {
    id: string;
    username: string;
    email: string;
    score: number;
    achievements: Achievement[];
    stats: UserStats;
  };
  status: number;
  message: string;
}
```

### Update User Profile
```typescript
PUT /api/v1/user/{userId}

Request:
{
  username?: string;
  email?: string;
  password?: string;
}

Response:
{
  data: {
    id: string;
    username: string;
    email: string;
  };
  status: number;
  message: string;
}
```

## Authentication API

### Login
```typescript
POST /api/v1/auth/login

Request:
{
  email: string;
  password: string;
}

Response:
{
  data: {
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
  status: number;
  message: string;
}
```

### Refresh Token
```typescript
POST /api/v1/auth/refresh

Request:
{
  refreshToken: string;
}

Response:
{
  data: {
    token: string;
  };
  status: number;
  message: string;
}
```

### Logout
```typescript
POST /api/v1/auth/logout

Response:
{
  status: number;
  message: string;
}
```