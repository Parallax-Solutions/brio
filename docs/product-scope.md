# Product Scope

This document explicitly defines what is **in-scope** and **out-of-scope** for the Brio. This prevents scope creep and ensures focus on core value delivery.

---

## In-Scope Features

### Core Budgeting (MVP)
- ✅ **Income Management**
  - Multiple income sources per user
  - Configurable cadences (monthly, biweekly, weekly, one-time)
  - Multi-currency support (CRC, USD, CAD)
  - Expected vs. received income tracking
  - Income source activation/deactivation
  - Date range support (startDate, endDate)

- ✅ **Expense Tracking**
  - Recurring payments (rent, insurance, subscriptions)
  - Extra/one-off expenses
  - Variable bills (utilities that change monthly)
  - Multi-currency support
  - Category assignment
  - Date tracking
  - Notes and receipt URLs

- ✅ **Currency Management**
  - Base currency (default: CRC)
  - Exchange rate storage (historical)
  - Currency conversion to base currency
  - Support for CRC, USD, CAD
  - Manual rate updates
  - Rate effective date tracking

- ✅ **Dashboard & Reporting**
  - Monthly income summary (by currency + converted)
  - Monthly expense summary (by category + currency)
  - Remaining budget calculation
  - Upcoming payments (7/14/30 days)
  - Overdue payments
  - Current month focus with month picker

- ✅ **User Management**
  - User authentication (NextAuth)
  - User profile (name, base currency, preferences)
  - Balance tracking (cash/bank per currency)
  - Balance update history

- ✅ **UI/UX Features**
  - Theme selector (light/dark/system)
  - Accent color selector (predefined colors)
  - Internationalization (Spanish default, English)
  - Accessibility (WCAG 2.1 AA)
  - Mobile responsive design
  - Fast "mark as paid" actions

---

## Out-of-Scope Features

### Explicitly Excluded (MVP & V1)

#### Financial Services
- ❌ **Investment Tracking**: Stocks, bonds, mutual funds, crypto
- ❌ **Debt Management**: Credit card debt, loans, payment plans
- ❌ **Credit Score Monitoring**: Credit reports, score tracking
- ❌ **Tax Filing Integration**: Direct tax software integration
- ❌ **Bill Payment Automation**: Actually paying bills (read-only tracking)

#### Advanced Analytics (V1+)
- ❌ **Predictive Analytics**: AI-powered spending predictions
- ❌ **Investment Recommendations**: Financial advice or recommendations
- ❌ **Credit Optimization**: Credit card recommendations
- ❌ **Tax Optimization**: Tax strategy suggestions

#### Integrations (V2+)
- ❌ **Bank Account Integration**: Automatic transaction import (V3+)
- ❌ **Credit Card Integration**: Automatic credit card transaction sync (V3+)
- ❌ **Payment Processing**: Actually processing payments (V3+)
- ❌ **Third-party Budget Apps**: Import from Mint, YNAB, etc. (V3+)

#### Collaboration (V2+)
- ❌ **Multi-user/Household Mode**: Shared budgets (V2+)
- ❌ **Financial Advisor Access**: Grant access to advisors (V3+)
- ❌ **Family Sharing**: Teaching tools for children (V3+)

#### Mobile Apps (V3+)
- ❌ **Native Mobile Apps**: iOS/Android apps (V3+)
- ❌ **Receipt OCR**: Automatic receipt scanning (V3+)
- ❌ **Offline Mode**: Full offline functionality (V3+)

#### Advanced Features (V3+)
- ❌ **Envelope Budgeting**: Zero-based budgeting method (V3+)
- ❌ **Goal Tracking**: Savings goals with progress (V2+)
- ❌ **Recurring Payment Detection**: Auto-detect from transactions (V3+)
- ❌ **Smart Categorization**: AI-powered expense categorization (V3+)

---

## Scope Boundaries

### What We Track vs. What We Don't

**We Track:**
- Income (expected and received)
- Expenses (recurring, one-time, variable)
- Exchange rates
- User balances
- Payment status (paid/unpaid/overdue)

**We Don't Track:**
- Investment portfolios
- Debt balances
- Credit scores
- Tax obligations
- Asset values (property, vehicles)

### What We Calculate vs. What We Don't

**We Calculate:**
- Total income per month (by currency + converted)
- Total expenses per month (by category + currency)
- Remaining budget (income - expenses)
- Currency conversions using stored rates

**We Don't Calculate:**
- Net worth
- Debt-to-income ratios
- Investment returns
- Tax deductions
- Credit utilization

---

## Future Scope Considerations

Features marked as "V2+" or "V3+" may be added in future versions based on:
1. User demand and feedback
2. Technical feasibility
3. Resource availability
4. Market opportunities

**Decision Process:**
- Any feature addition must be documented in `decisions-log.md`
- Product scope must be updated before implementation
- Architecture must support the addition without breaking changes

---

## Scope Change Protocol

If a feature request falls outside this scope:

1. **Evaluate**: Does it align with mission and vision?
2. **Document**: Add to `decisions-log.md` with context
3. **Update**: Modify this document if approved
4. **Plan**: Add to roadmap if it's a significant addition
5. **Implement**: Only after documentation is updated

**No ad-hoc scope additions without documentation.**


