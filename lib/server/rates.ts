'use server';

import { z } from 'zod';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { revalidatePath } from 'next/cache';
import { Currency, RateType } from '@prisma/client';

const rateSchema = z.object({
  fromCurrency: z.nativeEnum(Currency),
  toCurrency: z.nativeEnum(Currency),
  rate: z.number().positive('Rate must be positive'),
  rateType: z.nativeEnum(RateType),
  effectiveDate: z.string().or(z.date()),
  source: z.string().optional().nullable(),
});

export type RateInput = z.infer<typeof rateSchema>;

export async function createRate(data: RateInput) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = rateSchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid input');

  await db.exchangeRate.create({
    data: {
      ...parsed.data,
      effectiveDate: new Date(parsed.data.effectiveDate),
      userId: session.user.id,
    },
  });

  revalidatePath('/rates');
}

export async function updateRate(id: string, data: RateInput) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = rateSchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid input');

  await db.exchangeRate.update({
    where: { id, userId: session.user.id },
    data: {
      ...parsed.data,
      effectiveDate: new Date(parsed.data.effectiveDate),
    },
  });

  revalidatePath('/rates');
}

export async function deleteRate(id: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error('Unauthorized');

  await db.exchangeRate.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath('/rates');
}

