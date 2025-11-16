# Frontend Services - EveryTriv

## סקירה כללית

שכבת השירותים בצד הלקוח מספקת עטיפה מוטה טיפוסים עבור קריאות HTTP, ניהול מצב מקומי, ושירותים ייעודיים לתחומים שונים.

לקשר לדיאגרמות: 
- [דיאגרמת Services מלאה (Client)](../../DIAGRAMS.md#דיאגרמת-services-מלאה-client)
- [דיאגרמת מבנה Frontend](../../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

## מבנה תיקיית Services

```
client/src/services/
├── api.service.ts              # שירות API מרכזי
├── auth.service.ts              # שירות אימות
├── audio.service.ts             # שירות אודיו
├── storage.service.ts           # שירות אחסון מקומי
├── gameHistory.service.ts       # שירות היסטוריית משחקים
├── points.service.ts            # שירות נקודות
├── user.service.ts              # שירות משתמש
├── payment.service.ts           # שירות תשלומים
├── score.service.ts             # שירות ניקוד
├── customDifficulty.service.ts  # שירות קושי מותאם
├── queryClient.service.ts       # תצורת React Query
├── interceptors/                # Interceptors ל-API
│   ├── auth.interceptor.ts      # Interceptor לאימות
│   ├── error.interceptor.ts     # Interceptor לשגיאות
│   ├── request.interceptor.ts   # Interceptor לבקשות
│   ├── response.interceptor.ts  # Interceptor לתגובות
│   ├── base.interceptor-manager.ts # מנהל Interceptors
│   └── index.ts                 # ייצוא מאוחד
└── index.ts                     # ייצוא מאוחד
```

## שירות API מרכזי (API Service)

### api.service.ts

השירות המרכזי לניהול כל קריאות HTTP לשרת:

```typescript
import { HTTP_CLIENT_CONFIG, HTTP_STATUS_CODES, VALIDATION_LIMITS } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { ApiResponse, ApiError, TriviaRequest, TriviaQuestion } from '@shared/types';
import { getErrorMessage, hasProperty } from '@shared/utils';
import {
  authRequestInterceptor,
  ErrorInterceptorManager,
  RequestInterceptorManager,
  ResponseInterceptorManager,
} from './interceptors';
import { storageService } from './storage.service';

class ApiService implements ClientApiService {
  private baseURL: string;
  private retryAttempts: number = HTTP_CLIENT_CONFIG.RETRY_ATTEMPTS;
  private retryDelay: number = HTTP_CLIENT_CONFIG.RETRY_DELAY;
  private requestInterceptors: RequestInterceptorManager;
  private responseInterceptors: ResponseInterceptorManager;
  private errorInterceptors: ErrorInterceptorManager;
  private activeRequests = new Map<string, Promise<ApiResponse<unknown>>>();

  constructor() {
    this.baseURL = ApiConfig.getBaseUrl();
    this.requestInterceptors = new RequestInterceptorManager();
    this.responseInterceptors = new ResponseInterceptorManager();
    this.errorInterceptors = new ErrorInterceptorManager();

    // Register auth request interceptor with highest priority
    this.requestInterceptors.use(authRequestInterceptor, { priority: 0 });
  }

  // Get trivia questions
  async getTrivia(request: TriviaRequest): Promise<TriviaQuestion> {
    this.assertQuestionCountWithinLimits(request.questionCount);
    const response = await this.post<TriviaQuestion>('/game/trivia', request);
    return response.data;
  }

  // Get user game history
  async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
    const response = await this.get<GameHistoryEntry[]>('/game/history', {
      limit: String(limit),
      offset: String(offset),
    });
    return response.data;
  }

  // Generic GET method
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}${this.buildQueryString(params)}`;
    const requestKey = this.getRequestKey(url, 'GET');

    // Check for duplicate request
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const requestPromise = this.executeRequest<T>('GET', endpoint, undefined, params);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  // Generic POST method
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('POST', endpoint, data);
  }

  // Generic PUT method
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('PUT', endpoint, data);
  }

  // Generic DELETE method
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('DELETE', endpoint);
  }

  // Execute HTTP request with interceptors and retry logic
  private async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}${this.buildQueryString(params)}`;
    const timeoutController = this.createTimeoutController(HTTP_CLIENT_CONFIG.TIMEOUT);

    let config: EnhancedRequestConfig = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: timeoutController.signal,
    };

    // Execute request interceptors
    config = await this.requestInterceptors.execute(config);

    let attempt = 0;
    while (attempt <= this.retryAttempts) {
      try {
        const response = await fetch(url, {
          method: config.method,
          headers: config.headers,
          body: config.body,
          signal: config.signal,
        });

        // Parse response and execute response interceptors
        const apiResponse = await this.parseResponse<T>(response);
        const interceptedResponse = await this.responseInterceptors.execute(apiResponse);

        if (!interceptedResponse.success) {
          const error = interceptedResponse.error || new Error('Request failed');
          const shouldRetry = this.shouldRetry(response.status, attempt);

          if (shouldRetry) {
            attempt++;
            await this.sleep(this.retryDelay * attempt);
            continue;
          }

          throw error;
        }

        return interceptedResponse;
      } catch (error) {
        // Execute error interceptors
        await this.errorInterceptors.execute(error);

        const shouldRetry = this.shouldRetry(0, attempt);
        if (shouldRetry) {
          attempt++;
          await this.sleep(this.retryDelay * attempt);
          continue;
        }

        throw error;
      }
    }

    throw new Error('Request failed after retries');
  }

  private shouldRetry(statusCode: number, attempt: number): boolean {
    if (attempt >= this.retryAttempts) return false;
    if (statusCode >= 500 || statusCode === 429) return true;
    if (statusCode === 0) return true; // Network error
    return false;
  }
}

export const apiService = new ApiService();
```

## שירות אימות (Auth Service)

### auth.service.ts

```typescript
import { UserRole } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { AuthCredentials, AuthenticationResult, BasicUser } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { CLIENT_STORAGE_KEYS } from '../constants';
import { ApiConfig, apiService } from './api.service';
import { storageService } from './storage.service';

class AuthService {
  private readonly TOKEN_KEY = CLIENT_STORAGE_KEYS.AUTH_TOKEN;
  private readonly USER_KEY = CLIENT_STORAGE_KEYS.AUTH_USER;

  async login(credentials: AuthCredentials): Promise<AuthenticationResult> {
    try {
      logger.securityLogin('Attempting to login user', { username: credentials.username });
      const response = await apiService.login(credentials);
      await this.setAuthData(response);
      if (response.user) {
        logger.logUserActivity(response.user.id, 'login', { username: credentials.username });
      }
      return response;
    } catch (error) {
      logger.securityDenied('Login failed', { error: getErrorMessage(error), username: credentials.username });
      throw error;
    }
  }

  async register(credentials: AuthCredentials & { email: string }): Promise<AuthenticationResult> {
    try {
      logger.authRegister('Attempting to register user', { username: credentials.username });
      const response = await apiService.register(credentials);
      await this.setAuthData(response);
      if (response.user) {
        logger.authRegister('User registered successfully', { userId: response.user.id });
      }
      return response;
    } catch (error) {
      logger.authError(ensureErrorObject(error), 'Registration failed', {
        username: credentials.username,
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      logger.authLogout('Logging out user');
      await this.clearAuthData();
      await apiService.logout();
      logger.authLogout('User logged out successfully');
    } catch (error) {
      logger.authError(ensureErrorObject(error), 'Logout failed');
      await this.clearAuthData();
    }
  }

  async getCurrentUser(): Promise<BasicUser> {
    try {
      const response = await apiService.getCurrentUser();
      return response.data;
    } catch (error) {
      logger.authError(ensureErrorObject(error), 'Failed to get current user');
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const tokenResult = await storageService.getString(this.TOKEN_KEY);
    return tokenResult.success && !!tokenResult.data;
  }

  async getToken(): Promise<string | null> {
    const tokenResult = await storageService.getString(this.TOKEN_KEY);
    return tokenResult.success ? tokenResult.data : null;
  }

  private async setAuthData(response: AuthenticationResult): Promise<void> {
    if (response.access_token) {
      await storageService.set(this.TOKEN_KEY, response.access_token);
    }
    if (response.user) {
      await storageService.set(this.USER_KEY, response.user);
    }
  }

  private async clearAuthData(): Promise<void> {
    await storageService.delete(this.TOKEN_KEY);
    await storageService.delete(this.USER_KEY);
  }
}

export const authService = new AuthService();
```

## שירות אודיו (Audio Service)

### audio.service.ts

```typescript
import { clientLogger as logger } from '@shared/services';
import type { UserPreferences } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import {
  AUDIO_CATEGORIES,
  AUDIO_CONFIG,
  AUDIO_PATHS,
  AudioCategory,
  AudioKey,
  DEFAULT_CATEGORY_VOLUMES,
} from '../constants';
import { AudioServiceInterface } from '../types';

export class AudioService implements AudioServiceInterface {
  private audioElements: Map<AudioKey, HTMLAudioElement> = new Map();
  private isMuted = false;
  private volumes: Map<AudioKey, number> = new Map();
  private categoryVolumes: Map<AudioCategory, number>;
  private userInteracted = false;
  private userPreferences: UserPreferences | null = null;

  constructor() {
    const categoryEntries: [AudioCategory, number][] = [];
    for (const category of Object.values(AudioCategory)) {
      const defaultVolume = DEFAULT_CATEGORY_VOLUMES[category];
      if (typeof defaultVolume === 'number') {
        categoryEntries.push([category, defaultVolume]);
      }
    }
    this.categoryVolumes = new Map<AudioCategory, number>(categoryEntries);
    this.preloadEssentialAudio();
    this.setupUserInteractionListener();
  }

  play(key: AudioKey): void {
    if (this.isMuted || !this.userInteracted) return;

    const audio = this.audioElements.get(key);
    if (!audio) {
      this.loadAudio(key);
      return;
    }

    try {
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = this.getVolume(key);
      audioClone.play().catch(error => {
        logger.audioError('Failed to play audio', { key, error: getErrorMessage(error) });
      });
    } catch (error) {
      logger.audioError('Failed to play audio', { key, error: getErrorMessage(error) });
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  }

  setVolume(key: AudioKey, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.volumes.set(key, clampedVolume);
    const audio = this.audioElements.get(key);
    if (audio) {
      audio.volume = clampedVolume;
    }
  }

  setCategoryVolume(category: AudioCategory, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.categoryVolumes.set(category, clampedVolume);

    Object.entries(AUDIO_CATEGORIES).forEach(([key, cat]) => {
      if (cat === category) {
        this.setVolume(key as AudioKey, clampedVolume);
      }
    });
  }

  setUserPreferences(preferences: UserPreferences | null): void {
    this.userPreferences = preferences;
    if (preferences?.soundEnabled !== undefined) {
      this.setMuted(!preferences.soundEnabled);
    }
  }

  private preloadEssentialAudio(): void {
    const essentialKeys: AudioKey[] = [
      AudioKey.CLICK,
      AudioKey.POP,
      AudioKey.HOVER,
      AudioKey.BACKGROUND_MUSIC,
      AudioKey.GAME_MUSIC,
    ];

    essentialKeys.forEach(key => {
      const path = AUDIO_PATHS[key];
      if (path) {
        const category = AUDIO_CATEGORIES[key];
        const defaultVolume = this.categoryVolumes.get(category) ?? 0.7;
        const config = AUDIO_CONFIG[key] ?? {};
        this.preloadAudioInternal(key, path, {
          volume: config.volume ?? defaultVolume,
          loop: config.loop ?? false,
        });
      }
    });
  }

  private preloadAudioInternal(key: AudioKey, src: string, config: { volume?: number; loop?: boolean }): void {
    const audio = new Audio();
    audio.volume = this.isMuted ? 0 : (config.volume ?? 0.7);
    audio.loop = config.loop ?? false;
    audio.preload = 'auto';
    audio.src = src;
    this.audioElements.set(key, audio);
  }

  private setupUserInteractionListener(): void {
    const enableAudio = () => {
      this.userInteracted = true;
      if (!this.isMuted) {
        this.play(AudioKey.BACKGROUND_MUSIC);
      }
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
  }

  private getVolume(key: AudioKey): number {
    const specificVolume = this.volumes.get(key);
    if (specificVolume !== undefined) return specificVolume;

    const category = AUDIO_CATEGORIES[key];
    return this.categoryVolumes.get(category) ?? 0.7;
  }

  private loadAudio(key: AudioKey): void {
    const path = AUDIO_PATHS[key];
    if (!path) return;

    const category = AUDIO_CATEGORIES[key];
    const defaultVolume = this.categoryVolumes.get(category) ?? 0.7;
    const config = AUDIO_CONFIG[key] ?? {};
    this.preloadAudioInternal(key, path, {
      volume: config.volume ?? defaultVolume,
      loop: config.loop ?? false,
    });
    this.play(key);
  }
}

export const audioService = new AudioService();
```

## שירות אחסון מקומי (Storage Service)

### storage.service.ts

```typescript
import type { StorageOperationResult } from '@shared/types';

type TypeGuard<T> = (value: unknown) => value is T;

const defaultValidators = {
  string: (value: unknown): value is string => typeof value === 'string',
  number: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
  boolean: (value: unknown): value is boolean => typeof value === 'boolean',
} as const;

class ClientStorageService {
  async getString(key: string): Promise<StorageOperationResult<string>> {
    return this.get(key, defaultValidators.string);
  }

  async getNumber(key: string): Promise<StorageOperationResult<number>> {
    return this.get(key, defaultValidators.number);
  }

  async getBoolean(key: string): Promise<StorageOperationResult<boolean>> {
    return this.get(key, defaultValidators.boolean);
  }

  async get<T>(key: string, validator: TypeGuard<T>): Promise<StorageOperationResult<T>> {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return { success: false, data: undefined, timestamp: new Date() };
      }

      const parsed = JSON.parse(item);

      if (validator(parsed)) {
        return { success: true, data: parsed, timestamp: new Date() };
      } else {
        return { success: false, data: undefined, timestamp: new Date() };
      }
    } catch {
      return { success: false, data: undefined, timestamp: new Date() };
    }
  }

  async set<T>(key: string, value: T): Promise<StorageOperationResult<T>> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return { success: true, data: value, timestamp: new Date() };
    } catch {
      return { success: false, data: undefined, timestamp: new Date() };
    }
  }

  async delete(key: string): Promise<StorageOperationResult<boolean>> {
    try {
      localStorage.removeItem(key);
      return { success: true, data: true, timestamp: new Date() };
    } catch {
      return { success: false, data: false, timestamp: new Date() };
    }
  }
}

export const storageService = new ClientStorageService();
```

## שירות היסטוריית משחקים (Game History Service)

### gameHistory.service.ts

```typescript
import { GAME_STATE_DEFAULTS, VALID_GAME_MODES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { GameData, GameHistoryEntry, LeaderboardEntry, UserRankData, UserStatsData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { isValidDifficulty, toDifficultyLevel } from '@shared/validation';
import { apiService } from './api.service';

class ClientGameHistoryService {
  async saveGameResult(gameData: GameData): Promise<GameHistoryEntry> {
    try {
      logger.gameStatistics('Saving game result to history', {
        score: gameData.score,
        totalQuestions: gameData.totalQuestions,
        correctAnswers: gameData.correctAnswers,
      });

      if (!gameData.userId || gameData.userId.trim() === '') {
        throw new Error('User ID is required to save game history');
      }

      if (!isValidDifficulty(gameData.difficulty)) {
        throw new Error(`Invalid difficulty level: ${gameData.difficulty}`);
      }

      if (!VALID_GAME_MODES.includes(gameData.gameMode)) {
        throw new Error(`Invalid game mode: ${gameData.gameMode}`);
      }

      await apiService.saveGameHistory(gameData);

      const gameHistory: GameHistoryEntry = {
        id: `game_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: gameData.topic || GAME_STATE_DEFAULTS.TOPIC,
        difficulty: toDifficultyLevel(gameData.difficulty),
        gameMode: gameData.gameMode,
        score: gameData.score,
        totalQuestions: gameData.totalQuestions,
        correctAnswers: gameData.correctAnswers,
        timeSpent: gameData.timeSpent ?? 0,
        creditsUsed: gameData.creditsUsed ?? 0,
        questionsData: gameData.questionsData ?? [],
        userId: gameData.userId,
      };

      logger.gameStatistics('Game result saved successfully', { id: gameHistory.id });
      return gameHistory;
    } catch (error) {
      logger.gameError('Failed to save game result', {
        error: getErrorMessage(error),
        gameData,
      });
      throw error;
    }
  }

  async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
    try {
      logger.gameStatistics('Getting user game history', { limit, offset });
      const gameHistory = await apiService.getUserGameHistory(limit, offset);
      logger.gameStatistics('User game history retrieved successfully', {
        count: gameHistory.length,
      });
      return gameHistory;
    } catch (error) {
      logger.gameError('Failed to get user game history', {
        error: getErrorMessage(error),
        limit,
        offset,
      });
      throw error;
    }
  }

  async getUserRank(): Promise<UserRankData> {
    try {
      logger.userInfo('Getting user rank');
      const rank = await apiService.getUserRanking();
      logger.userInfo('User rank retrieved successfully', {
        rank: rank.rank,
        score: rank.score,
      });
      return rank;
    } catch (error) {
      logger.userError('Failed to get user rank', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async getUserStats(): Promise<UserStatsData> {
    try {
      logger.userInfo('Getting user statistics');
      const stats = await apiService.getUserStats();
      logger.userInfo('User statistics retrieved successfully', {
        totalGames: stats.gamesPlayed,
        totalScore: stats.correctAnswers,
      });
      return stats;
    } catch (error) {
      logger.userError('Failed to get user statistics', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async deleteGameHistory(gameId: string): Promise<{ message: string }> {
    try {
      logger.userInfo('Deleting game history', { gameId });
      await apiService.deleteGameHistory(gameId);
      logger.userInfo('Game history deleted successfully', { gameId });
      return { message: 'Game history deleted successfully' };
    } catch (error) {
      logger.userError('Failed to delete game history', { error: getErrorMessage(error), gameId });
      throw error;
    }
  }

  async clearGameHistory(): Promise<{ message: string; deletedCount: number }> {
    try {
      logger.userInfo('Clearing all game history');
      await apiService.clearGameHistory();
      logger.userInfo('All game history cleared successfully');
      return { message: 'All game history cleared successfully', deletedCount: 0 };
    } catch (error) {
      logger.userError('Failed to clear game history', { error: getErrorMessage(error) });
      throw error;
    }
  }
}

export const gameHistoryService = new ClientGameHistoryService();
```

## שירות נקודות (Points Service)

### points.service.ts

```typescript
import { GameMode, PaymentMethod, VALID_GAME_MODES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { CanPlayResponse, PointBalance, PointPurchaseOption, PointTransaction } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import type { PointsPurchaseRequest, PointsPurchaseResponse } from '../types';
import { apiService } from './api.service';

class ClientPointsService {
  async getPointBalance(): Promise<PointBalance> {
    try {
      logger.userInfo('Getting point balance');
      const balance = await apiService.getPointBalance();
      logger.userInfo('Point balance retrieved successfully', {
        totalPoints: balance.totalPoints,
        purchasedPoints: balance.purchasedPoints,
      });
      return balance;
    } catch (error) {
      logger.userError('Failed to get point balance', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async getPointPackages(): Promise<PointPurchaseOption[]> {
    try {
      logger.userInfo('Getting point packages');
      const packages = await apiService.getPointPackages();
      logger.userInfo('Point packages retrieved successfully', {
        count: packages.length,
      });
      return packages;
    } catch (error) {
      logger.userError('Failed to get point packages', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async canPlay(questionCount: number): Promise<CanPlayResponse> {
    try {
      logger.userInfo('Checking if user can play', { questionCount });
      const result = await apiService.canPlay(questionCount);
      logger.userInfo('Can play check completed', {
        canPlay: result.canPlay,
        reason: result.reason,
      });
      return {
        canPlay: result.canPlay,
        reason: result.reason,
      };
    } catch (error) {
      logger.userError('Failed to check if user can play', { error: getErrorMessage(error), questionCount });
      throw error;
    }
  }

  async deductPoints(questionCount: number, gameMode: GameMode): Promise<PointBalance> {
    try {
      const normalizedGameMode = this.resolveGameMode(gameMode);
      logger.userInfo('Deducting points', { questionCount, gameMode: normalizedGameMode });
      const newBalance = await apiService.deductPoints(questionCount, gameMode);
      logger.userInfo('Points deducted successfully', {
        newTotalPoints: newBalance.totalPoints,
      });
      return newBalance;
    } catch (error) {
      logger.userError('Failed to deduct points', { error: getErrorMessage(error), questionCount, gameMode });
      throw error;
    }
  }

  async purchasePoints(request: PointsPurchaseRequest): Promise<PointsPurchaseResponse> {
    try {
      logger.userInfo('Purchasing points', {
        packageId: request.packageId,
        paymentMethod: request.paymentMethod,
      });
      const response = await apiService.purchasePoints(request);
      logger.userInfo('Points purchased successfully', {
        amount: response.amount,
        totalPoints: response.totalPoints,
      });
      return response;
    } catch (error) {
      logger.userError('Failed to purchase points', {
        error: getErrorMessage(error),
        request,
      });
      throw error;
    }
  }

  async getTransactionHistory(limit: number = 50): Promise<PointTransaction[]> {
    try {
      logger.userInfo('Getting transaction history', { limit });
      const transactions = await apiService.getTransactionHistory(limit);
      logger.userInfo('Transaction history retrieved successfully', {
        count: transactions.length,
      });
      return transactions;
    } catch (error) {
      logger.userError('Failed to get transaction history', { error: getErrorMessage(error), limit });
      throw error;
    }
  }

  private resolveGameMode(gameMode: GameMode): GameMode {
    if (VALID_GAME_MODES.includes(gameMode)) {
      return gameMode;
    }
    logger.userWarn('Invalid game mode, defaulting to QUESTION_LIMITED', { gameMode });
    return GameMode.QUESTION_LIMITED;
  }
}

export const pointsService = new ClientPointsService();
```

## Interceptors

תיעוד מפורט על מערכת ה-Interceptors נמצא בקובץ נפרד:

- [Interceptors - Frontend](./interceptors/INTERCEPTORS.md)

הקובץ כולל תיעוד על:
- BaseInterceptorManager - Base class לכל ה-interceptor managers
- RequestInterceptorManager - מנהל interceptors לבקשות
- ResponseInterceptorManager - מנהל interceptors לתגובות
- ErrorInterceptorManager - מנהל interceptors לשגיאות
- authRequestInterceptor - Interceptor לאימות

## עקרונות עיצוב

### 1. הפרדת אחריות
- כל שירות מטפל בתחום ספציפי
- אין תלויות מעגליות בין שירותים

### 2. Type Safety
- כל השירותים מחזירים טיפוסים מוגדרים
- בדיקות runtime עם type guards

### 3. Error Handling
- שגיאות נרשמות בלוגר
- זריקת שגיאות מובנות לניהול ברכיבים

### 4. Caching
- שימוש ב-React Query לניהול cache
- Cache invalidation אוטומטי

## מדיניות

| מדיניות | כלל |
|---------|-----|
| Timeout | < 10s (HTTP_CLIENT_CONFIG.TIMEOUT) |
| Retries | Idempotent GET בלבד (עד 2) |
| Logging | שגיאות רשת בלבד |
| Deduplication | בקשות זהות נדחות |

## אבטחה

- אחסון טוקנים ב-localStorage (מוגן על ידי HttpOnly cookies בשרת)
- אין שמירת מידע רגיש ב-localStorage ללא הצפנה
- Token מוסר אוטומטית בכל בקשה דרך Auth Interceptor

## קישורים רלוונטיים

- [Interceptors - Frontend](./interceptors/INTERCEPTORS.md)
- [Hooks - Frontend](../HOOKS.md)
- [API Reference](../../backend/API_REFERENCE.md)
- [דיאגרמות](../../DIAGRAMS.md#דיאגרמת-services-מלאה-client)
