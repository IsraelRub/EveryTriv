# Subscription Module - EveryTriv

## סקירה כללית

מודול המנויים מספק את כל הפונקציונליות הקשורה לניהול מנויים, כולל יצירת מנויים, ביטול מנויים, ואחזור תוכניות זמינות.

לקשר לדיאגרמות: [דיאגרמת זרימת תשלומים](../../DIAGRAMS.md#דיאגרמת-זרימת-תשלומים)

## אחריות
- ניהול רמות מנוי (Tier)
- הפעלת הרשאות (Feature Flags)
- בדיקת סטטוס מנוי
- ניהול מחזורי חיוב
- אינטגרציה עם Payment Service

## מבנה מודול

```
server/src/features/subscription/
├── dtos/                         # Data Transfer Objects
│   ├── createSubscription.dto.ts # DTO ליצירת מנוי
│   └── index.ts
├── subscription.controller.ts     # Controller
├── subscription.service.ts        # Service
├── subscription.module.ts         # Module
└── index.ts
```

## API Endpoints

### GET /subscription/plans

אחזור תוכניות מנוי זמינות (ציבורי).

**Response:**
```typescript
SubscriptionPlans
```

**דוגמת שימוש:**
```typescript
@Get('plans')
@Cache(CACHE_DURATION.VERY_LONG)
async getAvailablePlans() {
  const result = await this.subscriptionService.getAvailablePlans();
  return result;
}
```

### GET /subscription/current

אחזור מנוי נוכחי של משתמש.

**Response:**
```typescript
{
  userId: string;
  subscriptionId: string | null;
  planType: PlanType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  price: number;
  billingCycle: BillingCycle | null;
  features: string[];
  autoRenew?: boolean;
  cancelledAt?: Date;
}
```

**דוגמת שימוש:**
```typescript
@Get('current')
@UseGuards(AuthGuard)
@Cache(CACHE_DURATION.MEDIUM)
async getCurrentSubscription(@CurrentUserId() userId: string) {
  const result = await this.subscriptionService.getCurrentSubscription(userId);
  return result;
}
```

### POST /subscription/create

יצירת מנוי חדש.

**Request Body:**
```typescript
{
  planType: PlanType;              // סוג תוכנית (BASIC, PREMIUM, PRO)
  billingCycle?: BillingCycle;     // מחזור חיוב (MONTHLY, YEARLY)
  paymentMethod: PaymentMethod;    // שיטת תשלום
  autoRenewal?: boolean;           // חידוש אוטומטי (ברירת מחדל: true)
  cardNumber?: string;             // מספר כרטיס (אם Manual Credit)
  expiryDate?: string;             // תאריך תפוגה MM/YY (אם Manual Credit)
  cvv?: string;                    // CVV (אם Manual Credit)
  cardHolderName?: string;         // שם בעל הכרטיס (אם Manual Credit)
  postalCode?: string;             // מיקוד (אם Manual Credit)
  paypalOrderId?: string;          // PayPal Order ID (אם PayPal)
  paypalPaymentId?: string;        // PayPal Payment ID (אם PayPal)
}
```

**Response:**
```typescript
{
  subscriptionId: string | null;
  planType: PlanType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  billingCycle: BillingCycle | null;
  price: number;
  features: string[];
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  paypalOrderId?: string;
  paypalTransactionId?: string;
  manualCaptureReference?: string;
}
```

**דוגמת שימוש:**
```typescript
@Post('create')
@UseGuards(AuthGuard)
@UsePipes(PaymentDataPipe)
async createSubscription(@CurrentUserId() userId: string, @Body() body: CreateSubscriptionDto) {
  const result = await this.subscriptionService.createSubscription(userId, body);
  return result;
}
```

### DELETE /subscription/cancel

ביטול מנוי נוכחי.

**Response:**
```typescript
{
  message: string;
}
```

**דוגמת שימוש:**
```typescript
@Delete('cancel')
@UseGuards(AuthGuard)
async cancelSubscription(@CurrentUserId() userId: string) {
  const result = await this.subscriptionService.cancelSubscription(userId);
  return result;
}
```

## Service Methods

### SubscriptionService

```typescript
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly paymentService: PaymentService
  ) {}

  /**
   * Get current subscription for user
   */
  async getCurrentSubscription(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const defaultSubscription = this.getDefaultSubscription();

    return {
      userId: user.id,
      subscriptionId: user.currentSubscriptionId || defaultSubscription.subscriptionId,
      planType: defaultSubscription.planType,
      status: defaultSubscription.status,
      startDate: defaultSubscription.startDate,
      endDate: defaultSubscription.endDate,
      price: defaultSubscription.price,
      billingCycle: defaultSubscription.billingCycle,
      features: defaultSubscription.features,
    };
  }

  /**
   * Create subscription for user
   */
  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    const plan = dto.planType;
    const billingCycle = dto.billingCycle || BillingCycle.MONTHLY;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (billingCycle === BillingCycle.YEARLY ? 12 : 1));

    const planDetails = this.getPlanDetails(plan);
    const subscriptionData: SubscriptionData = {
      subscriptionId,
      planType: plan,
      status: SubscriptionStatus.ACTIVE,
      startDate: startDate,
      endDate: endDate,
      price: planDetails.price,
      billingCycle,
      features: planDetails.features,
      autoRenew: dto.autoRenewal ?? true,
    };

    const manualPayment =
      dto.paymentMethod === PaymentMethod.MANUAL_CREDIT ? this.buildManualPaymentDetails(dto) : undefined;

    const paymentResult = await this.paymentService.processPayment(userId, {
      amount: planDetails.price,
      currency: 'USD',
      description: `Subscription to ${plan} plan`,
      planType: plan,
      numberOfPayments: billingCycle === BillingCycle.YEARLY ? 12 : 1,
      metadata: {
        subscriptionId,
        plan,
        billingCycle,
        price: planDetails.price,
      },
      method: dto.paymentMethod,
      manualPayment,
      paypalOrderId: dto.paymentMethod === PaymentMethod.PAYPAL ? dto.paypalOrderId : undefined,
      paypalPaymentId: dto.paymentMethod === PaymentMethod.PAYPAL ? dto.paypalPaymentId : undefined,
    });

    if (paymentResult.status !== PaymentStatus.COMPLETED) {
      return {
        subscriptionId: null,
        endDate: null,
        billingCycle,
        planType: plan,
        status: SubscriptionStatus.PENDING,
        startDate,
        price: planDetails.price,
        features: [...planDetails.features],
        autoRenew: dto.autoRenewal ?? true,
        nextBillingDate: undefined,
        cancelledAt: undefined,
        planDetails: {
          ...planDetails,
          features: [...planDetails.features],
        },
        paymentMethod: dto.paymentMethod,
        paypalTransactionId: paymentResult.paypalOrderId,
        paypalOrderId: paymentResult.paypalOrderId,
        manualCaptureReference: paymentResult.manualCaptureReference,
        paymentId: paymentResult.transactionId,
      };
    }

    await this.userRepository.update(userId, {
      currentSubscriptionId: subscriptionId,
    });

    return {
      ...subscriptionData,
      paymentId: paymentResult.paymentId ?? paymentResult.transactionId,
      paymentMethod: dto.paymentMethod,
      paypalTransactionId: paymentResult.paypalOrderId,
      paypalOrderId: paymentResult.paypalOrderId,
      manualCaptureReference: paymentResult.manualCaptureReference,
    };
  }

  /**
   * Cancel subscription for user
   */
  async cancelSubscription(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const defaultSubscription = this.getDefaultSubscription();
    defaultSubscription.status = 'cancelled';
    defaultSubscription.cancelledAt = new Date();

    await this.userRepository.update(userId, {
      currentSubscriptionId: undefined,
    });

    return { message: 'Subscription cancelled successfully' };
  }

  /**
   * Get available subscription plans
   */
  async getAvailablePlans() {
    // Use PaymentService to get plans (single source of truth)
    return await this.paymentService.getPricingPlans();
  }

  /**
   * Get default subscription data
   */
  private getDefaultSubscription(): SubscriptionData {
    return {
      subscriptionId: null,
      planType: PlanType.BASIC,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: null,
      price: 0,
      billingCycle: null,
      features: ['basic_questions'],
    };
  }

  /**
   * Get plan details by plan name
   */
  private getPlanDetails(plan: PlanType) {
    const plans = {
      basic: {
        price: 9.99,
        features: ['basic_questions', 'ad_free'],
      },
      premium: {
        price: 19.99,
        features: ['basic_questions', 'ad_free', 'priority_support', 'advanced_analytics'],
      },
      pro: {
        price: 39.99,
        features: [
          'basic_questions',
          'ad_free',
          'priority_support',
          'advanced_analytics',
          'custom_difficulty',
          'api_access',
        ],
      },
    };

    return plans[plan] || plans.basic;
  }

  /**
   * Build manual payment details
   */
  private buildManualPaymentDetails(dto: CreateSubscriptionDto): ManualPaymentDetails {
    const { month, year } = this.parseExpiryDate(dto.expiryDate);

    return {
      cardNumber: dto.cardNumber ?? '',
      expiryMonth: month,
      expiryYear: year,
      cvv: dto.cvv ?? '',
      cardHolderName: dto.cardHolderName ?? '',
      postalCode: dto.postalCode,
      expiryDate: dto.expiryDate,
    };
  }

  /**
   * Parse expiry date
   */
  private parseExpiryDate(expiryDate?: string): { month: number; year: number } {
    if (!expiryDate) {
      return { month: 0, year: 0 };
    }

    const [monthPart, yearPart] = expiryDate.split('/');
    const month = parseInt(monthPart ?? '0', 10);
    const yearDigits = parseInt(yearPart ?? '0', 10);

    return {
      month,
      year: 2000 + (Number.isNaN(yearDigits) ? 0 : yearDigits),
    };
  }
}
```

## Subscription Plans

| תוכנית | מחיר | תכונות |
|--------|------|--------|
| `BASIC` | $9.99/חודש | שאלות בסיסיות, ללא פרסומות |
| `PREMIUM` | $19.99/חודש | שאלות בסיסיות, ללא פרסומות, תמיכה מועדפת, אנליטיקה מתקדמת |
| `PRO` | $39.99/חודש | כל התכונות של PREMIUM + קושי מותאם אישית, גישה ל-API |

## Subscription Statuses

| סטטוס | תיאור |
|-------|-------|
| `ACTIVE` | מנוי פעיל |
| `PENDING` | מנוי ממתין להשלמת תשלום |
| `CANCELLED` | מנוי בוטל |
| `EXPIRED` | מנוי פג |

## Billing Cycles

| מחזור | תיאור |
|-------|-------|
| `MONTHLY` | חיוב חודשי |
| `YEARLY` | חיוב שנתי |

## Cache Strategy

| סוג נתון | Key Pattern | TTL | הערה |
|----------|-------------|-----|------|
| תוכניות מנוי | `subscription:plans:all` | 7200s | תוכניות משתנות לעיתים רחוקות |
| מנוי נוכחי | `subscription:current:{userId}` | 300s | עדכון בעת שינוי |

## אבטחה
- בדיקת בעלות על מנוי
- הרשאות Feature Flags בצד שרת בלבד
- ולידציית תשלום לפני יצירת מנוי
- אימות משתמש לפני כל פעולה

## אינטגרציות

- **Payment Service**: עיבוד תשלומי מנוי
- **User Repository**: עדכון נתוני משתמשים
- **Cache Service**: ניהול מטמון

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Internal Structure: `../internal/README.md`
- Payment Module: `./PAYMENT.md`
- דיאגרמות: [דיאגרמת זרימת תשלומים](../../DIAGRAMS.md#דיאגרמת-זרימת-תשלומים)

---
 