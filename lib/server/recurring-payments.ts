'use server';

import { z } from 'zod';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { revalidatePath } from 'next/cache';
import { Currency, PaymentCadence } from '@prisma/client';
import { getCurrentPeriodStart, isSameUTCDate } from '@/lib/utils/periods';

const recurringPaymentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().int().positive('Amount must be a positive integer'),
  currency: z.nativeEnum(Currency),
  cadence: z.nativeEnum(PaymentCadence),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
  active: z.boolean().default(true),
});

export type RecurringPaymentInput = z.infer<typeof recurringPaymentSchema>;

export async function createRecurringPayment(data: RecurringPaymentInput) {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const parsed = recurringPaymentSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Invalid input for recurring payment');
  }

  await db.recurringPayment.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
    },
  });

  revalidatePath('/recurring');
}

export async function updateRecurringPayment(id: string, data: RecurringPaymentInput) {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const parsed = recurringPaymentSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Invalid input for recurring payment');
  }

  await db.recurringPayment.update({
    where: { id, userId: session.user.id },
    data: parsed.data,
  });

  revalidatePath('/recurring');
}

export async function deleteRecurringPayment(id: string) {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  await db.recurringPayment.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath('/recurring');
}

export async function togglePaymentActive(id: string) {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const payment = await db.recurringPayment.findUnique({
    where: { id, userId: session.user.id },
    select: { active: true },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  await db.recurringPayment.update({
    where: { id, userId: session.user.id },
    data: { active: !payment.active },
  });

  revalidatePath('/recurring');
}

/**
 * Mark a recurring payment as paid for the current billing period.
 * The period is calculated based on the payment's cadence (monthly, weekly, biweekly).
 */
export async function markPaymentAsPaid(
  recurringPaymentId: string,
  cadence: PaymentCadence,
  amount: number,
  currency: Currency
) {
  const session = await getServerAuthSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  // Calculate the current period start based on cadence
  const periodStart = getCurrentPeriodStart(cadence);

  // Check if an instance for this period already exists
  const existingInstance = await db.paymentInstance.findFirst({
    where: {
      recurringPaymentId,
      periodStart,
    },
  });

  if (existingInstance) {
    return { success: false, error: 'Payment for this period already marked as paid.' };
  }

  await db.paymentInstance.create({
    data: {
      recurringPaymentId,
      periodStart,
      amount,
      currency,
      paidAt: new Date(),
    },
  });

  revalidatePath('/recurring');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Unmark a recurring payment as paid for the current billing period.
 */
export async function unmarkPaymentAsPaid(recurringPaymentId: string, cadence: PaymentCadence) {
  const session = await getServerAuthSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  const periodStart = getCurrentPeriodStart(cadence);

  await db.paymentInstance.deleteMany({
    where: {
      recurringPaymentId,
      periodStart,
    },
  });

  revalidatePath('/recurring');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Get all payment instances for the current period based on each payment's cadence.
 * This returns a map of recurringPaymentId -> boolean (true if paid for current period).
 */
export async function getPaymentInstancesForCurrentPeriods(recurringPaymentIds: string[], cadences: Record<string, PaymentCadence>) {
  const session = await getServerAuthSession();
  if (!session) {
    return {};
  }

  // Get all payment instances for the user's recurring payments
  const instances = await db.paymentInstance.findMany({
    where: {
      recurringPaymentId: { in: recurringPaymentIds },
    },
    select: {
      recurringPaymentId: true,
      periodStart: true,
    },
  });

  // Check which payments are paid for their current period
  const paidMap: Record<string, boolean> = {};
  
  for (const paymentId of recurringPaymentIds) {
    const cadence = cadences[paymentId] || 'MONTHLY';
    const currentPeriodStart = getCurrentPeriodStart(cadence);
    
    // Check if there's an instance matching this payment's current period
    const isPaid = instances.some(
      (instance) =>
        instance.recurringPaymentId === paymentId &&
        isSameUTCDate(new Date(instance.periodStart), currentPeriodStart)
    );
    
    paidMap[paymentId] = isPaid;
  }

  return paidMap;
}
