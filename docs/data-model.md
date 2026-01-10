# Data Model

This document explains the Prisma schema design, relationships, and important constraints for the Costa Rica Multi-Currency Budget App.

---

## Schema Overview

The database schema is designed to support:
- Multi-currency transactions
- Dynamic income sources
- Recurring and one-time expenses
- Historical exchange rates
- User preferences and balances
- Future household/multi-user support

---

## Core Models

### User

**Purpose**: User accounts, authentication, and preferences

```prisma
model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  emailVerified       DateTime?  // When email was verified
  passwordHash        String?    // Optional for OAuth users
  name                String?
  image               String?    // Google OAuth profile picture
  avatarUrl           String?    // Custom avatar (Supabase Storage)
  
  // Onboarding
  onboardingCompleted Boolean  @default(false)
  
  // Security
  role                Role     @default(USER)
  mfaEnabled          Boolean  @default(false)
  mfaSecret           String?
  
  // Preferences
  baseCurrency        Currency @default(CRC)
  enabledCurrencies   String[] @default(["CRC"])
  theme               Theme    @default(SYSTEM)
  accentColor         String   @default("blue")
  locale              String   @default("es")
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  incomes             Income[]
  recurringPayments   RecurringPayment[]
  subscriptions       Subscription[]
  extraExpenses       ExtraExpense[]
  variableBills       VariableBillEntry[]
  paymentInstances    PaymentInstance[]
  exchangeRates       ExchangeRate[]
  balanceSnapshots    BalanceSnapshot[]
  verificationCodes   VerificationCode[]
  accounts            Account[]
  sessions            Session[]
  
  @@map("users")
}

enum Role {
  USER
  MOD
  ADMIN
}
```

**Key Fields**:
- `passwordHash`: Optional - OAuth users may not have a password
- `emailVerified`: When the user verified their email
- `onboardingCompleted`: Has user finished the setup wizard
- `role`: User role for access control (USER, MOD, ADMIN)
- `baseCurrency`: Default currency for conversions (CRC, USD, CAD)
- `enabledCurrencies`: Currencies user wants to track
- `theme`: User's theme preference (LIGHT, DARK, SYSTEM)
- `accentColor`: Selected accent color (blue, emerald, violet, rose, amber)
- `locale`: Language preference (es, en)

**OAuth Support**:
- `image`: Profile picture from Google OAuth
- `avatarUrl`: Custom avatar uploaded by user
- OAuth users can later add a password for dual sign-in

**Future Extensibility**:
- `mfaEnabled`/`mfaSecret`: Prepared for multi-factor auth
- Can add `householdId` for multi-user support

---

### Income

**Purpose**: Dynamic income sources (multiple per user)

```prisma
model Income {
  id          String      @id @default(cuid())
  userId      String
  name        String
  amount      Int         // Stored in smallest unit (cents for USD/CAD, colones for CRC)
  currency    Currency
  cadence     IncomeCadence
  startDate   DateTime?
  endDate     DateTime?
  active      Boolean     @default(true)
  owner       String?     // Future: household member name
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  received    IncomeReceived[] // Track when income was received
  
  @@index([userId, active])
  @@map("incomes")
}
```

**Key Design Decisions**:
- `amount` stored as integer (cents/colones) to avoid floating-point errors
- `cadence` supports: MONTHLY, BIWEEKLY, WEEKLY, ONE_TIME
- `active` flag allows disabling without deletion
- `owner` field future-proofs for household mode

**IncomeReceived**:
Tracks when income was actually received (separate from expected income)

```prisma
model IncomeReceived {
  id          String   @id @default(cuid())
  incomeId    String
  month       DateTime // Year-month of receipt
  receivedAt  DateTime @default(now())
  amount      Int      // May differ from expected if updated
  currency    Currency
  notes       String?
  
  income      Income   @relation(fields: [incomeId], references: [id], onDelete: Cascade)
  
  @@unique([incomeId, month])
  @@index([incomeId])
  @@map("income_received")
}
```

---

### RecurringPayment

**Purpose**: Recurring bills (rent, insurance, phone, etc.)

```prisma
model RecurringPayment {
  id          String   @id @default(cuid())
  userId      String
  name        String
  category    String
  amount      Int      // Stored in smallest unit
  currency    Currency
  cadence     PaymentCadence
  dueDay      Int?     // 1-31 for monthly
  dueDateRule String?  // For weekly/biweekly (e.g., "first Monday")
  startDate   DateTime?
  endDate     DateTime?
  active      Boolean  @default(true)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  paymentInstances PaymentInstance[]
  
  @@index([userId, active])
  @@map("recurring_payments")
}
```

**Key Fields**:
- `dueDay`: For monthly payments (1-31)
- `dueDateRule`: For weekly/biweekly (e.g., "first Monday", "every 2 weeks")
- `category`: Flexible string (can be enum later if needed)

---

### PaymentInstance

**Purpose**: Tracks when a recurring payment or subscription was actually paid

```prisma
model PaymentInstance {
  id                String   @id @default(cuid())
  recurringPaymentId String?
  subscriptionId    String?
  periodStart       DateTime // Start of the billing period (handles monthly, weekly, biweekly)
  paidAt            DateTime @default(now())
  amount            Int      // May differ from recurring payment if updated
  currency          Currency
  convertedAmountCRC Int?    // Cached conversion (optional)
  rateId            String?  // Exchange rate used for conversion
  notes             String?
  
  recurringPayment  RecurringPayment? @relation(fields: [recurringPaymentId], references: [id], onDelete: Cascade)
  subscription      Subscription?     @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  exchangeRate      ExchangeRate?     @relation(fields: [rateId], references: [id])
  
  @@unique([recurringPaymentId, periodStart])
  @@unique([subscriptionId, periodStart])
  @@index([recurringPaymentId])
  @@index([subscriptionId])
  @@map("payment_instances")
}
```

**Key Design**:
- One PaymentInstance per payment/subscription per billing period
- `periodStart` is calculated based on the payment's cadence:
  - **MONTHLY**: First day of the month (e.g., 2024-01-01)
  - **WEEKLY**: Start of the week (Monday)
  - **BIWEEKLY**: Start of the 2-week period (based on epoch)
- Period automatically resets when a new period starts
- `convertedAmountCRC` cached for performance (can be recalculated)
- `rateId` links to ExchangeRate used for conversion

**Period Calculation** (see `lib/utils/periods.ts`):
- `getCurrentPeriodStart(cadence)`: Returns the current billing period start date
- `getPeriodEnd(periodStart, cadence)`: Returns the end of a billing period
- `getPeriodDisplayText(periodStart, cadence, locale)`: Human-readable period text

---

### Subscription

**Purpose**: Subscriptions (Netflix, Spotify, etc.)

**Decision**: Separate model from RecurringPayment for clarity, but similar structure.

```prisma
model Subscription {
  id          String   @id @default(cuid())
  userId      String
  name        String
  amount      Int
  currency    Currency
  cadence     PaymentCadence @default(MONTHLY)
  dueDay      Int?     // Usually monthly
  startDate   DateTime?
  endDate     DateTime?
  active      Boolean  @default(true)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  paymentInstances PaymentInstance[]
  
  @@index([userId, active])
  @@map("subscriptions")
}
```

**Tradeoff Considered**:
- **Option A**: Separate Subscription model (chosen)
  - Pros: Clear separation, easier to filter, can add subscription-specific fields later
  - Cons: Slight duplication
  
- **Option B**: Single RecurringPayment with `type` field
  - Pros: Less duplication
  - Cons: Less clear, harder to extend subscription-specific features

**Decision**: Separate model for clarity and future extensibility.

---

### ExtraExpense

**Purpose**: One-off expenses (groceries, gas, etc.)

```prisma
model ExtraExpense {
  id                String    @id @default(cuid())
  userId            String
  date              DateTime
  description       String
  category          String
  amount            Int
  currency          Currency
  convertedAmountCRC Int?     // Cached conversion
  rateId            String?    // Exchange rate used
  notes             String?
  receiptUrl        String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  exchangeRate ExchangeRate? @relation(fields: [rateId], references: [id])
  
  @@index([userId, date])
  @@index([userId, category])
  @@map("extra_expenses")
}
```

---

### VariableBillType

**Purpose**: Define types of variable bills (water, power, internet)

```prisma
model VariableBillType {
  id          String   @id @default(cuid())
  userId      String
  name        String   // "Water", "Power", "Internet"
  category    String   @default("Utilities")
  currency    Currency @default(CRC)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user    User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  entries VariableBillEntry[]
  
  @@unique([userId, name])
  @@index([userId])
  @@map("variable_bill_types")
}
```

---

### VariableBillEntry

**Purpose**: Monthly entries for variable bills

```prisma
model VariableBillEntry {
  id                String   @id @default(cuid())
  variableBillTypeId String
  month             DateTime // Year-month
  amount            Int
  currency          Currency
  convertedAmountCRC Int?
  rateId            String?
  paidAt            DateTime?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  variableBillType VariableBillType @relation(fields: [variableBillTypeId], references: [id], onDelete: Cascade)
  exchangeRate     ExchangeRate?    @relation(fields: [rateId], references: [id])
  
  @@unique([variableBillTypeId, month])
  @@index([variableBillTypeId])
  @@map("variable_bill_entries")
}
```

**Key Design**:
- One entry per bill type per month
- `paidAt` tracks when paid (null = unpaid)
- Dashboard highlights missing entries for current month

---

### ExchangeRate

**Purpose**: Historical exchange rates for currency conversion

```prisma
model ExchangeRate {
  id            String   @id @default(cuid())
  userId        String?  // Optional: user-specific rates, or global
  fromCurrency  Currency
  toCurrency    Currency
  rate          Decimal  @db.Decimal(18, 6) // High precision
  effectiveDate DateTime
  source        String?  // "manual", "api", etc.
  createdAt     DateTime @default(now())
  
  user            User?              @relation(fields: [userId], references: [id], onDelete: Cascade)
  paymentInstances PaymentInstance[]
  extraExpenses    ExtraExpense[]
  variableBillEntries VariableBillEntry[]
  
  @@index([fromCurrency, toCurrency, effectiveDate])
  @@index([userId])
  @@map("exchange_rates")
}
```

**Key Design**:
- `rate` stored as Decimal for precision
- `effectiveDate` allows historical rates
- `userId` optional: can have global rates or user-specific
- Indexed for fast lookups by currency pair and date

---

### BalanceSnapshot

**Purpose**: Track user's cash/bank balances over time

```prisma
model BalanceSnapshot {
  id          String   @id @default(cuid())
  userId      String
  currency    Currency
  amount      Int      // Balance in smallest unit
  accountType String?  // "cash", "bank", "savings", etc.
  notes       String?
  snapshotDate DateTime @default(now())
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, snapshotDate])
  @@map("balance_snapshots")
}
```

**Key Design**:
- Historical tracking (can see balance changes over time)
- Multiple currencies supported
- `accountType` allows tracking different accounts

---

### VerificationCode

**Purpose**: Store OTP codes for email verification and sign-in

```prisma
model VerificationCode {
  id        String               @id @default(cuid())
  userId    String
  code      String               // 6-digit code
  type      VerificationCodeType
  expiresAt DateTime
  createdAt DateTime             @default(now())
  used      Boolean              @default(false)
  
  user      User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("verification_codes")
}

enum VerificationCodeType {
  EMAIL_VERIFICATION
  SIGN_IN
  PASSWORD_RESET
}
```

**Key Design**:
- Single-use codes (`used` flag)
- Expiration time (15 min for verification, 5 min for sign-in)
- Type-based for different verification purposes
- Previous codes invalidated when new one requested

---

## Enums

```prisma
enum Currency {
  CRC
  USD
  CAD
}

enum IncomeCadence {
  MONTHLY
  BIWEEKLY
  WEEKLY
  ONE_TIME
}

enum PaymentCadence {
  MONTHLY
  BIWEEKLY
  WEEKLY
}

enum Theme {
  LIGHT
  DARK
  SYSTEM
}

enum Role {
  USER
  MOD
  ADMIN
}

enum RateType {
  BUY   // Compra
  SELL  // Venta
}

enum VerificationCodeType {
  EMAIL_VERIFICATION
  SIGN_IN
  PASSWORD_RESET
}
```

---

## Relationships Summary

```
User
  ├── Income (1:N)
  ├── RecurringPayment (1:N)
  ├── Subscription (1:N)
  ├── ExtraExpense (1:N)
  ├── VariableBillType (1:N)
  ├── ExchangeRate (1:N, optional)
  ├── BalanceSnapshot (1:N)
  ├── VerificationCode (1:N)
  ├── Account (1:N)           // OAuth accounts
  └── Session (1:N)           // Auth sessions

RecurringPayment
  └── PaymentInstance (1:N)

Subscription
  └── PaymentInstance (1:N)

VariableBillType
  └── VariableBillEntry (1:N)

ExchangeRate
  ├── PaymentInstance (1:N, optional)
  ├── ExtraExpense (1:N, optional)
  └── VariableBillEntry (1:N, optional)
```

---

## Important Constraints

### Data Integrity
- All amounts stored as integers (cents/colones)
- Currency conversions cached but can be recalculated
- Unique constraints prevent duplicate entries (e.g., one payment per month per recurring payment)

### Cascading Deletes
- Deleting a user deletes all related data
- Deleting a RecurringPayment deletes PaymentInstances
- Deleting a VariableBillType deletes entries

### Indexes
- User-scoped queries indexed (userId + active, userId + date)
- Exchange rate lookups indexed (currency pair + date)
- Payment lookups indexed (recurringPaymentId + month)

---

## Future Extensibility

### Household Support
- Add `householdId` to User
- Add `Household` model
- Add `HouseholdMember` model with roles

### Categories
- Can convert `category` strings to `Category` model later
- Allows category management, budgets per category

### Tags
- Can add `Tag` model and many-to-many relationships
- Allows flexible expense tagging

### Attachments
- Can add `Receipt` model linked to expenses
- Store receipt images/files

---

## Migration Strategy

- All schema changes via Prisma migrations
- Backward-compatible changes preferred
- Data migrations handled in migration scripts
- Seed data updated with schema changes


