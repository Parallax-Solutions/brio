'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { toStorageAmount } from '@/lib/utils/money';
import { Currency } from '@prisma/client';

const balanceSchema = z.object({
  currency: z.enum(['CRC', 'USD', 'CAD']),
  amount: z.number().min(0),
  accountType: z.string().min(1),
  notes: z.string().optional(),
});

export async function getBalances() {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // Get the most recent balance for each account type and currency combination
  const balances = await db.balanceSnapshot.findMany({
    where: { userId: session.user.id },
    orderBy: { snapshotDate: 'desc' },
  });

  // Group by accountType + currency and take the most recent
  const latestBalances: Record<string, typeof balances[0]> = {};
  for (const balance of balances) {
    const key = `${balance.accountType}-${balance.currency}`;
    if (!latestBalances[key]) {
      latestBalances[key] = balance;
    }
  }

  return Object.values(latestBalances);
}

export async function getBalanceHistory() {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  return db.balanceSnapshot.findMany({
    where: { userId: session.user.id },
    orderBy: { snapshotDate: 'desc' },
    take: 50,
  });
}

export async function createBalance(data: z.infer<typeof balanceSchema>) {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validated = balanceSchema.parse(data);
  const storageAmount = toStorageAmount(validated.amount, validated.currency as Currency);

  const balance = await db.balanceSnapshot.create({
    data: {
      userId: session.user.id,
      currency: validated.currency,
      amount: storageAmount,
      accountType: validated.accountType,
      notes: validated.notes,
    },
  });

  revalidatePath('/savings');
  revalidatePath('/dashboard');
  return balance;
}

export async function updateBalance(id: string, data: z.infer<typeof balanceSchema>) {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validated = balanceSchema.parse(data);
  const storageAmount = toStorageAmount(validated.amount, validated.currency as Currency);

  const balance = await db.balanceSnapshot.update({
    where: { id, userId: session.user.id },
    data: {
      currency: validated.currency,
      amount: storageAmount,
      accountType: validated.accountType,
      notes: validated.notes,
      snapshotDate: new Date(), // Update the snapshot date
    },
  });

  revalidatePath('/savings');
  revalidatePath('/dashboard');
  return balance;
}

export async function deleteBalance(id: string) {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  await db.balanceSnapshot.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath('/savings');
  revalidatePath('/dashboard');
}

export async function deleteBalances(ids: string[]) {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  await db.balanceSnapshot.deleteMany({
    where: {
      id: { in: ids },
      userId: session.user.id,
    },
  });

  revalidatePath('/savings');
  revalidatePath('/dashboard');
}

// Calculate projected balance for a given number of months
export interface ProjectionData {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNet: number;
  projections: {
    months: number;
    balance: number;
  }[];
}

export async function getProjections(): Promise<ProjectionData> {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // Get user's base currency
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { baseCurrency: true },
  });
  const baseCurrency = user?.baseCurrency || 'CRC';

  // Get current balances (most recent for each account)
  const balances = await getBalances();
  
  // Get exchange rates for conversion
  const exchangeRates = await db.exchangeRate.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { userId: null },
      ],
    },
    orderBy: { effectiveDate: 'desc' },
  });

  // Build rate map
  const { buildRateKey, convertCurrencyWithInfo } = await import('@/lib/utils/money');
  const rates: Record<string, number> = {};
  for (const rate of exchangeRates) {
    const keyWithType = buildRateKey(rate.fromCurrency, rate.toCurrency, rate.rateType);
    if (!rates[keyWithType]) {
      rates[keyWithType] = Number(rate.rate);
    }
    const legacyKey = buildRateKey(rate.fromCurrency, rate.toCurrency);
    if (!rates[legacyKey]) {
      rates[legacyKey] = Number(rate.rate);
    }
  }

  // Calculate total current balance in base currency
  let currentBalance = 0;
  for (const balance of balances) {
    const result = convertCurrencyWithInfo(balance.amount, balance.currency, baseCurrency, rates);
    currentBalance += result.amount;
  }

  // Get active incomes
  const incomes = await db.income.findMany({
    where: {
      userId: session.user.id,
      active: true,
    },
  });

  // Calculate monthly income
  let monthlyIncome = 0;
  for (const income of incomes) {
    const result = convertCurrencyWithInfo(income.amount, income.currency, baseCurrency, rates);
    let monthlyAmount = result.amount;
    
    // Convert to monthly based on cadence
    switch (income.cadence) {
      case 'WEEKLY':
        monthlyAmount *= 4.33;
        break;
      case 'BIWEEKLY':
        monthlyAmount *= 2.17;
        break;
      case 'ONE_TIME':
        monthlyAmount = 0; // Don't include one-time in projections
        break;
      // MONTHLY is already monthly
    }
    
    monthlyIncome += monthlyAmount;
  }

  // Get average monthly expenses from the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const expenses = await db.extraExpense.findMany({
    where: {
      userId: session.user.id,
      date: { gte: sixMonthsAgo },
    },
  });

  let totalExpenses = 0;
  for (const expense of expenses) {
    const result = convertCurrencyWithInfo(expense.amount, expense.currency, baseCurrency, rates);
    totalExpenses += result.amount;
  }

  // Get recurring payments
  const recurringPayments = await db.recurringPayment.findMany({
    where: {
      userId: session.user.id,
      active: true,
    },
  });

  let monthlyRecurring = 0;
  for (const payment of recurringPayments) {
    const result = convertCurrencyWithInfo(payment.amount, payment.currency, baseCurrency, rates);
    let monthlyAmount = result.amount;
    
    switch (payment.cadence) {
      case 'WEEKLY':
        monthlyAmount *= 4.33;
        break;
      case 'BIWEEKLY':
        monthlyAmount *= 2.17;
        break;
    }
    
    monthlyRecurring += monthlyAmount;
  }

  // Get subscriptions
  const subscriptions = await db.subscription.findMany({
    where: {
      userId: session.user.id,
      active: true,
    },
  });

  let monthlySubscriptions = 0;
  for (const sub of subscriptions) {
    const result = convertCurrencyWithInfo(sub.amount, sub.currency, baseCurrency, rates);
    let monthlyAmount = result.amount;
    
    switch (sub.cadence) {
      case 'WEEKLY':
        monthlyAmount *= 4.33;
        break;
      case 'BIWEEKLY':
        monthlyAmount *= 2.17;
        break;
    }
    
    monthlySubscriptions += monthlyAmount;
  }

  // Calculate average monthly extra expenses
  const monthsWithData = Math.max(1, Math.min(6, Math.ceil((Date.now() - sixMonthsAgo.getTime()) / (30 * 24 * 60 * 60 * 1000))));
  const avgMonthlyExtra = totalExpenses / monthsWithData;

  // Total monthly expenses
  const monthlyExpenses = monthlyRecurring + monthlySubscriptions + avgMonthlyExtra;

  // Monthly net (savings)
  const monthlyNet = monthlyIncome - monthlyExpenses;

  // Calculate projections for different time horizons
  const timeHorizons = [3, 6, 9, 12, 18, 24];
  const projections = timeHorizons.map(months => ({
    months,
    balance: currentBalance + (monthlyNet * months),
  }));

  return {
    currentBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyNet,
    projections,
  };
}
