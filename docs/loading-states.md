# Loading States in EveryTriv

This document outlines the loading state patterns used throughout the EveryTriv application, explaining the implementation details and best practices to follow when working with asynchronous operations.

## Table of Contents

1. [Overview](#overview)
2. [Loading State Patterns](#loading-state-patterns)
3. [Implementation in Redux](#implementation-in-redux)
4. [Component-Level Loading States](#component-level-loading-states)
5. [UI Components for Loading](#ui-components-for-loading)
6. [Best Practices](#best-practices)

## Overview

EveryTriv implements a consistent approach to handling loading states throughout the application to provide a smooth user experience during asynchronous operations. This includes:

- Redux state management for global loading states
- Component-level loading states for localized UI feedback
- Standardized UI components to represent loading states

## Loading State Patterns

### Boolean Flag Pattern

The simplest pattern used throughout the application is a boolean flag:

```typescript
interface State {
  loading: boolean;
  data: Data | null;
  error: string;
}
```

### Discriminated Union Pattern

For more complex loading states, we use a discriminated union type:

```typescript
type LoadingState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
```

## Implementation in Redux

Each Redux slice in the application follows a consistent pattern for managing loading states:

### 1. State Structure

```typescript
interface SliceState {
  data: DataType | null;
  loading: boolean;
  error: string;
}
```

### 2. Action Creators

```typescript
// Example from statsSlice.ts
setLoading: (state, action: PayloadAction<boolean>) => {
  state.loading = action.payload;
},
setError: (state, action: PayloadAction<string>) => {
  state.error = action.payload;
  state.loading = false;
},
setData: (state, action: PayloadAction<DataType>) => {
  state.data = action.payload;
  state.loading = false;
  state.error = '';
}
```

### 3. Thunk Example

While not shown in the examined code, async thunks follow this pattern:

```typescript
export const fetchData = createAsyncThunk(
  'slice/fetchData',
  async (params, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await apiService.getData(params);
      dispatch(setData(response));
      return response;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  }
);
```

## Component-Level Loading States

Components handle loading states in the following ways:

### 1. Consuming Redux Loading States

```tsx
// Example from a component
const loading = useAppSelector((state) => state.game.loading);

// In the render method
return (
  <div>
    {loading ? (
      <LoadingSpinner />
    ) : (
      <ContentComponent data={data} />
    )}
  </div>
);
```

### 2. Local Loading States

```tsx
// Example from UserProfile.tsx
const [loading, setLoading] = useState(false);

const handleSave = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await apiService.saveData();
    // Success handling
  } catch (err) {
    // Error handling
  } finally {
    setLoading(false);
  }
};

// In the render method
return (
  <Button 
    type="submit"
    isLoading={loading}
    disabled={loading}
  >
    {loading ? 'Saving...' : 'Save Profile'}
  </Button>
);
```

## UI Components for Loading

The application includes several loading state UI components:

### 1. Button with Loading State

```tsx
// Button component with loading state
<Button
  type="submit"
  variant="primary"
  isLoading={loading}
  disabled={loading}
>
  {loading ? 'Saving...' : 'Save Profile'}
</Button>
```

### 2. Loading Overlay

For full-page or section loading:

```tsx
{loading && (
  <motion.div
    className="absolute inset-0 bg-black/50 flex items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <LoadingSpinner size="lg" />
  </motion.div>
)}
```

## Best Practices

When working with loading states in EveryTriv, follow these best practices:

1. **Consistent Pattern**: Use the established patterns for loading state management.
2. **Visual Feedback**: Always provide visual feedback during asynchronous operations.
3. **Disable Interactions**: Prevent user interactions during loading to avoid double submissions.
4. **Error Handling**: Always couple loading states with proper error handling.
5. **Clean Up**: Reset loading states in finally blocks or useEffect cleanup functions.
6. **Timeouts**: Consider adding timeouts for operations that might take too long.
7. **Skeleton Loading**: For content-heavy components, use skeleton loading instead of spinners when appropriate.

### Example: Complete Loading State Pattern

```tsx
const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleAction = async () => {
    setLoading(true);
    setError('');
    
    try {
      await someAsyncOperation();
      // Handle success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {error && <ErrorMessage message={error} />}
      <Button 
        onClick={handleAction}
        isLoading={loading}
        disabled={loading}
      >
        Perform Action
      </Button>
    </div>
  );
};
```
