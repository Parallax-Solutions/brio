import { NextResponse } from 'next/server';
import { getIncomes } from '@/lib/server/incomes';

export async function GET() {
  const incomes = await getIncomes();
  return NextResponse.json(incomes);
}

