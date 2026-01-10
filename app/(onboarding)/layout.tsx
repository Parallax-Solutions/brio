import { BanknoteIcon, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: Authentication and onboarding status are handled by proxy.ts
  // The proxy redirects:
  // - Unauthenticated users to /login
  // - Users with completed onboarding to /dashboard
  // So if we reach here, the user is authenticated and needs to complete onboarding

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background pattern */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/25">
            <BanknoteIcon className="h-8 w-8" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-primary-foreground/80 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Budget App</h1>
          <p className="text-muted-foreground text-sm">Costa Rica 🇨🇷</p>
        </div>

        {/* Content */}
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
