import type { Metadata, Viewport } from "next";
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
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  OrganizationStructuredData,
  WebsiteStructuredData,
  FAQStructuredData,
} from "@/components/seo/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://brio.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Brio — App de Finanzas Personales Costa Rica | Presupuesto Multi-Moneda",
    template: "%s | Brio",
  },
  description: "La mejor aplicación de finanzas personales en Costa Rica. Controla tu presupuesto en colones y dólares, gestiona gastos recurrentes, suscripciones e ingresos. Gratis y fácil de usar.",
  keywords: [
    // Spanish - Costa Rica focused
    "app finanzas costa rica",
    "aplicación presupuesto costa rica",
    "control gastos colones",
    "finanzas personales costa rica",
    "app presupuesto familiar",
    "control de gastos app",
    "gestión financiera personal",
    "app multi-moneda",
    "colones y dólares",
    "ahorro costa rica",
    "gastos recurrentes",
    "control suscripciones",
    // English
    "finance app costa rica",
    "budget app costa rica",
    "personal finance colon dollar",
    "multi-currency budget",
    "expense tracker costa rica",
  ],
  authors: [{ name: "Parallax Solutions" }],
  creator: "Parallax Solutions",
  publisher: "Parallax Solutions",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CR",
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: "Brio",
    title: "Brio — App de Finanzas Personales Costa Rica",
    description: "Controla tu presupuesto en colones y dólares. Gestiona gastos, suscripciones e ingresos. La app de finanzas más completa de Costa Rica.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brio — App de Finanzas Personales Costa Rica",
    description: "Controla tu presupuesto en colones y dólares. La app de finanzas más completa de Costa Rica.",
    creator: "@brioapp",
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "es-CR": `${siteUrl}/es`,
      "en-US": `${siteUrl}/en`,
    },
  },
  category: "Finance",
  classification: "Personal Finance Application",
  other: {
    "geo.region": "CR",
    "geo.placename": "Costa Rica",
    "content-language": "es-CR, en-US",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
        <OrganizationStructuredData />
        <WebsiteStructuredData />
        <FAQStructuredData />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
