import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/get-server-session';
import { db } from '@/lib/config/db';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscriptions = await db.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(subscriptions);
}

