# Deployment Guide

This guide covers the complete deployment process for Brio, including development, staging, and production environments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Development Deployment](#development-deployment)
5. [Production Deployment](#production-deployment)
6. [Version Management](#version-management)
7. [Troubleshooting](#troubleshooting)

## Overview

Brio uses a Git-flow inspired deployment strategy with two main environments:

- **Development** (`dev` branch): For testing features and bug fixes
- **Production** (`main` branch): Live production environment

### Branch Strategy

```
dev (development)
├── feature/* (feature branches)
└── main (production via releases)
```

- All development happens on `dev` branch or feature branches
- Production releases are created from `main` branch only
- `main` branch is protected and only accepts merges from release PRs

## Prerequisites

### Required Accounts & Access

1. **GitHub Repository**: Admin access to configure branch protection and environments
2. **Vercel Account**: With access to deploy projects
3. **Database**: PostgreSQL database (Neon, Supabase, or similar)
4. **Email Service**: Resend account for email verification
5. **OAuth Providers**: Google OAuth configured

### Required Secrets

Set these in GitHub repository secrets and environment-specific secrets:

#### Repository Secrets (Global)
```
GITHUB_TOKEN (automatically provided)
```

#### Development Environment
```
DEV_DATABASE_URL=postgresql://...
VERCEL_TOKEN=vercel_token_here
VERCEL_ORG_ID=your_org_id
VERCEL_DEV_PROJECT_ID=dev_project_id
```

#### Production Environment
```
DATABASE_URL=postgresql://...
VERCEL_TOKEN=vercel_token_here
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=production_project_id
```

## Environment Setup

### 1. GitHub Environments

1. Go to **Settings** → **Environments** in your repository
2. Create `development` environment:
   - Allow deployments from `dev` branch
   - No required reviewers
3. Create `production` environment:
   - Allow deployments from `main` branch
   - Add required reviewers (maintainers)
   - Set wait timer to 0 minutes

### 2. Branch Protection

Configure branch protection for `main` branch:

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require PR reviews (1 reviewer)
   - ✅ Require status checks (CI tests must pass)
   - ✅ Require branches to be up to date
   - ✅ Include administrators
   - ❌ Allow force pushes
   - ❌ Allow deletions

### 3. Vercel Projects

1. Create two Vercel projects:
   - `brio-dev` for development
   - `brio` for production

2. Configure environment variables in each project (see `.env.example`)

## Development Deployment

Development deployments happen automatically when code is pushed to the `dev` branch.

### Process

1. **Develop**: Make changes on feature branches or directly on `dev`
2. **Test**: Push to `dev` branch
3. **Auto-deploy**: GitHub Actions automatically:
   - Runs tests and linting
   - Migrates development database
   - Deploys to Vercel dev environment
   - Comments deployment URL on the commit

### Manual Development Deployment

If needed, you can trigger a development deployment manually:

1. Go to **Actions** → **Deploy to Dev** workflow
2. Click **Run workflow**
3. The workflow will deploy the current `dev` branch

### Development URLs

- **Application**: https://brio-dev.vercel.app
- **Database**: Development database instance

## Production Deployment

Production deployments require creating a release, which triggers automated deployment.

### Release Process

#### Option 1: Automated Release (Recommended)

1. **Prepare Release**:
   ```bash
   # Switch to dev branch
   git checkout dev
   git pull origin dev
   ```

2. **Trigger Release Workflow**:
   - Go to **Actions** → **Create Release** workflow
   - Click **Run workflow**
   - Select version bump type: `patch`, `minor`, or `major`
   - Add release notes (optional)
   - Click **Run workflow**

3. **Review Release PR**:
   - GitHub creates a PR from `release/vX.Y.Z` to `main`
   - Review the changes
   - Approve and merge the PR

4. **Create GitHub Release**:
   - After merging, go to **Releases**
   - Click **Create a new release**
   - Use tag `vX.Y.Z` (matches the version)
   - Copy release notes from the PR
   - Click **Publish release**

5. **Auto-deploy**: GitHub Actions automatically:
   - Runs final tests
   - Migrates production database
   - Deploys to Vercel production
   - Comments deployment URL

#### Option 2: Manual Release

1. **Version Bump**:
   ```bash
   # Bump version locally
   pnpm version minor  # or patch/major
   git add package.json VERSION
   git commit -m "Bump version to X.Y.Z"
   ```

2. **Create Release Branch**:
   ```bash
   git checkout -b release/vX.Y.Z
   git push origin release/vX.Y.Z
   ```

3. **Create Pull Request**:
   - Create PR from `release/vX.Y.Z` to `main`
   - Get approval and merge

4. **Create GitHub Release**:
   - Follow steps 4-5 from Option 1

### Production URLs

- **Application**: https://brio.parallaxsolutions.dev
- **Database**: Production database instance

## Version Management

Brio uses semantic versioning (SemVer): `MAJOR.MINOR.PATCH`

### Current Version

- **Current**: 0.1.0-alpha
- **Next**: 0.2.0 (when ready for first stable release)

### Version Commands

```bash
# Check current version
pnpm version

# Bump version types
pnpm version:patch    # 1.0.0 → 1.0.1
pnpm version:minor    # 1.0.0 → 1.1.0
pnpm version:major    # 1.0.0 → 2.0.0

# Custom version management
pnpm version set 1.2.3
pnpm version bump patch
```

### Release Types

- **Patch** (`0.1.0` → `0.1.1`): Bug fixes, no breaking changes
- **Minor** (`0.1.0` → `0.2.0`): New features, backward compatible
- **Major** (`0.1.0` → `1.0.0`): Breaking changes

## Database Management

### Development Database

- Auto-migrated on every `dev` branch push
- Seeded with test data
- Can be reset if needed

### Production Database

- Migrated only on releases
- Contains live user data
- Backups recommended before major changes

### Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Create and apply migration
pnpm db:migrate

# Reset database (development only)
pnpm db:push --force-reset

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

## Troubleshooting

### Common Issues

#### 1. Deployment Fails

**Symptoms**: GitHub Actions workflow fails
**Solutions**:
- Check workflow logs for specific errors
- Verify environment secrets are set correctly
- Ensure database is accessible
- Check Vercel project configuration

#### 2. Database Migration Errors

**Symptoms**: Migration fails in production
**Solutions**:
- Test migrations locally first
- Backup production database
- Check migration files for syntax errors
- Verify database permissions

#### 3. Branch Protection Blocks Merge

**Symptoms**: Cannot merge PR to main
**Solutions**:
- Ensure all status checks pass
- Get required reviews
- Resolve merge conflicts
- Update branch with latest main

#### 4. Version Mismatch

**Symptoms**: VERSION file and package.json don't match
**Solutions**:
- Use `pnpm version` commands instead of manual edits
- Run `pnpm version set X.Y.Z` to sync both files

### Getting Help

1. Check GitHub Actions logs for detailed error messages
2. Review Vercel deployment logs
3. Check database connection and permissions
4. Verify all secrets and environment variables

### Rollback Procedures

#### Development Rollback
1. Revert the commit on `dev` branch
2. Push the revert commit
3. Deployment will auto-rollback

#### Production Rollback
1. Create a new release with a patch version
2. Include rollback changes in the release
3. Deploy following normal production process

## Monitoring

### Health Checks

- **Application**: Check if https://brio.parallaxsolutions.dev loads
- **Database**: Verify database connections work
- **Authentication**: Test login flows
- **Email**: Verify email verification works

### Logs

- **GitHub Actions**: Repository → Actions
- **Vercel**: Project dashboard → Functions/Deployments
- **Database**: Check provider logs (Neon, Supabase, etc.)

## Security Considerations

- Never commit secrets to code
- Use environment-specific secrets
- Rotate secrets regularly
- Limit Vercel project access
- Use branch protection rules
- Require reviews for production deployments