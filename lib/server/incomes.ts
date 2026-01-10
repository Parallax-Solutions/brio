'use server';

import { z } from 'zod';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { revalidatePath } from 'next/cache';
import { Currency, IncomeCadence } from '@prisma/client';
import { toStorageAmount } from '@/lib/utils/money';

const incomeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  currency: z.nativeEnum(Currency),
  cadence: z.nativeEnum(IncomeCadence),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  owner: z.string().optional().nullable(),
});

export type IncomeInput = z.infer<typeof incomeSchema>;

export async function createIncome(data: IncomeInput) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = incomeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const income = await db.income.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        amount: toStorageAmount(parsed.data.amount, parsed.data.currency),
        currency: parsed.data.currency,
        cadence: parsed.data.cadence,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        owner: parsed.data.owner,
      },
    });

    revalidatePath('/income');
    return { success: true, data: income };
  } catch {
    return { success: false, error: 'Failed to create income' };
  }
}

export async function updateIncome(id: string, data: IncomeInput) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = incomeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    // Verify ownership
    const existing = await db.income.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: 'Income not found' };
    }

    const income = await db.income.update({
      where: { id },
      data: {
        name: parsed.data.name,
        amount: toStorageAmount(parsed.data.amount, parsed.data.currency),
        currency: parsed.data.currency,
        cadence: parsed.data.cadence,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        owner: parsed.data.owner,
      },
    });

    revalidatePath('/income');
    return { success: true, data: income };
  } catch {
    return { success: false, error: 'Failed to update income' };
  }
}

export async function deleteIncome(id: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify ownership
    const existing = await db.income.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: 'Income not found' };
    }

    await db.income.delete({ where: { id } });

    revalidatePath('/income');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete income' };
  }
}

export async function toggleIncomeActive(id: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.income.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: 'Income not found' };
    }

    await db.income.update({
      where: { id },
      data: { active: !existing.active },
    });

    revalidatePath('/income');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to toggle income' };
  }
}

export async function getIncomes() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return [];
  }

  const incomes = await db.income.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return incomes;
}

