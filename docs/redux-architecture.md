# Redux Architecture in EveryTriv

This document outlines the Redux architecture used in the EveryTriv application, including slice organization, state management patterns, and best practices for working with Redux.

## Table of Contents

1. [Overview](#overview)
2. [Store Configuration](#store-configuration)
3. [Redux Slices](#redux-slices)
4. [Selectors and Hooks](#selectors-and-hooks)
5. [Async Operations](#async-operations)
6. [State Persistence](#state-persistence)
7. [Best Practices](#best-practices)

## Overview

EveryTriv uses Redux Toolkit for state management, organizing application state into domain-specific slices. The Redux architecture follows a modular approach with typed state, actions, and selectors to ensure type safety and maintainability.

## Store Configuration

The Redux store is configured in `src/redux/store.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './features/gameSlice';
import statsReducer from './features/statsSlice';
import favoritesReducer from './features/favoritesSlice';
import userReducer from './features/userSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    stats: statsReducer,
    favorites: favoritesReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['stats/setStats'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt', 'payload.lastPlayed'],
        // Ignore these paths in the state
        ignoredPaths: [
          'stats.stats.lastPlayed',
          'user.user.createdAt',
          'user.user.updatedAt',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Redux Slices

The application state is divided into four main slices:

### 1. Game Slice (`gameSlice.ts`)

Manages the current game state, including trivia questions, user selections, and game statistics.

```typescript
// Key state structure
interface GameState {
  favorites: Array<{topic: string, difficulty: string}>;
  trivia: TriviaQuestion | null;
  loading: boolean;
  error: string;
  score: number;
  total: number;
  selected: number | null;
  stats: {
    topicsPlayed: Record<string, number>;
    successRateByDifficulty: Record<string, { correct: number, total: number }>;
  };
  streak: number;
}
```

**Key Actions:**
- `setLoading` - Updates loading state
- `setError` - Sets error message
- `setTrivia` - Sets current trivia question
- `setSelected` - Sets selected answer
- `updateScore` - Updates score with complex calculations
- `addFavorite` - Adds a favorite topic
- `removeFavorite` - Removes a favorite topic
- `resetGame` - Resets game state

### 2. Stats Slice (`statsSlice.ts`)

Manages user statistics and achievements.

```typescript
// Key state structure
interface StatsState {
  stats: UserStats | null;
  achievements: Achievement[];
  loading: boolean;
  error: string;
}
```

**Key Actions:**
- `setLoading` - Updates loading state
- `setError` - Sets error message
- `setStats` - Sets user statistics
- `setAchievements` - Sets user achievements
- `addAchievement` - Adds a new achievement
- `updateTopicStats` - Updates topic-specific statistics
- `updateDifficultyStats` - Updates difficulty-specific statistics
- `resetStats` - Resets statistics

### 3. Favorites Slice (`favoritesSlice.ts`)

Manages user favorites and recently used items.

```typescript
// Key state structure
interface FavoritesState {
  items: FavoriteItem[];
  recentlyUsed: FavoriteItem[];
  loading: boolean;
  error: string;
}
```

**Key Actions:**
- `setLoading` - Updates loading state
- `setError` - Sets error message
- `setFavorites` - Sets favorite items
- `addFavorite` - Adds a favorite item
- `removeFavorite` - Removes a favorite item
- `incrementUsage` - Increments usage count for an item
- `clearRecentlyUsed` - Clears recently used items
- `resetFavorites` - Resets favorites state

### 4. User Slice (`userSlice.ts`)

Manages user information and preferences.

```typescript
// Key state structure
interface UserState {
  user: User | null;
  loading: boolean;
  error: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
}
```

**Key Actions:**
- `setLoading` - Updates loading state
- `setError` - Sets error message
- `setUser` - Sets user information
- `updateScore` - Updates user score
- `updateAvatar` - Updates user avatar
- `setTheme` - Sets theme preference
- `setLanguage` - Sets language preference
- `setNotifications` - Sets notification preference
- `logout` - Logs out user

## Selectors and Hooks

The application provides typed hooks for accessing Redux state and dispatch:

```typescript
// src/redux/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Usage in Components

```typescript
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setUser } from '../../redux/features/userSlice';

function UserComponent() {
  const user = useAppSelector((state) => state.user.user);
  const dispatch = useAppDispatch();
  
  const updateUser = (userData) => {
    dispatch(setUser(userData));
  };
  
  // Component implementation
}
```

## Async Operations

Async operations typically follow this pattern:

1. Set loading state
2. Try to perform operation
3. Set success state or error state
4. Reset loading state

Example in a component:

```typescript
const handleSave = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess(false);
  try {
    await axios.post('/user/profile', { userId, username, avatar });
    setSuccess(true);
  } catch (err: unknown) {
    setError('Failed to save profile');
  } finally {
    setLoading(false);
  }
};
```

## State Persistence

The application uses a combination of:

1. Redux store for in-memory state
2. localStorage for client persistence
3. API calls to sync with server state

The user ID is retrieved or created using:

```typescript
const [userId] = useState(() => getOrCreateUserId());
```

## Best Practices

When working with Redux in EveryTriv, follow these best practices:

1. **Use Typed Selectors**: Always use the typed `useAppSelector` hook to ensure type safety.

2. **Normalize Complex Data**: For related data structures, consider normalizing data using IDs.

3. **Keep Components Pure**: Components should focus on presentation, with Redux handling state logic.

4. **Avoid Nested State**: Prefer flat state structures when possible.

5. **Consistent State Structure**: All slices follow the `data`, `loading`, `error` pattern for consistency.

6. **Use Middleware Appropriately**: Configure middleware carefully, especially for serialization issues.

7. **Handle Loading States**: Always show loading indicators during async operations.

8. **Error Handling**: Always handle and display errors appropriately.

9. **Reset States**: Clean up state when components unmount or users log out.

10. **Selective Updates**: Only update the specific parts of state that need to change.

### Example: Component with Redux Integration

```tsx
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setUser, updateScore } from '../../redux/features/userSlice';

const UserDashboard = () => {
  const user = useAppSelector((state) => state.user.user);
  const loading = useAppSelector((state) => state.user.loading);
  const error = useAppSelector((state) => state.user.error);
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // Fetch user data on component mount
    const fetchUser = async () => {
      try {
        const userData = await apiService.getUserData();
        dispatch(setUser(userData));
      } catch (err) {
        // Error handling
      }
    };
    
    fetchUser();
  }, [dispatch]);
  
  return (
    <div>
      {loading && <LoadingIndicator />}
      {error && <ErrorMessage message={error} />}
      {user && <UserInfo user={user} />}
    </div>
  );
};
```
