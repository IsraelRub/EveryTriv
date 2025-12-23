# דיאגרמות - EveryTriv

קובץ זה מכיל את כל הדיאגרמות המתארות את הארכיטקטורה, הקשרים והיחסים בפרויקט EveryTriv.

## דיאגרמת ארכיטקטורה כללית

```mermaid
graph LR
    subgraph "Client - React Frontend"
        A[App.tsx] --> B[AppRoutes.tsx]
        B --> C[Views]
        B --> D[Components]
        C --> E[HomeView]
        C --> F[GameSessionView]
        C --> G[GameSummaryView]
        C --> H[CustomDifficultyView]
        C --> I[UserProfile]
        C --> J[GameHistory]
        C --> K[AnalyticsView]
        C --> L[AdminDashboard]
        C --> M[LeaderboardView]
        C --> N[PaymentView]
        C --> O[CreditsView]
        C --> P[SettingsView]
        C --> Q[LoginView]
        C --> R[RegistrationView]
        C --> S[UnauthorizedView]
        D --> T[Game Components]
        D --> U[UI Components]
        D --> V[Layout Components]
        D --> W[Navigation Components]
        D --> X[AudioControls]
        D --> Y[ProtectedRoute]
        A --> Z[Redux Store]
        Z --> AA[gameSlice]
        Z --> AB[userSlice]
        Z --> AC[statsSlice]
        Z --> AD[favoritesSlice]
        Z --> AE[gameModeSlice]
        A --> AF[React Query]
        A --> AG[Services]
        AG --> AH[api.service]
        AG --> AI[auth.service]
        AG --> AJ[user.service]
        AG --> AK[credits.service]
        AG --> AL[payment.service]
        AG --> AM[gameHistory.service]
        AG --> AN[customDifficulty.service]
        AG --> AO[audio.service]
        AG --> AP[storage.service]
        AG --> AQ[score.service]
        AG --> AR[queryClient.service]
        A --> AS[Hooks]
        AS --> AT[useAuth]
        AS --> AU[useTrivia]
        AS --> AV[useCredits]
        AS --> AW[useUser]
        AS --> AX[useUserStats]
        AS --> AY[useAnalyticsDashboard]
        AS --> AZ[useAdminAnalytics]
    end

    subgraph "Shared Package"
        BA[Types] --> BB[Domain Types]
        BA --> BC[Core Types]
        BA --> BD[Infrastructure Types]
        BB --> BE[Game Types]
        BB --> BF[User Types]
        BB --> BG[Analytics Types]
        BB --> BH[Subscription Types]
        BB --> BI[Language Types]
        BC --> BJ[Data Types]
        BC --> BK[Error Types]
        BC --> BL[Response Types]
        BD --> BM[API Types]
        BD --> BN[Auth Types]
        BD --> BO[Cache Types]
        BP[Constants] --> BQ[Business Constants]
        BP --> BR[Core Constants]
        BP --> BS[Domain Constants]
        BP --> BT[Infrastructure Constants]
        BQ --> BU[Info Constants]
        BQ --> BV[Language Constants]
        BQ --> BW[Social Constants]
        BR --> BX[API Constants]
        BR --> BY[Auth Constants]
        BR --> BZ[Error Constants]
        BR --> CA[Game Server Constants]
        BR --> CB[Performance Constants]
        BR --> CC[Validation Constants]
        BS --> CD[Game Constants]
        BS --> CE[User Constants]
        BS --> CF[Payment Constants]
        BS --> CG[Credits Constants]
        BT --> CH[HTTP Constants]
        BT --> CI[Infrastructure Constants]
        BT --> CJ[Localhost Constants]
        BT --> CK[Logging Constants]
        BT --> CL[Storage Constants]
        CD[Services] --> CEA[Logging Services]
        CD --> CFA[Credits Services]
        CD --> CGA[Storage Services]
        CEA --> CHA[Client Logger]
        CEA --> CIA[Server Logger]
        CFA --> CJA[Score Calculation]
        CGA --> CKA[Storage Manager]
        BTA[Utils] --> BUA[Core Utils]
        BTA --> BVA[Domain Utils]
        BTA --> BWA[Infrastructure Utils]
        BUA --> BYA[Array Utils]
        BUA --> BZA[Data Utils]
        BUA --> CAA[Math Utils]
        BUA --> CBA[Error Utils]
        BUA --> CCA[Format Utils]
        BVA --> CEB[User Utils]
        BVA --> CFB[Credits Utils]
        BVA --> CGB[Payment Utils]
        BVA --> CHB[Subscription Utils]
        BVA --> CIB[Entity Guards]
        BWA --> CJB[ID Utils]
        BWA --> CKB[Storage Utils]
        BWA --> CLB[Sanitization Utils]
        CM[Validation] --> CN[Trivia Validation]
        CM --> CO[Difficulty Validation]
        CM --> CP[Payment Validation]
    end

    subgraph "Server - NestJS Backend"
        DH[main.ts] --> DI[AppModule]
        DI --> DJ[Features Modules]
        DJ --> DK[AuthModule]
        DJ --> DL[GameModule]
        DJ --> DM[UserModule]
        DJ --> DN[CreditsModule]
        DJ --> DO[PaymentModule]
        DJ --> DP[SubscriptionModule]
        DJ --> DQ[LeaderboardModule]
        DJ --> DR[AnalyticsModule]
        DL --> DQ
        DL --> DR
        DR --> DQ
        DM --> DO
        DO --> DP
        DN --> DO
        DI --> DS[Internal Modules]
        DS --> DT[RedisModule]
        DS --> DU[StorageModule]
        DS --> DV[CacheModule]
        DI --> DW[Common]
        DW --> DX[Guards]
        DW --> DY[Interceptors]
        DW --> DZ[Pipes]
        DW --> EA[Decorators]
        DI --> EB[ValidationModule]
        EB --> EC[Validation Service]
    end

    subgraph "Database"
        ED[(PostgreSQL)]
        EE[(Redis)]
    end

    AH --> DI
    AI --> DK
    DI --> ED
    DS --> EE
    DJ --> BA
    DJ --> BP
    DJ --> CD
    DJ --> CL
    DJ --> DC
    AG --> BA
    AG --> BP
    AG --> CD
    AG --> CL
```

## דיאגרמת זרימת נתונים - יצירת שאלה

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant G as GameService
    participant GH as GameHistory
    participant TG as TriviaGenerationService
    participant DB as PostgreSQL
    participant AI as AI Providers

    U->>F: בחירת נושא וקושי
    F->>G: POST /api/game/trivia
    G->>G: ולידציית בקשה
    
    alt יש userId
        G->>GH: איסוף שאלות שהמשתמש כבר ראה
        GH->>DB: שאילתת game_history
        DB->>GH: החזרת היסטוריית משחקים
        GH->>G: רשימת שאלות שכבר נראו
    end
    
    G->>TG: בדיקה אם יש שאלות במסד הנתונים
    TG->>DB: שאילתת trivia (נושא + רמה)
    DB->>TG: מספר שאלות קיימות
    TG->>G: יש/אין שאלות קיימות
    
    alt יש שאלות קיימות
        G->>TG: אחזור שאלות קיימות (מסוננות)
        TG->>DB: שאילתת trivia (מסוננת לפי שאלות שכבר נראו)
        DB->>TG: שאלות קיימות
        TG->>G: שאלות קיימות
        G->>G: הוספת שאלות קיימות לרשימה
    end
    
    alt אין מספיק שאלות
        loop עד מספר השאלות המבוקש
            G->>TG: יצירת שאלה חדשה
            TG->>AI: יצירת שאלה עם AI
            AI->>TG: שאלה חדשה
            TG->>TG: בדיקה אם שאלה כבר קיימת במסד
            TG->>DB: בדיקת כפילות (שאלה, נושא, רמה)
            alt שאלה כבר קיימת
                DB->>TG: שאלה קיימת
                TG->>G: החזרת שאלה קיימת
            else שאלה לא קיימת
                TG->>DB: שמירת שאלה חדשה
                DB->>TG: אישור שמירה
                TG->>G: שאלה חדשה
            end
            G->>G: בדיקת כפילות בבאצ' הנוכחי
            G->>G: הוספת שאלה לרשימה
        end
    end
    
    G->>F: החזרת שאלות
    F->>U: הצגת שאלות
```

## דיאגרמת זרימת נתונים - תשובה לשאלה

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant G as GameService
    participant P as CreditsService
    participant S as UserStats
    participant DB as PostgreSQL

    U->>F: שליחת תשובה
    F->>G: POST /api/game/answer
    G->>G: בדיקת נכונות
    G->>P: חישוב ניקוד
    P->>P: חישוב לפי קושי וזמן
    P->>DB: שמירת טרנזקציה
    G->>S: עדכון סטטיסטיקות
    S->>DB: שמירת סטטיסטיקות
    G->>F: תוצאה וניקוד
    F->>U: הצגת תוצאה
```

## דיאגרמת מודולי Backend

```mermaid
graph TB
    subgraph "Feature Modules"
        A[AuthModule] --> B[UserModule]
        C[GameModule] --> D[CreditsModule]
        C --> E[AnalyticsModule]
        C --> F[LeaderboardModule]
        E --> F
        D --> F
        B --> G[PaymentModule]
        D --> G
        G --> H[SubscriptionModule]
    end

    subgraph "Common Layer"
        CL[Common Layer<br/>Guards, Interceptors, Pipes<br/>Decorators, Validation<br/>Auth Services]
        OA[Query Helpers<br/>DateRange, GroupBy<br/>Search, Random]
    end

    subgraph "Internal Modules"
        N[CacheModule]
        O[StorageModule]
        P[RedisModule]
    end

    subgraph "Internal Layer"
        Q[Entities]
        R[Repositories]
        S[Middleware]
    end

    subgraph "Infrastructure"
        T[(PostgreSQL)]
        U[(Redis)]
    end

    A --> CL
    B --> CL
    C --> CL
    D --> CL
    E --> CL
    F --> CL
    G --> CL
    H --> CL
    C --> OA
    E --> OA
    F --> OA
    A --> Q
    B --> Q
    C --> Q
    D --> Q
    E --> Q
    F --> Q
    G --> Q
    H --> Q
    Q --> R
    R --> T
    C --> N
    C --> O
    E --> N
    F --> N
    B --> N
    G --> N
    H --> N
    N --> P
    P --> U
    S --> A
    S --> B
    S --> C

    style CL fill:#e3f2fd,color:#000000
    style OA fill:#fff9c4,color:#000000
    style N fill:#fff4e6,color:#000000
    style O fill:#fff4e6,color:#000000
    style P fill:#fff4e6,color:#000000
    style Q fill:#e8f5e9,color:#000000
    style R fill:#e8f5e9,color:#000000
    style S fill:#fce4ec,color:#000000
    style T fill:#e1f5ff,color:#000000
    style U fill:#ffebee,color:#000000
```

## דיאגרמת היררכיית Common Layer - Backend

```mermaid
graph TB
    subgraph "Common Layer - Entry Points"
        A[Decorators<br/>Public, Roles<br/>Cache, NoCache<br/>CurrentUser, CurrentUserId]
        B[Guards<br/>AuthGuard<br/>RolesGuard]
        C[Interceptors<br/>CacheInterceptor<br/>PerformanceInterceptor<br/>ResponseFormattingInterceptor]
        D[Pipes<br/>UserDataPipe<br/>TriviaRequestPipe<br/>GameAnswerPipe<br/>CustomDifficultyPipe<br/>PaymentDataPipe<br/>TriviaQuestionPipe]
        E[Query Helpers<br/>DateRange<br/>GroupBy<br/>Search<br/>Random]
    end

    subgraph "Common Layer - Services"
        F[Auth Services<br/>AuthenticationManager<br/>PasswordService<br/>JwtTokenService]
        G[Validation Services<br/>ValidationService<br/>LanguageToolService]
        H[ValidationModule<br/>NestJS Module]
    end

    subgraph "Common Layer - Error Handling"
        I[GlobalExceptionFilter<br/>Exception Handling<br/>Error Formatting<br/>Error Logging]
    end

    subgraph "External Dependencies"
        J[CacheModule<br/>Internal]
        K[Shared Services<br/>Logger]
    end

    A -->|Metadata| B
    A -->|Metadata| C
    F -->|JWT Validation| B
    F -->|Password Hashing| B
    G -->|Validation Logic| D
    H -->|Module Exports| D
    C -->|Cache Operations| J
    I -->|Catches Errors| B
    I -->|Catches Errors| C
    I -->|Catches Errors| D
    I -->|Logs Errors| K

    style A fill:#fff4e6,color:#000000
    style B fill:#e8f5e9,color:#000000
    style C fill:#e3f2fd,color:#000000
    style D fill:#fce4ec,color:#000000
    style E fill:#fff9c4,color:#000000
    style F fill:#f3e5f5,color:#000000
    style G fill:#e1bee7,color:#000000
    style H fill:#e1bee7,color:#000000
    style I fill:#ffebee,color:#000000
    style J fill:#fff4e6,color:#000000
    style K fill:#e1f5ff,color:#000000
```

## דיאגרמת היררכיית Internal Layer - Backend

```mermaid
graph LR
    subgraph "Internal Layer - Entities"
        E1[UserEntity]
        E2[GameHistoryEntity]
        E3[TriviaEntity]
        E4[UserStatsEntity]
        E5[LeaderboardEntity]
        E6[PaymentHistoryEntity]
        E7[SubscriptionEntity]
        E8[CreditTransactionEntity]
        BE[BaseEntity<br/>id, createdAt, updatedAt]
    end

    subgraph "Internal Layer - Repositories"
        R1[UserRepository]
        R2[GameHistoryRepository]
        R3[TriviaRepository]
        R4[UserStatsRepository]
        R5[LeaderboardRepository]
        R6[PaymentRepository]
        R7[SubscriptionRepository]
        R8[CreditTransactionRepository]
    end

    subgraph "Internal Layer - Modules"
        CM[CacheModule<br/>CacheService<br/>CacheController]
        SM[StorageModule<br/>StorageService<br/>StorageController]
        RM[RedisModule<br/>Redis Client]
    end

    subgraph "Internal Layer - Middleware"
        MW1[RateLimitMiddleware<br/>Rate Limiting]
        MW2[DecoratorAwareMiddleware<br/>Metadata Extraction]
        MW3[BulkOperationsMiddleware<br/>Bulk Operations]
    end

    subgraph "Internal Layer - Controllers"
        C1[ClientLogsController<br/>Client Logs]
        C2[MiddlewareMetricsController<br/>Metrics]
    end

    subgraph "Internal Layer - Constants"
        IC1[Auth Constants]
        IC2[Database Constants]
        IC3[Public Endpoints Constants]
    end

    subgraph "Internal Layer - Utils"
        IU1[Error Utils]
        IU2[Guards Utils]
        IU3[Redis Utils]
    end

    subgraph "External Dependencies"
        DB[(PostgreSQL)]
        REDIS[(Redis)]
        FEATURES[Feature Modules]
    end

    BE --> E1
    BE --> E2
    BE --> E3
    BE --> E4
    BE --> E5
    BE --> E6
    BE --> E7
    BE --> E8

    E1 --> R1
    E2 --> R2
    E3 --> R3
    E4 --> R4
    E5 --> R5
    E6 --> R6
    E7 --> R7
    E8 --> R8

    R1 --> DB
    R2 --> DB
    R3 --> DB
    R4 --> DB
    R5 --> DB
    R6 --> DB
    R7 --> DB
    R8 --> DB

    CM --> RM
    SM --> RM
    RM --> REDIS

    FEATURES --> R1
    FEATURES --> R2
    FEATURES --> R3
    FEATURES --> R4
    FEATURES --> R5
    FEATURES --> R6
    FEATURES --> R7
    FEATURES --> R8

    FEATURES --> CM
    FEATURES --> SM

    MW1 --> REDIS
    MW2 --> FEATURES
    MW3 --> FEATURES

    style BE fill:#fff4e6,color:#000000
    style E1 fill:#fff4e6,color:#000000
    style E2 fill:#fff4e6,color:#000000
    style E3 fill:#fff4e6,color:#000000
    style E4 fill:#fff4e6,color:#000000
    style E5 fill:#fff4e6,color:#000000
    style E6 fill:#fff4e6,color:#000000
    style E7 fill:#fff4e6,color:#000000
    style E8 fill:#fff4e6,color:#000000
    style R1 fill:#f3e5f5,color:#000000
    style R2 fill:#f3e5f5,color:#000000
    style R3 fill:#f3e5f5,color:#000000
    style R4 fill:#f3e5f5,color:#000000
    style R5 fill:#f3e5f5,color:#000000
    style R6 fill:#f3e5f5,color:#000000
    style R7 fill:#f3e5f5,color:#000000
    style R8 fill:#f3e5f5,color:#000000
    style CM fill:#e3f2fd,color:#000000
    style SM fill:#e3f2fd,color:#000000
    style RM fill:#e3f2fd,color:#000000
    style MW1 fill:#e8f5e9,color:#000000
    style MW2 fill:#e8f5e9,color:#000000
    style MW3 fill:#e8f5e9,color:#000000
    style C1 fill:#fce4ec,color:#000000
    style C2 fill:#fce4ec,color:#000000
    style IC1 fill:#fff9c4,color:#000000
    style IC2 fill:#fff9c4,color:#000000
    style IC3 fill:#fff9c4,color:#000000
    style IU1 fill:#e1bee7,color:#000000
    style IU2 fill:#e1bee7,color:#000000
    style IU3 fill:#e1bee7,color:#000000
    style DB fill:#e1f5ff,color:#000000
    style REDIS fill:#ffebee,color:#000000
    style FEATURES fill:#e8f5e9,color:#000000
```

## דיאגרמת מבנה Frontend

```mermaid
graph LR
    subgraph "Views Layer"
        A[HomeView]
        B[GameSessionView]
        C[GameSummaryView]
        D[CustomDifficultyView]
        E[UserProfile]
        F[GameHistory]
        G[AnalyticsView]
        H[AdminDashboard]
        I[LeaderboardView]
        J[PaymentView]
        K[CreditsView]
        L[SettingsView]
        M[LoginView]
        N[RegistrationView]
        O[UnauthorizedView]
    end

    subgraph "Supporting Layers"
        COMP[Components<br/>Game, UI, Form, Layout<br/>Navigation, Stats, User<br/>Animations, Audio, etc.]
        STATE[State Management<br/>Redux Store + Slices<br/>React Query Cache]
        SERV[Services<br/>API, Auth, User, Credits<br/>Payment, Game History, etc.]
        HOOKS[Hooks<br/>Auth, Trivia, Credits, User<br/>Analytics, Admin, etc.]
        CONST[Constants<br/>Storage, UI, Game, Audio]
        TYPES[Types<br/>API, Game, Redux, UI, User]
        UTILS[Utils<br/>Data, Date/Time, Format, UI]
    end

    A --> COMP
    B --> COMP
    C --> COMP
    D --> COMP
    E --> COMP
    F --> COMP
    G --> COMP
    H --> COMP
    I --> COMP
    J --> COMP
    K --> COMP
    L --> COMP
    M --> COMP
    N --> COMP
    O --> COMP

    A --> STATE
    B --> STATE
    C --> STATE
    D --> STATE
    E --> STATE
    F --> STATE
    G --> STATE
    H --> STATE
    K --> STATE
    L --> STATE

    COMP --> HOOKS
    HOOKS --> SERV
    HOOKS --> STATE
    SERV --> CONST
    SERV --> TYPES
    COMP --> TYPES
    COMP --> CONST
    COMP --> UTILS

    style COMP fill:#e3f2fd,color:#000000
    style STATE fill:#e8f5e9,color:#000000
    style SERV fill:#fff4e6,color:#000000
    style HOOKS fill:#f3e5f5,color:#000000
    style CONST fill:#fff9c4,color:#000000
    style TYPES fill:#e1bee7,color:#000000
    style UTILS fill:#fce4ec,color:#000000
```

## דיאגרמת מסד נתונים (ERD)

```mermaid
erDiagram
    USERS ||--o{ TRIVIA : "creates"
    USERS ||--o{ GAME_HISTORY : "plays"
    USERS ||--o{ USER_STATS : "has"
    USERS ||--o{ PAYMENT_HISTORY : "makes"
    USERS ||--o{ SUBSCRIPTIONS : "subscribes"
    USERS ||--o{ CREDIT_TRANSACTIONS : "transacts"
    USERS ||--o{ LEADERBOARD : "ranks"

    USERS {
        uuid id PK
        string username UK
        string email UK
        string password_hash
        string google_id
        int credits
        int purchased_credits
        int daily_free_questions
        int remaining_free_questions
        boolean is_active
        string role
        jsonb preferences
        jsonb achievements
        timestamp created_at
        timestamp updated_at
    }

    TRIVIA {
        uuid id PK
        string topic
        string difficulty
        string question
        jsonb answers
        int correct_answer_index
        uuid user_id FK
        boolean is_correct
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }

    GAME_HISTORY {
        uuid id PK
        uuid user_id FK
        int score
        int total_questions
        int correct_answers
        string difficulty
        string topic
        string game_mode
        int time_spent
        int credits_used
        jsonb questions_data
        timestamp created_at
    }

    USER_STATS {
        uuid id PK
        uuid user_id FK
        int total_games_played
        int total_questions_answered
        int correct_answers
        int total_score
        decimal average_score
        int best_score
        int current_streak
        int longest_streak
        timestamp last_played
        jsonb difficulty_stats
        jsonb topic_stats
        timestamp created_at
        timestamp updated_at
    }

    PAYMENT_HISTORY {
        uuid id PK
        uuid user_id FK
        string payment_id UK
        decimal amount
        string currency
        string payment_method
        string payment_status
        string plan_type
        string subscription_id
        jsonb metadata
        timestamp created_at
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        string subscription_id UK
        string plan_type
        string status
        timestamp current_period_start
        timestamp current_period_end
        boolean cancel_at_period_end
        timestamp canceled_at
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }

    CREDIT_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        string transaction_type
        int credits_amount
        int balance_after
        string description
        string reference_id
        string reference_type
        jsonb metadata
        timestamp created_at
    }

    LEADERBOARD {
        uuid id PK
        uuid user_id FK
        string period_type
        date period_start
        date period_end
        int score
        int rank
        int games_played
        int correct_answers
        int total_questions
        timestamp created_at
        timestamp updated_at
    }
```

## דיאגרמת זרימת אימות

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as AuthService
    participant G as AuthGuard
    participant J as JWT Service
    participant DB as PostgreSQL

    U->>F: התחברות
    F->>A: POST /api/auth/login
    A->>DB: אימות פרטים
    DB->>A: פרטי משתמש
    A->>J: יצירת JWT
    J->>A: Access Token + Refresh Token
    A->>F: החזרת טוקנים
    F->>F: שמירה ב-localStorage
    F->>F: בקשה מוגנת
    F->>G: Authorization Header
    G->>J: אימות טוקן
    J->>G: אימות הצלח
    G->>F: גישה מאושרת
```

## דיאגרמת זרימת משחק מלא

```mermaid
stateDiagram-v2
    [*] --> HomeView: כניסה לאפליקציה
    HomeView --> CustomDifficultyView: יצירת קושי מותאם
    CustomDifficultyView --> HomeView: חזרה
    HomeView --> GameConfig: בחירת נושא וקושי
    GameConfig --> GameSession: התחלת משחק
    GameSession --> Question: טעינת שאלה
    Question --> Answer: הצגת שאלה
    Answer --> Validate: שליחת תשובה
    Validate --> Score: חישוב ניקוד
    Score --> UpdateStats: עדכון סטטיסטיקות
    UpdateStats --> NextQuestion: שאלה נוספת?
    NextQuestion --> Question: כן
    NextQuestion --> GameSummary: לא
    GameSummary --> GameHistory: שמירת משחק
    GameSummary --> Leaderboard: עדכון לוח תוצאות
    Leaderboard --> HomeView: חזרה לדף הבית
    GameHistory --> HomeView: חזרה לדף הבית
```

## דיאגרמת חבילה משותפת (Shared)

```mermaid
graph LR
    subgraph "Types"
        A[Domain Types]
        B[Core Types]
        C[Infrastructure Types]
        A --> D[Game Types]
        A --> E[User Types]
        A --> F[Analytics Types]
        A --> G[Subscription Types]
        A --> H[Language Types]
        B --> I[Data Types]
        B --> J[Error Types]
        B --> K[Response Types]
        B --> L[Performance Types]
        C --> M[API Types]
        C --> N[Auth Types]
        C --> O[Cache Types]
        C --> P[Storage Types]
        C --> Q[Logging Types]
        C --> R[Redis Types]
        C --> S[Config Types]
    end

    subgraph "Constants"
        T[Business Constants]
        U[Core Constants]
        V[Infrastructure Constants]
        W[Domain Constants]
        T --> X[Info Constants]
        T --> Y[Language Constants]
        T --> Z[Social Constants]
        U --> AA[API Constants]
        U --> AB[Auth Constants]
        U --> AC[Error Constants]
        U --> AD[Game Server Constants]
        U --> AE[Performance Constants]
        U --> AF[Validation Constants]
        W --> AG[Game Constants]
        W --> AH[User Constants]
        W --> AI[Payment Constants]
        W --> AJ[Credits Constants]
        V --> AK[HTTP Constants]
        V --> AL[Infrastructure Constants]
        V --> AM[Localhost Constants]
        V --> AN[Logging Constants]
        V --> AO[Storage Constants]
    end

    subgraph "Services"
        AP[Logging Services]
        AQ[Credits Services]
        AR[Storage Services]
        AP --> AS[Client Logger]
        AP --> AT[Server Logger]
        AP --> AU[Base Logger]
        AQ --> AV[Score Calculation]
        AQ --> AW[Base Credits Service]
        AR --> AX[Storage Manager]
        AR --> AY[Base Storage Service]
        AR --> AZ[Metrics Service]
        AR --> BA[Cache Service]
        AR --> BB[Token Extraction Service]
    end

    subgraph "Utils"
        BC[Core Utils]
        BD[Domain Utils]
        BE[Infrastructure Utils]
        BC --> BG[Array Utils]
        BC --> BH[Data Utils]
        BC --> BI[Math Utils]
        BC --> BJ[Error Utils]
        BC --> BK[Format Utils]
        BD --> BM[User Utils]
        BD --> BN[Credits Utils]
        BD --> BO[Payment Utils]
        BD --> BP[Subscription Utils]
        BD --> BQ[Entity Guards]
        BE --> BR[ID Utils]
        BE --> BS[Storage Utils]
        BE --> BT[Sanitization Utils]
    end

    subgraph "Validation"
        BU[Core Validation]
        BV[Domain Validation]
        BU --> BW[Email Validation]
        BU --> BX[Password Validation]
        BU --> BY[Username Validation]
        BU --> BZ[Topic Validation]
        BU --> CA[Language Validation]
        BU --> CB[Input Validation]
        BV --> CC[Trivia Validation]
        BV --> CD[Difficulty Validation]
        BV --> CE[Payment Validation]
    end
```

## דיאגרמת AI Providers

```mermaid
graph TB
    A[TriviaGenerationService] --> B[GroqProvider]
    B --> C[BaseProvider]
    
    B --> D[Model Selection<br/>by Priority]
    D --> E[Round Robin<br/>Priority 1 Models]
    
    B --> F[Groq API<br/>Unified Endpoint]
    F --> G[llama-3.1-8b-instant<br/>Priority: 1, Free]
    F --> H[gpt-oss-20b<br/>Priority: 1, Free Tier]
    F --> I[gpt-oss-120b<br/>Priority: 2, Paid]
    F --> J[llama-3.1-70b-versatile<br/>Priority: 3, Paid]
    
    A --> K[Prompt Templates]
    K --> L[Trivia Prompt]
    K --> M[Custom Difficulty Prompt]
```

## דיאגרמת Middleware Stack

```mermaid
graph TB
    A[Incoming Request] --> B[DecoratorAwareMiddleware]
    B --> C[RateLimitMiddleware]
    C --> D[BulkOperationsMiddleware]
    D --> E[AuthGuard]
    E --> F[RolesGuard]
    F --> G[ValidationPipe]
    G --> H[Controller]
    H --> I[Service]
    I --> J[CacheInterceptor]
    I --> K[ResponseFormattingInterceptor]
    I --> L[PerformanceMonitoringInterceptor]
    J --> M[Response]
    K --> M
    L --> M
    M --> N[GlobalExceptionFilter]
    N --> O[Outgoing Response]
```

## דיאגרמת Redux State

```mermaid
graph LR
    A[Redux Store] --> B[gameSlice]
    A --> C[userSlice]
    A --> D[statsSlice]
    A --> E[favoritesSlice]
    A --> F[gameModeSlice]
    
    B --> G[state]
    G --> H[status]
    G --> I[isPlaying]
    G --> J[currentQuestion]
    G --> K[totalQuestions]
    G --> L[questions]
    G --> M[answers]
    G --> N[loading]
    G --> O[data]
    O --> P[score]
    O --> Q[currentQuestionIndex]
    O --> R[startTime]
    B --> S[gameHistory]
    B --> T[leaderboard]
    B --> U[isLoading]
    B --> V[error]
    
    C --> W[currentUser]
    C --> X[username]
    C --> Y[avatar]
    C --> Z[creditBalance]
    C --> AA[isLoading]
    C --> AB[error]
    C --> AC[isAuthenticated]
    Z --> AD[purchasedCredits]
    Z --> AE[freeCredits]
    Z --> AF[totalCredits]
    
    D --> AG[stats]
    D --> AH[globalStats]
    D --> AI[leaderboard]
    D --> AJ[isLoading]
    D --> AK[error]
    AG --> AL[topicsPlayed]
    AG --> AM[successRateByDifficulty]
    AG --> AN[streaks]
    
    E --> AO[topics]
    
    F --> AP[selectedMode]
    F --> AQ[currentTopic]
    F --> AR[currentDifficulty]
    F --> AS[customDifficulty]
    
    C --> AT[redux-persist]
    E --> AT
    F --> AT
```

## דיאגרמת React Query Cache

```mermaid
graph LR
    A[React Query Client] --> B[useCurrentUser]
    A --> C[useUserProfile]
    A --> D[useTrivia]
    A --> E[useUserStats]
    A --> F[useGameHistory]
    A --> G[useLeaderboard]
    A --> H[useLeaderboardStats]
    A --> I[useUserAnalytics]
    A --> J[useAdminAnalytics]
    A --> K[usePopularTopics]
    A --> L[useDifficultyStats]
    A --> M[useGlobalStats]
    A --> N[useUserRanking]
    A --> O[useGlobalLeaderboard]
    A --> P[useLeaderboardByPeriod]
    
    B --> Q[GET /api/auth/me]
    C --> R[GET /api/users/profile]
    D --> S[POST /api/game/trivia]
    E --> T[GET /api/users/stats]
    F --> U[GET /api/game/history]
    G --> V[GET /api/leaderboard]
    H --> W[GET /api/leaderboard/stats]
    I --> X[GET /api/analytics/user]
    J --> Y[GET /api/admin/analytics]
    J --> Z[GET /api/admin/users/:id/statistics]
    K --> AA[GET /api/analytics/topics]
    L --> AB[GET /api/analytics/difficulty]
    M --> AC[GET /api/analytics/global]
    N --> AD[GET /api/leaderboard/rank]
    O --> V
    P --> AE[GET /api/leaderboard/:period]
    
    Q --> AF[Cache: currentUser]
    R --> AG[Cache: userProfile]
    S --> AH[Cache: question]
    T --> AI[Cache: stats]
    U --> AJ[Cache: history]
    V --> AK[Cache: leaderboard]
    W --> AL[Cache: leaderboardStats]
    X --> AM[Cache: userAnalytics]
    Y --> AN[Cache: adminAnalytics]
    Z --> AO[Cache: userStatistics]
    AA --> AP[Cache: popularTopics]
    AB --> AQ[Cache: difficultyStats]
    AC --> AR[Cache: globalStats]
    AD --> AS[Cache: userRanking]
    AE --> AK
    
    AF --> AT[Stale Time: 5min]
    AG --> AT
    AH --> AU[Stale Time: 1min]
    AI --> AV[Stale Time: 10min]
    AJ --> AW[Stale Time: 5min]
    AK --> AX[Stale Time: 2min]
    AL --> AX
    AM --> AV
    AN --> AY[Stale Time: 5min]
    AO --> AY
    AP --> AV
    AQ --> AV
    AR --> AY
    AS --> AX
```

## דיאגרמת זרימת תשלומים

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant P as PaymentService
    participant S as Stripe
    participant SUB as SubscriptionService
    participant DB as PostgreSQL

    U->>F: בחירת תוכנית
    F->>P: POST /api/payment/create-session
    P->>S: יצירת session
    S->>P: Session ID
    P->>F: החזרת Session ID
    F->>S: הפניה ל-Stripe Checkout
    S->>U: טופס תשלום
    U->>S: אישור תשלום
    S->>P: Webhook
    P->>DB: שמירת תשלום
    P->>SUB: יצירת מנוי
    SUB->>DB: שמירת מנוי
    SUB->>F: עדכון סטטוס
    F->>U: אישור מנוי
```

## דיאגרמת Views מלאה

```mermaid
graph LR
    subgraph "Public Views"
        A[HomeView]
        B[LoginView]
        C[RegistrationView]
        D[LeaderboardView]
        E[UnauthorizedView]
    end

    subgraph "Protected Views"
        F[GameSessionView]
        G[GameSummaryView]
        H[CustomDifficultyView]
        I[UserProfile]
        J[GameHistory]
        K[AnalyticsView]
        L[PaymentView]
        M[CreditsView]
        N[SettingsView]
    end

    subgraph "Admin Views"
        O[AdminDashboard]
    end

    A --> P[Game Components]
    A --> Q[Navigation Components]
    F --> P
    G --> P
    H --> R[Form Components]
    I --> S[User Components]
    I --> T[UI Components]
    J --> U[Stats Components]
    K --> U
    L --> V[Payment Components]
    M --> T
    N --> T
    O --> U
    O --> W[Admin Components]

    subgraph "State Management"
        SM[State Management<br/>Redux Store<br/>React Query]
    end

    A --> SM
    F --> SM
    G --> SM
    H --> SM
    I --> SM
    J --> SM
    K --> SM
    L --> SM
    M --> SM
    N --> SM
    O --> SM

    style SM fill:#e3f2fd,color:#000000
```

## דיאגרמת Components מלאה

```mermaid
graph TB
    subgraph "Game Components"
        A[Game]
        B[GameTimer]
        C[TriviaForm]
        D[TriviaGame]
        E[GameMode]
        F[CustomDifficultyHistory]
    end

    subgraph "UI Components"
        G[Button]
        H[Card]
        I[Modal]
        J[Input]
        K[Select]
        L[Avatar]
        M[IconLibrary]
        N[ValidatedInput]
        O[ValidationMessage]
        P[ValidationIcon]
        Q[AlertModal]
        R[ConfirmModal]
        S[GoogleIcon]
        T[FeatureHighlight]
    end

    subgraph "Layout Components"
        U[GridLayout]
        V[Footer]
        W[NotFound]
        X[SocialShare]
    end

    subgraph "Navigation Components"
        Y[Navigation]
        Z[ProtectedRoute]
        BA[PublicRoute]
    end

    subgraph "Stats Components"
        BB[ScoringSystem]
        BC[Leaderboard]
        BD[CustomDifficultyHistory]
    end

    subgraph "User Components"
        BE[CompleteProfile]
        BF[FavoriteTopics]
        BG[OAuthCallback]
    end

    subgraph "Animations"
        BH[AnimationLibrary]
        BI[fadeInUp]
        BJ[fadeInDown]
        BK[fadeInLeft]
        BL[fadeInRight]
        BM[scaleIn]
        BN[hoverScale]
        BO[createStaggerContainer]
    end

    subgraph "Special Components"
        BP[AudioControls]
        BQ[FeatureErrorBoundary]
        BR[ErrorBoundary]
        BS[SubscriptionPlans]
        BT[ValidatedForm]
        BU[GameMode]
        BV[IconLibrary]
    end

    subgraph "Home Components"
        BW[HomeTitle]
        BX[ErrorBanner]
        BY[CurrentDifficulty]
    end

    A --> E
    A --> B
    C --> E
    D --> A
    F --> E
    G --> H
    I --> N
    J --> N
    N --> O
    N --> P
    Y --> Z
    BB --> BC
    BE --> BF
    A --> BH
    C --> BH
    BH --> BI
    BH --> BJ
    BH --> BK
    BH --> BL
    BH --> BM
    BH --> BN
    BH --> BO
```

## דיאגרמת Hooks מלאה

```mermaid
graph LR
    subgraph "React Query Hooks"
        RQH[React Query Hooks<br/>useUserProfile, useUserStats<br/>useGameHistory, useLeaderboard<br/>useAnalytics, useAdminAnalytics<br/>usePopularTopics, useDifficultyStats<br/>useGlobalStats, useUserRanking<br/>useGlobalLeaderboard, etc.]
    end

    subgraph "Redux Hooks"
        N[useAppDispatch]
        O[useAppSelector]
    end

    subgraph "Auth Hooks"
        AUTH[Auth Hooks<br/>useAuth, useLogin<br/>useRegister, useCurrentUser]
    end

    subgraph "Game Hooks"
        GAME[Game Hooks<br/>useTrivia, useGameTimer<br/>useSaveHistory, useCanPlay<br/>useDeductCredits]
    end

    subgraph "User Hooks"
        USER[User Hooks<br/>useUser, useUpdateUserProfile<br/>useUserPreferences]
    end

    subgraph "Credits Hooks"
        CREDITS[Credits Hooks<br/>useCredits, useCreditBalance<br/>useCreditHistory]
    end

    subgraph "Subscription Hooks"
        SUB[Subscription Hooks<br/>useSubscriptionManagement<br/>useCreateSubscription<br/>useCancelSubscription]
    end

    subgraph "Account Management Hooks"
        ACCOUNT[Account Management Hooks<br/>useAccountManagement<br/>useUpdateUserCredits<br/>useUpdateUserStatus<br/>useDeleteUser<br/>useGetUserById]
    end

    subgraph "Analytics Hooks"
        ANALYTICS[Analytics Hooks<br/>useAnalyticsDashboard<br/>useUserStatisticsById<br/>useUserPerformanceById<br/>useUserProgressById<br/>useUserActivityById<br/>useUserInsightsById<br/>useUserRecommendationsById<br/>useUserAchievementsById<br/>useUserTrendsById<br/>useCompareUserPerformance<br/>useUserSummaryById, etc.]
    end

    subgraph "Utility Hooks"
        AZ[useAudio]
        BA[useDebounce]
        BB[useDebouncedCallback]
        BC[usePrevious]
        BD[useValueChange]
        BE[useValidation]
        BF[useNavigationController]
        BG[useLeaderboardFeatures]
    end

    subgraph "Services"
        BH[api.service]
        BI[auth.service]
        BJ[user.service]
        BK[credits.service]
        BL[payment.service]
        BM[audio.service]
        BN[Redux Store]
    end

    RQH --> BH
    AUTH --> BI
    USER --> BJ
    CREDITS --> BK
    SUB --> BL
    GAME --> BH
    ACCOUNT --> BH
    ANALYTICS --> BH
    AZ --> BM
    N --> BN

    style BH fill:#e3f2fd,color:#000000
    style BI fill:#fff4e6,color:#000000
    style BJ fill:#e8f5e9,color:#000000
    style BK fill:#fff9c4,color:#000000
    style BL fill:#fce4ec,color:#000000
    style BM fill:#e1bee7,color:#000000
    style BN fill:#e8f5e9,color:#000000
    style RQH fill:#e3f2fd,color:#000000
    style AUTH fill:#fff4e6,color:#000000
    style USER fill:#e8f5e9,color:#000000
    style CREDITS fill:#fff9c4,color:#000000
    style SUB fill:#fce4ec,color:#000000
    style GAME fill:#e1bee7,color:#000000
    style ACCOUNT fill:#f3e5f5,color:#000000
    style ANALYTICS fill:#e1bee7,color:#000000
```

## דיאגרמת Services מלאה (Client)

```mermaid
graph LR
    subgraph "API Services"
        A[api.service]
        B[auth.service]
        C[user.service]
        D[credits.service]
        E[payment.service]
        F[gameHistory.service]
        G[customDifficulty.service]
        H[score.service]
    end

    subgraph "Utility Services"
        I[audio.service]
        J[storage.service]
        K[queryClient.service]
    end

    subgraph "Interceptors"
        L[Request Interceptor]
        M[Response Interceptor]
        N[Error Interceptor]
        O[Auth Interceptor]
        P[Base Interceptor Manager]
    end

    subgraph "External APIs"
        Q[Backend API]
        R[PayPal API]
        S[Stripe API]
    end

    A --> Q
    B --> Q
    C --> Q
    D --> Q
    E --> Q
    F --> Q
    G --> Q
    H --> Q
    E --> R
    E --> S
    A --> L
    A --> M
    A --> N
    A --> O
    L --> P
    M --> P
    N --> P
    O --> P
    I --> T[AudioContext]
    J --> U[localStorage]
    K --> V[React Query Client]
```

## דיאגרמת Routes/Navigation

```mermaid
graph LR
    subgraph "App Routes"
        A[AppRoutes.tsx]
        A --> B[Public Routes]
        A --> C[Protected Routes]
        A --> D[Admin Routes]
    end

    subgraph "Public Routes"
        E[- HomeView]
        F[leaderboard - LeaderboardView]
        G[login - LoginView]
        H[register - RegistrationView]
        I[unauthorized - UnauthorizedView]
    end

    subgraph "Game Routes"
        J[game/play - GameSessionView]
        K[game/summary - GameSummaryView]
        L[game/custom - CustomDifficultyView]
    end

    subgraph "Protected Routes"
        M[profile - UserProfile]
        N[history - GameHistory]
        O[payment - PaymentView]
        P[credits - CreditsView]
        Q[analytics - AnalyticsView]
        R[settings - SettingsView]
        S[complete-profile - CompleteProfile]
    end

    subgraph "Admin Routes"
        T[admin - AdminDashboard]
    end

    subgraph "Route Protection"
        U[ProtectedRoute]
        V[PublicRoute]
        W[Navigation]
    end

    C --> U
    D --> U
    B --> V
    M --> U
    N --> U
    O --> U
    P --> U
    Q --> U
    R --> U
    S --> U
    T --> U
    G --> V
    H --> V
    W --> X[NavigationBrand]
    W --> Y[NavigationActions]
    W --> Z[NavigationMenu]
```

## דיאגרמת זרימת Custom Difficulty

```mermaid
sequenceDiagram
    participant U as User
    participant CV as CustomDifficultyView
    participant CDS as customDifficulty.service
    participant SS as storage.service
    participant AS as api.service
    participant BE as Backend

    U->>CV: יצירת קושי מותאם
    CV->>CDS: saveCustomDifficulty
    CDS->>SS: שמירה ב-localStorage
    SS->>CDS: אישור שמירה
    CDS->>AS: POST /api/game/custom-difficulty
    AS->>BE: שליחת קושי מותאם
    BE->>AS: אישור שמירה
    AS->>CDS: אישור מהשרת
    CDS->>CV: עדכון רשימת קשיים
    CV->>U: הצגת קשיים שמורים
    U->>CV: בחירת קושי מותאם
    CV->>CDS: loadCustomDifficulty
    CDS->>SS: קריאה מ-localStorage
    SS->>CDS: החזרת קושי
    CDS->>CV: עדכון מצב
    CV->>U: מעבר למשחק
```

## דיאגרמת זרימת Analytics

```mermaid
sequenceDiagram
    participant U as User
    participant AV as AnalyticsView
    participant ADH as useAnalyticsDashboard
    participant AS as api.service
    participant AM as AnalyticsModule
    participant DB as PostgreSQL
    participant C as Redis Cache

    U->>AV: פתיחת Analytics
    AV->>ADH: useUserAnalytics
    ADH->>AS: GET /api/analytics/user
    AS->>AM: בקשה לאנליטיקה
    AM->>C: בדיקת מטמון
    alt יש במטמון
        C->>AM: החזרת נתונים
    else אין במטמון
        AM->>DB: שאילתת נתונים
        DB->>AM: החזרת נתונים
        AM->>C: שמירה במטמון
    end
    AM->>AS: החזרת אנליטיקה
    AS->>ADH: עדכון cache
    ADH->>AV: עדכון UI
    AV->>U: הצגת גרפים ונתונים
    U->>AV: בחירת תקופה/פילטרים
    AV->>ADH: useDifficultyStats / usePopularTopics
    ADH->>AS: GET /api/analytics/difficulty / topics
    AS->>AM: בקשה לנתונים
    AM->>DB: שאילתה
    DB->>AM: נתונים
    AM->>AS: תגובה
    AS->>ADH: עדכון
    ADH->>AV: עדכון UI
```

## דיאגרמת זרימת Admin Dashboard

```mermaid
sequenceDiagram
    participant A as Admin
    participant AD as AdminDashboard
    participant AAH as useAdminAnalytics
    participant AS as api.service
    participant UM as UserModule
    participant AM as AnalyticsModule
    participant DB as PostgreSQL

    A->>AD: פתיחת Dashboard
    AD->>AAH: useUserStatisticsById
    AAH->>AS: GET /api/admin/users/:id/statistics
    AS->>UM: בקשה לנתוני משתמש
    UM->>DB: שאילתת נתונים
    DB->>UM: נתוני משתמש
    UM->>AS: תגובה
    AS->>AAH: עדכון cache
    AAH->>AD: עדכון UI
    AD->>A: הצגת סטטיסטיקות
    A->>AD: פעולת ניהול (עדכון/מחיקה)
    AD->>AAH: useUpdateUserCredits / useDeleteUser
    AAH->>AS: PUT/DELETE /api/admin/users/:id
    AS->>UM: פעולת ניהול
    UM->>DB: עדכון/מחיקה
    DB->>UM: אישור
    UM->>AS: תגובה
    AS->>AAH: עדכון
    AAH->>AD: עדכון UI
    AD->>A: אישור פעולה
    A->>AD: השוואת משתמשים
    AD->>AAH: useCompareUserPerformance
    AAH->>AS: GET /api/admin/users/:id/compare
    AS->>AM: בקשה להשוואה
    AM->>DB: שאילתת השוואה
    DB->>AM: נתוני השוואה
    AM->>AS: תגובה
    AS->>AAH: עדכון
    AAH->>AD: עדכון UI
    AD->>A: הצגת השוואה
```

## דיאגרמת היררכיית Backend - Database עד API

```mermaid
graph TB
    subgraph "Database Layer"
        DB[(PostgreSQL Database)]
    end

    subgraph "TypeORM Entities Layer"
        E1[UserEntity]
        E2[GameHistoryEntity]
        E3[TriviaEntity]
        E4[UserStatsEntity]
        E5[LeaderboardEntity]
        E6[PaymentHistoryEntity]
        E7[SubscriptionEntity]
    end

    subgraph "TypeORM Repositories Layer"
        R1[UserRepository]
        R2[GameHistoryRepository]
        R3[TriviaRepository]
        R4[UserStatsRepository]
        R5[LeaderboardRepository]
        R6[PaymentRepository]
        R7[SubscriptionRepository]
    end

    subgraph "TypeORM QueryBuilder (Complex Queries Only)"
        QB[QueryBuilder<br/>- Aggregations<br/>- GROUP BY<br/>- JOIN<br/>- Date Range<br/>- ILIKE Search]
    end

    subgraph "Common Layer (Query Helpers)"
        QH[Query Helpers<br/>- addDateRangeConditions<br/>- addSearchConditions<br/>- createGroupByQuery]
    end

    subgraph "Services Layer (Business Logic)"
        S1[UserService]
        S2[GameService]
        S3[AnalyticsService]
        S4[LeaderboardService]
        S5[CreditsService]
        S6[PaymentService]
        S7[SubscriptionService]
    end

    subgraph "Controllers Layer (HTTP Handling)"
        C1[UserController]
        C2[GameController]
        C3[AnalyticsController]
        C4[LeaderboardController]
        C5[CreditsController]
        C6[PaymentController]
        C7[SubscriptionController]
    end

    subgraph "HTTP API Layer"
        API[REST API<br/>/auth<br/>/game<br/>/users<br/>/credits<br/>/leaderboard<br/>/analytics<br/>/payment<br/>/subscription]
    end

    DB --> E1
    DB --> E2
    DB --> E3
    DB --> E4
    DB --> E5
    DB --> E6
    DB --> E7

    E1 --> R1
    E2 --> R2
    E3 --> R3
    E4 --> R4
    E5 --> R5
    E6 --> R6
    E7 --> R7

    subgraph "Repositories Group"
        REPOS[Repositories<br/>R1, R2, R3, R4<br/>R5, R6, R7]
    end

    subgraph "Services Group"
        SERVS[Services<br/>S1, S2, S3, S4<br/>S5, S6, S7]
    end

    subgraph "Controllers Group"
        CONTRS[Controllers<br/>C1, C2, C3, C4<br/>C5, C6, C7]
    end

    REPOS --> QB
    QB --> QH
    QH --> SERVS
    REPOS --> SERVS
    SERVS --> CONTRS
    CONTRS --> API

    style REPOS fill:#f3e5f5,color:#000000
    style SERVS fill:#e8f5e9,color:#000000
    style CONTRS fill:#fce4ec,color:#000000

    style DB fill:#e1f5ff,color:#000000
    style E1 fill:#fff4e6,color:#000000
    style E2 fill:#fff4e6,color:#000000
    style E3 fill:#fff4e6,color:#000000
    style E4 fill:#fff4e6,color:#000000
    style E5 fill:#fff4e6,color:#000000
    style E6 fill:#fff4e6,color:#000000
    style E7 fill:#fff4e6,color:#000000
    style R1 fill:#f3e5f5,color:#000000
    style R2 fill:#f3e5f5,color:#000000
    style R3 fill:#f3e5f5,color:#000000
    style R4 fill:#f3e5f5,color:#000000
    style R5 fill:#f3e5f5,color:#000000
    style R6 fill:#f3e5f5,color:#000000
    style R7 fill:#f3e5f5,color:#000000
    style QB fill:#fff9c4,color:#000000
    style QH fill:#e1bee7,color:#000000
    style S1 fill:#e8f5e9,color:#000000
    style S2 fill:#e8f5e9,color:#000000
    style S3 fill:#e8f5e9,color:#000000
    style S4 fill:#e8f5e9,color:#000000
    style S5 fill:#e8f5e9,color:#000000
    style S6 fill:#e8f5e9,color:#000000
    style S7 fill:#e8f5e9,color:#000000
    style C1 fill:#fce4ec,color:#000000
    style C2 fill:#fce4ec,color:#000000
    style C3 fill:#fce4ec,color:#000000
    style C4 fill:#fce4ec,color:#000000
    style C5 fill:#fce4ec,color:#000000
    style C6 fill:#fce4ec,color:#000000
    style C7 fill:#fce4ec,color:#000000
    style API fill:#ffebee,color:#000000
```

## דיאגרמת היררכיית Frontend - API עד Components

```mermaid
graph TB
    subgraph "HTTP API Layer"
        API[REST API<br/>/auth<br/>/game<br/>/users<br/>/credits<br/>/leaderboard<br/>/analytics<br/>/payment<br/>/subscription]
    end

    subgraph "API Service Layer (HTTP Client)"
        AS[api.service<br/>- HTTP Requests<br/>- Request Interceptors<br/>- Response Interceptors<br/>- Error Interceptors<br/>- Transformers]
    end

    subgraph "React Query Client"
        QC[QueryClient<br/>- Cache Management<br/>- Invalidation<br/>- Optimistic Updates<br/>- Background Refetching]
    end

    subgraph "React Query Hooks Group"
        RQ_ALL[React Query Hooks<br/>useAuth, useTrivia<br/>useUser, useCredits<br/>useUserStats, etc.]
    end

    subgraph "Components Group"
        COMPS[Components<br/>GameSessionView, UserProfile<br/>GameHistory, AnalyticsView<br/>LeaderboardView, etc.]
    end

    API --> AS
    AS --> RQ_ALL
    RQ_ALL --> QC
    RQ_ALL --> COMPS

    style API fill:#ffebee,color:#000000
    style AS fill:#e3f2fd,color:#000000
    style QC fill:#fff9c4,color:#000000
    style RQ_ALL fill:#f1f8e9,color:#000000
    style COMPS fill:#fce4ec,color:#000000
```

## דיאגרמת היררכיה מלאה - Database עד Components

```mermaid
graph TB
    subgraph "Database Layer"
        DB[(PostgreSQL<br/>Database)]
    end

    subgraph "Backend - TypeORM Layer"
        E[TypeORM Entities<br/>UserEntity<br/>GameHistoryEntity<br/>TriviaEntity<br/>UserStatsEntity<br/>etc.]
        R[TypeORM Repositories<br/>UserRepository<br/>GameHistoryRepository<br/>TriviaRepository<br/>etc.]
        QB[TypeORM QueryBuilder<br/>Complex Queries Only]
        QH[Query Helpers<br/>common/queries<br/>Date Range, Search<br/>Random, GroupBy]
    end

    subgraph "Backend - Business Logic Layer"
        S[Services<br/>UserService<br/>GameService<br/>AnalyticsService<br/>LeaderboardService<br/>etc.]
    end

    subgraph "Backend - HTTP Layer"
        C[Controllers<br/>UserController<br/>GameController<br/>AnalyticsController<br/>etc.]
        API[HTTP API<br/>REST Endpoints]
    end

    subgraph "Frontend - HTTP Client Layer"
        AS[API Service<br/>api.service<br/>HTTP Client with Interceptors]
    end

    subgraph "Frontend - State Management Layer"
        RS[Redux Store<br/>gameSlice<br/>userSlice<br/>statsSlice<br/>favoritesSlice<br/>gameModeSlice]
        RQ[React Query Hooks<br/>useAuth<br/>useTrivia<br/>useUser<br/>useCredits<br/>etc.]
        QC[React Query Client<br/>Cache Management]
    end

    subgraph "Frontend - UI Layer"
        COM[Components<br/>GameSessionView<br/>UserProfile<br/>AnalyticsView<br/>LeaderboardView<br/>etc.]
    end

    DB -->|Schema| E
    E -->|InjectRepository| R
    R -->|Simple Queries| S
    R -->|Complex Queries| QB
    QB -->|Uses Helpers| QH
    QH -->|Query Results| S
    QB -->|Query Results| S
    S -->|Business Logic| C
    C -->|HTTP Handlers| API
    API -->|REST Requests| AS
    AS -->|HTTP Client| RQ
    RQ -->|Cache/State| QC
    RQ -->|Server State| COM
    RS -->|Local State| COM

    style DB fill:#e1f5ff,color:#000000
    style E fill:#fff4e6,color:#000000
    style R fill:#f3e5f5,color:#000000
    style QB fill:#fff9c4,color:#000000
    style QH fill:#e1bee7,color:#000000
    style S fill:#e8f5e9,color:#000000
    style C fill:#fce4ec,color:#000000
    style API fill:#ffebee,color:#000000
    style AS fill:#e3f2fd,color:#000000
    style RS fill:#ffcdd2,color:#000000
    style RQ fill:#f1f8e9,color:#000000
    style QC fill:#fff9c4,color:#000000
    style COM fill:#fce4ec,color:#000000
```

## דיאגרמת היררכיית Shared Package - שילוב ב-Backend ו-Frontend

```mermaid
graph LR
    subgraph "Shared Package"
        SP_T[Types<br/>Domain, Core, Infrastructure]
        SP_C[Constants<br/>Business, Core, Domain, Infrastructure]
        SP_S[Services<br/>Core: Logging<br/>Domain: Credits<br/>Infrastructure: Storage, Cache, Auth]
        SP_U[Utils<br/>Core, Domain, Infrastructure]
        SP_V[Validation<br/>Core, Domain]
    end

    subgraph "Backend Usage Group"
        BE_ALL[Backend<br/>Services, Controllers<br/>Entities, Modules]
    end

    subgraph "Frontend Usage Group"
        FE_ALL[Frontend<br/>Services, Hooks<br/>Components, Types]
    end

    SP_T -->|Import/Extend Types| BE_ALL
    SP_T -->|Import/Extend Types| FE_ALL

    SP_C -->|Import Constants| BE_ALL
    SP_C -->|Import Constants| FE_ALL

    SP_S -->|Use Services| BE_ALL
    SP_S -->|Use Services| FE_ALL

    SP_U -->|Use Utils| BE_ALL
    SP_U -->|Use Utils| FE_ALL

    SP_V -->|Validation| BE_ALL
    SP_V -->|Validation| FE_ALL

    style BE_ALL fill:#e8f5e9,color:#000000
    style FE_ALL fill:#e3f2fd,color:#000000

    style SP_T fill:#fff4e6,color:#000000
    style SP_C fill:#e3f2fd,color:#000000
    style SP_S fill:#e8f5e9,color:#000000
    style SP_U fill:#fce4ec,color:#000000
    style SP_V fill:#fff9c4,color:#000000
```

## הפניות

לדיאגרמות מפורטות יותר, ראו:
- [ארכיטקטורה כללית](./ARCHITECTURE.md)
- [מבנה Backend](./backend/internal/README.md)
- [מבנה Frontend](./frontend/REDUX.md)
- [מסד נתונים](./database/DATABASE_SETUP.md)
- [Database Queries](./backend/DATABASE_QUERIES.md)
- [Shared Package](./shared/SHARED_PACKAGE.md)
