'use server';

import { z } from 'zod';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { revalidatePath } from 'next/cache';
import { Currency } from '@prisma/client';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.nativeEnum(Currency),
  date: z.string().or(z.date()),
  notes: z.string().optional().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export async function createExpense(data: ExpenseInput) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid input');

  await db.extraExpense.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      userId: session.user.id,
    },
  });

  revalidatePath('/expenses');
  revalidatePath('/dashboard');
}

export async function updateExpense(id: string, data: ExpenseInput) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid input');

  await db.extraExpense.update({
    where: { id, userId: session.user.id },
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });

  revalidatePath('/expenses');
  revalidatePath('/dashboard');
}

export async function deleteExpense(id: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  await db.extraExpense.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath('/expenses');
  revalidatePath('/dashboard');
}

