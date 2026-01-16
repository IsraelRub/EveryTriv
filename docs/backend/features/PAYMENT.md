# Payment Module - EveryTriv

## סקירה כללית

מודול התשלומים מספק את כל הפונקציונליות הקשורה לעיבוד תשלומים, כולל תשלומים בכרטיס אשראי, PayPal, תשלומים ידניים, והיסטוריית תשלומים.

לקשר לדיאגרמות: [דיאגרמת זרימת תשלומים](../../DIAGRAMS.md#דיאגרמת-זרימת-תשלומים)

## אחריות
- טיפול בטרנזקציות תשלום (Manual Credit, PayPal)
- אימות סכומים
- ניהול תוצאה (Success/Failure/Pending)
- היסטוריית תשלומים
- תמיכה ברכישת נקודות

## מבנה מודול

```
server/src/features/payment/
├── dtos/                       # Data Transfer Objects
│   ├── payment.dto.ts          # DTOs ליצירת תשלום
│   └── index.ts
├── webhooks/                   # PayPal Webhook Handlers
│   ├── paypalWebhook.controller.ts  # Webhook endpoint
│   ├── paypalWebhook.service.ts     # Webhook processing
│   └── index.ts
├── payment.controller.ts        # Controller
├── payment.service.ts          # Service
├── payment.module.ts           # Module
└── index.ts
```

## API Endpoints

### POST /payment/create

יצירת תשלום.

**Request Body:**
```typescript
{
  amount: number;                    // סכום התשלום
  currency?: string;                 // מטבע (ברירת מחדל: USD)
  description?: string;              // תיאור התשלום
  planType?: PlanType;               // סוג תוכנית (אם תשלום למנוי)
  numberOfPayments?: number;         // מספר תשלומים (ברירת מחדל: 1)
  paymentMethod: PaymentMethod;     // שיטת תשלום (MANUAL_CREDIT, PAYPAL)
  cardNumber?: string;               // מספר כרטיס (אם Manual Credit)
  expiryDate?: string;               // תאריך תפוגה MM/YY (אם Manual Credit)
  cvv?: string;                      // CVV (אם Manual Credit)
  cardHolderName?: string;           // שם בעל הכרטיס (אם Manual Credit)
  postalCode?: string;               // מיקוד (אם Manual Credit)
  paypalOrderId?: string;            // PayPal Order ID (אם PayPal)
  paypalPaymentId?: string;          // PayPal Payment ID (אם PayPal)
  additionalInfo?: string;           // מידע נוסף
}
```

**Response:**
```typescript
{
  paymentId?: string;                // מזהה תשלום
  transactionId: string;             // מזהה עסקה
  status: PaymentStatus;             // סטטוס (COMPLETED, PENDING, FAILED, REQUIRES_CAPTURE)
  message: string;                   // הודעת סטטוס
  amount: number;                    // סכום התשלום
  currency: string;                  // מטבע
  paymentMethod: PaymentMethod;     // שיטת תשלום
  clientAction?: string;             // פעולה נדרשת מהלקוח
  manualCaptureReference?: string;   // מזהה לכידת תשלום ידנית
  paypalOrderId?: string;            // PayPal Order ID
  metadata?: PaymentMetadata;        // מטא-דאטה
}
```

**דוגמת שימוש:**
```typescript
@Post('create')
async createPayment(@CurrentUserId() userId: string, @Body(PaymentDataPipe) paymentData: CreatePaymentDto) {
  const paymentDataForService: PaymentData = {
    amount: paymentData.amount,
    currency: paymentData.currency ?? 'USD',
    description: paymentData.description ?? 'EveryTriv payment',
    planType: paymentData.planType,
    numberOfPayments: paymentData.numberOfPayments ?? 1,
    metadata: {
      plan: paymentData.planType,
      paymentMethod: paymentData.paymentMethod,
    },
    method: paymentData.paymentMethod,
    manualPayment: paymentData.paymentMethod === PaymentMethod.MANUAL_CREDIT ? /* ... */ : undefined,
    paypalOrderId: paymentData.paypalOrderId,
    paypalPaymentId: paymentData.paypalPaymentId,
  };
  const result = await this.paymentService.processPayment(userId, paymentDataForService);
  return result;
}
```

### GET /payment/history

אחזור היסטוריית תשלומים של משתמש נוכחי.

**Response:**
```typescript
PaymentHistoryEntity[]
```

**דוגמת שימוש:**
```typescript
@Get('history')
@Cache(CACHE_DURATION.MEDIUM)
async getPaymentHistory(@CurrentUserId() userId: string) {
  const result = await this.paymentService.getPaymentHistory(userId);
  return result;
}
```

### POST /payment/webhooks/paypal

Webhook endpoint לטיפול בעדכוני סטטוס תשלום מ-PayPal.

**Headers:**
- `paypal-transmission-id` - PayPal transmission ID
- `paypal-transmission-sig` - PayPal transmission signature
- `paypal-transmission-time` - PayPal transmission time
- `paypal-cert-url` - PayPal certificate URL
- `paypal-auth-algo` - PayPal authentication algorithm

**Request Body:**
```typescript
PayPalWebhookEvent
```

**Response:**
```typescript
{
  status: 'success' | 'error';
  message?: string;
}
```

**Security:**
- Endpoint הוא public (לא דורש authentication)
- אימות signature מול PayPal API (חובה)
- Idempotency checks למניעת עיבוד כפול

## Service Methods

### PaymentService

```typescript
@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentHistoryEntity)
    private readonly paymentHistoryRepository: Repository<PaymentHistoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly validationService: ValidationService
  ) {}

  /**
   * Get credit purchase options
   */
  async getCreditPurchaseOptions(): Promise<CreditPurchaseOption[]> {
    return CREDIT_PURCHASE_PACKAGES.map(pkg => ({
      id: pkg.id,
      credits: pkg.credits,
      price: pkg.price,
      priceDisplay: pkg.priceDisplay,
      pricePerCredit: pkg.pricePerCredit,
    }));
  }

  /**
   * Process payment
   * Supports both standalone and transaction-based processing
   */
  async processPayment(userId: string, paymentData: PaymentData): Promise<PaymentResult> {
    return this.processPaymentInternal(null, userId, paymentData);
  }

  /**
   * Process payment with transaction support
   */
  async processPaymentWithTransaction(
    entityManager: EntityManager,
    userId: string,
    paymentData: PaymentData
  ): Promise<PaymentResult> {
    return this.processPaymentInternal(entityManager, userId, paymentData);
  }

  /**
   * Internal method that handles both standalone and transaction-based payment processing
   * - Normalizes amount from dollars to cents (e.g., 9.99 -> 999)
   * - Creates payment history record
   * - Processes payment based on method (MANUAL_CREDIT or PAYPAL)
   * - Invalidates cache on successful payment
   */
  private async processPaymentInternal(
    entityManager: EntityManager | null,
    userId: string,
    paymentData: PaymentData
  ): Promise<PaymentResult> {
    // Implementation details:
    // - Amount is normalized from dollars to cents (9.99 -> 999)
    // - originalAmount and originalCurrency stored in metadata only
    // - completedAt and failedAt are stored as separate columns (not in metadata)
    // - Cache is invalidated after successful payment
  }

  /**
   * Process payment by method
   */
  private async processPaymentByMethod(
    userId: string,
    paymentHistory: PaymentHistoryEntity,
    paymentData: PaymentData,
    normalizedAmount: number,
    currency: string,
    method: PaymentMethod
  ): Promise<PaymentResult> {
    switch (method) {
      case PaymentMethod.MANUAL_CREDIT:
        return this.processManualCreditPayment(paymentHistory, paymentData, normalizedAmount, currency);
      case PaymentMethod.PAYPAL:
        return this.processPayPalPayment(paymentHistory, paymentData, normalizedAmount, currency);
      default:
        throw createValidationError('payment method', 'string');
    }
  }

  /**
   * Process manual credit payment
   */
  private processManualCreditPayment(
    paymentHistory: PaymentHistoryEntity,
    paymentData: PaymentData,
    normalizedAmount: number,
    currency: string
  ): PaymentResult {
    const manualDetails = paymentData.manualPayment;
    
    if (!manualDetails || !manualDetails.cardNumber) {
      // Payment recorded, requires manual capture
      paymentHistory.status = PaymentStatus.REQUIRES_CAPTURE;
      paymentHistory.metadata = {
        ...paymentHistory.metadata,
        manualCaptureReference: paymentHistory.transactionId,
      };

      return {
        paymentId: paymentHistory.transactionId,
        transactionId: paymentHistory.transactionId,
        status: PaymentStatus.REQUIRES_CAPTURE,
        message: 'Payment recorded and pending manual capture',
        amount: normalizedAmount,
        currency,
        paymentMethod: PaymentMethod.MANUAL_CREDIT,
        clientAction: 'manual_capture',
        manualCaptureReference: paymentHistory.transactionId,
        metadata: paymentHistory.metadata,
      };
    }

    // Validate card number
    const sanitizedCardNumber = sanitizeCardNumber(manualDetails.cardNumber);
    if (!isValidCardNumber(sanitizedCardNumber)) {
      throw createValidationError('card number', 'string');
    }

    const { expiryMonth, expiryYear } = this.extractExpiryComponents(manualDetails);
    const cardBrand = detectCardBrand(sanitizedCardNumber);
    const lastFour = extractLastFourDigits(sanitizedCardNumber);

    paymentHistory.status = PaymentStatus.REQUIRES_CAPTURE;
    paymentHistory.metadata = {
      ...paymentHistory.metadata,
      cardLast4: lastFour,
      cardBrand,
      cardExpirationMonth: expiryMonth,
      cardExpirationYear: expiryYear,
      manualCaptureReference: paymentHistory.transactionId,
    };

    // Mark as completed if all validations pass
    paymentHistory.status = PaymentStatus.COMPLETED;
    paymentHistory.completedAt = new Date();

    return {
      paymentId: paymentHistory.transactionId,
      transactionId: paymentHistory.transactionId,
      status: PaymentStatus.COMPLETED,
      message: 'Payment processed successfully',
      amount: normalizedAmount,
      currency,
      paymentMethod: PaymentMethod.MANUAL_CREDIT,
      metadata: paymentHistory.metadata,
    };
  }

  /**
   * Process PayPal payment
   * 
   * Flow:
   * 1. אם אין paypalOrderId - מחזיר REQUIRES_ACTION עם paypalOrderRequest
   * 2. אם יש paypalOrderId:
   *    - קורא ל-PayPal API לאימות הזמנה
   *    - בודק סטטוס (APPROVED/COMPLETED)
   *    - בודק סכום ומטבע
   *    - מבצע capture אם נדרש
   *    - מעדכן payment history עם נתונים מ-PayPal
   * 
   * Retry Logic:
   * - Retry אוטומטי עבור transient errors (5xx, network errors)
   * - Exponential backoff (max 3 retries)
   * - Logging מפורט של כל ניסיון
   */
  private async processPayPalPayment(
    paymentHistory: PaymentHistoryEntity,
    paymentData: PaymentData,
    normalizedAmount: number,
    currency: string
  ): Promise<PaymentResult> {
    // Implementation uses PayPalApiService for real API calls
    // Validates order status, amount, and currency
    // Captures payment if needed
    // Updates payment history with PayPal transaction data
  }

  /**
   * Handle payment success
   */
  private async handlePaymentSuccess(userId: string, paymentData: PaymentData): Promise<void> {
    // Handle payment success based on payment type
    if (paymentData.type === 'points_purchase') {
      // Points purchase handled by CreditsService
      return;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId: string, limit: number = 10, offset: number = 0): Promise<PaymentHistoryEntity[]> {
    const payments = await this.paymentHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return payments;
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normalize amount from dollars to cents
   * @param amount Amount in dollars (e.g., 9.99)
   * @returns Amount in cents (e.g., 999)
   */
  private normalizeAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Ensure valid payment amount
   */
  private ensureValidPaymentAmount(amount: number | undefined): void {
    if (!amount || amount <= 0) {
      throw createValidationError('payment amount', 'number');
    }
  }

  /**
   * Ensure valid payment method
   */
  private ensureValidPaymentMethod(method: PaymentMethod | undefined): void {
    const VALID_PAYMENT_METHODS = [PaymentMethod.MANUAL_CREDIT, PaymentMethod.PAYPAL];
    if (!method || !VALID_PAYMENT_METHODS.includes(method)) {
      throw createValidationError('payment method', 'string');
    }
  }
}
```

## Payment Statuses

| סטטוס | תיאור |
|-------|-------|
| `PENDING` | תשלום ממתין לעיבוד |
| `COMPLETED` | תשלום הושלם בהצלחה |
| `FAILED` | תשלום נכשל |
| `REQUIRES_CAPTURE` | תשלום דורש לכידה ידנית |

## Payment Methods

| שיטה | תיאור |
|------|-------|
| `MANUAL_CREDIT` | תשלום בכרטיס אשראי (לכידה ידנית) |
| `PAYPAL` | תשלום דרך PayPal |

## Cache Strategy

| סוג נתון | Key Pattern | TTL | הערה |
|----------|-------------|-----|------|
| היסטוריית תשלומים | `payment:history:{userId}` | MEDIUM | Cache מתאפס אוטומטית לאחר תשלום חדש מוצלח |
| אפשרויות רכישת נקודות | `credit_purchase_options` | VERY_LONG | Cache ארוך טווח |

## אבטחה
- אימות בעלות על אמצעי תשלום
- בדיקת סכום מול טבלת תעריפים
- ולידציית פרטי כרטיס (Luhn algorithm)
- הגנה על נתונים רגישים (CVV, מספר כרטיס מלא) - נמחקים לאחר עיבוד
- רישום כל התשלומים בהיסטוריה
- **PayPal API Integration**: אימות מלא מול PayPal REST API
  - OAuth 2.0 authentication עם token caching
  - אימות הזמנה, סכום, ומטבע
  - Capture אוטומטי של תשלומים
  - Webhook signature verification
  - Retry logic עבור transient errors

## הערות חשובות

### Amount Handling
- סכומים מגיעים כ-dollars (float) מה-API
- מאוחסנים ב-DB כ-cents (integer)
- `normalizeAmount` ממיר: `9.99` -> `999` (cents)

### Payment History Entity
- `completedAt` ו-`failedAt` הם עמודות נפרדות (לא metadata)
- `originalAmount` ו-`originalCurrency` נשמרים ב-metadata בלבד
- סכומים ב-DB הם ב-cents (integer)

### PayPal Integration
- **אימות מלא**: אינטגרציה מלאה עם PayPal REST API
  - OAuth 2.0 token management עם auto-refresh
  - Order validation מול PayPal API
  - Amount ו-currency validation
  - Capture אוטומטי של תשלומים
  - Webhook handling לעדכוני סטטוס אסינכרוניים
  - Retry logic עם exponential backoff
  - Idempotency checks למניעת עיבוד כפול

**PayPal Services:**
- `PayPalAuthService` - ניהול OAuth tokens עם caching
- `PayPalApiService` - קריאות ל-PayPal REST API
- `PayPalWebhookService` - עיבוד webhook events

**Webhook Events:**
- `PAYMENT.CAPTURE.COMPLETED` - עדכון payment ל-COMPLETED
- `PAYMENT.CAPTURE.DENIED` - עדכון payment ל-FAILED
- `PAYMENT.CAPTURE.REFUNDED` - עדכון payment ל-FAILED עם refund flag
- `PAYMENT.CAPTURE.PENDING` - עדכון payment ל-PENDING

**Environment Variables:**
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- `PAYPAL_MERCHANT_ID` - PayPal merchant ID
- `PAYPAL_ENVIRONMENT` - sandbox או production
- `PAYPAL_WEBHOOK_ID` - PayPal webhook ID (אופציונלי)

## אינטגרציות

- **Credits Service**: רכישת נקודות
- **User Repository**: עדכון נתוני משתמשים
- **Validation Service**: ולידציית נתוני תשלום
- **PayPal REST API**: אינטגרציה מלאה עם PayPal
  - OAuth 2.0 authentication
  - Order management
  - Payment capture
  - Webhook verification
- **Cache Service**: Caching של PayPal access tokens
- **HttpService**: HTTP client לביצוע קריאות ל-PayPal API

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Internal Structure: `../internal/README.md`
- Credits Module: `./CREDITS.md`
- דיאגרמות: [דיאגרמת זרימת תשלומים](../../DIAGRAMS.md#דיאגרמת-זרימת-תשלומים)

---
 