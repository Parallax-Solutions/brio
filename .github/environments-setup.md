# GitHub Environments Setup

This document describes how to set up GitHub Environments for the Brio project.

## Environments Overview

We use two environments:
- **development**: For testing features before production
- **production**: For live production deployments

## Setting Up Environments

### 1. Development Environment

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Environments**
3. Click **New environment**
4. Name it `development`
5. Configure:
   - **Environment protection rules**: None (optional)
   - **Deployment branches**: `dev`
   - **Required reviewers**: None (optional)

### 2. Production Environment

1. Click **New environment**
2. Name it `production`
3. Configure:
   - **Environment protection rules**:
     - ✅ Require reviewers
     - Add yourself and other maintainers as required reviewers
   - **Deployment branches**: `main`
   - **Wait timer**: 0 minutes (optional)

## Environment Secrets

Add the following secrets to each environment:

### Development Environment Secrets
```
DEV_DATABASE_URL=postgresql://...
VERCEL_TOKEN=vercel_token_here
VERCEL_ORG_ID=your_org_id
VERCEL_DEV_PROJECT_ID=dev_project_id
```

### Production Environment Secrets
```
DATABASE_URL=postgresql://...
VERCEL_TOKEN=vercel_token_here
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=production_project_id
```

## Repository Secrets (Global)

Add these secrets at the repository level (not environment-specific):
```
GITHUB_TOKEN (automatically provided)
```

## Environment URLs

- **Development**: https://brio-dev.vercel.app
- **Production**: https://brio.parallaxsolutions.dev

## Deployment Flow

1. **Development**: Push to `dev` branch → Auto-deploy to dev environment
2. **Production**: Create release from `main` branch → Auto-deploy to production

## Environment Variables

Make sure these environment variables are set in Vercel for each project:

### Shared Variables
```
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
RESEND_API_KEY=your_resend_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Database URLs
- **Dev**: Set `DATABASE_URL` in Vercel dev project
- **Prod**: Set `DATABASE_URL` in Vercel prod project

## Manual Setup Commands

If you need to set up environments programmatically:

```bash
# Create development environment
gh api repos/Parallax-Solutions/brio/environments/development \
  -f deployment_branch_policy='{"protected_branches":false,"custom_branch_policies":true}' \
  -f custom_deployment_branch_policy='{"name":"dev","type":"branch"}'

# Create production environment
gh api repos/Parallax-Solutions/brio/environments/production \
  -f deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}' \
  -f reviewers='[{"type":"User","id":YOUR_USER_ID}]' \
  -f wait_timer=0
```