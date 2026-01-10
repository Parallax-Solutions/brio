# Contributing

This document provides guidelines for contributing to the Brio.

---

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm (package manager)
- PostgreSQL 14+ (or Docker)
- Git

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budget-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start PostgreSQL** (Docker)
   ```bash
   docker compose up -d
   ```

5. **Run migrations**
   ```bash
   pnpm prisma migrate dev
   ```

6. **Seed database**
   ```bash
   pnpm prisma db seed
   ```

7. **Start development server**
   ```bash
   pnpm dev
   ```

---

## Code Style

### TypeScript

- **Strict mode**: Enabled
- **No `any` types**: Use proper types or `unknown`
- **Explicit return types**: For functions (where helpful)

### Naming Conventions

- **Components**: PascalCase (`ExpenseForm.tsx`)
- **Files**: Match component name
- **Functions**: camelCase (`createExpense`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_AMOUNT`)
- **Types/Interfaces**: PascalCase (`ExpenseData`)

### File Organization

```
app/
  (app)/
    dashboard/
      page.tsx
components/
  ui/
    button.tsx
  expenses/
    expense-form.tsx
lib/
  actions/
    expenses.ts
  utils/
    money.ts
```

---

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Follow conventional commits:

```
feat: add income source management
fix: correct currency conversion rounding
docs: update setup instructions
refactor: simplify expense form validation
```

### Pull Request Process

1. **Create branch** from `main`
2. **Make changes** following code style
3. **Test locally** (run linter, check functionality)
4. **Update documentation** if needed
5. **Create PR** with clear description
6. **Request review**

---

## Coding Standards

### Server Components (Default)

- Use Server Components by default
- Fetch data directly from database
- No `'use client'` unless needed

### Client Components (When Needed)

- Mark with `'use client'` directive
- Use for interactive UI only
- Keep client components small

### Server Actions

- All mutations use Server Actions
- Validate with Zod schemas
- Return `{ success, error?, data? }` pattern
- Always verify session/auth

### Error Handling

- Return user-friendly error messages
- Log errors server-side
- Don't expose internal errors to users

### Database Queries

- Always scope by `userId`
- Use Prisma `select` for performance
- Index frequently queried fields

---

## Testing

### Unit Tests (Future)

- Test utility functions (`money.ts`, `dates.ts`)
- Test validation schemas
- Test conversion functions

### Integration Tests (Future)

- Test Server Actions
- Test database operations
- Test authentication flow

### Manual Testing

- Test in multiple browsers
- Test with keyboard navigation
- Test with screen reader (basic)
- Test responsive design

---

## Documentation

### Code Documentation

- **JSDoc comments** for complex functions
- **Inline comments** for non-obvious logic
- **README updates** for new features

### Architecture Documentation

- **Update `/docs`** when architecture changes
- **Update `decisions-log.md`** for significant decisions
- **Keep docs in sync** with code

---

## Accessibility

### Requirements

- **WCAG 2.1 AA** compliance
- **Keyboard navigation** for all features
- **Screen reader** friendly
- **Visible focus** states
- **Color contrast** meets standards

### Testing

- Test with keyboard only
- Test with screen reader (basic)
- Verify focus indicators
- Check color contrast

---

## Performance

### Optimization Guidelines

- **Server Components** for data fetching
- **Code splitting** automatic with App Router
- **Database queries** optimized (select only needed fields)
- **Images** optimized (Next.js Image component)

### Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 90+

---

## Security

### Best Practices

- **Never commit** secrets or `.env` files
- **Validate all inputs** with Zod
- **Scope queries** by userId
- **Use parameterized queries** (Prisma handles)
- **Hash passwords** with bcrypt

### Security Checklist

- [ ] No secrets in code
- [ ] Input validation on all forms
- [ ] User-scoped data access
- [ ] Session validation in Server Actions
- [ ] HTTPS in production

---

## Common Tasks

### Adding a New Page

1. Create page in `app/(app)/new-page/page.tsx`
2. Add to navigation (if needed)
3. Create Server Actions in `app/actions/`
4. Add translations to `messages/`
5. Update documentation

### Adding a New Component

1. Create component in `components/`
2. Use shadcn/ui patterns
3. Add TypeScript types
4. Add accessibility attributes
5. Add translations if needed

### Adding a Database Model

1. Update `prisma/schema.prisma`
2. Create migration: `pnpm prisma migrate dev`
3. Update seed script if needed
4. Update `data-model.md` documentation

---

## Questions?

- Check `/docs` for architecture and decisions
- Review existing code for patterns
- Ask in PR comments

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn
- Follow project conventions

---

Thank you for contributing! 🎉


