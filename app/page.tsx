import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/get-server-session';

// Force dynamic rendering to ensure auth check runs on every request
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerAuthSession();

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
