import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';

export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

