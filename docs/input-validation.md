# Input Validation System

## Overview

EveryTriv implements a comprehensive input validation system to ensure data quality, security, and user experience. This document outlines our approach to input validation across both client and server.

## Technologies

### Primary Validation Service
We use **LanguageTool API** (`https://api.languagetool.org/v2/check`) for advanced text validation due to:
- Comprehensive language checking
- Grammar and spelling validation
- Multilingual support
- Rich error information
- Free API tier for basic usage

### Validation Architecture

#### Client-Side Validation
- Located in `shared/services/inputValidation.ts`
- Performs real-time validation with debouncing
- Provides visual feedback and suggestions
- Falls back gracefully when the service is unavailable

#### Server-Side Validation
- Located in `src/common/validation/`
- Implements the same validation logic with additional security checks
- Uses Redis caching to reduce redundant API calls
- Handles batch validation requests efficiently

## Implementation Details

### Client Validation Flow

1. User input is captured
2. Input is sent to `validateInput()` function
3. Request is made to LanguageTool API
4. Response is parsed into standardized `ValidationResult`
5. UI is updated with validation feedback
6. Invalid submissions are prevented

### Server Validation Flow

1. Request data is received
2. Cache is checked for existing validation result
3. If not cached, external validation is performed
4. Results are cached for future requests
5. Invalid inputs are rejected with specific error messages
6. Validation results are returned to the client

## Response Format

The standardized `ValidationResult` interface:

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    message: string;
    suggestion?: string;
    position: {
      start: number;
      end: number;
    };
  }>;
}
```

## Caching Strategy

- Cache key: Base64-encoded input text
- TTL: 1 hour for typical inputs
- Smart invalidation for common patterns
- Redis used for distributed caching

## Error Handling

### Graceful Degradation
If the validation service is unavailable:
1. Client falls back to basic validation
2. Server logs the failure
3. Requests are still processed with a warning flag
4. Admin is notified of service disruption

### Error Visualization
Validation errors are displayed with:
- Highlighted problematic text
- Specific error messages
- Actionable suggestions
- Non-blocking UI when possible

## Performance Considerations

- Debounce user input (350ms delay)
- Batch validation for multiple fields
- Caching for repeated validations
- Progressive loading indicators

## Custom Validators

In addition to the LanguageTool API, we implement custom validators for:
- Trivia question limits (3, 4, or 5 only)
- Custom difficulty descriptions
- Topic names
- User profile information

## Security Aspects

The validation system helps protect against:
- Injection attacks
- Malicious inputs
- Spam content
- Excessive API usage

## Future Enhancements

- Add support for additional languages
- Implement ML-based content filtering
- Create offline validation capabilities
- Develop domain-specific validation rules

## Configuration

Service configuration parameters are stored in:
- `.env` files for API keys
- `constants/app.constants.ts` for limits and thresholds
- Redis config for caching behavior

## Monitoring and Metrics

The validation system tracks:
- Validation request volume
- Error rates by type
- API latency
- Cache hit/miss ratio
- Validation bypass attempts
