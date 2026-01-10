# Architecture

## High-Level Architecture

The Brio is built as a full-stack Next.js application using the App Router pattern, with a clear separation between server and client components.

---

## Project Structure

```
budget-app/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Protected app routes
│   ├── (auth)/                   # Public auth routes
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   ├── forms/                    # Form components
│   │   ├── expense-form.tsx
│   │   ├── income-form.tsx
│   │   ├── rate-form.tsx
│   │   ├── recurring-payment-form.tsx
│   │   ├── subscription-form.tsx
│   │   ├── bill-type-form.tsx
│   │   └── login-form.tsx
│   ├── layout/                   # Layout components
│   │   ├── app-sidebar.tsx
│   │   ├── site-header.tsx
│   │   ├── nav-main.tsx
│   │   ├── nav-secondary.tsx
│   │   └── nav-user.tsx
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── budget-cards.tsx
│   │   ├── chart-area-interactive.tsx    # Income vs Expenses over time
│   │   ├── chart-expense-breakdown.tsx   # Pie chart: expense categories
│   │   ├── chart-income-sources.tsx      # Pie chart: income sources
│   │   ├── chart-projections.tsx         # Financial projections chart
│   │   ├── recent-transactions.tsx
│   │   ├── dashboard-header.tsx
│   │   ├── conversion-warnings.tsx
│   │   └── section-cards.tsx
│   ├── shared/                   # Shared reusable components
│   │   ├── data-table/           # Data table components
│   │   ├── crud-page.tsx         # Reusable CRUD page component
│   │   ├── animations.tsx        # Animation components (Framer Motion)
│   │   ├── page-wrapper.tsx      # Page wrapper with loading states
│   │   ├── password-requirements.tsx  # Real-time password validation
│   │   ├── locale-switcher.tsx
│   │   ├── theme-toggle.tsx
│   │   └── accent-color-selector.tsx
│   └── providers/                # Context providers
│       ├── theme-provider.tsx    # next-themes provider
│       ├── session-provider.tsx  # NextAuth session provider
│       └── preferences-sync.tsx  # Syncs theme/accent from DB
│
├── lib/                          # Library code
│   ├── config/                   # Configuration
│   │   ├── auth.ts               # NextAuth configuration
│   │   ├── db.ts                 # Prisma client
│   │   └── supabase.ts           # Supabase client
│   ├── server/                   # Server actions
│   │   ├── avatar.ts             # Avatar upload/delete
│   │   ├── email.ts              # Email sending (Resend)
│   │   ├── expenses.ts           # Expense CRUD
│   │   ├── incomes.ts            # Income CRUD
│   │   ├── onboarding.ts         # Onboarding flow actions
│   │   ├── profile.ts            # Profile management + password
│   │   ├── rates.ts              # Exchange rate CRUD
│   │   ├── recurring-payments.ts # Recurring payment CRUD + mark paid
│   │   ├── savings.ts            # Balance/savings CRUD + projections
│   │   ├── subscriptions.ts      # Subscription CRUD + mark paid
│   │   ├── users.ts              # User management (admin)
│   │   └── variables.ts          # Variable bill CRUD
│   ├── i18n/                     # Internationalization
│   │   ├── config.ts             # i18n configuration
│   │   └── context.tsx           # i18n React context
│   ├── utils/                    # Utility functions
│   │   ├── cn.ts                 # className utility (shadcn)
│   │   ├── dates.ts              # Date formatting utilities
│   │   ├── money.ts              # Currency conversion + formatting
│   │   ├── periods.ts            # Payment period calculations
│   │   └── permissions.ts        # Role-based access control
│   └── get-server-session.ts     # Auth session helper
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.tsx
│   └── use-mounted.ts
│
├── types/                        # TypeScript type definitions
│   └── next-auth.d.ts
│
├── messages/                     # i18n translation files
│   ├── en.json
│   └── es.json
│
├── prisma/                       # Database
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── docs/                         # Documentation
│
└── public/                       # Static assets
```

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
├─────────────────────────────────────────────────────────┤
│  Server Components (Default)                            │
│  - Data fetching                                        │
│  - Server Actions (mutations)                           │
│  - Authentication checks                                 │
├─────────────────────────────────────────────────────────┤
│  Client Components (When Needed)                        │
│  - Interactive UI (forms, dialogs)                       │
│  - Theme switching                                      │
│  - Real-time updates                                    │
├─────────────────────────────────────────────────────────┤
│  API Layer                                              │
│  - NextAuth routes (/api/auth/[...nextauth])           │
│  - Server Actions (app/actions/)                        │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                             │
│  - Prisma ORM                                           │
│  - PostgreSQL Database                                  │
└─────────────────────────────────────────────────────────┘
```

---

## App Router Structure

### Route Organization

```
app/
  (auth)/                    # Public auth routes
    login/
      page.tsx
  (app)/                     # Protected app routes
    layout.tsx               # Protected layout with auth check
    dashboard/
      page.tsx
    recurring/
      page.tsx
    subscriptions/
      page.tsx
    variables/
      page.tsx
    expenses/
      page.tsx
    rates/
      page.tsx
    profile/
      page.tsx
  api/
    auth/
      [...nextauth]/
        route.ts
  layout.tsx                 # Root layout (theme, i18n)
  page.tsx                   # Redirect to dashboard or login
```

### Route Groups
- `(auth)`: Public authentication routes (login, register)
- `(onboarding)`: Onboarding flow for new users
- `(app)`: Protected application routes requiring authentication + completed onboarding

---

## Server Components vs Client Components

### Server Components (Default)

**Use Server Components for:**
- Data fetching from database
- Static content rendering
- Layout components
- Initial page loads
- SEO-important content

**Benefits:**
- Reduced JavaScript bundle size
- Faster initial page loads
- Direct database access
- Better SEO

**Example:**
```typescript
// app/(app)/dashboard/page.tsx
export default async function DashboardPage() {
  const session = await getServerSession();
  const expenses = await getExpenses(session.user.id);
  return <ExpenseList expenses={expenses} />;
}
```

### Client Components (When Needed)

**Use Client Components for:**
- Interactive forms and inputs
- Dialogs and modals
- Theme switching
- Real-time UI updates
- Browser APIs (localStorage, etc.)

**Mark with `'use client'` directive:**
```typescript
'use client';

import { useState } from 'react';

export function ExpenseForm() {
  const [amount, setAmount] = useState(0);
  // ... interactive logic
}
```

---

## Server Actions

### Pattern

All mutations use Server Actions (not API routes) for:
- Creating records
- Updating records
- Deleting records
- Marking payments as paid
- Updating exchange rates

**Location**: `lib/server/`

**Structure**:
```typescript
// lib/server/expenses.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/config/db';
import { auth } from '@/lib/config/auth';

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['CRC', 'USD', 'CAD']),
  // ...
});

export async function createExpense(data: unknown) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  
  const validated = createExpenseSchema.parse(data);
  // ... database operation
}
```

### Validation
- All Server Actions validate input with Zod schemas
- Validation errors are returned as user-friendly messages
- Type safety enforced with TypeScript

---

## Authentication Flow

### NextAuth (Auth.js) Setup

**Providers**:
- Credentials (email/password with strong validation)
- Google OAuth (one-click sign-in)

**Registration Flow**:
1. User registers via email/password or Google OAuth
2. Account created in database
3. Auto sign-in after registration
4. Redirect to `/onboarding`

**Onboarding Flow** (required for new users):
1. Email verification (6-digit OTP via Resend)
2. Profile setup (name, base currency, enabled currencies)
3. Add at least 1 income source
4. Add at least 1 balance/account
5. Onboarding complete → redirect to dashboard

**Login Flow**:
1. User signs in via credentials or Google
2. JWT session created with `onboardingCompleted` flag
3. Proxy checks onboarding status:
   - If not completed → redirect to `/onboarding`
   - If completed → proceed to `/dashboard`

**Route Protection** (via `proxy.ts`):
- Auth routes (`/login`, `/register`): Public only, redirect if authenticated
- Onboarding routes (`/onboarding`): Require auth, not completed onboarding
- App routes (`/dashboard`, etc.): Require auth + completed onboarding

**Session Management**:
- JWT-based sessions (not database sessions)
- Token includes `onboardingCompleted`, `emailVerified`, `role`
- Server-side session validation
- Client-side session access via `useSession()` hook

**Account Linking**:
- OAuth users can add password via Profile → Security
- Enables dual sign-in (Google OR email/password)

---

## Data Flow

### Reading Data (Server Components)

```
User Request → Server Component → Prisma → PostgreSQL → Render
```

1. User navigates to page
2. Server Component fetches data directly from database
3. Data rendered on server
4. HTML sent to client

### Mutating Data (Server Actions)

```
User Action → Client Component → Server Action → Prisma → PostgreSQL → Revalidation
```

1. User interacts with form/button
2. Client Component calls Server Action
3. Server Action validates and mutates database
4. Next.js revalidates affected routes
5. UI updates automatically

### Real-time Updates

For immediate UI feedback:
- Optimistic updates in Client Components
- `useTransition` for loading states
- `revalidatePath` in Server Actions to refresh data

---

## State Management

### Server State
- Managed by React Server Components
- Fetched fresh on each request
- Cached via Next.js caching strategies

### Client State
- React `useState` for component-local state
- React `useTransition` for async actions
- No global state management library needed (keeping it simple)

### Form State
- React Hook Form for complex forms
- Zod for validation
- Server Actions for submission

---

## Database Access

### Prisma ORM

**Single Database Client**:
```typescript
// lib/config/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();
```

**Usage**:
- Import `db` in Server Components and Server Actions
- Never use in Client Components
- Connection pooling handled by Prisma

---

## Error Handling

### Server Actions
- Return `{ success: boolean, error?: string, data?: T }` pattern
- Catch and return user-friendly error messages
- Log errors server-side for debugging

### UI Errors
- Display inline validation errors
- Toast notifications for action results
- Graceful degradation for missing data

---

## Performance Optimizations

### Caching Strategy
- Static pages cached where possible
- Dynamic data fetched fresh (budget data changes frequently)
- Exchange rates cached with revalidation

### Code Splitting
- Automatic with Next.js App Router
- Client Components code-split automatically
- Server Components not included in client bundle

### Database Queries
- Use Prisma `select` to fetch only needed fields
- Eager loading with `include` for related data
- Indexes on frequently queried fields

---

## Security

### Authentication
- Server-side session validation (JWT)
- Protected routes via proxy middleware + layout checks
- CSRF protection via NextAuth
- Email verification required for app access
- Strong password requirements (8+ chars, uppercase, lowercase, special char)

### Data Validation
- Zod schemas for all inputs (client + server)
- Type-safe database queries via Prisma
- SQL injection prevention (Prisma handles)
- Password regex validation on registration and profile

### Authorization
- Role-based access control (Admin, Mod, User)
- User-scoped queries (always filter by userId)
- Server Actions verify session before operations
- Permission checks in server actions (`lib/utils/permissions.ts`)
- No client-side authorization logic

### Permissions Matrix
| Permission | Admin | Mod | User |
|------------|-------|-----|------|
| View users | ✅ | ✅ | ❌ |
| Edit users | ✅ | ✅* | ❌ |
| Delete users | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |

*Mods can only edit Users, not other Mods or Admins

---

## Internationalization (i18n)

### next-intl Integration

**Structure**:
```
messages/
  en.json
  es.json
```

**Usage**:
- Server Components: `await getTranslations()`
- Client Components: `useTranslations()`
- All user-facing text translated
- Dates/numbers formatted by locale

---

## Theming

### Theme System
- CSS variables for colors
- Tailwind dark mode
- User preference stored in database
- System theme detection

### Accent Colors
- Predefined color options
- CSS variable-based implementation
- Accessible contrast ratios maintained

---

## Reusable Components

### CrudPage Component

The `CrudPage` component (`components/shared/crud-page.tsx`) is a highly reusable component that handles the common CRUD (Create, Read, Update, Delete) pattern used across many pages in the application.

**Features:**
- Data fetching with loading states
- Search filtering
- Customizable filter dropdowns
- Pagination
- Row selection for bulk operations
- Add/Edit dialog with form integration
- Delete confirmation dialog
- Toggle active/pause state support
- Custom row actions support

**Usage:**
```typescript
import { CrudPage } from '@/components/shared';

export default function ExpensesPage() {
  const columns = useMemo(() => [...], []);
  const filters = useMemo(() => [...], []);

  return (
    <CrudPage<Expense>
      translationNamespace="expenses"
      apiEndpoint="/api/expenses"
      deleteAction={deleteExpense}
      columns={columns}
      searchField="description"
      filters={filters}
      renderForm={({ item, onSuccess }) => (
        <ExpenseForm expense={item} onSuccess={onSuccess} />
      )}
    />
  );
}
```

**Props:**
- `translationNamespace`: Translation key prefix for i18n
- `apiEndpoint`: API endpoint for fetching data
- `deleteAction`: Server action to delete an item
- `toggleActiveAction`: (Optional) Server action to toggle active state
- `columns`: TanStack Table column definitions
- `searchField`: Field to search on
- `filters`: Array of filter configurations
- `filterFn`: (Optional) Custom filter function
- `hasActiveState`: (Optional) Whether items have active/paused state
- `activeField`: (Optional) Field name for active state
- `customActions`: (Optional) Custom dropdown menu actions
- `renderForm`: Render prop for the add/edit form
- `dialogMaxWidth`: (Optional) Dialog max width class

---

## Future Extensibility

The architecture supports:
- Adding OAuth providers (NextAuth)
- Adding more currencies (database schema)
- Household mode (user relationships)
- Real-time updates (WebSockets if needed)
- Mobile apps (API routes can be added)


