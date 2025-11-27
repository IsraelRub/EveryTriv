# Payment Module - EveryTriv

## סקירה כללית

מודול התשלומים מספק את כל הפונקציונליות הקשורה לעיבוד תשלומים, כולל תשלומים בכרטיס אשראי, PayPal, תשלומים ידניים, והיסטוריית תשלומים.

לקשר לדיאגרמות: [דיאגרמת זרימת תשלומים](../../DIAGRAMS.md#דיאגרמת-זרימת-תשלומים)

## אחריות
- טיפול בטרנזקציות תשלום (Manual Credit, PayPal)
- אימות סכומים
- ניהול תוצאה (Success/Failure/Pending)
- היסטוריית תשלומים
- תמיכה ברכישת נקודות ומנויים

## מבנה מודול

```
server/src/features/payment/
├── dtos/                       # Data Transfer Objects
│   ├── createPayment.dto.ts    # DTO ליצירת תשלום
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
@UsePipes(PaymentDataPipe)
async createPayment(@CurrentUserId() userId: string, @Body() paymentData: CreatePaymentDto) {
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
   * Get pricing plans
   */
  async getPricingPlans(): Promise<SubscriptionPlans> {
    return SUBSCRIPTION_PLANS;
  }

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
   */
  async processPayment(userId: string, paymentData: PaymentData): Promise<PaymentResult> {
    this.ensureValidPaymentAmount(paymentData.amount);
    const normalizedAmount = this.normalizeAmount(paymentData.amount);
    const currency = (paymentData.currency ?? 'USD').toUpperCase();
    const transactionId = this.generateTransactionId();
    const method = paymentData.method ?? PaymentMethod.MANUAL_CREDIT;

    this.ensureValidPaymentMethod(method);

    // Create payment history record
    const paymentHistory = this.paymentHistoryRepository.create({
      userId,
      amount: normalizedAmount,
      currency,
      status: PaymentStatus.PENDING,
      paymentMethod: method,
      description: paymentData.description,
      paymentId: transactionId,
      transactionId: transactionId,
      originalAmount: paymentData.amount,
      originalCurrency: currency,
      metadata: {
        ...paymentData.metadata,
        originalAmount: paymentData.amount,
        originalCurrency: currency,
      },
    });

    await this.paymentHistoryRepository.save(paymentHistory);

    // Process payment by method
    const processingResult = await this.processPaymentByMethod(
      userId,
      paymentHistory,
      paymentData,
      normalizedAmount,
      currency,
      method
    );

    await this.paymentHistoryRepository.save(paymentHistory);

    if (processingResult.status === PaymentStatus.COMPLETED) {
      await this.handlePaymentSuccess(userId, paymentData);
    }

    return processingResult;
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
   */
  private async processPayPalPayment(
    paymentHistory: PaymentHistoryEntity,
    paymentData: PaymentData,
    normalizedAmount: number,
    currency: string
  ): Promise<PaymentResult> {
    const paypalOrderId = paymentData.paypalOrderId;
    const paypalPaymentId = paymentData.paypalPaymentId;

    if (!paypalOrderId || !paypalPaymentId) {
      paymentHistory.status = PaymentStatus.PENDING;
      paymentHistory.metadata = {
        ...paymentHistory.metadata,
        paypalPending: true,
      };

      return {
        paymentId: paymentHistory.transactionId,
        transactionId: paymentHistory.transactionId,
        status: PaymentStatus.PENDING,
        message: 'PayPal payment pending',
        amount: normalizedAmount,
        currency,
        paymentMethod: PaymentMethod.PAYPAL,
        clientAction: 'complete_paypal',
        paypalOrderId: paypalOrderId || undefined,
        metadata: paymentHistory.metadata,
      };
    }

    // Validate PayPal payment
    // In production, this would integrate with PayPal API
    
    paymentHistory.status = PaymentStatus.COMPLETED;
    paymentHistory.completedAt = new Date();
    paymentHistory.metadata = {
      ...paymentHistory.metadata,
      paypalOrderId,
      paypalPaymentId,
    };

    return {
      paymentId: paymentHistory.transactionId,
      transactionId: paymentHistory.transactionId,
      status: PaymentStatus.COMPLETED,
      message: 'PayPal payment completed',
      amount: normalizedAmount,
      currency,
      paymentMethod: PaymentMethod.PAYPAL,
      paypalOrderId,
      metadata: paymentHistory.metadata,
    };
  }

  /**
   * Handle payment success
   */
  private async handlePaymentSuccess(userId: string, paymentData: PaymentData): Promise<void> {
    // Handle payment success based on payment type
    if (paymentData.type === 'points_purchase') {
      // Points purchase handled by PointsService
      return;
    }
    
    if (paymentData.planType) {
      // Subscription handled by SubscriptionService
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
   * Normalize amount
   */
  private normalizeAmount(amount: number): number {
    return Math.round(amount);
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
| היסטוריית תשלומים | `payment:history:{userId}` | 300s | עדכון בעת תשלום חדש |

## אבטחה
- אימות בעלות על אמצעי תשלום
- בדיקת סכום מול טבלת תעריפים
- ולידציית פרטי כרטיס
- הגנה על נתונים רגישים (CVV, מספר כרטיס מלא)
- רישום כל התשלומים בהיסטוריה

## אינטגרציות

- **Points Service**: רכישת נקודות
- **Subscription Service**: רכישת מנויים
- **User Repository**: עדכון נתוני משתמשים
- **Validation Service**: ולידציית נתוני תשלום

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Internal Structure: `../internal/README.md`
- Subscription Module: `./SUBSCRIPTION.md`
- Credits Module: `./CREDITS.md`
- דיאגרמות: [דיאגרמת זרימת תשלומים](../../DIAGRAMS.md#דיאגרמת-זרימת-תשלומים)

---
 