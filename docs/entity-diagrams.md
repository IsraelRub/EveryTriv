# Entity Diagrams

## Database Schema

```mermaid
erDiagram
    User {
        uuid id PK
        string username
        string email
        string password_hash
        int score
        timestamp created_at
        timestamp updated_at
    }

    Trivia {
        uuid id PK
        string topic
        string difficulty
        string question
        jsonb answers
        int correct_answer_index
        boolean is_correct
        uuid user_id FK
        timestamp created_at
    }

    Achievement {
        uuid id PK
        uuid user_id FK
        string title
        string description
        string icon
        timestamp unlocked_at
    }

    UserStats {
        uuid id PK
        uuid user_id FK
        jsonb topics_played
        jsonb difficulty_stats
        int total_questions
        int correct_answers
        timestamp last_played
    }

    CustomDifficulty {
        uuid id PK
        string description
        int usage_count
        timestamp created_at
        timestamp last_used
    }

    User ||--o{ Trivia : "answers"
    User ||--o{ Achievement : "earns"
    User ||--|| UserStats : "has"
    User ||--o{ CustomDifficulty : "creates"
```

## Cache Structure

```mermaid
graph TD
    A[Redis Cache] --> B[Question Cache]
    A --> C[Session Cache]
    A --> D[Rate Limiting]
    A --> E[User Stats Cache]

    B --> F[Key: trivia:{topic}:{difficulty}]
    B --> G[TTL: 1 hour]

    C --> H[Key: session:{userId}]
    C --> I[TTL: 24 hours]

    D --> J[Key: ratelimit:{ip}]
    D --> K[TTL: 15 minutes]

    E --> L[Key: stats:{userId}]
    E --> M[TTL: 30 minutes]
```

## State Management

```mermaid
graph TD
    A[Redux Store] --> B[User Slice]
    A --> C[Game Slice]
    A --> D[Stats Slice]
    A --> E[Favorites Slice]

    B --> F[User Info]
    B --> G[Auth Status]
    B --> H[Preferences]

    C --> I[Current Game]
    C --> J[Question History]
    C --> K[Score]

    D --> L[Topic Stats]
    D --> M[Difficulty Stats]
    D --> N[Achievement Progress]

    E --> O[Favorite Topics]
    E --> P[Custom Difficulties]
```

## Component Dependencies

```mermaid
graph TD
    A[App] --> B[Redux Store]
    A --> C[Router]
    
    C --> D[Home View]
    C --> E[User Profile]
    C --> F[404 Page]
    
    D --> G[Trivia Form]
    D --> H[Trivia Game]
    D --> I[Favorites]
    
    E --> J[Stats Charts]
    E --> K[Achievements]
    E --> L[History]
    
    G --> M[Custom Difficulty]
    H --> N[Scoring System]
    I --> O[Topic List]
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant R as Redis
    participant B as Backend
    participant DB as PostgreSQL
    participant LLM as LLM Provider

    U->>F: Enter Topic & Difficulty
    F->>B: POST /trivia
    B->>R: Check Cache
    alt Cache Hit
        R-->>B: Return Cached Question
        B-->>F: Return Question
    else Cache Miss
        B->>LLM: Generate Question
        LLM-->>B: Return Question
        B->>R: Cache Question
        B->>DB: Store Question
        B-->>F: Return Question
    end
    F-->>U: Display Question

    U->>F: Submit Answer
    F->>B: POST /trivia/history
    B->>DB: Store Answer
    B->>DB: Update Stats
    B-->>F: Return Result
    F-->>U: Show Result
```