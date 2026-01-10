# Authentication Strategy

This document explains the authentication flow, protected routes, and future extensibility for the Brio.

---

## Authentication Provider

### NextAuth.js (Auth.js)

**Why NextAuth**:

- Industry-standard for Next.js
- Secure by default
- Easy to extend
- Prisma adapter available
- Session management built-in

**Version**: Latest (Auth.js v5 compatible)

---

## Current Implementation

### Providers: Credentials + Google OAuth

**Credentials Provider**:

- Email/password authentication
- Passwords hashed with bcrypt (salt rounds: 12)
- Password requirements:
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one special character (!@#$%^&\*...)
- Real-time validation feedback on registration and profile pages
- Best for users who prefer traditional login

**Google OAuth Provider**:

- One-click Google sign-in
- Profile picture automatically imported
- No password required for OAuth users
- OAuth users can optionally add a password via Profile → Security
- Once password is set, user can sign in with either Google or email/password

### Registration & Onboarding Flow

```
1. User visits /register
2. Enters name, email + password OR signs in with Google
3. Account created in database
4. Auto sign-in after registration
5. Redirect to /onboarding (email verification required)
6. Onboarding wizard:
   a. Verify email (6-digit OTP via Resend)
   b. Set profile (name, base currency, enabled currencies)
   c. Add at least 1 income source
   d. Add at least 1 balance (checking, savings, etc.)
7. Onboarding complete → redirect to /dashboard
8. Future logins check onboardingCompleted status
```

### Login Flow

```
1. User visits /login
2. Enters email + password OR signs in with Google
3. NextAuth validates credentials
4. Session created (JWT with onboardingCompleted flag)
5. Proxy checks onboardingCompleted:
   - If false → redirect to /onboarding
   - If true → proceed to /dashboard
6. Protected routes check session
```

### User Model

```prisma
model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  emailVerified       DateTime?  // When email was verified
  passwordHash        String?    // Optional for OAuth users, bcrypt hashed
  name                String?
  image               String?    // Google OAuth profile picture
  avatarUrl           String?    // Custom avatar (Supabase Storage)
  onboardingCompleted Boolean  @default(false)  // Has completed setup wizard
  mfaEnabled          Boolean  @default(false)  // Multi-factor auth enabled
  mfaSecret           String?  // TOTP secret for MFA
  // ... other fields
}

model VerificationCode {
  id        String   @id @default(cuid())
  userId    String
  code      String   // 6-digit OTP code
  type      VerificationType  // EMAIL_VERIFICATION, SIGN_IN, PASSWORD_RESET
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(...)
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  // OAuth tokens...
  user              User    @relation(...)
  @@unique([provider, providerAccountId])
}
```

**Security**:

- Passwords hashed with bcrypt (salt rounds: 10)
- Never store plain text passwords
- Email is unique (enforced by database)
- OAuth users have null passwordHash (cannot use credentials login)
- `allowDangerousEmailAccountLinking: true` allows linking existing email accounts

---

## Email Verification

### Implementation

**Email Provider**: Resend

**Flow**:

1. User registers with email/password or Google OAuth
2. Verification code (6-digit OTP) generated and stored in database
3. Email sent via Resend with branded HTML template
4. User enters code in onboarding wizard
5. Code validated and marked as used
6. `emailVerified` timestamp set on User
7. Proceed to next onboarding step

**Code Expiration**: 15 minutes for email verification, 5 minutes for sign-in OTP

**Security**:

- Codes are single-use
- Previous unused codes invalidated when new code requested
- Rate limiting via 60-second cooldown on resend

### Environment Variables

```env
# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=Budget App <noreply@yourdomain.com>
```

---

## Onboarding Flow

### Requirements

Before accessing the app, users must complete:

1. **Email Verification** (required)

   - 6-digit OTP sent to email
   - Must be verified to proceed

2. **Profile Setup** (required)

   - Display name
   - Base currency (for totals/reports)
   - Enabled currencies (what currencies to track)

3. **At Least 1 Income** (required)

   - Name, amount, currency, cadence
   - Optional: owner (for household budgets)

4. **At Least 1 Balance** (required)
   - Account type (checking, savings, cash, etc.)
   - Current amount and currency

### Route Protection

**Proxy (middleware)** handles all routing:

```typescript
// Protected routes require auth + completed onboarding
const protectedRoutes = ['/dashboard', '/income', ...];

// Onboarding routes require auth + NOT completed onboarding
const onboardingRoutes = ['/onboarding'];

// Auth routes redirect based on status
const authRoutes = ['/login', '/register'];
```

**Logic**:

- Not authenticated → redirect to /login
- Authenticated + onboarding incomplete + accessing protected route → redirect to /onboarding
- Authenticated + onboarding complete + accessing onboarding → redirect to /dashboard
- Authenticated + on auth route → redirect to dashboard or onboarding

---

## Protected Routes

### Route Protection Strategy

**App Router Layout Protection**:

```typescript
// app/(app)/layout.tsx
export default async function AppLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
```

**All routes under `(app)/` are protected**:

- `/dashboard`
- `/recurring`
- `/subscriptions`
- `/variables`
- `/expenses`
- `/rates`
- `/profile`

### Public Routes

- `/login` - Authentication page
- `/api/auth/*` - NextAuth API routes

---

## Account Linking

### OAuth Users Adding Password

OAuth users (e.g., signed in with Google) can add a password to enable email/password sign-in:

**Location**: Profile → Security

**Flow**:

1. OAuth user navigates to Profile page
2. Security section shows "Set Password" form (instead of "Change Password")
3. User enters new password + confirmation
4. Password is hashed with bcrypt and stored
5. User can now sign in with either:
   - Google OAuth (original method)
   - Email + Password (new method)

**Server Action**: `setPassword`

```typescript
// Only allows setting password if user doesn't already have one
if (user.passwordHash) {
  return {
    error: 'You already have a password. Use "Change Password" instead.',
  };
}
```

**Profile Display**:

- `hasPassword: false` → Shows "Set Password" form
- `hasPassword: true` → Shows "Change Password" form (requires current password)

---

## Session Management

### Session Storage

**Prisma Adapter**:

- Sessions stored in database
- Automatic cleanup of expired sessions
- Secure session tokens

### Session Structure

```typescript
{
  user: {
    id: string,
    email: string,
    name: string | null,
  },
  expires: string // ISO date
}
```

### Server-Side Access

```typescript
// Server Components / Server Actions
import { auth } from "@/lib/config/auth";

const session = await auth();
if (!session) {
  // Not authenticated
}
const userId = session.user.id;
```

### Client-Side Access

```typescript
// Client Components
"use client";

import { useSession } from "next-auth/react";

export function Component() {
  const { data: session, status } = useSession();

  if (status === "loading") return <Loading />;
  if (!session) return <NotAuthenticated />;

  return <AuthenticatedContent />;
}
```

---

## Authorization

### User-Scoped Data

**Principle**: All data queries must be scoped to the authenticated user.

**Pattern**:

```typescript
// ✅ CORRECT: Filter by userId
const expenses = await db.extraExpense.findMany({
  where: { userId: session.user.id },
});

// ❌ WRONG: No user filter (security risk)
const expenses = await db.extraExpense.findMany();
```

### Server Actions Authorization

**Every Server Action must verify session**:

```typescript
"use server";

export async function createExpense(data: unknown) {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Proceed with user-scoped operation
  await db.extraExpense.create({
    data: {
      ...validatedData,
      userId: session.user.id, // Always set userId from session
    },
  });
}
```

---

## Future Extensibility

### Email Provider

**To Add Email Provider**:

1. Install email package (e.g., `nodemailer`, `resend`)
2. Configure NextAuth email provider
3. Update User model (if needed for email verification)
4. Add email templates

**No breaking changes**: Credentials provider can coexist with Email.

### OAuth Providers

**Supported Providers**:

- Google
- GitHub
- Facebook
- Apple

**To Add OAuth**:

1. Add provider credentials to env vars
2. Configure NextAuth OAuth provider
3. Update User model (if needed for OAuth accounts)
4. Handle account linking (if user has both credentials and OAuth)

**Example**:

```typescript
// lib/auth.ts
providers: [
  CredentialsProvider({ ... }),
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
]
```

### Two-Factor Authentication (2FA)

**Future Feature**:

- Add `twoFactorEnabled` to User model
- Add `twoFactorSecret` (encrypted)
- Use TOTP (Time-based One-Time Password)
- Require 2FA code after password

**Implementation**:

- Library: `otplib` for TOTP
- QR code generation for setup
- Backup codes for recovery

### Magic Links (Passwordless)

**Future Feature**:

- Email-based login (no password)
- One-time link sent to email
- Link expires after use or time limit

**Implementation**:

- Custom NextAuth provider
- Token-based authentication
- Secure token generation and storage

---

## Security Best Practices

### Password Requirements

**Current (MVP)**: No strict requirements (can add later)

**Future**:

- Minimum 8 characters
- Require uppercase, lowercase, number
- Optional: special character requirement

### Password Reset

**Future Feature**:

1. User requests reset
2. Token generated and stored
3. Email sent with reset link
4. Link expires after 1 hour
5. User sets new password
6. Token invalidated

### Session Security

- **HttpOnly cookies**: Prevent XSS attacks
- **Secure cookies**: HTTPS only (production)
- **SameSite**: CSRF protection
- **Expiration**: Sessions expire after inactivity

### Rate Limiting

**Future Feature**:

- Limit login attempts (prevent brute force)
- Limit password reset requests
- Use middleware or external service

---

## Development Setup

### Seed User

**For Local Development**:

```typescript
// prisma/seed.ts
await db.user.create({
  data: {
    email: "dev@example.com",
    passwordHash: await bcrypt.hash("password123", 10),
    name: "Dev User",
  },
});
```

**Credentials**:

- Email: `dev@example.com`
- Password: `password123`

**⚠️ Never commit seed users to production**

---

## Environment Variables

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database (for Prisma adapter)
DATABASE_URL=postgresql://user:password@localhost:5432/budget_app

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=Budget App <noreply@yourdomain.com>
```

**NEXTAUTH_SECRET**:

- Generate: `openssl rand -base64 32`
- Keep secret (never commit)
- Required for session encryption

**Google OAuth Setup**:

1. Go to Google Cloud Console
2. Create/select a project
3. Enable OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `{NEXTAUTH_URL}/api/auth/callback/google`
6. Copy Client ID and Client Secret to env vars

---

## Testing Authentication

### Unit Tests

- Test password hashing
- Test session creation
- Test authorization checks

### Integration Tests

- Test login flow
- Test protected route access
- Test session expiration
- Test logout

### E2E Tests

- Test full authentication flow
- Test unauthorized access attempts
- Test session persistence

---

## Migration Path

### Adding New Provider

1. **No Breaking Changes**: Existing users keep credentials login
2. **Account Linking**: Allow users to link OAuth to existing account
3. **Gradual Migration**: Users can switch to OAuth over time
4. **Backward Compatible**: Credentials provider remains available

---

## Summary

**Current**:

- Credentials provider (email/password)
- Google OAuth provider
- Email verification with 6-digit OTP (via Resend)
- Onboarding wizard (profile, currencies, income, balance)
- JWT-based sessions with onboardingCompleted flag
- Proxy middleware for route protection
- User-scoped data access
- Google profile picture import
- Password change hidden for OAuth users

**Future**:

- Additional OAuth providers (GitHub, Apple, etc.)
- Two-factor authentication (TOTP)
- Password reset
- Magic links (passwordless login)

**Security Principles**:

- Always verify session in Server Actions
- Always scope data by userId
- Never trust client-side auth checks
- Use secure session storage (JWT)
- Hash passwords with bcrypt
- Email verification required before app access

This strategy provides a secure, extensible authentication system with a guided onboarding experience.
