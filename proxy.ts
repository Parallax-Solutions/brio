import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication AND completed onboarding
const protectedRoutes = [
  '/dashboard',
  '/income',
  '/recurring',
  '/subscriptions',
  '/variables',
  '/expenses',
  '/rates',
  '/profile',
  '/savings',
  '/users',
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

// Routes for onboarding (require auth but NOT completed onboarding)
const onboardingRoutes = ['/onboarding'];

export async function proxy(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  const { pathname } = request.nextUrl;

  // Check if accessing a protected route without auth
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isOnboardingRoute = onboardingRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Not authenticated
  if (!token) {
    // Redirect protected/onboarding routes to login
    if (isProtectedRoute || isOnboardingRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Authenticated user
  const onboardingCompleted = token.onboardingCompleted as boolean;

  // Auth routes - redirect to appropriate destination
  if (isAuthRoute) {
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Onboarding routes - only allow if onboarding NOT completed
  if (isOnboardingRoute) {
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - only allow if onboarding IS completed
  if (isProtectedRoute) {
    if (!onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
