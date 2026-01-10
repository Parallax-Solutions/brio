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
      <SidebarInset className="overflow-auto relative">
        {/* Ambient background effects */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {/* Primary gradient glow - top right */}
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          {/* Secondary gradient glow - bottom left */}
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
          {/* Subtle accent orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/[0.02] blur-3xl" />
        </div>
        
        {/* Subtle star pattern overlay */}
        <div className="pointer-events-none fixed inset-0 bg-stars opacity-30 dark:opacity-50" />
        
        {/* Subtle grid pattern */}
        <div 
          className="pointer-events-none fixed inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23888' fill-opacity='0.4'%3E%3Cpath d='M0 0h1v40H0V0zm39 0h1v40h-1V0z'/%3E%3Cpath d='M0 0h40v1H0V0zm0 39h40v1H0v-1z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <SiteHeader />
        <div className="@container/main relative flex flex-1 flex-col gap-2 px-4 py-4 md:px-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
