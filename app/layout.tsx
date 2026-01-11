import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { defaultLocale, getMessages, Locale } from "@/lib/i18n/config";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { getServerAuthSession } from "@/lib/get-server-session";
import { db } from "@/lib/config/db";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brio — Finances with Spirit",
  description: "Multi-currency budget management app. Manage your money with energy, live your life with spirit.",
};

// Script to prevent accent color flash - runs before React hydrates
const accentColorScript = `
  (function() {
    try {
      var accent = localStorage.getItem('accent-color');
      if (accent && ['blue', 'emerald', 'violet', 'rose', 'amber', 'coral'].includes(accent)) {
        document.documentElement.setAttribute('data-accent', accent);
      }
    } catch (e) {}
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Try to get user's locale from database if authenticated
  let locale: Locale = defaultLocale;
  
  try {
    const session = await getServerAuthSession();
    if (session?.user?.id) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { locale: true },
      });
      if (user?.locale && (user.locale === 'en' || user.locale === 'es')) {
        locale = user.locale;
      }
    }
  } catch {
    // If session check fails (e.g., on login page), use default locale
  }

  const messages = getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentColorScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <I18nProvider locale={locale} messages={messages}>
              {children}
              <Analytics />
              <SpeedInsights />
              <Toaster />
            </I18nProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
