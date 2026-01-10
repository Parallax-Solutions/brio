# Decisions Log

This document records Architecture Decision Records (ADRs) for the Costa Rica Multi-Currency Budget App. Each decision includes context, the decision made, alternatives considered, and consequences.

---

## ADR-001: Next.js App Router over Pages Router

**Date**: 2024-01-XX

**Context**: Choosing the routing strategy for the Next.js application.

**Decision**: Use Next.js App Router (not Pages Router).

**Alternatives Considered**:
1. **Pages Router**: Mature, stable, well-documented
2. **App Router**: Modern, Server Components, better performance

**Rationale**:
- App Router provides Server Components by default (better performance)
- Server Actions eliminate need for API routes
- Better TypeScript support
- Future-proof (Next.js direction)
- Cleaner code organization

**Consequences**:
- ✅ Smaller client bundle (Server Components)
- ✅ Better SEO (server-rendered)
- ✅ Simpler data fetching
- ⚠️ Learning curve for team (if unfamiliar)
- ⚠️ Some libraries may not support App Router yet

**Status**: Implemented

---

## ADR-002: Prisma over Raw SQL or Other ORMs

**Date**: 2024-01-XX

**Context**: Choosing database access layer.

**Decision**: Use Prisma ORM.

**Alternatives Considered**:
1. **Raw SQL**: Maximum control, but verbose and error-prone
2. **TypeORM**: Mature, but more complex
3. **Drizzle**: Lightweight, but less mature
4. **Prisma**: Type-safe, great DX, excellent migrations

**Rationale**:
- Type-safe database access (TypeScript)
- Excellent migration system
- Auto-generated types
- Great developer experience
- Active development and community

**Consequences**:
- ✅ Type safety end-to-end
- ✅ Easy migrations
- ✅ Great DX
- ⚠️ Learning curve (if unfamiliar)
- ⚠️ Some advanced SQL features may require raw queries

**Status**: Implemented

---

## ADR-003: Separate Subscription Model vs. RecurringPayment with Type Field

**Date**: 2024-01-XX

**Context**: How to model subscriptions (Netflix, Spotify) vs. recurring payments (rent, insurance).

**Decision**: Separate `Subscription` model (not a `type` field on `RecurringPayment`).

**Alternatives Considered**:
1. **Single RecurringPayment with `type` field**: Less duplication
2. **Separate Subscription model**: Clear separation, easier to extend

**Rationale**:
- Clear separation of concerns
- Easier to filter and query subscriptions separately
- Can add subscription-specific fields later (e.g., trial period, cancellation date)
- Better for future features (subscription analytics, renewal tracking)
- Slight duplication is acceptable for clarity

**Consequences**:
- ✅ Clear data model
- ✅ Easy to extend subscription features
- ✅ Better query performance (separate tables)
- ⚠️ Slight code duplication
- ⚠️ Two similar models to maintain

**Status**: Implemented

---

## ADR-004: Integer Storage for Currency Amounts

**Date**: 2024-01-XX

**Context**: How to store currency amounts to avoid floating-point errors.

**Decision**: Store all amounts as integers (cents for USD/CAD, colones for CRC).

**Alternatives Considered**:
1. **Floating Point (Decimal/Number)**: Simple, but precision errors
2. **Decimal Type**: Precise, but more complex
3. **Integer (cents/colones)**: Precise, simple math

**Rationale**:
- Avoids floating-point precision errors
- Simple integer arithmetic
- Standard practice for financial applications
- Easy to convert for display (divide by 100 for USD/CAD)

**Consequences**:
- ✅ No precision errors
- ✅ Simple calculations
- ✅ Industry standard
- ⚠️ Must convert for display (divide by 100)
- ⚠️ Must convert on input (multiply by 100)

**Status**: Implemented

---

## ADR-005: Cache Currency Conversions vs. Always Recalculate

**Date**: 2024-01-XX

**Context**: Whether to store converted amounts or recalculate on every query.

**Decision**: Cache converted amounts (`convertedAmountCRC`) but allow recalculation.

**Alternatives Considered**:
1. **Always Recalculate**: Always accurate, but slower
2. **Cache Conversions**: Faster, but may become stale
3. **Hybrid**: Cache with recalculation option

**Rationale**:
- Performance: Avoid recalculating on every query
- Historical Accuracy: Preserve conversion used at time of transaction
- Audit Trail: Store `rateId` to know which rate was used
- Flexibility: Can recalculate if needed

**Consequences**:
- ✅ Better query performance
- ✅ Historical accuracy preserved
- ✅ Audit trail (rateId)
- ⚠️ Must handle missing conversions
- ⚠️ May need recalculation if rates change significantly

**Status**: Implemented

---

## ADR-006: NextAuth Credentials Provider (MVP) vs. OAuth from Start

**Date**: 2024-01-XX

**Context**: Authentication provider for MVP.

**Decision**: Start with Credentials provider, easy to extend to OAuth/Email later.

**Alternatives Considered**:
1. **OAuth from Start**: Better UX, but more setup
2. **Email Provider**: Passwordless, but requires email service
3. **Credentials**: Simple, easy to test, extensible

**Rationale**:
- Simplest to implement for MVP
- No external dependencies (email service, OAuth apps)
- Easy to test locally
- Can add OAuth/Email later without breaking changes
- NextAuth supports multiple providers simultaneously

**Consequences**:
- ✅ Fast MVP delivery
- ✅ No external dependencies
- ✅ Easy local testing
- ⚠️ Users must create account (no social login yet)
- ✅ Can add OAuth later seamlessly

**Status**: Implemented

---

## ADR-007: next-intl for Internationalization

**Date**: 2024-01-XX

**Context**: Choosing i18n solution for Next.js App Router.

**Decision**: Use next-intl.

**Alternatives Considered**:
1. **next-i18next**: Mature, but Pages Router focused
2. **react-intl**: Popular, but complex setup
3. **next-intl**: Built for App Router, type-safe

**Rationale**:
- Built specifically for Next.js App Router
- Supports both Server and Client Components
- Type-safe translations
- Locale-aware formatting (dates, numbers, currency)
- Active development

**Consequences**:
- ✅ App Router compatible
- ✅ Type-safe translations
- ✅ Server/Client Component support
- ⚠️ Less mature than alternatives (but actively developed)

**Status**: Implemented

---

## ADR-008: shadcn/ui over Component Library NPM Package

**Date**: 2024-01-XX

**Context**: Choosing UI component library.

**Decision**: Use shadcn/ui (copy-paste components, not npm package).

**Alternatives Considered**:
1. **Material-UI**: Mature, but opinionated design
2. **Chakra UI**: Good, but npm package (vendor lock-in)
3. **Ant Design**: Feature-rich, but heavy
4. **shadcn/ui**: Copy-paste, fully customizable, accessible

**Rationale**:
- No vendor lock-in (components in your codebase)
- Fully customizable (modify as needed)
- Built on Radix UI (accessible)
- Tailwind CSS based (matches our stack)
- Copy-paste model (own the code)

**Consequences**:
- ✅ Full control over components
- ✅ No vendor lock-in
- ✅ Accessible by default (Radix UI)
- ⚠️ Must maintain components ourselves
- ⚠️ Updates require manual copy-paste

**Status**: Implemented

---

## ADR-009: Server Actions over API Routes for Mutations

**Date**: 2024-01-XX

**Context**: How to handle data mutations (create, update, delete).

**Decision**: Use Server Actions (not API routes) for all mutations.

**Alternatives Considered**:
1. **API Routes**: Traditional approach, explicit endpoints
2. **tRPC**: Type-safe, but adds complexity
3. **Server Actions**: Built into Next.js, type-safe, simpler

**Rationale**:
- Built into Next.js App Router
- Type-safe end-to-end (TypeScript)
- No extra network hop (direct server call)
- Automatic revalidation
- Simpler codebase (no API route files)

**Consequences**:
- ✅ Simpler code (no API routes)
- ✅ Type-safe
- ✅ Better performance (no extra hop)
- ✅ Automatic revalidation
- ⚠️ Less flexible than API routes (but sufficient for our needs)

**Status**: Implemented

---

## ADR-010: Predefined Accent Colors vs. Arbitrary Hex Colors

**Date**: 2024-01-XX

**Context**: How to implement accent color selection.

**Decision**: Predefined accent colors (blue, emerald, violet, rose, amber) - not arbitrary hex.

**Alternatives Considered**:
1. **Arbitrary Hex**: Maximum flexibility, but contrast issues
2. **Predefined Colors**: Limited options, but guaranteed accessibility

**Rationale**:
- Ensures WCAG AA contrast compliance
- Consistent design system
- Easier to maintain
- Tested color combinations
- Can add more predefined colors later

**Consequences**:
- ✅ Guaranteed accessibility
- ✅ Consistent design
- ✅ Easy to maintain
- ⚠️ Limited color options (but can add more)
- ✅ Can extend with more predefined colors

**Status**: Implemented

---

## ADR-011: Database-Backed Theme/Locale Preferences vs. localStorage Only

**Date**: 2024-01-XX

**Context**: Where to store user preferences (theme, accent, locale).

**Decision**: Store in database (User model) with localStorage fallback for immediate UI update.

**Alternatives Considered**:
1. **localStorage Only**: Simple, but not synced across devices
2. **Database Only**: Synced, but slower initial load
3. **Hybrid**: Database + localStorage (best of both)

**Rationale**:
- Preferences sync across devices
- Persists if user clears browser data
- localStorage provides immediate UI update (no wait for DB)
- Best user experience

**Consequences**:
- ✅ Synced across devices
- ✅ Immediate UI update (localStorage)
- ✅ Persistent (database)
- ⚠️ Slight complexity (two sources of truth, but DB is source of truth)

**Status**: Implemented

---

## Future Decisions to Document

As the project evolves, document:
- Choice of testing framework (Vitest, Jest, etc.)
- Choice of E2E testing (Playwright, Cypress)
- Decision on bank integration approach
- Decision on mobile app strategy (PWA vs. native)
- Decision on real-time updates (WebSockets, polling, etc.)

---

## Decision Process

When making significant decisions:

1. **Document Context**: Why is this decision needed?
2. **List Alternatives**: What options were considered?
3. **Explain Decision**: Why was this option chosen?
4. **Note Consequences**: What are the trade-offs?
5. **Update This Log**: Add ADR entry

**No undocumented architectural decisions.**


