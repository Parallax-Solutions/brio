# Tech Stack

This document outlines the technology choices for the Brio and the rationale behind each decision.

---

## Frontend

### Next.js 16+ (App Router)
**Why**: 
- Modern React framework with excellent developer experience
- Built-in Server Components for optimal performance
- App Router provides clean routing and layouts
- Server Actions eliminate need for API routes for mutations
- Excellent TypeScript support
- Production-ready with great performance

**Alternatives Considered**: Remix, SvelteKit
**Decision**: Next.js chosen for maturity, ecosystem, and App Router features

### React 19
**Why**:
- Latest React with improved Server Components support
- Better performance and developer experience
- Required by Next.js 16+

### TypeScript
**Why**:
- Type safety prevents bugs
- Better IDE support and autocomplete
- Self-documenting code
- Required for production-grade applications

### Tailwind CSS 4
**Why**:
- Utility-first CSS framework
- Rapid UI development
- Consistent design system
- Excellent dark mode support
- Small bundle size with purging

**Alternatives Considered**: CSS Modules, styled-components
**Decision**: Tailwind chosen for speed and consistency

---

## UI Components

### shadcn/ui
**Why**:
- High-quality, accessible components
- Built on Radix UI primitives
- Fully customizable (copy-paste, not npm package)
- Excellent TypeScript support
- WCAG compliant by default

**Components Used**:
- Card, Table, Button, Dialog, Tabs, Badge, Input, Select, etc.

**Alternatives Considered**: Material-UI, Chakra UI, Ant Design
**Decision**: shadcn/ui chosen for accessibility, customization, and no vendor lock-in

### TanStack Table
**Why**:
- Powerful table component for complex data
- Headless (full control over UI)
- Excellent TypeScript support
- Sorting, filtering, pagination built-in

**Usage**: Data tables across the app (expenses, payments, etc.)

### Recharts
**Why**:
- React-based charting library
- Composable components
- Good TypeScript support
- Responsive by default
- Works well with shadcn/ui styling

**Usage**:
- Income vs Expenses area chart
- Expense breakdown pie chart
- Income sources pie chart
- Financial projections chart

**Alternatives Considered**: Chart.js, Nivo, Victory
**Decision**: Recharts chosen for React integration and composability

### Framer Motion
**Why**:
- Powerful animation library for React
- Declarative API
- Exit animations support
- Great performance
- Gesture support

**Usage**:
- Page transitions
- Staggered list animations
- Micro-interactions
- Loading states

**Alternatives Considered**: React Spring, CSS animations only
**Decision**: Framer Motion chosen for ease of use and features

---

## Backend

### Next.js Server Actions
**Why**:
- No API routes needed for mutations
- Type-safe end-to-end
- Automatic revalidation
- Simpler codebase
- Better performance (no extra network hop)

**Alternatives Considered**: tRPC, REST API routes
**Decision**: Server Actions chosen for simplicity and Next.js integration

### Prisma ORM
**Why**:
- Type-safe database access
- Excellent migration system
- Great developer experience
- Auto-generated TypeScript types
- Supports PostgreSQL (and others if needed)

**Alternatives Considered**: Drizzle, TypeORM, raw SQL
**Decision**: Prisma chosen for type safety and DX

### PostgreSQL
**Why**:
- Robust relational database
- Excellent for financial data (ACID compliance)
- JSON support for flexible fields
- Great performance
- Free and open-source
- Docker-friendly

**Alternatives Considered**: MySQL, SQLite
**Decision**: PostgreSQL chosen for reliability and features

---

## Authentication

### NextAuth.js (Auth.js)
**Why**:
- Industry-standard authentication for Next.js
- Prisma adapter available
- Multiple providers (Credentials + Google OAuth)
- Session management built-in
- Secure by default

**Providers**:
- Credentials (email/password with strong validation)
- Google OAuth (one-click sign-in)

**Features**:
- JWT-based sessions
- Email verification via OTP
- Account linking (OAuth users can add password)
- Role-based access control (Admin, Mod, User)

**Alternatives Considered**: Clerk, Supabase Auth, custom
**Decision**: NextAuth chosen for Next.js integration and flexibility

---

## Email Service

### Resend
**Why**:
- Modern email API with great DX
- React Email support for templates
- High deliverability
- Simple pricing
- Great TypeScript support

**Usage**:
- Email verification OTPs
- Sign-in codes
- Future: notifications, reports

**Environment Variables**:
- `RESEND_API_KEY`: API key from Resend dashboard
- `FROM_EMAIL`: Sender email address

**Alternatives Considered**: SendGrid, Mailgun, AWS SES
**Decision**: Resend chosen for DX and React Email integration

---

## File Storage

### Supabase Storage
**Why**:
- Easy to set up for avatar uploads
- CDN included
- Public URLs for avatars
- S3-compatible API
- Generous free tier

**Usage**:
- User avatar uploads
- Future: receipt/document storage

**Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

**Alternatives Considered**: Cloudinary, AWS S3, Vercel Blob
**Decision**: Supabase chosen for simplicity and free tier

---

## Validation

### Zod
**Why**:
- TypeScript-first schema validation
- Type inference from schemas
- Runtime validation
- Great error messages
- Works with forms and Server Actions

**Alternatives Considered**: Yup, Joi, class-validator
**Decision**: Zod chosen for TypeScript integration

---

## Internationalization

### next-intl
**Why**:
- Built for Next.js App Router
- Server and Client Component support
- Type-safe translations
- Locale-aware formatting (dates, numbers, currency)
- Excellent performance

**Alternatives Considered**: next-i18next, react-intl
**Decision**: next-intl chosen for App Router compatibility

---

## Development Tools

### pnpm
**Why**:
- Faster than npm/yarn
- Efficient disk usage
- Better monorepo support
- Lock file ensures consistency

### ESLint
**Why**:
- Code quality enforcement
- Catches bugs early
- Next.js config included

### TypeScript
**Why**:
- Static type checking
- Better IDE support
- Prevents runtime errors

---

## Deployment & Infrastructure

### Docker Compose
**Why**:
- Easy local PostgreSQL setup
- Consistent development environment
- Production-like database locally

### Environment Variables
**Why**:
- Secure configuration management
- Different configs for dev/prod
- No secrets in code

---

## Testing (Future)

### Vitest (planned)
**Why**:
- Fast test runner
- Vite-based (fast)
- Great TypeScript support
- Jest-compatible API

### Testing Library (planned)
**Why**:
- React component testing
- User-centric testing approach
- Accessible queries

---

## Why Not These Technologies?

### tRPC
- Overkill for this app size
- Server Actions simpler for our needs
- Adds complexity without clear benefit

### GraphQL
- REST/Server Actions sufficient
- Adds complexity
- No clear need for flexible queries

### Redux / Zustand
- Not needed for this app's state complexity
- Server Components handle most state
- React state sufficient for client state

### Styled Components / Emotion
- Tailwind provides better DX
- No runtime CSS-in-JS overhead
- Better performance with Tailwind

---

## Future Considerations

### Technologies We Might Add
- **Vitest**: For unit/integration tests
- **Playwright**: For E2E tests
- **Sentry**: For error tracking
- **Vercel Analytics**: For performance monitoring
- **Stripe**: If we add payment features (V3+)

### Technologies We Won't Add (Unless Needed)
- **Redis**: Caching not needed yet
- **Message Queue**: No async jobs yet
- **Microservices**: Monolith is fine for this scale
- **GraphQL**: REST/Server Actions sufficient

---

## Version Pinning

We pin major versions but allow patch/minor updates:
- Next.js: `^16.1.1` (allow minor/patch)
- React: `^19.2.3` (allow minor/patch)
- Prisma: `^latest` (check compatibility)

**Rationale**: Security updates and bug fixes while maintaining stability.

---

## Summary

This tech stack prioritizes:
1. **Developer Experience**: TypeScript, Prisma, shadcn/ui
2. **Performance**: Server Components, Tailwind
3. **Type Safety**: TypeScript, Zod, Prisma
4. **Accessibility**: shadcn/ui, WCAG compliance
5. **Simplicity**: Server Actions over API routes, minimal dependencies

The stack is modern, production-ready, and maintainable.


