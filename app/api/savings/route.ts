import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/get-server-session';
import { getBalances } from '@/lib/server/savings';

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balances = await getBalances();
    return NextResponse.json(balances);
  } catch (error) {
    console.error('Error fetching balances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
