# Deployment Guide

This guide covers the complete deployment process for Brio, including development and production environments.

## Table of Contents

1. [Overview](#overview)
2. [Deployment Architecture](#deployment-architecture)
3. [GitHub Actions CI](#github-actions-ci)
4. [Development Deployment](#development-deployment)
5. [Production Deployment](#production-deployment)
6. [Version Management](#version-management)
7. [Database Migrations](#database-migrations)
8. [Troubleshooting](#troubleshooting)

## Overview

Brio uses a simple but effective deployment strategy:

- **CI/CD**: GitHub Actions for code quality checks
- **Hosting**: Vercel for automatic deployments
- **Database**: Neon PostgreSQL (or any PostgreSQL provider)

### Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Development | `dev` | `brio-git-dev-*.vercel.app` | Testing new features |
| Production | `main` | `brio.parallaxsolutions.dev` | Live application |

## Deployment Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  GitHub Repo    │────▶│  GitHub Actions  │────▶│  CI Checks  │
│  (dev/main)     │     │  (on push/PR)    │     │  (lint/ts)  │
└────────┬────────┘     └──────────────────┘     └─────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Vercel Git     │────▶│  Vercel Build    │
│  Integration    │     │  & Deploy        │
└─────────────────┘     └──────────────────┘
```

**Key Points:**
- Vercel automatically deploys on every push (no GitHub Actions needed for deployment)
- GitHub Actions run CI checks (linting, type checking)
- Database migrations run during Vercel build via `prisma migrate deploy`

## GitHub Actions CI

### What CI Does

The CI workflow (`.github/workflows/ci.yml`) runs on every push and PR:

1. **Lint**: Checks code style with ESLint
2. **Type Check**: Validates TypeScript types

### CI Status Badges

Add to your README:
```markdown
![CI](https://github.com/Parallax-Solutions/brio/actions/workflows/ci.yml/badge.svg)
```

### Required Checks for Branch Protection

When setting up branch protection for `main`, require these checks:
- `Code Quality` (from CI workflow)

## Development Deployment

### Automatic Dev Deployments

Every push to the `dev` branch automatically:
1. Triggers Vercel deployment
2. Creates a preview URL
3. Runs database migrations

### Development Workflow

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR to dev
git push origin feature/my-feature
# Create PR on GitHub

# 4. After PR is merged, dev auto-deploys
```

### Preview URLs

Each commit to `dev` gets a unique preview URL:
- `brio-git-dev-{username}.vercel.app`
- `brio-{hash}-{username}.vercel.app`

## Production Deployment

### Release Process

Production deployments happen when code is merged to `main`. Use the release workflow for versioned releases:

#### Step 1: Create Release (GitHub Actions)

1. Go to **Actions** → **Create Release**
2. Click **Run workflow**
3. Select:
   - **Version type**: `patch`, `minor`, or `major`
   - **Pre-release tag** (optional): e.g., `beta`, `rc1`
   - **Release notes**: Description of changes
4. Click **Run workflow**

#### Step 2: Review and Merge PR

1. The workflow creates a PR from `release/vX.Y.Z` to `main`
2. Review the version changes
3. Get approval (if branch protection is enabled)
4. Merge the PR

#### Step 3: Create GitHub Release

1. Go to **Releases** → **Create a new release**
2. Create tag: `vX.Y.Z` (matches the version)
3. Title: `v{version}` or descriptive name
4. Add release notes (changelog)
5. Click **Publish release**

#### Step 4: Automatic Deployment

Vercel automatically deploys `main` to production after the merge.

### Quick Production Fix (Hotfix)

For urgent fixes:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Make fix and bump patch version
# ... make changes ...
npm version patch --no-git-tag-version
git add .
git commit -m "fix: critical bug fix"

# 3. Push and create PR to main
git push origin hotfix/critical-fix
# Create PR on GitHub, get approval, merge

# 4. Tag the release
git checkout main
git pull origin main
git tag v0.1.1
git push origin v0.1.1
```

## Version Management

### Semantic Versioning

Brio follows SemVer: `MAJOR.MINOR.PATCH[-PRERELEASE]`

| Type | When to Use | Example |
|------|-------------|---------|
| Patch | Bug fixes, no API changes | `0.1.0` → `0.1.1` |
| Minor | New features, backward compatible | `0.1.0` → `0.2.0` |
| Major | Breaking changes | `0.1.0` → `1.0.0` |

### Current Version

The current version is tracked in two files:
- `package.json` (authoritative)
- `VERSION` (for quick reference)

### Version Commands

```bash
# Check current version
pnpm version

# Manual version bumps (local)
pnpm version:patch
pnpm version:minor
pnpm version:major

# Or use npm directly
npm version patch --no-git-tag-version
```

## Database Migrations

### How Migrations Run

Migrations are handled automatically during Vercel builds:

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Manual Migration (Production)

If you need to run migrations manually:

```bash
# 1. Get production DATABASE_URL from Vercel
vercel env pull .env.production.local

# 2. Run migration
DATABASE_URL="your-production-url" pnpm prisma migrate deploy
```

### Creating New Migrations

```bash
# 1. Update schema.prisma
# 2. Create migration
pnpm db:migrate

# 3. Commit migration files
git add prisma/migrations
git commit -m "chore: add migration for new feature"
```

## Troubleshooting

### CI Workflow Fails

**Lint Errors:**
```bash
pnpm lint:fix
```

**Type Errors:**
```bash
pnpm type-check
```

### Vercel Build Fails

1. Check Vercel deployment logs
2. Verify environment variables are set
3. Check database connection

**Common Issues:**
- Missing `DATABASE_URL` → Add in Vercel project settings
- Missing `NEXTAUTH_SECRET` → Generate with `openssl rand -base64 32`
- Prisma client not generated → Should auto-generate during build

### Database Connection Issues

**Symptoms:** Build fails with "database not found" or connection errors

**Solutions:**
1. Verify DATABASE_URL format
2. Check database is accessible from Vercel (IP whitelisting)
3. Ensure SSL mode is correct: `?sslmode=require`

### Release Workflow Not Visible

The "Create Release" workflow uses manual dispatch. To see it:
1. Go to **Actions** tab
2. Look in the left sidebar under "All workflows"
3. Or run it once - then it appears in the list

### Preview Deployment Issues

**PR previews not working:**
1. Check Vercel GitHub integration is connected
2. Verify branch is not in Vercel's "Ignored Build Step"
3. Check Vercel project settings

## Best Practices

### Before Merging to Main

1. ✅ All CI checks pass
2. ✅ Tested on dev/preview environment
3. ✅ Version bumped appropriately
4. ✅ Migrations tested locally
5. ✅ Release notes prepared

### After Production Deployment

1. ✅ Verify deployment at production URL
2. ✅ Test critical user flows
3. ✅ Check error monitoring (if configured)
4. ✅ Monitor for issues

### Rollback Procedure

1. **Vercel Rollback**: Go to Deployments → Find last working deployment → "Promote to Production"
2. **Code Rollback**: Revert commit on main → Push → Vercel auto-deploys