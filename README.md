# ⚡ Brio — Finances with Spirit

[![CI](https://github.com/Parallax-Solutions/brio/actions/workflows/ci.yml/badge.svg)](https://github.com/Parallax-Solutions/brio/actions/workflows/ci.yml)
[![Production](https://img.shields.io/badge/Production-brio.parallaxsolutions.dev-00C853?logo=vercel&logoColor=white)](https://brio.parallaxsolutions.dev)
[![Development](https://img.shields.io/badge/Development-Preview-blue?logo=vercel&logoColor=white)](https://brio-git-dev-gustavoro19s-projects.vercel.app)
[![Version](https://img.shields.io/badge/version-0.1.0--alpha-orange)](https://github.com/Parallax-Solutions/brio/releases)

A production-ready multi-currency budgeting web application, built with Next.js, TypeScript, and PostgreSQL. Manage your money with energy, live your life with spirit.

> **Brio** (noun): Vivacity, vigor, spirit, enthusiasm. From Italian/Spanish, also used in music ("con brio" = with spirit).

## Environments

| Environment | URL | Branch | Status |
|-------------|-----|--------|--------|
| 🟢 Production | [brio.parallaxsolutions.dev](https://brio.parallaxsolutions.dev) | `main` | Live |
| 🔵 Development | [Preview URL](https://brio-git-dev-gustavoro19s-projects.vercel.app) | `dev` | Testing |

## Features

### Financial Management

- **Multi-Currency Support**: Track income and expenses in CRC, USD, and CAD
- **Dynamic Income Management**: Multiple income sources with configurable cadences
- **Recurring Payments**: Track recurring bills with "mark as paid" functionality
- **Subscriptions**: Manage subscription services with payment tracking
- **Variable Bills**: Track bills that change monthly (utilities)
- **Extra Expenses**: One-off expense tracking
- **Savings/Balances**: Track account balances across currencies
- **Financial Projections**: See projected balance at 3, 6, 9, 12, 18, 24 months

### Exchange Rates

- **Historical Rates**: Store and manage exchange rates over time
- **Buy/Sell Rates**: Support for both buy (compra) and sell (venta) rates
- **Chain Conversion**: Automatic fallback (e.g., CAD → USD → CRC)
- **Conversion Warnings**: Toast notifications for missing rates

### Dashboard

- **Monthly Overview**: Income vs expenses visualization
- **Interactive Charts**: Area charts, pie charts for breakdown
- **Upcoming Payments**: Track what's due with paid/unpaid status
- **Recent Transactions**: Quick view of latest activity

### User Experience

- **Theme Support**: Light/dark/system themes with 5 accent colors
- **Internationalization**: Spanish and English
- **Responsive Design**: Works on desktop and mobile
- **Animations**: Smooth transitions with Framer Motion
- **Accessibility**: WCAG 2.1 AA compliant

### Security

- **Authentication**: Email/password + Google OAuth
- **Email Verification**: OTP-based verification
- **Strong Passwords**: 8+ chars, uppercase, lowercase, special character
- **Role-Based Access**: Admin, Mod, User roles with permissions
- **Onboarding Flow**: Guided setup for new users

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Auth.js)
- **Validation**: Zod
- **Internationalization**: next-intl
- **Package Manager**: pnpm

## Prerequisites

- Node.js 18+
- pnpm
- Docker (for PostgreSQL) or PostgreSQL 14+

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory by copying from `.env.example`:

```bash
cp .env.example .env
```

Then fill in your values:

```env
# =================================
# Database
# =================================
# For local development with Docker Compose:
DATABASE_URL="postgresql://budget_user:budget_password@localhost:5432/budget_app?schema=public"

# =================================
# NextAuth
# =================================
# Generate a secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# =================================
# Next.js
# =================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# =================================
# Supabase Configuration (for avatar uploads)
# =================================
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# =================================
# Google OAuth
# =================================
# Get these from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# =================================
# Resend (Email Service)
# =================================
# Get from: https://resend.com/api-keys
RESEND_API_KEY="re_xxxxxxxxxxxx"
FROM_EMAIL="Budget App <noreply@yourdomain.com>"
```

#### Generate Secrets

**NEXTAUTH_SECRET**:

```bash
openssl rand -base64 32
```

#### Required Environment Variables

| Variable                        | Required | Description                     |
| ------------------------------- | -------- | ------------------------------- |
| `DATABASE_URL`                  | ✅       | PostgreSQL connection string    |
| `NEXTAUTH_URL`                  | ✅       | App URL for NextAuth            |
| `NEXTAUTH_SECRET`               | ✅       | Secret for JWT signing          |
| `NEXT_PUBLIC_APP_URL`           | ✅       | Public app URL                  |
| `NEXT_PUBLIC_SUPABASE_URL`      | ⚠️       | Required for avatar uploads     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️       | Required for avatar uploads     |
| `GOOGLE_CLIENT_ID`              | ⚠️       | Required for Google sign-in     |
| `GOOGLE_CLIENT_SECRET`          | ⚠️       | Required for Google sign-in     |
| `RESEND_API_KEY`                | ⚠️       | Required for email verification |
| `FROM_EMAIL`                    | ⚠️       | Required for email verification |

**Note**: ⚠️ = Required for specific features to work

### 3. Start PostgreSQL

Using Docker Compose:

```bash
docker compose up -d
```

Or use your own PostgreSQL instance and update `DATABASE_URL` in `.env`.

### 4. Run Database Migrations

```bash
pnpm db:migrate
```

### 5. Seed Database

```bash
pnpm db:seed
```

This creates:

- Dev user: `dev@example.com` / `Password123!`
- Sample income source
- Sample exchange rates
- Sample recurring payments and subscriptions

**Note**: Password must be 8+ characters with uppercase, lowercase, and special character.

### 6. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

### Development
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Quality
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm type-check` - Run TypeScript type checking
- `pnpm test` - Run tests (placeholder)

### Database
- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:studio` - Open Prisma Studio

### Versioning
- `pnpm version` - Show current version and help
- `pnpm version current` - Display current version
- `pnpm version bump <type>` - Bump version (patch/minor/major)
- `pnpm version set <version>` - Set specific version

## Project Structure

```
app/
  (auth)/              # Public auth routes
    login/
    register/
  (onboarding)/        # Onboarding flow
    onboarding/
      steps/           # Onboarding step components
  (app)/               # Protected app routes
    dashboard/
    income/
    recurring/
    subscriptions/
    variables/
    expenses/
    rates/
    savings/
    users/             # Admin only
    profile/
  api/
    auth/
      [...nextauth]/
      register/
    expenses/
    incomes/
    rates/
    recurring-payments/
    savings/
    subscriptions/
    users/
    variables/
components/
  ui/                  # shadcn/ui components
  forms/               # Form components
  dashboard/           # Dashboard components
  layout/              # Layout components
  shared/              # Shared/reusable components
  providers/           # Context providers
lib/
  config/              # Configuration (auth, db, supabase)
  server/              # Server Actions
  utils/               # Utility functions
  i18n/                # Internationalization
prisma/
  schema.prisma        # Database schema
  migrations/          # Database migrations
  seed.ts              # Seed script
scripts/
  version.js           # Version management utility
docs/                  # Documentation
messages/              # i18n translations (en.json, es.json)
types/                 # TypeScript type definitions
hooks/                 # Custom React hooks
.github/
  workflows/           # GitHub Actions (CI, Release)
```

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- `deployment.md` - Complete deployment guide and CI/CD setup
- `vercel-setup.md` - Vercel configuration and preview deployments
- `mission.md` - Product mission and goals
- `vision.md` - Long-term vision
- `roadmap.md` - Development roadmap
- `product-scope.md` - In-scope and out-of-scope features
- `architecture.md` - System architecture
- `tech-stack.md` - Technology choices
- `data-model.md` - Database schema explanation
- `currency-handling.md` - Multi-currency strategy
- `auth-strategy.md` - Authentication approach
- `theming-and-i18n.md` - Theme and i18n implementation
- `accessibility.md` - Accessibility guidelines
- `contributing.md` - Contribution guidelines
- `decisions-log.md` - Architecture Decision Records

## Currency Handling

- All amounts stored as integers (cents for USD/CAD, colones for CRC)
- Conversions cached for performance
- Historical exchange rates supported
- Base currency: CRC (configurable per user)

## Authentication

- **Credentials Provider**: Email/password with strong password requirements
- **Google OAuth**: One-click sign-in with Google
- **Email Verification**: OTP-based verification via Resend
- **Account Linking**: OAuth users can add password for dual sign-in
- **Session Management**: JWT-based via NextAuth
- **Protected Routes**: Proxy middleware + layout checks
- **Onboarding Flow**: Required setup wizard for new users

## Theme & Localization

- **Themes**: Light, Dark, System
- **Accent Colors**: Blue, Emerald, Violet, Rose, Amber
- **Languages**: Spanish (default), English
- Preferences stored in database

## Development

### Adding a New Page

1. Create page in `app/(app)/new-page/page.tsx`
2. Add to navigation in `components/layout/app-nav.tsx`
3. Create Server Actions in `app/actions/`
4. Add translations to `messages/`

### Adding a Database Model

1. Update `prisma/schema.prisma`
2. Run `pnpm db:migrate`
3. Update seed script if needed
4. Update `docs/data-model.md`

## Deployment

Brio uses automated CI/CD with GitHub Actions and Vercel for seamless deployments.

### Environments

- **Development** (`dev` branch): Auto-deploys to https://brio-dev.vercel.app
- **Production** (`main` branch): Versioned releases to https://brio.parallaxsolutions.dev

### Version Management

Brio uses [Semantic Versioning](https://semver.org/) (SemVer): `MAJOR.MINOR.PATCH[-PRERELEASE]`

**Current version**: `0.1.0-alpha`

#### Version Script (`scripts/version.js`)

A local utility for managing versions across `package.json` and `VERSION` files:

```bash
# Show current version and help
pnpm version

# Check current version only
pnpm version current

# Bump version (updates both package.json and VERSION file)
pnpm version bump patch    # 0.1.0 → 0.1.1 (bug fixes)
pnpm version bump minor    # 0.1.0 → 0.2.0 (new features)
pnpm version bump major    # 0.1.0 → 1.0.0 (breaking changes)

# Set specific version
pnpm version set 1.0.0-beta
```

**When to use locally:**
- Quick version checks during development
- Manual version bumps before committing
- Setting pre-release versions (alpha, beta, rc)

#### GitHub Actions Release Workflow

For automated, versioned releases to production:

1. Go to **Actions** → **Create Release**
2. Click **Run workflow**
3. Select version type (`patch`, `minor`, `major`)
4. Optionally add pre-release tag and notes
5. Workflow creates a release PR automatically

**When to use:**
- Creating official releases
- Deploying to production with version tags
- Automated changelog generation

### CI/CD Pipeline

| Trigger | Action | Environment |
|---------|--------|-------------|
| Push to `dev` | Vercel auto-deploys | Preview |
| Push to `main` | Vercel auto-deploys | Production |
| PR to any branch | CI checks (lint, type-check) | - |
| Create Release workflow | Creates version PR | - |

### Development Deployment

Push to `dev` branch → Automatic deployment with database migration.

### Production Deployment

**Option 1: Automated (Recommended)**
1. **Create Release**: Use GitHub Actions "Create Release" workflow
2. **Version Bump**: Select patch/minor/major version increment
3. **Merge PR**: Approve and merge the auto-generated release PR
4. **Tag Release**: Create GitHub release with version tag

**Option 2: Manual**
1. Bump version locally: `pnpm version bump minor`
2. Commit and push to `main`
3. Create GitHub release with tag

See `docs/deployment.md` for detailed deployment instructions.

### Self-Hosted Deployment

1. Set up PostgreSQL database
2. Set environment variables (see `.env.example`)
3. Run migrations: `pnpm prisma migrate deploy`
4. Build: `pnpm build`
5. Start: `pnpm start`

## License

Private project - All rights reserved

## Support

For issues or questions, please refer to the documentation in `/docs` or create an issue.
