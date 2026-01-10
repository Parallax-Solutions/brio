'use server';

import { z } from 'zod';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { revalidatePath } from 'next/cache';
import { Currency } from '@prisma/client';

const billTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().default('Utilities'),
  currency: z.nativeEnum(Currency),
  notes: z.string().optional().nullable(),
});

const billEntrySchema = z.object({
  variableBillTypeId: z.string(),
  month: z.string().or(z.date()),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.nativeEnum(Currency),
  notes: z.string().optional().nullable(),
});

export type BillTypeInput = z.infer<typeof billTypeSchema>;
export type BillEntryInput = z.infer<typeof billEntrySchema>;

// Bill Types
export async function createBillType(data: BillTypeInput) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = billTypeSchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid input');

  await db.variableBillType.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  revalidatePath('/variables');
}

export async function updateBillType(id: string, data: BillTypeInput) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = billTypeSchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid input');

  await db.variableBillType.update({
    where: { id, userId: session.user.id },
    data: parsed.data,
  });

  revalidatePath('/variables');
}

export async function deleteBillType(id: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  await db.variableBillType.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath('/variables');
}

// Bill Entries
export async function createBillEntry(data: BillEntryInput) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = billEntrySchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid input');

  // Verify ownership of bill type
  const billType = await db.variableBillType.findFirst({
    where: { id: parsed.data.variableBillTypeId, userId: session.user.id },
  });
  if (!billType) throw new Error('Bill type not found');

  await db.variableBillEntry.create({
    data: {
      ...parsed.data,
      month: new Date(parsed.data.month),
    },
  });

  revalidatePath('/variables');
  revalidatePath('/dashboard');
}

export async function updateBillEntry(id: string, data: Omit<BillEntryInput, 'variableBillTypeId'>) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  // Verify ownership
  const entry = await db.variableBillEntry.findUnique({
    where: { id },
    include: { variableBillType: true },
  });
  if (!entry || entry.variableBillType.userId !== session.user.id) {
    throw new Error('Entry not found');
  }

  await db.variableBillEntry.update({
    where: { id },
    data: {
      month: new Date(data.month),
      amount: data.amount,
      currency: data.currency,
      notes: data.notes,
    },
  });

  revalidatePath('/variables');
  revalidatePath('/dashboard');
}

export async function deleteBillEntry(id: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  // Verify ownership
  const entry = await db.variableBillEntry.findUnique({
    where: { id },
    include: { variableBillType: true },
  });
  if (!entry || entry.variableBillType.userId !== session.user.id) {
    throw new Error('Entry not found');
  }

  await db.variableBillEntry.delete({ where: { id } });

  revalidatePath('/variables');
  revalidatePath('/dashboard');
}

export async function markBillAsPaid(id: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const entry = await db.variableBillEntry.findUnique({
    where: { id },
    include: { variableBillType: true },
  });
  if (!entry || entry.variableBillType.userId !== session.user.id) {
    throw new Error('Entry not found');
  }

  await db.variableBillEntry.update({
    where: { id },
    data: { paidAt: new Date() },
  });

  revalidatePath('/variables');
  revalidatePath('/dashboard');
}

