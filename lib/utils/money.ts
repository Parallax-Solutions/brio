import { Currency } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * ISO 4217 Currency Configuration
 * @see https://www.iso.org/iso-4217-currency-codes.html
 * @see https://en.wikipedia.org/wiki/ISO_4217
 * 
 * Each currency has:
 * - code: ISO 4217 alphabetic code
 * - numericCode: ISO 4217 numeric code
 * - minorUnit: Number of decimal places (exponent)
 * - divisor: 10^minorUnit (used to convert between minor and major units)
 * - symbol: Currency symbol for display
 * - name: Full currency name
 */
export interface CurrencyConfig {
  code: Currency;
  numericCode: string;
  minorUnit: number;
  divisor: number;
  symbol: string;
  name: string;
}

/**
 * ISO 4217 Currency Definitions
 * All amounts are stored in the smallest unit (cents/céntimos)
 */
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

/**
 * Get the divisor for a currency (10^minorUnit)
 * Used to convert between display amount and stored amount
 */
export function getCurrencyDivisor(currency: Currency): number {
  return CURRENCY_CONFIG[currency].divisor;
}

/**
 * Get the number of decimal places for a currency
 */
export function getCurrencyDecimals(currency: Currency): number {
  return CURRENCY_CONFIG[currency].minorUnit;
}

/**
 * Convert display amount to storage amount (smallest unit)
 * @param displayAmount - Amount as user sees it (e.g., 100.50)
 * @param currency - Currency code
 * @returns Amount in smallest unit (e.g., 10050 cents)
 */
export function toStorageAmount(displayAmount: number, currency: Currency): number {
  const divisor = getCurrencyDivisor(currency);
  return Math.round(displayAmount * divisor);
}

/**
 * Convert storage amount to display amount
 * @param storageAmount - Amount in smallest unit (e.g., 10050 cents)
 * @param currency - Currency code
 * @returns Amount for display (e.g., 100.50)
 */
export function toDisplayAmount(storageAmount: number, currency: Currency): number {
  const divisor = getCurrencyDivisor(currency);
  return storageAmount / divisor;
}

/**
 * Rate type for buy/sell differentiation
 */
export type RateTypeValue = 'BUY' | 'SELL';

/**
 * Exchange rate lookup type
 * Key format: "USD_CRC_BUY" or "USD_CRC_SELL" (with rate type)
 * Or legacy: "USD_CRC" (without rate type, defaults to BUY)
 */
export type RateMap = Record<string, number>;

/**
 * Build a rate key for lookup (with rate type)
 */
export function buildRateKey(from: Currency, to: Currency, rateType?: RateTypeValue): string {
  if (rateType) {
    return `${from}_${to}_${rateType}`;
  }
  return `${from}_${to}`;
}

/**
 * Determine which rate type to use based on conversion direction
 * 
 * When converting FROM foreign currency TO local currency (CRC):
 * - Use BUY rate (compra) - bank buys foreign currency from you
 * 
 * When converting FROM local currency (CRC) TO foreign currency:
 * - Use SELL rate (venta) - bank sells foreign currency to you
 * 
 * For conversions between two foreign currencies:
 * - Use BUY rate as default (you're selling the foreign currency)
 */
export function getRateTypeForConversion(from: Currency, to: Currency): RateTypeValue {
  // Converting TO local currency = bank buys from you = BUY rate
  if (to === 'CRC') {
    return 'BUY';
  }
  // Converting FROM local currency = bank sells to you = SELL rate
  if (from === 'CRC') {
    return 'SELL';
  }
  // Between foreign currencies, default to BUY
  return 'BUY';
}

/**
 * Result of a currency conversion
 */
export interface ConversionResult {
  amount: number;
  success: boolean;
  method: 'direct' | 'reverse' | 'chain' | 'none';
  chain?: Currency[]; // intermediate currencies used
  warning?: string;
}

/**
 * All supported currencies for chain conversion
 */
const ALL_CURRENCIES: Currency[] = ['USD', 'CRC', 'CAD'];

/**
 * Get rate between two currencies (direct or reverse)
 * Tries with rate type first, then falls back to legacy keys without rate type
 */
function getRate(from: Currency, to: Currency, rates: RateMap, rateType?: RateTypeValue): number | null {
  const effectiveRateType = rateType ?? getRateTypeForConversion(from, to);
  
  // Try direct with rate type
  const directKeyWithType = buildRateKey(from, to, effectiveRateType);
  if (rates[directKeyWithType]) {
    return rates[directKeyWithType];
  }
  
  // Try direct without rate type (legacy)
  const directKey = buildRateKey(from, to);
  if (rates[directKey]) {
    return rates[directKey];
  }
  
  // For reverse, we need to consider opposite rate type
  // If we need BUY for USD→CRC, the reverse CRC→USD would be SELL
  const reverseRateType: RateTypeValue = effectiveRateType === 'BUY' ? 'SELL' : 'BUY';
  
  // Try reverse with rate type
  const reverseKeyWithType = buildRateKey(to, from, reverseRateType);
  if (rates[reverseKeyWithType]) {
    return 1 / rates[reverseKeyWithType];
  }
  
  // Try reverse without rate type (legacy)
  const reverseKey = buildRateKey(to, from);
  if (rates[reverseKey]) {
    return 1 / rates[reverseKey];
  }
  
  return null;
}

/**
 * Convert amount from one currency to the target currency
 * Supports direct, reverse, and chain conversion (through intermediate currency)
 * @param amount - Amount in smallest unit (cents/céntimos)
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @param rates - Map of exchange rates (key format: "USD_CRC" -> rate)
 * @returns Converted amount in target currency's smallest unit
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: RateMap
): number {
  const result = convertCurrencyWithInfo(amount, fromCurrency, toCurrency, rates);
  return result.amount;
}

/**
 * Convert amount with detailed information about the conversion
 * Automatically selects BUY or SELL rate based on conversion direction
 * @returns ConversionResult with amount, success flag, and method used
 */
export function convertCurrencyWithInfo(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: RateMap
): ConversionResult {
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return { amount, success: true, method: 'direct' };
  }

  const fromDivisor = getCurrencyDivisor(fromCurrency);
  const toDivisor = getCurrencyDivisor(toCurrency);
  const rateType = getRateTypeForConversion(fromCurrency, toCurrency);

  // Try to get rate (handles direct, reverse, and rate types)
  const rate = getRate(fromCurrency, toCurrency, rates, rateType);
  
  if (rate !== null) {
    const majorAmount = amount / fromDivisor;
    const convertedMajor = majorAmount * rate;
    return {
      amount: Math.round(convertedMajor * toDivisor),
      success: true,
      method: 'direct',
    };
  }

  // Try chain conversion through intermediate currency
  for (const intermediate of ALL_CURRENCIES) {
    if (intermediate === fromCurrency || intermediate === toCurrency) {
      continue;
    }

    // For chain conversion, determine rate types for each leg
    const rateTypeToIntermediate = getRateTypeForConversion(fromCurrency, intermediate);
    const rateTypeFromIntermediate = getRateTypeForConversion(intermediate, toCurrency);

    const rateToIntermediate = getRate(fromCurrency, intermediate, rates, rateTypeToIntermediate);
    const rateFromIntermediate = getRate(intermediate, toCurrency, rates, rateTypeFromIntermediate);

    if (rateToIntermediate !== null && rateFromIntermediate !== null) {
      // Convert: from → intermediate → to
      const majorAmount = amount / fromDivisor;
      const intermediateAmount = majorAmount * rateToIntermediate;
      const convertedMajor = intermediateAmount * rateFromIntermediate;
      
      console.info(`Chain conversion: ${fromCurrency} → ${intermediate} → ${toCurrency}`);
      
      return {
        amount: Math.round(convertedMajor * toDivisor),
        success: true,
        method: 'chain',
        chain: [fromCurrency, intermediate, toCurrency],
      };
    }
  }

  // No rate found, return original amount
  console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
  return {
    amount,
    success: false,
    method: 'none',
    warning: `No exchange rate found for ${fromCurrency} to ${toCurrency}`,
  };
}

/**
 * Convert amount from one currency to base currency (CRC)
 * @param amount - Amount in smallest unit (cents/céntimos)
 * @param currency - Original currency
 * @param rate - Exchange rate (Decimal from Prisma) - e.g., 500 means 1 USD = 500 CRC
 * @returns Converted amount in CRC céntimos
 */
export function convertToBase(
  amount: number,
  currency: Currency,
  rate: Decimal | number | null
): number {
  if (currency === 'CRC') {
    return amount; // Already in base currency
  }

  if (!rate) {
    throw new Error(`No exchange rate provided for ${currency} to CRC`);
  }

  // Convert rate to number if it's a Decimal
  const rateValue = typeof rate === 'number' ? rate : Number(rate);

  const fromDivisor = getCurrencyDivisor(currency);
  const toDivisor = getCurrencyDivisor('CRC');

  // Convert: smallest unit → major unit → apply rate → target smallest unit
  // Example: 350000 cents ($3500) * rate 500 = 1,750,000 CRC = 175,000,000 céntimos
  const majorAmount = amount / fromDivisor;
  const convertedMajor = majorAmount * rateValue;
  return Math.round(convertedMajor * toDivisor);
}

/**
 * Format amount for display based on currency
 * @param amount - Amount in smallest unit (cents/céntimos)
 * @param currency - Currency code
 * @param locale - Locale string (e.g., 'es-CR', 'en-US')
 * @returns Formatted currency string
 */
export function formatMoney(
  amount: number,
  currency: Currency,
  locale: string = 'es-CR'
): string {
  const config = CURRENCY_CONFIG[currency];
  const value = amount / config.divisor;

  // For CRC, typically display without decimals even though céntimos exist
  // This is a practical choice since céntimos are rarely used
  const showDecimals = currency !== 'CRC';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: showDecimals ? config.minorUnit : 0,
    maximumFractionDigits: showDecimals ? config.minorUnit : 0,
  }).format(value);
}

/**
 * Parse user input to storage amount (smallest unit)
 * @param input - User input string (e.g., "35.00", "50000")
 * @param currency - Currency code
 * @returns Amount in smallest unit (cents/céntimos)
 */
export function parseMoneyInput(input: string, currency: Currency): number {
  // Remove currency symbols and whitespace
  const cleaned = input.replace(/[₡$,\s]/g, '');

  const value = parseFloat(cleaned);

  if (isNaN(value)) {
    throw new Error('Invalid amount');
  }

  return toStorageAmount(value, currency);
}

/**
 * Get currency symbol from ISO 4217 config
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_CONFIG[currency].symbol;
}

/**
 * Get currency display with symbol (e.g., "$ USD", "₡ CRC")
 */
export function getCurrencyDisplay(currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${currency}`;
}


