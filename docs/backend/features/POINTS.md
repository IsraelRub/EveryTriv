# Points Module - EveryTriv

## סקירה כללית

מודול הנקודות מספק את כל הפונקציונליות הקשורה לניהול נקודות, כולל חישוב נקודות, ניהול מאזן, רכישת נקודות, והיסטוריית עסקות.

לקשר לדיאגרמות: 
- [דיאגרמת זרימת נתונים - תשובה לשאלה](../../DIAGRAMS.md#דיאגרמת-זרימת-נתונים---תשובה-לשאלה)
- [דיאגרמת מודולי Backend](../../DIAGRAMS.md#דיאגרמת-מודולי-backend)

## אחריות
- חישוב נקודות לפי קושי, זמן, נכונות.
- שמירת טרנזקציות נקודות (Ledger).
- מניעת כפילויות (Idempotency).
- ניהול נקודות חינמיות יומיות.
- רכישת נקודות דרך תשלומים.

## מבנה מודול

```
server/src/features/points/
├── dtos/                       # Data Transfer Objects
│   ├── canPlay.dto.ts          # DTO לבדיקת יכולת משחק
│   ├── confirmPointPurchase.dto.ts # DTO לאישור רכישה
│   ├── deductPoints.dto.ts     # DTO לניכוי נקודות
│   ├── getPointHistory.dto.ts  # DTO להיסטוריית נקודות
│   ├── purchasePoints.dto.ts   # DTO לרכישת נקודות
│   └── index.ts
├── points.controller.ts        # Controller
├── points.service.ts           # Service
├── points.module.ts            # Module
└── index.ts
```

## API Endpoints

### GET /points/balance

אחזור מאזן נקודות נוכחי.

**Response:**
```typescript
{
  totalPoints: number;           // סה"כ נקודות
  purchasedPoints: number;       // נקודות שנרכשו
  freeQuestions: number;         // שאלות חינמיות נותרות
  dailyLimit: number;            // מגבלת שאלות יומיות
  canPlayFree: boolean;          // האם יכול לשחק בחינם
  nextResetTime: string | null;  // זמן איפוס הבא
}
```

**דוגמת שימוש:**
```typescript
@Get('balance')
@NoCache()
async getPointBalance(@CurrentUserId() userId: string) {
  const result = await this.pointsService.getPointBalance(userId);
  return result;
}
```

### GET /points/packages

אחזור חבילות נקודות זמינות לרכישה.

**Response:**
```typescript
PointPurchaseOption[]
```

**דוגמת שימוש:**
```typescript
@Get('packages')
@Cache(CACHE_DURATION.VERY_LONG)
async getPointPackages() {
  const result = await this.pointsService.getPointPackages();
  return result;
}
```

### GET /points/can-play

בדיקה האם המשתמש יכול לשחק עם מספר שאלות נתון.

**Request Query:**
```typescript
{
  questionCount: number;  // מספר שאלות
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
async canPlay(@CurrentUserId() userId: string, @Query() query: CanPlayDto) {
  const result = await this.pointsService.canPlay(userId, query.questionCount);
  return result;
}
```

### POST /points/deduct

ניכוי נקודות ממאזן המשתמש.

**Request Body:**
```typescript
{
  questionCount: number;  // מספר שאלות (או amount)
  gameMode?: GameMode;    // מצב משחק
  reason?: string;        // סיבת הניכוי
}
```

**Response:**
```typescript
{
  totalPoints: number;
  purchasedPoints: number;
  freeQuestions: number;
  dailyLimit: number;
  canPlayFree: boolean;
  nextResetTime: string | null;
}
```

**דוגמת שימוש:**
```typescript
@Post('deduct')
async deductPoints(@CurrentUserId() userId: string, @Body() body: DeductPointsDto) {
  const result = await this.pointsService.deductPoints(
    userId,
    body.questionCount,
    body.gameMode ?? GameMode.QUESTION_LIMITED,
    body.reason
  );
  return result;
}
```

### GET /points/history

אחזור היסטוריית עסקות נקודות.

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
async getPointHistory(@CurrentUserId() userId: string, @Query() query: GetPointHistoryDto) {
  const result = await this.pointsService.getPointHistory(userId, query.limit || 50);
  return result;
}
```

### POST /points/purchase

רכישת חבילת נקודות.

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
  balance?: PointBalance;
}
```

**דוגמת שימוש:**
```typescript
@Post('purchase')
async purchasePoints(@CurrentUserId() userId: string, @Body() body: PurchasePointsDto) {
  const result = await this.pointsService.purchasePoints(userId, {
    packageId: body.packageId,
    paymentMethod: body.paymentMethod,
    paypalOrderId: body.paypalOrderId,
    paypalPaymentId: body.paypalPaymentId,
    manualPayment: body.paymentMethod === PaymentMethod.MANUAL_CREDIT ? /* ... */ : undefined,
  });
  return result;
}
```

### POST /points/confirm-purchase

אישור רכישת נקודות לאחר תשלום.

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
async confirmPointPurchase(@CurrentUserId() userId: string, @Body() body: ConfirmPointPurchaseDto) {
  const result = await this.pointsService.confirmPointPurchase(
    userId,
    body.paymentIntentId,
    body.points
  );
  return result;
}
```

## Service Methods

### PointsService

```typescript
@Injectable()
export class PointsService extends BasePointsService {
  constructor(
    @InjectRepository(PointTransactionEntity)
    private readonly pointTransactionRepository: Repository<PointTransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly cacheService: CacheService,
    private readonly paymentService: PaymentService,
    private readonly validationService: ValidationService
  ) {
    super();
  }

  /**
   * Get user's current point balance
   */
  async getPointBalance(userId: string): Promise<PointBalance> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      totalPoints: user.credits,
      purchasedPoints: user.purchasedPoints,
      freeQuestions: user.remainingFreeQuestions,
      dailyLimit: user.dailyFreeQuestions,
      canPlayFree: user.remainingFreeQuestions > 0,
      nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
    };
  }

  /**
   * Get available point packages for purchase
   */
  async getPointPackages(): Promise<PointPurchaseOption[]> {
    return POINT_PURCHASE_PACKAGES.map(pkg => ({
      id: pkg.id,
      points: pkg.points,
      price: pkg.price,
      priceDisplay: pkg.priceDisplay,
      pricePerPoint: pkg.pricePerPoint,
    }));
  }

  /**
   * Check if user can play with current points
   */
  async canPlay(userId: string, questionCount: number): Promise<CanPlayResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalAvailable = user.credits + user.purchasedPoints + user.remainingFreeQuestions;

    if (totalAvailable >= questionCount) {
      return { canPlay: true };
    }

    return {
      canPlay: false,
      reason: `Insufficient points. You have ${totalAvailable} points available but need ${questionCount} points.`,
    };
  }

  /**
   * Deduct points from user's balance
   */
  async deductPoints(
    userId: string,
    questionCount: number,
    gameMode: GameMode = GameMode.QUESTION_LIMITED,
    reason?: string
  ): Promise<PointBalance> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const canPlayResult = await this.canPlay(userId, questionCount);
    if (!canPlayResult.canPlay) {
      throw new BadRequestException(canPlayResult.reason);
    }

    // Calculate new balance based on game mode
    const currentBalance: PointBalance = {
      totalPoints: user.credits,
      purchasedPoints: user.purchasedPoints,
      freeQuestions: user.remainingFreeQuestions,
      canPlayFree: user.remainingFreeQuestions > 0,
      dailyLimit: user.dailyFreeQuestions,
      nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
    };

    const deductionResult = this.calculateNewBalance(currentBalance, questionCount, gameMode);

    // Update user with new balance
    user.remainingFreeQuestions = deductionResult.newBalance.freeQuestions;
    user.purchasedPoints = deductionResult.newBalance.purchasedPoints;
    user.credits = deductionResult.newBalance.totalPoints;

    await this.userRepository.save(user);

    // Create transaction record
    const transaction = this.pointTransactionRepository.create({
      userId,
      type: PointTransactionType.GAME_USAGE,
      source: deductionResult.deductionDetails.purchasedPointsUsed > 0 ? PointSource.PURCHASED : PointSource.FREE_DAILY,
      amount: -questionCount,
      balanceAfter: user.credits,
      freeQuestionsAfter: user.remainingFreeQuestions,
      purchasedPointsAfter: user.purchasedPoints,
      description: reason
        ? `Points deducted (${reason}): ${questionCount} points`
        : `Points deducted for ${gameMode} game: ${questionCount} points`,
      metadata: {
        gameMode,
        freeQuestionsUsed: deductionResult.deductionDetails.freeQuestionsUsed,
        purchasedPointsUsed: deductionResult.deductionDetails.purchasedPointsUsed,
        creditsUsed: deductionResult.deductionDetails.creditsUsed,
        reason: reason ?? null,
      },
    });

    await this.pointTransactionRepository.save(transaction);

    // Invalidate cache
    await this.cacheService.delete(`points:balance:${userId}`);

    return {
      totalPoints: user.credits,
      purchasedPoints: user.purchasedPoints,
      freeQuestions: user.remainingFreeQuestions,
      dailyLimit: user.dailyFreeQuestions,
      canPlayFree: user.remainingFreeQuestions > 0,
      nextResetTime: user.lastFreeQuestionsReset ? new Date(user.lastFreeQuestionsReset).toISOString() : null,
    };
  }

  /**
   * Get point transaction history for user
   */
  async getPointHistory(userId: string, limit: number = 50): Promise<PointTransactionEntity[]> {
    const transactions = await this.pointTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return transactions;
  }

  /**
   * Purchase points package
   */
  async purchasePoints(
    userId: string,
    request: PointsPurchaseRequest
  ): Promise<PaymentResult & { balance?: PointBalance }> {
    // Extract points from package ID
    const pointsMatch = request.packageId.match(/package_(\d+)/);
    if (!pointsMatch) {
      throw new BadRequestException('Invalid package ID');
    }

    const points = parseInt(pointsMatch[1]);
    const packageInfo = POINT_PURCHASE_PACKAGES.find(pkg => pkg.points === points);

    if (!packageInfo) {
      throw new BadRequestException('Invalid points package');
    }

    // Create payment session using PaymentService
    const paymentResult = await this.paymentService.processPayment(userId, {
      amount: packageInfo.price,
      currency: 'USD',
      description: `Points purchase: ${points} points`,
      numberOfPayments: 1,
      type: 'points_purchase',
      metadata: {
        packageId: request.packageId,
        points,
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

    const balance = await this.applyPointsPurchase(userId, points, packageInfo.bonus ?? 0);

    return {
      ...paymentResult,
      balance,
    };
  }

  /**
   * Confirm point purchase after payment
   */
  async confirmPointPurchase(userId: string, paymentIntentId: string, points: number): Promise<PointBalance> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add points to user's balance
    user.purchasedPoints += points;
    await this.userRepository.save(user);

    // Create transaction record
    const transaction = this.pointTransactionRepository.create({
      userId,
      type: PointTransactionType.PURCHASE,
      source: PointSource.PURCHASED,
      amount: points,
      balanceAfter: user.credits,
      freeQuestionsAfter: user.remainingFreeQuestions,
      purchasedPointsAfter: user.purchasedPoints,
      description: `Points purchase: ${points} points`,
      paymentId: paymentIntentId,
      metadata: {
        originalAmount: points,
      },
    });

    await this.pointTransactionRepository.save(transaction);

    // Invalidate cache
    await this.cacheService.delete(`points:balance:${userId}`);

    return {
      totalPoints: user.credits,
      purchasedPoints: user.purchasedPoints,
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
| מאזן נקודות | `points:balance:{userId}` | 1800s | עדכון בזמן אמת |
| חבילות נקודות | `points:packages:all` | 3600s | חבילות משתנות לעיתים רחוקות |

## אינטגרציות

- **Payment Service**: רכישת נקודות דרך תשלומים
- **User Repository**: ניהול מאזן נקודות של משתמשים
- **Cache Service**: ניהול מטמון למאזנים
- **Validation Service**: ולידציית בקשות נקודות
- **BasePointsService**: לוגיקת חישוב נקודות משותפת

## אבטחה
- כל פעולה מחייבת אימות משתמש.
- בדיקת בעלות על טרנזקציה.
- ולידציית סכומים וגדלי חבילות.

## ביצועים
- שימוש ב-Cache למאזנים וסטטיסטיקות.
- Transaction records לאודיט.

## קישורים רלוונטיים

- מבנה Backend: `../../README.md#backend`
- API Reference: `../API_REFERENCE.md`
- Internal Structure: `../internal/README.md`
- דיאגרמות: [דיאגרמת זרימת נתונים - תשובה לשאלה](../../DIAGRAMS.md#דיאגרמת-זרימת-נתונים---תשובה-לשאלה)

---
 