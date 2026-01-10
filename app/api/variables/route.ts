import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/get-server-session';
import { db } from '@/lib/config/db';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const billTypes = await db.variableBillType.findMany({
    where: { userId: session.user.id },
    include: {
      entries: {
        orderBy: { month: 'desc' },
        take: 12, // Last 12 months
      },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(billTypes);
}

