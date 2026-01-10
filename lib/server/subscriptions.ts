'use server';

import { z } from 'zod';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { revalidatePath } from 'next/cache';
import { Currency, PaymentCadence } from '@prisma/client';
import { getCurrentPeriodStart } from '@/lib/utils/periods';

const subscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.nativeEnum(Currency),
  cadence: z.nativeEnum(PaymentCadence),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
  active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

export async function createSubscription(data: SubscriptionInput) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = subscriptionSchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid input');

  await db.subscription.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  revalidatePath('/subscriptions');
}

export async function updateSubscription(id: string, data: SubscriptionInput) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = subscriptionSchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid input');

  await db.subscription.update({
    where: { id, userId: session.user.id },
    data: parsed.data,
  });

  revalidatePath('/subscriptions');
}

export async function deleteSubscription(id: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  await db.subscription.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath('/subscriptions');
}

export async function toggleSubscriptionActive(id: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const sub = await db.subscription.findUnique({
    where: { id, userId: session.user.id },
    select: { active: true },
  });

  if (!sub) throw new Error('Subscription not found');

  await db.subscription.update({
    where: { id, userId: session.user.id },
    data: { active: !sub.active },
  });

  revalidatePath('/subscriptions');
}

/**
 * Mark a subscription as paid for the current billing period.
 * The period is calculated based on the subscription's cadence (monthly, weekly, biweekly).
 */
export async function markSubscriptionAsPaid(
  subscriptionId: string,
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
      subscriptionId,
      periodStart,
    },
  });

  if (existingInstance) {
    return { success: false, error: 'Subscription for this period already marked as paid.' };
  }

  await db.paymentInstance.create({
    data: {
      subscriptionId,
      periodStart,
      amount,
      currency,
      paidAt: new Date(),
    },
  });

  revalidatePath('/subscriptions');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Unmark a subscription as paid for the current billing period.
 */
export async function unmarkSubscriptionAsPaid(subscriptionId: string, cadence: PaymentCadence) {
  const session = await getServerAuthSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  const periodStart = getCurrentPeriodStart(cadence);

  await db.paymentInstance.deleteMany({
    where: {
      subscriptionId,
      periodStart,
    },
  });

  revalidatePath('/subscriptions');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Get all payment instances for the current period based on each subscription's cadence.
 * This returns a map of subscriptionId -> boolean (true if paid for current period).
 */
export async function getSubscriptionInstancesForCurrentPeriods(subscriptionIds: string[], cadences: Record<string, PaymentCadence>) {
  const session = await getServerAuthSession();
  if (!session) {
    return {};
  }

  // Get all payment instances for the user's subscriptions
  const instances = await db.paymentInstance.findMany({
    where: {
      subscriptionId: { in: subscriptionIds },
    },
    select: {
      subscriptionId: true,
      periodStart: true,
    },
  });

  // Check which subscriptions are paid for their current period
  const paidMap: Record<string, boolean> = {};
  
  for (const subId of subscriptionIds) {
    const cadence = cadences[subId] || 'MONTHLY';
    const currentPeriodStart = getCurrentPeriodStart(cadence);
    
    // Check if there's an instance matching this subscription's current period
    const isPaid = instances.some(
      (instance) =>
        instance.subscriptionId === subId &&
        instance.periodStart.getTime() === currentPeriodStart.getTime()
    );
    
    paidMap[subId] = isPaid;
  }

  return paidMap;
}