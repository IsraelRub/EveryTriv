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
├── multiplayer.service.ts       # שירות multiplayer
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
    this.assertRequestedQuestionsWithinLimits(request.requestedQuestions);
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
import type { AuthCredentials, AuthenticationResult, BasicUser, User, UserProfileResponseType } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { ensureErrorObject } from '@shared/utils/core/error.utils';
import { CLIENT_STORAGE_KEYS } from '../constants';
import { isUser } from '../utils/data.utils';
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
      const user = await apiService.getCurrentUser();
      await storageService.set(this.USER_KEY, user);
      return {
        ...user,
        role: user.role || UserRole.USER,
      };
    } catch (error) {
      logger.authError(ensureErrorObject(error), 'Failed to get current user');
      throw error;
    }
  }

  async refreshToken(): Promise<AuthenticationResult> {
    try {
      logger.authTokenRefresh('Refreshing auth token');
      const response = await apiService.refreshToken();
      const user = await this.getStoredUser();
      if (!user) {
        throw new Error('No user data found');
      }
      const refreshTokenResult = await storageService.getString(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
      const refreshToken = refreshTokenResult.success ? refreshTokenResult.data : null;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const fullResponse: AuthenticationResult = {
        user,
        accessToken: response.accessToken,
        refreshToken,
      };
      await this.setAuthData(fullResponse);
      logger.authTokenRefresh('Token refreshed successfully');
      return fullResponse;
    } catch (error) {
      logger.authError(ensureErrorObject(error), 'Token refresh failed');
      await this.clearAuthData();
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return await apiService.isAuthenticated();
  }

  async getToken(): Promise<string | null> {
    return await apiService.getAuthToken();
  }

  async getStoredUser(): Promise<User | null> {
    const result = await storageService.get<User>(this.USER_KEY, isUser);
    return result.success && result.data ? result.data : null;
  }

  async getAuthState(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
  }> {
    const token = await this.getToken();
    const user = await this.getStoredUser();
    return {
      isAuthenticated: !!token && !!user,
      user,
      token,
    };
  }

  async initiateGoogleLogin(): Promise<void> {
    try {
      logger.securityLogin('Initiating Google OAuth login');
      const googleAuthUrl = ApiConfig.getGoogleAuthUrl();
      window.location.href = googleAuthUrl;
    } catch (error) {
      logger.securityDenied('Google login initiation failed', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async completeProfile(profileData: {
    firstName: string;
    lastName?: string;
    avatar?: string;
  }): Promise<UserProfileResponseType> {
    try {
      logger.authProfileUpdate('Completing user profile');
      const profileResponse = await apiService.updateUserProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        avatar: profileData.avatar,
      });
      logger.authProfileUpdate('Profile completed successfully');
      return profileResponse;
    } catch (error) {
      logger.authError('Profile completion failed', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async updateUserProfile(profileData: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    email?: string;
  }): Promise<UserProfileResponseType> {
    try {
      logger.authProfileUpdate('Updating user profile');
      const profileResponse = await apiService.updateUserProfile(profileData);
      logger.authProfileUpdate('Profile updated successfully');
      return profileResponse;
    } catch (error) {
      logger.authError('Profile update failed', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      logger.authProfileUpdate('Changing user password');
      const response = await apiService.changePassword(currentPassword, newPassword);
      logger.authProfileUpdate('Password changed successfully');
      return response;
    } catch (error) {
      logger.authError('Password change failed', { error: getErrorMessage(error) });
      throw error;
    }
  }

  private async setAuthData(authResponse: AuthenticationResult): Promise<void> {
    if (authResponse.user) {
      await storageService.set(this.USER_KEY, authResponse.user);
    }
  }

  private async clearAuthData(): Promise<void> {
    await storageService.delete(this.TOKEN_KEY);
    await storageService.delete(CLIENT_STORAGE_KEYS.REFRESH_TOKEN);
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
  private masterVolume = 1;
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

  // Public API methods
  play(key: AudioKey): void {
    const audio = this.ensureAudioLoaded(key);
    if (!audio) return;

    // Check user preferences
    if (AUDIO_CATEGORIES[key] === AudioCategory.EFFECTS && this.userPreferences && !this.userPreferences.soundEnabled) {
      return;
    }
    if (AUDIO_CATEGORIES[key] === AudioCategory.MUSIC && this.userPreferences && !this.userPreferences.musicEnabled) {
      return;
    }
    if (key === AudioKey.BACKGROUND_MUSIC && !this.userInteracted) {
      return;
    }

    // For music, restart from beginning
    if (AUDIO_CATEGORIES[key] === AudioCategory.MUSIC) {
      audio.currentTime = 0;
      const soundVolume = this.volumes.get(key) || 0.7;
      const category = AUDIO_CATEGORIES[key];
      const categoryVolume = this.categoryVolumes.get(category) || 1;
      audio.volume = this.isMuted ? 0 : soundVolume * categoryVolume * this.masterVolume;
      audio.play().catch(err => {
        logger.audioError(key, err.message, { key, error: err });
      });
      return;
    }

    // For sound effects, clone to allow overlapping playback
    const clone = audio.cloneNode() as HTMLAudioElement;
    const soundVolume = this.volumes.get(key) || 0.7;
    const category = AUDIO_CATEGORIES[key];
    const categoryVolume = this.categoryVolumes.get(category) || 1;
    clone.volume = this.isMuted ? 0 : soundVolume * categoryVolume * this.masterVolume;
    clone.play().catch(err => {
      logger.audioError(key, err.message, { key, error: err });
    });
    clone.addEventListener('ended', () => clone.remove());
  }

  stop(key: AudioKey): void {
    const audio = this.audioElements.get(key);
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  stopAll(): void {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  mute(): void {
    this.isMuted = true;
    this.audioElements.forEach(audio => {
      audio.volume = 0;
    });
  }

  unmute(): void {
    this.isMuted = false;
    this.audioElements.forEach((audio, key) => {
      const category = AUDIO_CATEGORIES[key];
      const categoryVolume = this.categoryVolumes.get(category) || 1;
      const soundVolume = this.volumes.get(key) || 0.7;
      audio.volume = soundVolume * categoryVolume * this.masterVolume;
    });
  }

  toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = volume;
    this.audioElements.forEach((audio, key) => {
      const soundVolume = this.volumes.get(key) || 0.7;
      const category = AUDIO_CATEGORIES[key];
      const categoryVolume = this.categoryVolumes.get(category) || 1;
      audio.volume = this.isMuted ? 0 : soundVolume * categoryVolume * this.masterVolume;
    });
  }

  setVolume(volume: number): void {
    // Alias for setMasterVolume
    this.setMasterVolume(volume);
  }

  playAchievementSound(score: number, total: number, previousScore: number): void {
    if (score <= previousScore) return;
    const scoreIncrease = score - previousScore;
    const percentage = (score / total) * 100;

    if (percentage >= 100) {
      this.play(AudioKey.NEW_ACHIEVEMENT);
    } else if (percentage >= 80) {
      this.play(AudioKey.LEVEL_UP);
    } else if (scoreIncrease >= 5) {
      this.play(AudioKey.SCORE_STREAK);
    } else if (scoreIncrease >= 2) {
      this.play(AudioKey.SCORE_EARNED);
    } else if (scoreIncrease >= 1) {
      this.play(AudioKey.ACHIEVEMENT);
    } else {
      this.play(AudioKey.CLICK);
    }
  }

  setUserPreferences(preferences: UserPreferences | null): void {
    this.userPreferences = preferences;
  }

  // Getters
  get isEnabled(): boolean {
    return !this.isMuted;
  }

  get volume(): number {
    return this.isMuted ? 0 : this.masterVolume;
  }

  // Private methods
  private ensureAudioLoaded(key: AudioKey): HTMLAudioElement | null {
    let audio = this.audioElements.get(key);
    if (!audio) {
      const path = AUDIO_PATHS[key];
      if (path) {
        const category = AUDIO_CATEGORIES[key];
        const defaultVolume = this.categoryVolumes.get(category) ?? 0.7;
        const config = AUDIO_CONFIG[key] ?? {};
        this.preloadAudioInternal(key, path, {
          volume: config.volume ?? defaultVolume,
          loop: config.loop ?? false,
        });
        audio = this.audioElements.get(key);
      }
    }
    return audio || null;
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
    const soundVolume = config.volume ?? 0.7;
    const category = AUDIO_CATEGORIES[key];
    const categoryVolume = this.categoryVolumes.get(category) || 1;
    audio.volume = this.isMuted ? 0 : soundVolume * categoryVolume * this.masterVolume;
    audio.loop = config.loop ?? false;
    audio.preload = 'metadata';
    audio.addEventListener('error', err => {
      logger.mediaError(`Failed to load audio file: ${key}`, { error: getErrorMessage(err), key, src });
    });
    this.audioElements.set(key, audio);
    this.volumes.set(key, config.volume ?? 0.7);
    audio.src = src;
    audio.load();
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

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      logger.gameStatistics('Getting leaderboard', { limit });
      const leaderboard = await apiService.getLeaderboardEntries(limit);
      logger.gameStatistics('Leaderboard retrieved successfully', {
        entries: leaderboard.length,
      });
      return leaderboard;
    } catch (error) {
      logger.gameError('Failed to get leaderboard', { error: getErrorMessage(error), limit });
      throw error;
    }
  }

  async getGameById(gameId: string): Promise<GameHistoryEntry> {
    try {
      logger.gameStatistics('Getting game by ID', { id: gameId });
      const game = await apiService.getGameById(gameId);
      logger.gameStatistics('Game retrieved successfully', {
        id: gameId,
      });
      return game;
    } catch (error) {
      logger.gameError('Failed to get game by ID', { error: getErrorMessage(error), id: gameId });
      throw error;
    }
  }

  async deleteGameHistory(gameId: string): Promise<{ success: boolean; message: string }> {
    try {
      logger.gameStatistics('Deleting game history', { id: gameId });
      const response = await apiService.deleteGameHistory(gameId);
      logger.gameStatistics('Game history deleted successfully', { id: gameId });
      return response;
    } catch (error) {
      logger.gameError('Failed to delete game history', {
        error: getErrorMessage(error),
        id: gameId,
      });
      throw error;
    }
  }

  async clearGameHistory(): Promise<{ deletedCount: number }> {
    try {
      logger.gameStatistics('Clearing all game history');
      const response = await apiService.clearGameHistory();
      logger.gameStatistics('All game history cleared successfully', {
        deletedCount: response.deletedCount,
      });
      return response;
    } catch (error) {
      logger.gameError('Failed to clear game history', { error: getErrorMessage(error) });
      throw error;
    }
  }
}

export const gameHistoryService = new ClientGameHistoryService();
```

## שירות נקודות (Points Service)

### credits.service.ts

```typescript
import { GameMode, PaymentMethod, VALID_GAME_MODES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { CanPlayResponse, CreditBalance, CreditPurchaseOption, CreditTransaction } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import type { CreditsPurchaseRequest, CreditsPurchaseResponse } from '../types';
import { formatTimeUntilReset } from '../utils';
import { apiService } from './api.service';

class ClientCreditsService {
  async getCreditBalance(): Promise<CreditBalance> {
    try {
      logger.userInfo('Getting credit balance');
      const balance = await apiService.getCreditBalance();
      logger.userInfo('Credit balance retrieved successfully', {
        totalCredits: balance.totalCredits,
        purchasedCredits: balance.purchasedCredits,
      });
      return balance;
    } catch (error) {
      logger.userError('Failed to get credit balance', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async getCreditPackages(): Promise<CreditPurchaseOption[]> {
    try {
      logger.userInfo('Getting credit packages');
      const packages = await apiService.getCreditPackages();
      logger.userInfo('Credit packages retrieved successfully', {
        count: packages.length,
      });
      return packages;
    } catch (error) {
      logger.userError('Failed to get credit packages', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async canPlayCredits(totalQuestions: number): Promise<CanPlayResponse> {
    try {
      logger.userInfo('Checking if user can play', { totalQuestions });
      const result = await apiService.canPlayCredits(totalQuestions);
      logger.userInfo('Can play check completed', {
        canPlay: result.canPlay,
        reason: result.reason,
      });
      return {
        canPlay: result.canPlay,
        reason: result.reason,
      };
    } catch (error) {
      logger.userError('Failed to check if user can play', { error: getErrorMessage(error), totalQuestions });
      throw error;
    }
  }

  async deductCredits(totalQuestions: number, gameMode: GameMode): Promise<CreditBalance> {
    try {
      const normalizedGameMode = this.resolveGameMode(gameMode);
      logger.userInfo('Deducting credits', { totalQuestions, gameMode: normalizedGameMode });
      const newBalance = await apiService.deductCredits(totalQuestions, gameMode);
      logger.userInfo('Credits deducted successfully', {
        newTotalCredits: newBalance.totalCredits,
      });
      return newBalance;
    } catch (error) {
      logger.userError('Failed to deduct credits', { error: getErrorMessage(error), totalQuestions, gameMode });
      throw error;
    }
  }

  async purchaseCredits(request: CreditsPurchaseRequest): Promise<CreditsPurchaseResponse> {
    try {
      logger.userInfo('Purchasing credits', {
        packageId: request.packageId,
        paymentMethod: request.paymentMethod,
      });
      const response = await apiService.purchaseCredits(request);
      logger.userInfo('Credits purchased successfully', {
        amount: response.amount,
        totalCredits: response.balance?.totalCredits,
      });
      return response;
    } catch (error) {
      logger.userError('Failed to purchase credits', {
        error: getErrorMessage(error),
        request,
      });
      throw error;
    }
  }

  async getCreditHistory(limit: number = 20): Promise<CreditTransaction[]> {
    try {
      logger.userInfo('Getting credit history', { limit });
      const history = await apiService.getCreditHistory(limit);
      logger.userInfo('Credit history retrieved successfully', {
        count: history.length,
      });
      return history;
    } catch (error) {
      logger.userError('Failed to get credit history', { error: getErrorMessage(error), limit });
      throw error;
    }
  }

  async confirmCreditPurchase(paymentIntentId: string): Promise<CreditBalance> {
    try {
      logger.userInfo('Confirming credit purchase', { id: paymentIntentId });
      const newBalance = await apiService.confirmCreditPurchase(paymentIntentId);
      logger.userInfo('Credit purchase confirmed successfully', {
        newCredits: newBalance.totalCredits,
      });
      return newBalance;
    } catch (error) {
      logger.userError('Failed to confirm credit purchase', { error: getErrorMessage(error), id: paymentIntentId });
      throw error;
    }
  }

  async getCreditTransactionHistory(limit: number = 20): Promise<CreditTransaction[]> {
    return this.getCreditHistory(limit);
  }

  formatTimeUntilReset(resetTime: Date): string {
    return formatTimeUntilReset(resetTime.getTime());
  }

  private resolveGameMode(gameMode: GameMode): GameMode | undefined {
    return VALID_GAME_MODES.find(mode => mode === gameMode);
  }
}

export const creditsService = new ClientCreditsService();
```

## שירות משתמש (User Service)

### user.service.ts

```typescript
import { BillingCycle, PlanType } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type {
  BasicUser,
  BasicValue,
  UpdateUserProfileData,
  User,
  UserPreferences,
  UserProfileResponseType,
} from '@shared/types';
import { getErrorMessage, hasPropertyOfType } from '@shared/utils';

import type { SubscriptionCreationResponse } from '../types';
import { apiService } from './api.service';

class ClientUserService {
  async getUserProfile(): Promise<UserProfileResponseType> {
    try {
      logger.userInfo('Getting user profile');
      const profileResponse = await apiService.getUserProfile();
      logger.userInfo('User profile retrieved successfully');
      return profileResponse;
    } catch (error) {
      logger.userError('Failed to get user profile', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponseType> {
    try {
      logger.userInfo('Updating user profile', { data });
      const profileResponse = await apiService.updateUserProfile(data);
      logger.userInfo('User profile updated successfully');
      return profileResponse;
    } catch (error) {
      logger.userError('Failed to update user profile', { error: getErrorMessage(error), data });
      throw error;
    }
  }

  async deductCredits(amount: number): Promise<{ success: boolean; credits: number }> {
    try {
      logger.userInfo('Deducting user credits', { amount });
      const result = await apiService.deductCredits(amount);
      logger.userInfo('User credits deducted successfully', {
        amount,
        newCredits: result.credits,
      });
      return result;
    } catch (error) {
      logger.userError('Failed to deduct user credits', { error: getErrorMessage(error), amount });
      throw error;
    }
  }

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    try {
      logger.userInfo('Deleting user account');
      const response = await apiService.deleteUserAccount();
      logger.userInfo('User account deleted successfully', {
        success: response.success,
        message: response.message,
      });
      return response;
    } catch (error) {
      logger.userError('Failed to delete user account', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async createSubscription(plan: PlanType, billingCycle?: BillingCycle): Promise<SubscriptionCreationResponse> {
    try {
      logger.userInfo('Creating subscription', { planType: plan, billingCycle });
      const response = await apiService.createSubscription(plan, billingCycle);
      const normalizedBillingCycle = Object.values(BillingCycle).find(cycle => cycle === response.billingCycle);
      const paymentId = hasPropertyOfType(response, 'paymentId', (value): value is string => typeof value === 'string')
        ? response.paymentId
        : undefined;

      const subscriptionPayload: SubscriptionCreationResponse = {
        subscriptionId: response.subscriptionId,
        planType: response.planType,
        billingCycle: normalizedBillingCycle,
        status: response.status,
        paymentId,
      };

      logger.userInfo('Subscription created successfully', {
        id: subscriptionPayload.subscriptionId ?? undefined,
        planType: subscriptionPayload.planType,
        billingCycle: subscriptionPayload.billingCycle,
      });
      return subscriptionPayload;
    } catch (error) {
      logger.userError('Failed to create subscription', {
        error: getErrorMessage(error),
        planType: plan,
        billingCycle,
      });
      throw error;
    }
  }

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    try {
      logger.userInfo('Canceling subscription');
      const response = await apiService.cancelSubscription();
      logger.userInfo('Subscription canceled successfully', {
        success: response.success,
        message: response.message,
      });
      return response;
    } catch (error) {
      logger.userError('Failed to cancel subscription', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<BasicUser[]> {
    try {
      logger.userInfo('Searching users', { query, limit });
      const users = await apiService.searchUsers(query, limit);
      logger.userInfo('Users found', { count: users.length });
      return users;
    } catch (error) {
      logger.userError('Failed to search users', { error: getErrorMessage(error), query });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<BasicUser> {
    try {
      logger.userInfo('Getting user by username', { username });
      const user = await apiService.getUserByUsername(username);
      logger.userInfo('User retrieved successfully', { username });
      return user;
    } catch (error) {
      logger.userError('Failed to get user by username', { error: getErrorMessage(error), username });
      throw error;
    }
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      logger.userInfo('Updating user preferences', { preferences });
      await apiService.updateUserPreferences(preferences);
      logger.userInfo('User preferences updated successfully');
    } catch (error) {
      logger.userError('Failed to update user preferences', { error: getErrorMessage(error), preferences });
      throw error;
    }
  }
}

export const userService = new ClientUserService();
```

## שירות תשלומים (Payment Service)

### payment.service.ts

```typescript
import { PaymentMethod, PlanType } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { PaymentResult } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService } from './api.service';

class ClientPaymentService {
  async createPayment(paymentData: {
    amount?: number;
    currency?: string;
    description?: string;
    planType?: PlanType;
    numberOfPayments?: number;
    paymentMethod: PaymentMethod;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardHolderName?: string;
    postalCode?: string;
    paypalOrderId?: string;
    paypalPaymentId?: string;
    agreeToTerms?: boolean;
    additionalInfo?: string;
  }): Promise<PaymentResult> {
    try {
      logger.userInfo('Creating payment', {
        amount: paymentData.amount,
        planType: paymentData.planType,
        paymentMethod: paymentData.paymentMethod,
      });

      const result = await apiService.createPayment(paymentData);

      logger.userInfo('Payment created successfully', {
        paymentId: result.paymentId,
        status: result.status,
      });
      return result;
    } catch (error) {
      logger.userError('Failed to create payment', {
        error: getErrorMessage(error),
        amount: paymentData.amount,
        planType: paymentData.planType,
      });
      throw error;
    }
  }

  async getPaymentHistory(): Promise<PaymentResult[]> {
    try {
      logger.userInfo('Getting payment history');

      const history = await apiService.getPaymentHistory();

      logger.userInfo('Payment history retrieved successfully', {
        count: history.length,
      });
      return history;
    } catch (error) {
      logger.userError('Failed to get payment history', { error: getErrorMessage(error) });
      throw error;
    }
  }
}

export const paymentService = new ClientPaymentService();
```

## שירות ניקוד (Score Service)

### score.service.ts

```typescript
import type { TriviaQuestion } from '@shared/types';
import { calculateAnswerPoints } from '@shared/utils';

/**
 * Calculate total score for a correct answer using ALGORITHM
 */
export const calculateScore = (
  question: TriviaQuestion,
  _totalTime: number,
  timeSpent: number,
  streak: number = 0,
  isCorrect: boolean = true
): number => {
  return calculateAnswerPoints(question.difficulty, timeSpent, streak, isCorrect);
};
```

## שירות קושי מותאם (Custom Difficulty Service)

### customDifficulty.service.ts

```typescript
import { isCustomDifficulty } from '@shared/validation';

import { CLIENT_STORAGE_KEYS } from '../constants';
import type { HistoryItem } from '../types';
import { storageService } from './storage.service';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isHistoryItemArray(value: unknown): value is HistoryItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        'topic' in item &&
        'difficulty' in item &&
        'score' in item &&
        'date' in item &&
        typeof item.topic === 'string' &&
        typeof item.difficulty === 'string' &&
        typeof item.score === 'number' &&
        typeof item.date === 'string'
    )
  );
}

class CustomDifficultyService {
  private readonly CUSTOM_DIFFICULTIES_KEY = CLIENT_STORAGE_KEYS.CUSTOM_DIFFICULTIES;
  private readonly HISTORY_KEY = CLIENT_STORAGE_KEYS.CUSTOM_DIFFICULTY_HISTORY;
  private readonly MAX_HISTORY_ITEMS = 50;

  async getCustomDifficulties(): Promise<string[]> {
    try {
      const result = await storageService.get<string[]>(this.CUSTOM_DIFFICULTIES_KEY, isStringArray);
      return result.success && result.data ? result.data : [];
    } catch {
      return [];
    }
  }

  async saveCustomDifficulty(difficulty: string): Promise<void> {
    try {
      const difficulties = await this.getCustomDifficulties();
      if (!difficulties.includes(difficulty)) {
        difficulties.push(difficulty);
        await storageService.set(this.CUSTOM_DIFFICULTIES_KEY, difficulties);
      }
    } catch (error) {
      throw new Error(`Failed to save custom difficulty: ${error}`);
    }
  }

  async deleteCustomDifficulty(difficulty: string): Promise<void> {
    try {
      const difficulties = await this.getCustomDifficulties();
      const filtered = difficulties.filter(d => d !== difficulty);
      await storageService.set(this.CUSTOM_DIFFICULTIES_KEY, filtered);
    } catch (error) {
      throw new Error(`Failed to delete custom difficulty: ${error}`);
    }
  }

  async getHistory(): Promise<HistoryItem[]> {
    try {
      const result = await storageService.get<HistoryItem[]>(this.HISTORY_KEY, isHistoryItemArray);
      return result.success && result.data ? result.data : [];
    } catch {
      return [];
    }
  }

  async addToHistory(topic: string, difficulty: string, score: number = 0): Promise<void> {
    try {
      if (!isCustomDifficulty(difficulty)) {
        return;
      }

      const history = await this.getHistory();
      const timestamp = Date.now();

      const existingIndex = history.findIndex(item => item.topic === topic && item.difficulty === difficulty);

      if (existingIndex !== -1) {
        const updated = [...history];
        updated[existingIndex] = {
          ...updated[existingIndex],
          score: Math.max(updated[existingIndex].score, score),
          date: new Date(timestamp).toISOString(),
          timestamp,
        };

        const [updatedItem] = updated.splice(existingIndex, 1);
        const reordered = [updatedItem, ...updated];
        const limited = reordered.slice(0, this.MAX_HISTORY_ITEMS);
        await storageService.set(this.HISTORY_KEY, limited);
      } else {
        const newItem: HistoryItem = {
          topic,
          difficulty,
          score,
          date: new Date(timestamp).toISOString(),
          timestamp,
        };

        const updated = [newItem, ...history];
        const limited = updated.slice(0, this.MAX_HISTORY_ITEMS);
        await storageService.set(this.HISTORY_KEY, limited);
      }
    } catch (error) {
      throw new Error(`Failed to add to history: ${error}`);
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await storageService.set(this.HISTORY_KEY, []);
    } catch (error) {
      throw new Error(`Failed to clear history: ${error}`);
    }
  }
}

export const customDifficultyService = new CustomDifficultyService();
```

## שירות Multiplayer (Multiplayer Service)

### multiplayer.service.ts

```typescript
import { io, Socket } from 'socket.io-client';

import { clientLogger as logger } from '@shared/services';
import type {
  AnswerReceivedEvent,
  GameEndedEvent,
  GameStartedEvent,
  LeaderboardUpdateEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  QuestionEndedEvent,
  QuestionStartedEvent,
  RoomUpdatedEvent,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { ApiConfig } from './api.service';

class MultiplayerService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl = ApiConfig.getBaseUrl();
    const wsProtocol = serverUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = serverUrl.replace(/^https?:\/\//, '').split('/')[0];

    this.socket = io(`${wsProtocol}://${wsUrl}/multiplayer`, {
      auth: {
        token,
      },
      query: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.gameInfo('Connected to multiplayer server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', reason => {
      logger.gameError('Disconnected from multiplayer server', {
        reason,
      });
    });

    this.socket.on('connect_error', error => {
      logger.gameError('Failed to connect to multiplayer server', {
        error: getErrorMessage(error),
      });
      this.reconnectAttempts++;
    });

    this.socket.on('error', (error: { message: string }) => {
      logger.gameError('Multiplayer server error', {
        error: error.message,
      });
    });
  }

  emit(event: string, data: unknown): void {
    if (!this.socket?.connected) {
      logger.gameError('Cannot emit event - not connected', { eventName: event });
      return;
    }
    this.socket.emit(event, data);
  }

  on<T = unknown>(event: string, callback: (data: T) => void): void {
    if (!this.socket) {
      logger.gameError('Cannot listen to event - socket not initialized', { eventName: event });
      return;
    }
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: unknown) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  createRoom(config: {
    topic: string;
    difficulty: string;
    requestedQuestions: number;
    maxPlayers: number;
    gameMode: string;
  }): void {
    this.emit('create-room', config);
  }

  joinRoom(roomId: string): void {
    this.emit('join-room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.emit('leave-room', { roomId });
  }

  startGame(roomId: string): void {
    this.emit('start-game', { roomId });
  }

  submitAnswer(roomId: string, questionId: string, answer: number, timeSpent: number): void {
    this.emit('submit-answer', {
      roomId,
      questionId,
      answer,
      timeSpent,
    });
  }

  onRoomCreated(callback: (data: { room: unknown; code: string }) => void): void {
    this.on('room-created', callback);
  }

  onRoomJoined(callback: (data: { room: unknown }) => void): void {
    this.on('room-joined', callback);
  }

  onRoomLeft(callback: (data: { roomId: string }) => void): void {
    this.on('room-left', callback);
  }

  onPlayerJoined(callback: (event: PlayerJoinedEvent) => void): void {
    this.on<PlayerJoinedEvent>('player-joined', callback);
  }

  onPlayerLeft(callback: (event: PlayerLeftEvent) => void): void {
    this.on<PlayerLeftEvent>('player-left', callback);
  }

  onGameStarted(callback: (event: GameStartedEvent) => void): void {
    this.on<GameStartedEvent>('game-started', callback);
  }

  onQuestionStarted(callback: (event: QuestionStartedEvent) => void): void {
    this.on<QuestionStartedEvent>('question-started', callback);
  }

  onAnswerReceived(callback: (event: AnswerReceivedEvent) => void): void {
    this.on<AnswerReceivedEvent>('answer-received', callback);
  }

  onQuestionEnded(callback: (event: QuestionEndedEvent) => void): void {
    this.on<QuestionEndedEvent>('question-ended', callback);
  }

  onGameEnded(callback: (event: GameEndedEvent) => void): void {
    this.on<GameEndedEvent>('game-ended', callback);
  }

  onLeaderboardUpdate(callback: (event: LeaderboardUpdateEvent) => void): void {
    this.on<LeaderboardUpdateEvent>('leaderboard-update', callback);
  }

  onRoomUpdated(callback: (event: RoomUpdatedEvent) => void): void {
    this.on<RoomUpdatedEvent>('room-updated', callback);
  }

  onError(callback: (error: { message: string }) => void): void {
    this.on<{ message: string }>('error', callback);
  }
}

export const multiplayerService = new MultiplayerService();
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
