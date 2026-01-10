# Currency Handling

This document explains the multi-currency strategy, conversion rules, precision decisions, and edge cases for the Costa Rica Multi-Currency Budget App.

---

## ISO 4217 Standard

All currency handling follows the [ISO 4217](https://www.iso.org/iso-4217-currency-codes.html) international standard.

### Currency Configuration

```typescript
// From lib/utils/money.ts
export const CURRENCY_CONFIG: Record<Currency, CurrencyConfig> = {
  CRC: {
    code: 'CRC',
    numericCode: '188',
    minorUnit: 2,       // CRC has 2 decimal places (céntimos)
    divisor: 100,       // 1 colón = 100 céntimos
    symbol: '₡',
    name: 'Costa Rican Colón',
  },
  USD: {
    code: 'USD',
    numericCode: '840',
    minorUnit: 2,       // USD has 2 decimal places (cents)
    divisor: 100,       // 1 dollar = 100 cents
    symbol: '$',
    name: 'US Dollar',
  },
  CAD: {
    code: 'CAD',
    numericCode: '124',
    minorUnit: 2,       // CAD has 2 decimal places (cents)
    divisor: 100,       // 1 dollar = 100 cents
    symbol: 'CA$',
    name: 'Canadian Dollar',
  },
};
```

### Key Insight
- **All three currencies have 2 decimal places** according to ISO 4217
- CRC has **céntimos** (similar to cents), though rarely used in practice
- For consistency, all currencies are stored in their smallest unit

---

## Storage Strategy

### Integer Storage (No Floating Point)

**Why**: Avoid floating-point precision errors in financial calculations.

**Implementation** (all currencies treated the same):
- **CRC**: Stored as céntimos (multiply by 100)
- **USD**: Stored as cents (multiply by 100)
- **CAD**: Stored as cents (multiply by 100)

**Examples**:
```typescript
// User enters: $35.00 USD
// Stored in DB: 3500 (cents)

// User enters: ₡50,000 CRC
// Stored in DB: 5000000 (céntimos)

// User enters: $1,234.56 CAD
// Stored in DB: 123456 (cents)
```

### Display Behavior
- **CRC**: Displayed without decimals (céntimos hidden for practicality)
- **USD/CAD**: Displayed with 2 decimal places

### Formatting Functions

**IMPORTANT**: Use the correct function to avoid double-conversion errors!

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `formatMoney(amount, currency)` | Storage amount (cents/céntimos) | Formatted string (e.g., "$19.95") | Display money in UI tables, cards |
| `toDisplayAmount(amount, currency)` | Storage amount (cents/céntimos) | Number (e.g., 19.95) | Chart data, calculations with display values |
| `toStorageAmount(amount, currency)` | Display amount (e.g., 19.95) | Storage amount (e.g., 1995) | Saving user input to database |

**Common Mistake to Avoid**:
```typescript
// ❌ WRONG - Double conversion!
const displayAmount = toDisplayAmount(row.amount, currency);
formatMoney(displayAmount, currency); // formatMoney divides again!

// ✅ CORRECT - formatMoney expects storage amounts
formatMoney(row.amount, currency);

// ✅ CORRECT - For charts needing raw numbers
const chartValue = toDisplayAmount(row.amount, currency);
```

### Conversion Storage

**Strategy**: Store original amount + optional converted amount

```typescript
{
  amount: 3500,              // Original: $35.00 USD (in cents)
  currency: "USD",
  convertedAmountCRC: 183750, // Converted: ₡183,750 CRC (cached)
  rateId: "rate_123"         // Exchange rate used
}
```

**Why Cache Conversions?**
- Performance: Avoid recalculating on every query
- Historical accuracy: Preserve conversion used at time of transaction
- Audit trail: Know which rate was used

**When to Recalculate?**
- If exchange rate changes significantly
- If user requests recalculation
- If cached value is missing

---

## Exchange Rate Management

### Rate Storage

```prisma
model ExchangeRate {
  fromCurrency  Currency
  toCurrency    Currency
  rate          Decimal   @db.Decimal(18, 6) // High precision
  rateType      RateType  @default(BUY)      // BUY (compra) or SELL (venta)
  effectiveDate DateTime
}

enum RateType {
  BUY   // Compra - Bank buys foreign currency from you
  SELL  // Venta - Bank sells foreign currency to you
}
```

**Precision**: 18 digits, 6 decimal places
- Example: 1 USD = 525.123456 CRC
- Allows precise conversions

### Buy vs Sell Rates (Compra vs Venta)

In Costa Rica (and most countries), banks have two exchange rates:

| Rate Type | Spanish | When Used | Example |
|-----------|---------|-----------|---------|
| **BUY** | Compra | You sell foreign currency to bank | You have $100 USD → Bank pays you ₡49,800 |
| **SELL** | Venta | You buy foreign currency from bank | You want $100 USD → You pay bank ₡50,300 |

The SELL rate is always higher than BUY rate (the difference is the bank's profit).

**Automatic Rate Selection**:
- **Foreign → CRC**: Use BUY rate (you're selling foreign currency)
- **CRC → Foreign**: Use SELL rate (you're buying foreign currency)
- **Foreign → Foreign**: Chain through CRC using appropriate rates

### Rate Selection Rules

1. **For Current Month**: Use latest effective rate
2. **For Historical Month**: Use rate effective on or before that month
3. **Fallback**: If no rate exists, show warning and block conversion

### Rate Lookup Logic

```typescript
// Find rate for USD -> CRC effective on or before target date
const rate = await db.exchangeRate.findFirst({
  where: {
    fromCurrency: 'USD',
    toCurrency: 'CRC',
    effectiveDate: { lte: targetDate }
  },
  orderBy: { effectiveDate: 'desc' }
});
```

---

## Conversion Functions

### toStorageAmount() / toDisplayAmount()

**Purpose**: Convert between user-entered amounts and database storage format

```typescript
// Convert display amount to storage (smallest unit)
export function toStorageAmount(displayAmount: number, currency: Currency): number {
  const divisor = getCurrencyDivisor(currency); // 100 for all currencies
  return Math.round(displayAmount * divisor);
}

// Convert storage amount to display
export function toDisplayAmount(storageAmount: number, currency: Currency): number {
  const divisor = getCurrencyDivisor(currency);
  return storageAmount / divisor;
}
```

**Examples**:
```typescript
toStorageAmount(100000, 'CRC')  // 10000000 (céntimos)
toStorageAmount(35.00, 'USD')   // 3500 (cents)

toDisplayAmount(10000000, 'CRC') // 100000 (colones)
toDisplayAmount(3500, 'USD')     // 35.00 (dollars)
```

### convertCurrency() / convertCurrencyWithInfo()

**Purpose**: Convert any currency amount to any target currency using a rate map

```typescript
// Simple version - returns just the amount
function convertCurrency(
  amount: number,        // Amount in smallest unit (cents/céntimos)
  fromCurrency: Currency, // Source currency
  toCurrency: Currency,   // Target currency
  rates: RateMap          // Map of exchange rates
): number;

// Detailed version - returns result with metadata
function convertCurrencyWithInfo(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: RateMap
): ConversionResult;

// Result type
interface ConversionResult {
  amount: number;        // Converted amount
  success: boolean;      // Whether conversion succeeded
  method: 'direct' | 'reverse' | 'chain' | 'none';
  chain?: Currency[];    // For chain conversion: [CAD, USD, CRC]
  warning?: string;      // Error message if failed
}
```

**Conversion Order**:
1. **Direct rate**: Try `USD_CRC` key in rate map
2. **Reverse rate**: Try `CRC_USD` key and use 1/rate
3. **Chain conversion**: Try through intermediate currencies (e.g., CAD → USD → CRC)
4. **Fallback**: Return original amount with success=false

**Usage in Dashboard**:
```typescript
// Build rate map from database
const rates: RateMap = {};
for (const rate of exchangeRates) {
  rates[buildRateKey(rate.fromCurrency, rate.toCurrency)] = Number(rate.rate);
}

// Convert with tracking
const conversionWarnings: ConversionWarning[] = [];
const totalIncome = incomes.reduce((sum, income) => {
  const result = convertCurrencyWithInfo(income.amount, income.currency, baseCurrency, rates);
  if (!result.success) {
    conversionWarnings.push({ from: income.currency, to: baseCurrency, type: 'missing' });
  } else if (result.method === 'chain') {
    conversionWarnings.push({ from: income.currency, to: baseCurrency, type: 'chain', chain: result.chain });
  }
  return sum + result.amount;
}, 0);
```

### convertToBase()

**Purpose**: Convert any currency amount to base currency (CRC)

```typescript
function convertToBase(
  amount: number,      // Amount in original currency (integer)
  currency: Currency,  // Original currency
  rate: ExchangeRate   // Exchange rate to use
): number {
  if (currency === 'CRC') {
    return amount; // Already in base currency
  }
  
  // Convert using rate
  // amount is in cents, rate is decimal
  const converted = Number(rate.rate) * amount;
  
  // Round to integer (colones have no decimals)
  return Math.round(converted);
}
```

**Edge Cases**:
- If currency is already base currency, return as-is
- If rate is missing, throw error (don't convert)
- Round to nearest integer (colones)

### formatMoney()

**Purpose**: Format amount for display based on currency

```typescript
function formatMoney(
  amount: number,     // Amount in smallest unit (cents/colones)
  currency: Currency,
  locale: string = 'es-CR'
): string {
  const divisor = currency === 'CRC' ? 1 : 100;
  const value = amount / divisor;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'CRC' ? 0 : 2,
    maximumFractionDigits: currency === 'CRC' ? 0 : 2,
  }).format(value);
}
```

**Examples**:
```typescript
formatMoney(3500, 'USD', 'en-US')  // "$35.00"
formatMoney(50000, 'CRC', 'es-CR') // "₡50,000"
formatMoney(123456, 'CAD', 'en-CA') // "CA$1,234.56"
```

---

## Conversion Workflow

### When Creating a Transaction

1. **User enters amount and currency**
2. **System finds appropriate exchange rate**
   - For current month: latest rate
   - For past month: rate effective on/before that date
3. **Convert to base currency (CRC)**
4. **Store both original and converted amounts**
5. **Store rateId for audit trail**

### When Displaying Summary

1. **Group transactions by currency**
2. **Show totals per currency**
3. **Convert all to base currency using stored conversions**
4. **Display grand total in base currency**

### When Exchange Rate Changes

1. **User updates exchange rate**
2. **Option to recalculate all conversions**
3. **Or keep historical conversions (recommended)**
4. **New transactions use new rate**

---

## Edge Cases & Error Handling

### Missing Exchange Rate

**Scenario**: User creates transaction but no exchange rate exists

**Handling**:
1. **Try direct rate**: Look for USD → CRC rate
2. **Try reverse rate**: Look for CRC → USD and invert (1/rate)
3. **Try chain conversion**: Look for intermediate currency path
   - Example: CAD → USD → CRC (when CAD → CRC is missing)
   - This requires both CAD → USD and USD → CRC rates to exist
4. **If all fail**: Show warning toast and use original amount

**Chain Conversion Logic**:
```typescript
// For CAD → CRC, if no direct or reverse rate:
// 1. Check if CAD → USD exists (or USD → CAD)
// 2. Check if USD → CRC exists (or CRC → USD)
// 3. If both exist, chain: CAD → USD → CRC
```

**User Notifications**:
- **Missing rates**: Warning toast showing which rates are missing
- **Chain conversion**: Info toast showing the conversion path used

### Rate for Future Date

**Scenario**: User creates transaction for future month

**Handling**:
- Use latest available rate
- Show note: "Using rate from [date]"
- Allow user to update when actual rate is known

### Multiple Rates for Same Date

**Scenario**: User adds multiple rates with same effective date

**Handling**:
- Use most recent (by createdAt)
- Or allow user to select which rate to use
- Consider: Add "primary" flag to rates

### Currency Mismatch

**Scenario**: User tries to convert CRC to CRC

**Handling**:
- Return amount as-is (no conversion needed)
- Skip rate lookup

### Zero or Negative Amounts

**Scenario**: User enters 0 or negative amount

**Handling**:
- Validate with Zod: `z.number().positive()`
- Reject zero/negative amounts
- Show error message

---

## Precision Considerations

### Rounding Strategy

**For Conversions**:
- Round to nearest integer (colones have no decimals)
- Use `Math.round()` for fair rounding

**For Calculations**:
- Keep intermediate calculations in Decimal/Number
- Round only at final display step
- Avoid accumulating rounding errors

### Example Calculation

```typescript
// User has 3 expenses:
// $10.00 USD, $20.00 USD, $30.00 USD
// Rate: 1 USD = 525.5 CRC

// Convert each:
// $10.00 → ₡5,255 (525.5 * 1000, rounded)
// $20.00 → ₡10,510 (525.5 * 2000, rounded)
// $30.00 → ₡15,765 (525.5 * 3000, rounded)
// Total: ₡31,530

// NOT: Convert total ($60.00 → ₡31,530)
// This ensures accuracy per transaction
```

---

## Currency Display

### Formatting Rules

1. **CRC**: No decimals, use ₡ symbol
   - Example: ₡50,000

2. **USD**: 2 decimals, use $ symbol
   - Example: $35.00

3. **CAD**: 2 decimals, use CA$ or C$ symbol
   - Example: CA$1,234.56

### Locale-Aware Formatting

- Use `Intl.NumberFormat` with user's locale
- Spanish (es-CR): ₡50.000 (period as thousand separator)
- English (en-US): $1,234.56 (comma as thousand separator)

---

## Future Considerations

### Additional Currencies

**To Add**:
1. Add to `Currency` enum
2. Determine storage unit (cents or base unit)
3. Update conversion functions
4. Update formatting functions

### Live Rate Fetching

**Implementation**:
- API integration (e.g., exchangerate-api.com)
- Background job to fetch daily rates
- Store in ExchangeRate table
- User can override with manual rates

### Multi-Base Currency

**Future Feature**:
- Allow users to set base currency to USD or CAD
- All conversions target new base
- Requires recalculating all cached conversions

---

## Testing Strategy

### Unit Tests

- Test conversion functions with known rates
- Test edge cases (missing rates, zero amounts)
- Test rounding behavior
- Test formatting for all currencies

### Integration Tests

- Test rate lookup logic
- Test conversion caching
- Test summary calculations
- Test rate update workflow

---

## Summary

**Key Principles**:
1. **Integer storage**: Avoid floating-point errors
2. **Cache conversions**: Performance + historical accuracy
3. **Precise rates**: Decimal(18,6) for accuracy
4. **Clear errors**: Warn when rates missing
5. **Locale-aware**: Format for user's locale
6. **Audit trail**: Store rateId with conversions

This strategy ensures accurate, performant, and maintainable currency handling.


