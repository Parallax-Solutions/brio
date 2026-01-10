# Roadmap

## Phased Development Approach

This roadmap outlines the development phases for the Brio, clearly marking what's being built now, next, and later.

---

## MVP (Now) - Core Budgeting Features

**Status**: In Development

### Core Functionality

- ✅ Multi-currency support (CRC, USD, CAD)
- ✅ Dynamic income management (multiple sources, configurable cadences)
- ✅ Recurring payments tracking with "Mark as Paid" functionality
- ✅ Extra expenses tracking
- ✅ Subscriptions management with "Mark as Paid" functionality
- ✅ Variable bills tracking
- ✅ Exchange rate management
- ✅ User profile with balance tracking
- ✅ Authentication (NextAuth with credentials + Google OAuth)
- ✅ Dashboard with monthly summaries and payment tracking
- ✅ Theme selector (light/dark/system)
- ✅ Accent color selector
- ✅ Internationalization (Spanish default, English)
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Animations and smooth transitions

### Technical Foundation

- ✅ Next.js App Router with TypeScript
- ✅ PostgreSQL with Prisma ORM
- ✅ Server Actions for mutations
- ✅ React Server Components by default
- ✅ Zod validation
- ✅ shadcn/ui components
- ✅ Complete documentation structure

---

## V1 (Next) - Enhanced User Experience

**Status**: Planned

### Features

- [ ] Advanced filtering and search

  - Filter expenses by date range, category, currency
  - Search across all transactions
  - Saved filter presets

- [ ] Improved dashboard

  - Spending trends charts
  - Category breakdown visualizations
  - Month-over-month comparisons
  - Quick stats cards

- [ ] Better mobile experience

  - Responsive design improvements
  - Touch-optimized interactions
  - Mobile-first expense entry

- [ ] Enhanced exchange rates

  - Live rate fetching (API integration)
  - Rate change notifications
  - Historical rate charts

- [ ] Receipt management

  - Upload receipt images
  - Link receipts to expenses
  - Receipt gallery view

- [ ] Export functionality
  - CSV export for expenses
  - PDF monthly reports
  - Tax-ready summaries

---

## V2 (Later) - Household & Collaboration

**Status**: Future

### Features

- [ ] Household mode

  - Multi-user support
  - Shared budgets
  - Individual spending tracking within household
  - Role-based permissions

- [ ] Advanced reporting

  - Custom date range reports
  - Spending analysis by category
  - Income vs. expense trends
  - Savings goal tracking

- [ ] Budget planning

  - Monthly budget allocation
  - Budget vs. actual comparisons
  - Budget rollover options

- [ ] Notifications
  - Upcoming payment reminders
  - Budget threshold alerts
  - Exchange rate change notifications

---

## V3 (Future) - Automation & Integration

**Status**: Future

### Features

- [ ] Bank account integration

  - Connect Costa Rican banks
  - Connect international banks
  - Automatic transaction import
  - Transaction categorization

- [ ] Mobile apps

  - Native iOS app
  - Native Android app
  - Offline support
  - Receipt scanning (OCR)

- [ ] Smart features

  - AI-powered categorization
  - Recurring payment detection
  - Spending pattern insights
  - Budget recommendations

- [ ] Advanced security
  - Two-factor authentication
  - End-to-end encryption
  - Enhanced audit logging

---

## Timeline Estimates

- **MVP**: 4-6 weeks (current phase)
- **V1**: 3-4 weeks after MVP
- **V2**: 6-8 weeks after V1
- **V3**: 12+ weeks after V2

_Note: Timeline estimates are rough and subject to change based on priorities and feedback._

---

## Decision Criteria for Feature Prioritization

Features are prioritized based on:

1. **User value**: How much does this solve a real problem?
2. **Technical feasibility**: Can we build this with current resources?
3. **Dependencies**: Does this block other important features?
4. **User feedback**: What are users asking for most?
5. **Market fit**: Does this differentiate us in the market?

---

## Out of Scope (For Now)

The following are explicitly out of scope for MVP and V1:

- Investment tracking
- Debt management
- Credit score monitoring
- Tax filing integration
- Cryptocurrency support
- Bill payment automation
- Credit card rewards tracking

_See `product-scope.md` for detailed in-scope and out-of-scope definitions._
