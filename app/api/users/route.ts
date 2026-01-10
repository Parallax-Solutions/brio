import { NextResponse } from 'next/server';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { hasPermission } from '@/lib/utils/permissions';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !hasPermission(currentUser.role, 'users:view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      image: true,
      emailVerified: true,
      onboardingCompleted: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users);
}
