# Vercel Setup Guide

This guide covers how to set up Vercel for Brio's development and production deployments.

## Table of Contents

1. [Vercel Projects](#vercel-projects)
2. [Environment Variables](#environment-variables)
3. [Preview Deployments](#preview-deployments)
4. [Production Deployment](#production-deployment)
5. [Domain Configuration](#domain-configuration)

## Vercel Projects

Create two separate Vercel projects:

### 1. Development Project (`brio-dev`)

- **Name**: `brio-dev`
- **Git Branch**: `dev`
- **Domain**: `brio-dev.vercel.app` (auto-generated)

### 2. Production Project (`brio`)

- **Name**: `brio`
- **Git Branch**: `main`
- **Domain**: `brio.parallaxsolutions.dev` (custom domain)

## Environment Variables

Configure these environment variables in each Vercel project:

### Shared Variables (Both Projects)

```bash
# Authentication
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# File Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Development-Specific Variables

```bash
# Use development database
DATABASE_URL=postgresql://dev-db-connection-string
```

### Production-Specific Variables

```bash
# Use production database
DATABASE_URL=postgresql://prod-db-connection-string
```

## Preview Deployments

Preview deployments are automatically created for:

- Pull requests to any branch
- Pushes to branches other than `main`

### Preview Deployment Settings

In Vercel project settings:

1. **Git** → **Preview Deployment Aliases**
   - Enable custom aliases
   - Pattern: `brio-preview-${PR_NUMBER}.vercel.app`

2. **Git** → **Ignored Build Step**
   - Command: Leave empty (build on all pushes)

3. **Functions** → **Function Settings**
   - Timeout: 30 seconds for API routes

## Production Deployment

Production deployments only happen from the `main` branch via GitHub releases.

### Production Settings

1. **Git** → **Production Branch**
   - Branch: `main`

2. **Deployments** → **Deployment Protection**
   - Enable password protection (optional)
   - Or leave unprotected for public access

3. **Analytics** → **Vercel Analytics**
   - Enable for production monitoring

## Domain Configuration

### Custom Domain Setup

1. **Add Domain** in Vercel:
   - Go to Project → Settings → Domains
   - Add `brio.parallaxsolutions.dev`

2. **DNS Configuration**:
   - Add CNAME record: `brio.parallaxsolutions.dev` → `cname.vercel-dns.com`
   - Or configure A records if using apex domain

3. **SSL Certificate**:
   - Vercel automatically provisions SSL certificates
   - Takes a few minutes to propagate

### Development Domain

- Development uses auto-generated domain: `brio-dev.vercel.app`
- No custom domain configuration needed

## Build Configuration

The `vercel.json` file configures:

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Build Settings in Vercel

- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next` (default)
- **Install Command**: `pnpm install` (auto-detected)
- **Node Version**: 20.x (matches GitHub Actions)

## Deployment Hooks

### Preview Comments

GitHub Actions automatically comments on pull requests with preview URLs:

```text
🚀 Preview deployment ready: https://brio-preview-123.vercel.app
```

### Production Notifications

Production deployments post comments on releases:

```text
🎉 Production deployment v1.0.0 ready: https://brio.parallaxsolutions.dev
✅ Database migrated
🚀 Live in production
```

## Monitoring & Logs

### Vercel Dashboard

- **Deployments**: View build logs and deployment status
- **Functions**: Monitor API route performance
- **Analytics**: User traffic and performance metrics
- **Logs**: Real-time application logs

### Error Tracking

Enable error tracking in Vercel:

1. Go to Project → Settings → Integrations
2. Add Sentry or similar error tracking service
3. Configure environment variables for error reporting

## Troubleshooting

### Common Issues

#### Build Fails

**Symptoms**: Build fails in Vercel
**Solutions:**

- Check build logs for specific errors
- Verify environment variables are set
- Ensure database is accessible
- Check Node.js version compatibility

#### Database Connection Issues

**Symptoms**: Application can't connect to database
**Solutions:**

- Verify DATABASE_URL format
- Check database firewall rules
- Ensure SSL mode is correct for your provider
- Test connection locally

#### Preview Deployments Not Triggering

**Symptoms**: No preview deployment for PR
**Solutions:**

- Check if PR is from fork (may need approval)
- Verify branch name doesn't match ignored patterns
- Check Vercel project settings

### Environment Variable Issues

**Symptoms**: App works locally but fails in Vercel
**Solutions:**

- Ensure all required env vars are set in Vercel
- Check variable names match exactly
- Verify sensitive data isn't logged
- Use Vercel CLI to check env vars: `vercel env ls`

### Rollback Procedures

1. **Redeploy Previous Version**:
   - Go to Deployments tab
   - Find previous successful deployment
   - Click "Promote to Production"

2. **Rollback Code**:
   - Create new release with hotfix
   - Follow normal deployment process

## Security

- **Environment Variables**: Never commit secrets to code
- **Database Access**: Restrict database access to Vercel IP ranges
- **API Routes**: Implement proper authentication
- **CORS**: Configure appropriate CORS policies
- **Rate Limiting**: Consider implementing rate limiting for API routes
