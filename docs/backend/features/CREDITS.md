# Credits Module - EveryTriv

## סקירה כללית

מודול הקרדיטים מספק את כל הפונקציונליות הקשורה לניהול קרדיטים, כולל ניהול מאזן, רכישת קרדיטים, והיסטוריית עסקות.

לקשר לדיאגרמות: 
- [דיאגרמת זרימת נתונים - תשובה לשאלה](../../DIAGRAMS.md#דיאגרמת-זרימת-נתונים---תשובה-לשאלה)
- [דיאגרמת מודולי Backend](../../DIAGRAMS.md#דיאגרמת-מודולי-backend)

## אחריות
- ניהול קרדיטים למשחק.
- שמירת טרנזקציות קרדיטים (Ledger).
- מניעת כפילויות (Idempotency).
- ניהול שאלות חינמיות יומיות.
- רכישת קרדיטים דרך תשלומים.

## מבנה מודול

```
server/src/features/credits/
├── dtos/                       # Data Transfer Objects
│   ├── canPlay.dto.ts          # DTO לבדיקת יכולת משחק
│   ├── confirmCreditPurchase.dto.ts # DTO לאישור רכישה
│   ├── deductCredits.dto.ts     # DTO לניכוי קרדיטים
│   ├── getCreditHistory.dto.ts  # DTO להיסטוריית קרדיטים
│   ├── purchaseCredits.dto.ts   # DTO לרכישת קרדיטים
│   └── index.ts
├── credits.controller.ts        # Controller
├── credits.service.ts           # Service
├── credits.module.ts            # Module
└── index.ts
```

## API Endpoints

### GET /credits/balance

אחזור מאזן קרדיטים נוכחי.

**Response:**
```typescript
{
  totalCredits: number;           // סה"כ קרדיטים זמינים (credits + purchasedCredits + freeQuestions)
  credits: number;               // קרדיטים בסיס (נרכשו דרך משחק, אדמין, וכו')
  purchasedCredits: number;       // קרדיטים שנרכשו בתשלום
  freeQuestions: number;         // שאלות חינמיות נותרות (איפוס יומי)
  dailyLimit: number;            // מגבלת שאלות יומיות
  canPlayFree: boolean;          // האם יכול לשחק בחינם
  nextResetTime: string | null;  // זמן איפוס הבא
}
```

**הערה חשובה:** `totalCredits` הוא סכום של כל המקורות: `credits + purchasedCredits + freeQuestions`. סדר הניכוי: תחילה `freeQuestions`, אחר כך `purchasedCredits`, ולבסוף `credits`.

**דוגמת שימוש:**
```typescript
@Get('balance')
@NoCache()
async getCreditBalance(@CurrentUserId() userId: string) {
  const result = await this.creditsService.getCreditBalance(userId);
  return result;
}
```

### GET /credits/packages

אחזור חבילות קרדיטים זמינות לרכישה.

**Response:**
```typescript
CreditPurchaseOption[]
```

**דוגמת שימוש:**
```typescript
@Get('packages')
@Cache(CACHE_DURATION.VERY_LONG)
async getCreditPackages() {
  const result = await this.creditsService.getCreditPackages();
  return result;
}
```

### GET /credits/can-play

בדיקה האם המשתמש יכול לשחק עם מספר שאלות נתון.

**הערה:** משתמשים עם תפקיד `ADMIN` יכולים תמיד לשחק ללא קרדיטים.

**Request Query:**
```typescript
{
  totalQuestions: number;  // מספר שאלות
  gameMode?: GameMode;    // מצב משחק (אופציונלי)
}
```

**Response:**
```typescript
{
  canPlay: boolean;       // האם יכול לשחק
  reason?: string;        // סיבה אם לא יכול
}
```

**דוגמת שימוש:**
```typescript
@Get('can-play')
@Cache(CACHE_DURATION.SHORT)
async canPlayCredits(@CurrentUserId() userId: string, @Query() query: CanPlayCreditsDto) {
  const result = await this.creditsService.canPlay(userId, query.totalQuestions);
  return result;
}
```

### POST /credits/deduct

ניכוי קרדיטים ממאזן המשתמש.

**הערה:** משתמשים עם תפקיד `ADMIN` יכולים לשחק ללא ניכוי קרדיטים. עבור אדמין, הפונקציה מדלגת על ניכוי הקרדיטים ולא יוצרת רשומת transaction.

**Request Body:**
```typescript
{
  totalQuestions: number;  // מספר שאלות (או amount)
  gameMode?: GameMode;    // מצב משחק
  reason?: string;        // סיבת הניכוי
}
```

**Response:**
```typescript
{
  totalCredits: number;
  purchasedCredits: number;
  freeQuestions: number;
  dailyLimit: number;
  canPlayFree: boolean;
  nextResetTime: string | null;
}
```

**דוגמת שימוש:**
```typescript
@Post('deduct')
async deductCredits(@CurrentUserId() userId: string, @Body() body: DeductCreditsDto) {
  const result = await this.creditsService.deductCredits(
    userId,
    body.totalQuestions,
    body.gameMode ?? GameMode.QUESTION_LIMITED,
    body.reason
  );
  return result;
}
```

### GET /credits/history

אחזור היסטוריית עסקות קרדיטים.

**Request Query:**
```typescript
{
  limit?: number;  // מספר רשומות (ברירת מחדל: 50, מקסימום: 100)
}
```

**Response:**
```typescript
PointTransactionEntity[]
```

**דוגמת שימוש:**
```typescript
@Get('history')
@Cache(CACHE_DURATION.SHORT + 90)
async getCreditHistory(@CurrentUserId() userId: string, @Query() query: GetCreditHistoryDto) {
  const result = await this.creditsService.getCreditHistory(userId, query.limit || 50);
  return result;
}
```

### POST /credits/purchase

רכישת חבילת קרדיטים.

**Request Body:**
```typescript
{
  packageId: string;                // מזהה חבילה (package_XXX)
  paymentMethod: PaymentMethod;     // שיטת תשלום
  paypalOrderId?: string;           // PayPal Order ID (אם PayPal)
  paypalPaymentId?: string;         // PayPal Payment ID (אם PayPal)
  cardNumber?: string;              // מספר כרטיס (אם Manual Credit)
  expiryDate?: string;              // תאריך תפוגה (אם Manual Credit)
  cvv?: string;                     // CVV (אם Manual Credit)
  cardHolderName?: string;          // שם בעל הכרטיס (אם Manual Credit)
  postalCode?: string;              // מיקוד (אם Manual Credit)
}
```

**Response:**
```typescript
PaymentResult & {
  balance?: CreditBalance;
}
```

**דוגמת שימוש:**
```typescript
@Post('purchase')
async purchaseCredits(@CurrentUserId() userId: string, @Body() body: PurchaseCreditsDto) {
  const result = await this.creditsService.purchaseCredits(userId, {
    packageId: body.packageId,
    paymentMethod: body.paymentMethod,
    paypalOrderId: body.paypalOrderId,
    paypalPaymentId: body.paypalPaymentId,
    manualPayment: body.paymentMethod === PaymentMethod.MANUAL_CREDIT ? /* ... */ : undefined,
  });
  return result;
}
```

### POST /credits/confirm-purchase

אישור רכישת קרדיטים לאחר תשלום.

**Request Body:**
```typescript
{
  paymentIntentId: string;  // מזהה תשלום (או transactionId/paymentId)
  points: number;           // מספר נקודות שנרכשו
}
```

**Response:**
```typescript
PointBalance
```

**דוגמת שימוש:**
```typescript
@Post('confirm-purchase')
async confirmCreditPurchase(@CurrentUserId() userId: string, @Body() body: ConfirmCreditPurchaseDto) {
  const result = await this.creditsService.confirmCreditPurchase(
    userId,
    body.paymentIntentId,
    body.points
  );
  return result;
}
```

## Service Methods

### CreditsService

```typescript
@Injectable()
export class CreditsService extends BaseCreditsService {
  constructor(
    @InjectRepository(CreditTransactionEntity)
    private readonly creditTransactionRepository: Repository<CreditTransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly cacheService: CacheService,
    private readonly paymentService: PaymentService,
    private readonly validationService: ValidationService
  ) {
    super();
  }

  /**
   * Get user's current credit balance
   * 
   * Returns a CreditBalance object with:
   * - credits: Base credits (earned through gameplay, admin adjustments, etc.)
   * - purchasedCredits: Credits purchased through payment
   * - freeQuestions: Free questions remaining (daily reset)
   * - totalCredits: Sum of all sources (credits + purchasedCredits + freeQuestions)
   */
  async getCreditBalance(userId: string): Promise<CreditBalance> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const credits = user.credits ?? 0;
    const purchasedCredits = user.purchasedCredits ?? 0;
    const freeQuestions = user.remainingFreeQuestions ?? 0;
    const totalCredits = credits + purchasedCredits + freeQuestions;

    return {
      totalCredits,
      credits,
      purchasedCredits,
      freeQuestions,
      dailyLimit: user.dailyFreeQuestions,
      canPlayFree: freeQuestions > 0,
      nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
    };
  }

  /**
   * Get available credit packages for purchase
   */
  async getCreditPackages(): Promise<CreditPurchaseOption[]> {
    return CREDIT_PURCHASE_PACKAGES.map(pkg => ({
      id: pkg.id,
      credits: pkg.credits,
      price: pkg.price,
      priceDisplay: pkg.priceDisplay,
      pricePerCredit: pkg.pricePerCredit,
    }));
  }

  /**
   * Check if user can play with current points
   * 
   * **Admin Users:** Admin users can always play without credits.
   * The method checks if the user has the ADMIN role and returns `{ canPlay: true }` immediately.
   */
  async canPlay(userId: string, requestedQuestions: number): Promise<CanPlayResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Admin users can always play without credits
    if (user.role === UserRole.ADMIN) {
      return { canPlay: true };
    }

    const totalAvailable = user.credits + user.purchasedCredits + user.remainingFreeQuestions;

    if (totalAvailable >= requestedQuestions) {
      return { canPlay: true };
    }

    return {
      canPlay: false,
      reason: `Insufficient credits. You have ${totalAvailable} credits available but need ${requestedQuestions} credits.`,
    };
  }

  /**
   * Deduct credits from user's balance
   * 
   * **Deduction Order:** Credits are deducted in the following order:
   * 1. Free questions (freeQuestions) - first priority
   * 2. Purchased credits (purchasedCredits) - second priority
   * 3. Base credits (credits) - last priority
   * 
   * **Admin Users:** Admin users can play without deducting credits.
   * The method checks if the user has the ADMIN role and skips the deduction process,
   * returning the current balance without creating a transaction record.
   */
  async deductCredits(
    userId: string,
    requestedQuestions: number,
    gameMode: GameMode = GameMode.QUESTION_LIMITED,
    reason?: string
  ): Promise<CreditBalance> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Admin users can play without deducting credits
    if (user.role === UserRole.ADMIN) {
      const nextResetTime = user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null;
      const credits = user.credits ?? 0;
      const purchasedCredits = user.purchasedCredits ?? 0;
      const freeQuestions = user.remainingFreeQuestions ?? 0;
      const totalCredits = credits + purchasedCredits + freeQuestions;

      return {
        totalCredits,
        credits,
        purchasedCredits,
        freeQuestions,
        dailyLimit: user.dailyFreeQuestions,
        canPlayFree: freeQuestions > 0,
        nextResetTime,
      };
    }

    const canPlayResult = await this.canPlay(userId, requestedQuestions);
    if (!canPlayResult.canPlay) {
      throw new BadRequestException(canPlayResult.reason);
    }

    // Calculate new balance based on game mode
    const currentBalance: CreditBalance = {
      totalCredits: user.credits,
      purchasedCredits: user.purchasedCredits,
      freeQuestions: user.remainingFreeQuestions,
      canPlayFree: user.remainingFreeQuestions > 0,
      dailyLimit: user.dailyFreeQuestions,
      nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
    };

    const deductionResult = this.calculateNewBalance(currentBalance, requestedQuestions, gameMode);

    // Update user with new balance
    user.remainingFreeQuestions = deductionResult.newBalance.freeQuestions;
    user.purchasedCredits = deductionResult.newBalance.purchasedCredits;
    user.credits = deductionResult.newBalance.credits;

    await this.userRepository.save(user);

    // Create transaction record
    const transaction = this.creditTransactionRepository.create({
      userId,
      type: CreditTransactionType.GAME_USAGE,
      source: deductionResult.deductionDetails.purchasedCreditsUsed > 0 ? CreditSource.PURCHASED : CreditSource.FREE_DAILY,
      amount: -requestedQuestions,
      balanceAfter: user.credits,
      freeQuestionsAfter: user.remainingFreeQuestions,
      purchasedCreditsAfter: user.purchasedCredits,
      description: reason
        ? `Credits deducted (${reason}): ${requestedQuestions} credits`
        : `Credits deducted for ${gameMode} game: ${requestedQuestions} credits`,
      metadata: {
        gameMode,
        freeQuestionsUsed: deductionResult.deductionDetails.freeQuestionsUsed,
        purchasedCreditsUsed: deductionResult.deductionDetails.purchasedCreditsUsed,
        creditsUsed: deductionResult.deductionDetails.creditsUsed,
        reason: reason ?? null,
      },
    });

    await this.creditTransactionRepository.save(transaction);

    // Invalidate cache
    await this.cacheService.delete(`credits:balance:${userId}`);

    return {
      totalCredits: user.credits + user.purchasedCredits + user.remainingFreeQuestions,
      credits: user.credits,
      purchasedCredits: user.purchasedCredits,
      freeQuestions: user.remainingFreeQuestions,
      dailyLimit: user.dailyFreeQuestions,
      canPlayFree: user.remainingFreeQuestions > 0,
      nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
    };
  }

  /**
   * Get credit transaction history for user
   */
  async getCreditHistory(userId: string, limit: number = 50): Promise<CreditTransactionEntity[]> {
    const transactions = await this.creditTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return transactions;
  }

  /**
   * Purchase credits package
   */
  async purchaseCredits(
    userId: string,
    request: CreditsPurchaseRequest
  ): Promise<PaymentResult & { balance?: CreditBalance }> {
    // Extract credits from package ID
    const creditsMatch = request.packageId.match(/package_(\d+)/);
    if (!creditsMatch) {
      throw new BadRequestException('Invalid package ID');
    }

    const credits = parseInt(creditsMatch[1]);
    const packageInfo = CREDIT_PURCHASE_PACKAGES.find(pkg => pkg.credits === credits);

    if (!packageInfo) {
      throw new BadRequestException('Invalid credits package');
    }

    // Create payment session using PaymentService
    const paymentResult = await this.paymentService.processPayment(userId, {
      amount: packageInfo.price,
      currency: 'USD',
      description: `Credits purchase: ${credits} credits`,
      numberOfPayments: 1,
      type: 'credits_purchase',
      metadata: {
        packageId: request.packageId,
        credits,
        price: packageInfo.price,
      },
      method: request.paymentMethod,
      paypalOrderId: request.paypalOrderId,
      paypalPaymentId: request.paypalPaymentId,
      manualPayment: request.manualPayment,
    });

    if (paymentResult.status !== PaymentStatus.COMPLETED) {
      return paymentResult;
    }

    const balance = await this.applyCreditsPurchase(userId, credits, packageInfo.bonus ?? 0);

    return {
      ...paymentResult,
      balance,
    };
  }

  /**
   * Confirm credit purchase after payment
   */
  async confirmCreditPurchase(userId: string, paymentIntentId: string, credits: number): Promise<CreditBalance> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add credits to user's balance
    user.purchasedCredits += credits;
    await this.userRepository.save(user);

    // Create transaction record
    const transaction = this.creditTransactionRepository.create({
      userId,
      type: CreditTransactionType.PURCHASE,
      source: CreditSource.PURCHASED,
      amount: credits,
      balanceAfter: user.credits,
      freeQuestionsAfter: user.remainingFreeQuestions,
      purchasedCreditsAfter: user.purchasedCredits,
      description: `Credits purchase: ${credits} credits`,
      paymentId: paymentIntentId,
      metadata: {
        originalAmount: credits,
      },
    });

    await this.creditTransactionRepository.save(transaction);

    // Invalidate cache
    await this.cacheService.delete(`credits:balance:${userId}`);

    return {
      totalCredits: user.credits + user.purchasedCredits + user.remainingFreeQuestions,
      credits: user.credits,
      purchasedCredits: user.purchasedCredits,
      freeQuestions: user.remainingFreeQuestions,
      dailyLimit: user.dailyFreeQuestions,
      canPlayFree: user.remainingFreeQuestions > 0,
      nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
    };
  }

  /**
   * Reset daily free questions
   */
  async resetDailyFreeQuestions(): Promise<void> {
    const users = await this.userRepository.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const user of users) {
      const lastReset = user.lastFreeQuestionsReset;
      const lastResetDate = lastReset ? new Date(lastReset) : null;
      lastResetDate?.setHours(0, 0, 0, 0);

      // Reset if it's a new day
      if (!lastResetDate || lastResetDate.getTime() !== today.getTime()) {
        user.remainingFreeQuestions = user.dailyFreeQuestions;
        user.lastFreeQuestionsReset = new Date();
        await this.userRepository.save(user);
      }
    }
  }
}
```

## Cache Strategy

| סוג נתון | Key Pattern | TTL | הערה |
|----------|-------------|-----|------|
| מאזן קרדיטים | `credits:balance:{userId}` | 1800s | עדכון בזמן אמת |
| חבילות קרדיטים | `credits:packages:all` | 3600s | חבילות משתנות לעיתים רחוקות |

## אינטגרציות

- **Payment Service**: רכישת קרדיטים דרך תשלומים
- **User Repository**: ניהול מאזן קרדיטים של משתמשים
- **Cache Service**: ניהול מטמון למאזנים
- **Validation Service**: ולידציית בקשות קרדיטים
- **BaseCreditsService**: לוגיקת חישוב קרדיטים משותפת

## אבטחה
- כל פעולה מחייבת אימות משתמש.
- בדיקת בעלות על טרנזקציה.
- ולידציית סכומים וגדלי חבילות קרדיטים.

## ביצועים
- שימוש ב-Cache למאזנים וסטטיסטיקות.
- Transaction records לאודיט.

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Internal Structure: `../internal/README.md`
- דיאגרמות: [דיאגרמת זרימת נתונים - תשובה לשאלה](../../DIAGRAMS.md#דיאגרמת-זרימת-נתונים---תשובה-לשאלה)

---
 