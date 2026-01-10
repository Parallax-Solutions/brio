import { PaymentCadence } from '@prisma/client';

/**
 * Calculate the current billing period start date based on payment cadence.
 * 
 * - MONTHLY: First day of the current month
 * - BIWEEKLY: Start of the current 2-week period (based on epoch)
 * - WEEKLY: Start of the current week (Monday)
 */
export function getCurrentPeriodStart(cadence: PaymentCadence, referenceDate: Date = new Date()): Date {
  const date = new Date(referenceDate);
  
  switch (cadence) {
    case 'MONTHLY':
      // First day of the current month at midnight UTC
      return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    
    case 'WEEKLY':
      // Start of the current week (Monday) at midnight UTC
      const dayOfWeek = date.getUTCDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, so we go back 6 days
      const monday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getUTCDate() - daysToMonday));
      return monday;
    
    case 'BIWEEKLY':
      // Calculate biweekly period based on a fixed epoch (Jan 1, 2024 - a Monday)
      // This ensures consistent 2-week periods regardless of when a payment was created
      const epochStart = new Date(Date.UTC(2024, 0, 1)); // Monday, Jan 1, 2024
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysSinceEpoch = Math.floor((date.getTime() - epochStart.getTime()) / msPerDay);
      const biweeklyPeriodNumber = Math.floor(daysSinceEpoch / 14);
      const periodStartDays = biweeklyPeriodNumber * 14;
      return new Date(epochStart.getTime() + periodStartDays * msPerDay);
    
    default:
      // Default to monthly
      return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
  }
}

/**
 * Get the end date of a billing period.
 */
export function getPeriodEnd(periodStart: Date, cadence: PaymentCadence): Date {
  switch (cadence) {
    case 'MONTHLY':
      // Last moment of the month
      return new Date(Date.UTC(periodStart.getFullYear(), periodStart.getMonth() + 1, 0, 23, 59, 59, 999));
    
    case 'WEEKLY':
      // 6 days, 23 hours, 59 minutes, 59 seconds after start
      return new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    
    case 'BIWEEKLY':
      // 13 days, 23 hours, 59 minutes, 59 seconds after start
      return new Date(periodStart.getTime() + 14 * 24 * 60 * 60 * 1000 - 1);
    
    default:
      return new Date(Date.UTC(periodStart.getFullYear(), periodStart.getMonth() + 1, 0, 23, 59, 59, 999));
  }
}

/**
 * Check if a date falls within a billing period.
 */
export function isInPeriod(date: Date, periodStart: Date, cadence: PaymentCadence): boolean {
  const periodEnd = getPeriodEnd(periodStart, cadence);
  return date >= periodStart && date <= periodEnd;
}

/**
 * Get display text for a billing period.
 */
export function getPeriodDisplayText(periodStart: Date, cadence: PaymentCadence, locale: string = 'en'): string {
  const periodEnd = getPeriodEnd(periodStart, cadence);
  
  switch (cadence) {
    case 'MONTHLY':
      return periodStart.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    
    case 'WEEKLY':
    case 'BIWEEKLY':
      const startStr = periodStart.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
      const endStr = periodEnd.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
      return `${startStr} - ${endStr}`;
    
    default:
      return periodStart.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }
}
