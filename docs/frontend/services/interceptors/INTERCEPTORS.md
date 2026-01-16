# Interceptors - Frontend

תיעוד מערכת ה-Interceptors ב-Frontend, המספקת מנגנון לניהול בקשות HTTP, תגובות ושגיאות.

לקשר לדיאגרמות:
- [דיאגרמת Services מלאה (Client)](../../../DIAGRAMS.md#דיאגרמת-services-מלאה-client)
- [דיאגרמת מבנה Frontend](../../../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

## מבנה תיקיית Interceptors

```
client/src/services/infrastructure/interceptors/
├── interceptors.ts    # כל ה-interceptor managers ו-auth interceptor
└── index.ts           # ייצוא מאוחד
```

## BaseInterceptorManager

### interceptors.ts (BaseInterceptorManager)

Abstract class בסיסי המספק פונקציונליות משותפת לכל ה-interceptor managers.

**Type Parameters:**
- `TInterceptor` - סוג הפונקציה של ה-interceptor
- `TInput` - סוג הקלט לביצוע ה-interceptor
- `TOutput` - סוג הפלט מביצוע ה-interceptor (default: `TInput`)

**Methods:**

#### `use(interceptor: TInterceptor, options?: InterceptorOptions): string`
רישום interceptor חדש:
```typescript
const id = manager.use(myInterceptor, { priority: 0, enabled: true });
```

**Options:**
- `priority: number` - עדיפות (נמוך יותר = ביצוע מוקדם יותר, default: 0)
- `enabled: boolean` - האם ה-interceptor פעיל (default: true)

**Returns:** מזהה ייחודי להסרה

#### `eject(id: string): boolean`
הסרת interceptor לפי מזהה:
```typescript
const removed = manager.eject('req_1234567890_abc123');
```

**Returns:** `true` אם הוסר, `false` אם לא נמצא

#### `clear(): void`
ניקוי כל ה-interceptors:
```typescript
manager.clear();
```

#### `execute(input: TInput): Promise<TOutput>`
ביצוע כל ה-interceptors הרשומים:
```typescript
const result = await manager.execute(config);
```

**Behavior:**
- ביצוע לפי סדר עדיפות (נמוך יותר = מוקדם יותר)
- דילוג על interceptors מושבתים (`enabled: false`)
- טיפול בשגיאות: Error interceptors ממשיכים עם השגיאה, אחרים זורקים

#### `getCount(): number`
קבלת מספר ה-interceptors הרשומים:
```typescript
const count = manager.getCount();
```

**Abstract Methods:**

#### `getIdPrefix(): string`
מחזיר את הקידומת למזהה ה-interceptor (לדוגמה: `'req'`, `'res'`, `'err'`)

#### `executeInterceptor(interceptor: TInterceptor, input: TInput): Promise<TOutput>`
ביצוע interceptor בודד

#### `errorContext: string` (readonly property)
שם ההקשר לשגיאות (לדוגמה: `'Request'`, `'Response'`, `'Error'`)

**Error Handling:**

הטיפול בשגיאות מבוסס על `errorContext` property:
- אם `errorContext === 'Error'` - ממשיך עם השגיאה המקורית (לא זורק)
- אחרת - זורק שגיאה

## RequestInterceptorManager

### request.interceptor.ts

מנהל interceptors לבקשות HTTP (לפני שליחה לשרת).

**Extends:** `BaseInterceptorManager<RequestInterceptor, EnhancedRequestConfig, EnhancedRequestConfig>`

**ID Prefix:** `'req'`

**Usage:**
```typescript
import { RequestInterceptorManager } from './interceptors';

const requestManager = new RequestInterceptorManager();

// רישום interceptor
const id = requestManager.use(async (config) => {
  config.headers['X-Custom-Header'] = 'value';
  return config;
}, { priority: 0 });

// ביצוע interceptors
const interceptedConfig = await requestManager.execute(config);

// הסרה
requestManager.eject(id);
```

**Interceptor Type:**
```typescript
type RequestInterceptor = (
  config: EnhancedRequestConfig
) => Promise<EnhancedRequestConfig> | EnhancedRequestConfig;
```

## ResponseInterceptorManager

### interceptors.ts (ResponseInterceptorManager)

מנהל interceptors לתגובות HTTP (אחרי קבלת response מהשרת).

**Extends:** `BaseInterceptorManager<ResponseInterceptor, ApiResponse<unknown>, ApiResponse<unknown>>`

**ID Prefix:** `'res'`

**Methods:**

#### `execute<T>(response: ApiResponse<T>): Promise<ApiResponse<T>>`
ביצוע interceptors על תגובה:
```typescript
const interceptedResponse = await responseManager.execute(response);
```

**Usage:**
```typescript
import { ResponseInterceptorManager } from './interceptors';

const responseManager = new ResponseInterceptorManager();

// רישום interceptor
const id = responseManager.use(async (response) => {
  // עיבוד response
  return response;
}, { priority: 0 });

// ביצוע interceptors (עם generic type)
const interceptedResponse = await responseManager.execute<MyType>(response);
```

**Interceptor Type:**
```typescript
type ResponseInterceptor = <T>(
  response: ApiResponse<T>
) => Promise<ApiResponse<T>> | ApiResponse<T>;
```

## ErrorInterceptorManager

### error.interceptor.ts

מנהל interceptors לשגיאות HTTP.

**Extends:** `BaseInterceptorManager<ErrorInterceptor, ApiError, ApiError>`

**ID Prefix:** `'err'`

**Error Handling:** `errorContext = 'Error'`, ולכן לא זורק שגיאות אלא ממשיך עם השגיאה המקורית

**Usage:**
```typescript
import { ErrorInterceptorManager } from './interceptors';

const errorManager = new ErrorInterceptorManager();

// רישום interceptor
const id = errorManager.use(async (error) => {
  // טיפול בשגיאה (לוג, נוטיפיקציה, וכו')
  console.error('API Error:', error);
  return error;
}, { priority: 0 });

// ביצוע interceptors
const processedError = await errorManager.execute(error);
```

**Interceptor Type:**
```typescript
type ErrorInterceptor = (
  error: ApiError
) => Promise<ApiError> | ApiError;
```

## authRequestInterceptor

### interceptors.ts (authRequestInterceptor)

Interceptor פונקציונלי (לא class) המוסיף את ה-Authorization header לבקשות HTTP.

**Type:** `RequestInterceptor`

**Priority:** `0` (highest - ביצוע ראשון)

**Features:**
- מוסיף `Authorization: Bearer {token}` header
- משתמש ב-`STORAGE_KEYS.AUTH_TOKEN` לאחסון הטוקן
- תומך ב-`skipAuth` flag לדילוג על אימות

**Usage:**
```typescript
import { authRequestInterceptor } from './interceptors';

// רישום ב-RequestInterceptorManager
requestManager.use(authRequestInterceptor, { priority: 0 });

// או שימוש ישיר
const config = await authRequestInterceptor({
  method: 'GET',
  url: '/api/user',
  headers: {},
});
```

**Implementation:**
```typescript
export const authRequestInterceptor: RequestInterceptor = async (
  config: EnhancedRequestConfig
): Promise<EnhancedRequestConfig> => {
  // Skip auth if explicitly requested
  if (config.skipAuth) {
    return config;
  }

  // Get auth token from storage
  const tokenResult = await storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
  const token = tokenResult.success ? tokenResult.data : null;

  // Add Authorization header if token exists
  if (token) {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }

  return config;
};
```

**Configuration:**
- **skipAuth:** אם `true`, ה-interceptor לא מוסיף את ה-Authorization header
- **Token Source:** `STORAGE_KEYS.AUTH_TOKEN` מ-localStorage

## שימוש ב-API Service

ה-interceptors משולבים ב-`ApiService`:

```typescript
class ApiService {
  private requestInterceptors: RequestInterceptorManager;
  private responseInterceptors: ResponseInterceptorManager;
  private errorInterceptors: ErrorInterceptorManager;

  constructor() {
    this.requestInterceptors = new RequestInterceptorManager();
    this.responseInterceptors = new ResponseInterceptorManager();
    this.errorInterceptors = new ErrorInterceptorManager();

    // רישום auth interceptor עם עדיפות גבוהה
    this.requestInterceptors.use(authRequestInterceptor, { priority: 0 });
  }

  private async executeRequestInternal<T>(...): Promise<ApiResponse<T>> {
    // Execute request interceptors (auth headers are added by authRequestInterceptor)
    const interceptedConfig = await this.requestInterceptors.execute(enhancedConfig);

    // ... שליחת בקשה עם fetch ...

    // Parse response and execute response interceptors
    const apiResponse = await this.parseResponse<T>(response);
    const interceptedResponse = await this.responseInterceptors.execute(apiResponse);

    // ... טיפול בשגיאות ...
    // Execute error interceptors
    const apiError: ApiError = { ... };
    await this.errorInterceptors.execute(apiError);
  }
}
```

## עקרונות עיצוב

### 1. Priority System
- עדיפות נמוכה יותר = ביצוע מוקדם יותר
- `authRequestInterceptor` עם `priority: 0` (ביצוע ראשון)
- ניתן להוסיף interceptors נוספים עם עדיפויות שונות

### 2. Error Handling
- Request/Response interceptors זורקים שגיאות
- Error interceptors ממשיכים עם השגיאה המקורית (לא זורקים)

### 3. Type Safety
- כל interceptor manager מוגדר עם types מפורשים
- TypeScript type checking מלא

### 4. Extensibility
- קל להוסיף interceptors חדשים
- כל interceptor הוא פונקציה עצמאית
- ניהול lifecycle מלא (רישום, הסרה, ניקוי)

## דוגמאות שימוש

### הוספת Custom Header
```typescript
const customHeaderInterceptor: RequestInterceptor = async (config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Request-ID': generateRequestId(),
    },
  };
};

requestManager.use(customHeaderInterceptor, { priority: 1 });
```

### לוגינג Responses
```typescript
const loggingInterceptor: ResponseInterceptor = async (response) => {
  logger.apiInfo('API Response', {
    status: response.status,
    url: response.url,
  });
  return response;
};

responseManager.use(loggingInterceptor, { priority: 0 });
```

### טיפול בשגיאות
```typescript
const errorNotificationInterceptor: ErrorInterceptor = async (error) => {
  if (error.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  }
  return error;
};

errorManager.use(errorNotificationInterceptor, { priority: 0 });
```

## קישורים רלוונטיים

- [Services - Frontend](../SERVICES.md)
- [Types - Frontend](../../TYPES.md)
- [דיאגרמות](../../../DIAGRAMS.md#דיאגרמת-services-מלאה-client)

