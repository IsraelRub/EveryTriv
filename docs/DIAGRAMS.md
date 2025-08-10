# EveryTriv - דיאגרמות Mermaid

## ארכיטקטורה כללית

```mermaid
graph TB
    subgraph "Client Layer"
        A[React App]
        B[Redux Store]
        C[UI Components]
    end
    
    subgraph "API Layer"
        D[REST API]
        E[Authentication]
        F[Rate Limiting]
    end
    
    subgraph "Business Layer"
        G[Trivia Service]
        H[User Service]
        I[AI Service]
    end
    
    subgraph "Data Layer"
        J[(PostgreSQL)]
        K[(Redis Cache)]
    end
    
    subgraph "External Services"
        L[OpenAI]
        M[Anthropic]
        N[Google AI]
    end
    
    A --> D
    B --> C
    D --> E
    D --> F
    D --> G
    D --> H
    G --> I
    I --> L
    I --> M
    I --> N
    G --> J
    G --> K
    H --> J
    H --> K
```

## מבנה בסיס הנתונים

```mermaid
erDiagram
    User {
        uuid id PK
        string username
        string email
        string password_hash
        int score
        int credits
        string role
        timestamp created_at
        timestamp updated_at
    }

    TriviaQuestion {
        uuid id PK
        string topic
        string difficulty
        string question
        jsonb answers
        int correct_answer_index
        jsonb metadata
        timestamp created_at
    }

    GameHistory {
        uuid id PK
        uuid user_id FK
        uuid question_id FK
        string user_answer
        string correct_answer
        boolean is_correct
        int score
        string difficulty
        string topic
        string game_mode
        int time_spent
        int credits_used
        timestamp created_at
    }

    UserStats {
        uuid id PK
        uuid user_id FK
        jsonb topics_played
        jsonb difficulty_stats
        int total_questions
        int correct_answers
        float success_rate
        int current_streak
        int best_streak
        timestamp last_played
        timestamp updated_at
    }

    Achievement {
        uuid id PK
        uuid user_id FK
        string title
        string description
        string icon
        string category
        int points
        timestamp unlocked_at
    }

    CustomDifficulty {
        uuid id PK
        string description
        float multiplier
        int usage_count
        timestamp created_at
        timestamp last_used
    }

    User ||--o{ GameHistory : "plays"
    User ||--|| UserStats : "has"
    User ||--o{ Achievement : "earns"
    TriviaQuestion ||--o{ GameHistory : "answered_in"
    User ||--o{ CustomDifficulty : "creates"
```

## מבנה Redux Store

```mermaid
graph TD
    A[Redux Store] --> B[Game Slice]
    A --> C[User Slice]
    A --> D[Stats Slice]
    A --> E[Favorites Slice]
    A --> F[GameMode Slice]

    B --> B1[Current Trivia]
    B --> B2[Score]
    B --> B3[Loading State]
    B --> B4[Error State]
    B --> B5[Timer State]

    C --> C1[Profile]
    C --> C2[Auth Status]
    C --> C3[Preferences]
    C --> C4[Credits]

    D --> D1[Topics Played]
    D --> D2[Success Rate by Difficulty]
    D --> D3[Achievements]
    D --> D4[Streaks]

    E --> E1[Favorite Topics]
    E --> E2[Custom Difficulties]

    F --> F1[Current Mode]
    F --> F2[Time Limit]
    F --> F3[Question Limit]
    F --> F4[Game Over State]
```

## זרימת נתונים - יצירת שאלה

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as REST API
    participant TS as Trivia Service
    participant C as Redis Cache
    participant AI as AI Service
    participant DB as PostgreSQL

    U->>F: בחירת נושא וקושי
    F->>API: POST /trivia/generate
    API->>TS: generateQuestion(topic, difficulty)
    TS->>C: בדיקת מטמון
    
    alt שאלה קיימת במטמון
        C-->>TS: החזרת שאלה מהמטמון
    else שאלה לא קיימת
        TS->>AI: יצירת שאלה חדשה
        AI-->>TS: שאלה שנוצרה
        TS->>C: שמירה במטמון
        TS->>DB: שמירה בבסיס נתונים
    end
    
    TS-->>API: החזרת שאלה
    API-->>F: JSON Response
    F-->>U: הצגת שאלה
```

## זרימת נתונים - שמירת תשובה

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as REST API
    participant GH as GameHistory Service
    participant US as UserStats Service
    participant DB as PostgreSQL
    participant C as Redis Cache

    U->>F: שליחת תשובה
    F->>API: POST /trivia/submit
    API->>GH: saveGameHistory(answer)
    GH->>DB: שמירת תוצאה
    
    par עדכון סטטיסטיקות
        GH->>US: updateUserStats(userId, result)
        US->>DB: עדכון סטטיסטיקות
        US->>C: עדכון מטמון סטטיסטיקות
    end
    
    GH-->>API: תוצאה + ניקוד
    API-->>F: JSON Response עם תוצאות
    F-->>U: הצגת תוצאות
```

## מבנה רכיבי UI

```mermaid
graph TD
    A[App] --> B[AppRoutes]
    
    B --> C[HomeView]
    B --> D[UserProfile]
    B --> E[Leaderboard]
    B --> F[GameHistory]
    B --> G[Help]
    B --> H[Legal]
    
    C --> I[TriviaForm]
    C --> J[TriviaGame]
    C --> K[FavoriteTopics]
    C --> L[ScoringSystem]
    C --> M[CustomDifficultyHistory]
    C --> N[GameModeComponent]
    
    D --> O[ProfileSettings]
    D --> P[StatsCharts]
    D --> Q[Achievements]
    
    I --> R[CustomDifficultyInput]
    I --> S[TopicSelector]
    I --> T[DifficultySelector]
    
    J --> U[QuestionDisplay]
    J --> V[AnswerOptions]
    J --> W[GameTimer]
    J --> X[ScoreDisplay]
```

## מבנה מודולי Backend

```mermaid
graph TD
    A[App Module] --> B[Auth Module]
    A --> C[User Module]
    A --> D[Trivia Module]
    A --> E[GameHistory Module]
    A --> F[Shared Module]
    
    B --> B1[Auth Controller]
    B --> B2[Auth Service]
    B --> B3[JWT Strategy]
    B --> B4[Guards]
    
    C --> C1[User Controller]
    C --> C2[User Service]
    C --> C3[User Entity]
    C --> C4[User Repository]
    
    D --> D1[Trivia Controller]
    D --> D2[Trivia Service]
    D --> D3[Question Generator]
    D --> D4[AI Integration]
    
    E --> E1[GameHistory Controller]
    E --> E2[GameHistory Service]
    E --> E3[Stats Calculator]
    
    F --> F1[Logger Service]
    F --> F2[Cache Service]
    F --> F3[Validation Service]
    F --> F4[Config Service]
```

## ארכיטקטורת מטמון

```mermaid
graph TD
    A[Application] --> B[Redis Cache]
    
    B --> C[Question Cache]
    B --> D[User Stats Cache]
    B --> E[Session Cache]
    B --> F[Rate Limit Cache]
    B --> G[Leaderboard Cache]
    
    C --> C1["Key: trivia:{topic}:{difficulty}"]
    C --> C2["TTL: 1 hour"]
    C --> C3["Value: TriviaQuestion[]"]
    
    D --> D1["Key: stats:{userId}"]
    D --> D2["TTL: 30 minutes"]
    D --> D3["Value: UserStats"]
    
    E --> E1["Key: session:{userId}"]
    E --> E2["TTL: 24 hours"]
    E --> E3["Value: SessionData"]
    
    F --> F1["Key: ratelimit:{ip}"]
    F --> F2["TTL: 15 minutes"]
    F --> F3["Value: RequestCount"]
    
    G --> G1["Key: leaderboard:global"]
    G --> G2["TTL: 5 minutes"]
    G --> G3["Value: LeaderboardEntry[]"]
```

## מבנה אבטחה

```mermaid
graph TD
    A[Client Request] --> B[Rate Limiting Middleware]
    B --> C[CORS Middleware]
    C --> D[Auth Guard]
    D --> E[JWT Validation]
    E --> F[Role Guard]
    F --> G[Input Validation]
    G --> H[Controller]
    
    H --> I[Service Layer]
    I --> J[Data Sanitization]
    J --> K[Database Query]
    
    K --> L[Response Transformation]
    L --> M[Security Headers]
    M --> N[Client Response]
    
    subgraph "Security Layers"
        B
        C
        D
        E
        F
        G
        J
        M
    end
```

## זרימת Development Build

```mermaid
graph LR
    A[Source Code] --> B[TypeScript Compilation]
    B --> C[Vite Build Process]
    C --> D[Code Splitting]
    D --> E[Asset Optimization]
    E --> F[Bundle Generation]
    
    F --> G[Development Server]
    G --> H[Hot Module Replacement]
    H --> I[Browser]
    
    subgraph "Development Tools"
        J[ESLint]
        K[Prettier]
        L[TypeScript Checker]
    end
    
    A --> J
    A --> K
    A --> L
```

## זרימת Production Deployment

```mermaid
graph TD
    A[Source Code] --> B[CI/CD Pipeline]
    B --> C[Tests]
    C --> D[Build Process]
    D --> E[Docker Image Creation]
    E --> F[Container Registry]
    F --> G[Production Deployment]
    
    G --> H[Load Balancer]
    H --> I[Application Servers]
    I --> J[Database Cluster]
    I --> K[Redis Cluster]
    
    subgraph "Monitoring"
        L[Health Checks]
        M[Performance Metrics]
        N[Error Tracking]
        O[Logs Aggregation]
    end
    
    I --> L
    I --> M
    I --> N
    I --> O
```

## מבנה Game Modes

```mermaid
stateDiagram-v2
    [*] --> ModeSelection
    
    ModeSelection --> TimeLimited: בחירת זמן מוגבל
    ModeSelection --> QuestionLimited: בחירת מספר שאלות
    ModeSelection --> Unlimited: בחירת בלי הגבלה
    
    TimeLimited --> GameActive: התחלת משחק
    QuestionLimited --> GameActive: התחלת משחק
    Unlimited --> GameActive: התחלת משחק
    
    GameActive --> QuestionAnswered: תשובה נשלחה
    QuestionAnswered --> GameActive: שאלה חדשה
    QuestionAnswered --> GameOver: תנאי סיום הושג
    
    GameOver --> Results: הצגת תוצאות
    Results --> [*]: חזרה לתפריט
    
    state GameActive {
        [*] --> QuestionDisplay
        QuestionDisplay --> AnswerSelection
        AnswerSelection --> AnswerSubmission
        AnswerSubmission --> ScoreCalculation
        ScoreCalculation --> [*]
    }
```

## ארכיטקטורת Audio System

```mermaid
graph TD
    A[Audio Manager] --> B[Background Music]
    A --> C[Sound Effects]
    A --> D[Voice Notifications]
    
    B --> B1[Game Music]
    B --> B2[Menu Music]
    B --> B3[Victory Music]
    
    C --> C1[Button Clicks]
    C --> C2[Correct Answer]
    C --> C3[Wrong Answer]
    C --> C4[Timer Warning]
    C --> C5[Game Over]
    
    D --> D1[Question Reading]
    D --> D2[Score Announcements]
    
    subgraph "Audio Controls"
        E[Volume Control]
        F[Mute Toggle]
        G[Audio Preferences]
    end
    
    A --> E
    A --> F
    A --> G
    
    subgraph "Browser APIs"
        H[Web Audio API]
        I[Audio Context]
        J[Audio Nodes]
    end
    
    A --> H
    H --> I
    I --> J
```
