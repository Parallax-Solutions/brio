import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/get-server-session';
import { db } from '@/lib/config/db';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getAvatarUrl } from '@/lib/config/supabase';
import { PreferencesSync } from '@/components/providers/preferences-sync';

// Force dynamic rendering to ensure auth check runs on every request
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, theme: true, accentColor: true, locale: true, avatarUrl: true, image: true, role: true },
  });

  // Read sidebar state from cookie
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get('sidebar_state')?.value;
  const defaultOpen = sidebarState !== 'false';

  // Get avatar public URL: Custom avatar > Google OAuth image
  const avatarPublicUrl = getAvatarUrl(user?.avatarUrl ?? null) || user?.image || null;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {/* Sync user preferences from database to client */}
      <PreferencesSync theme={user?.theme} accentColor={user?.accentColor} />
      <AppSidebar user={user ? { ...user, avatarPublicUrl } : undefined} />
      <SidebarInset className="overflow-auto">
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col gap-2 px-4 py-4 md:px-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
