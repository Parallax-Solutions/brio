# Branch Protection Rules Configuration

This document outlines the branch protection rules that should be configured in GitHub for the Brio repository.

## Main Branch Protection

Configure branch protection for the `main` branch with the following settings:

### Required Settings
- **Require pull request reviews before merging**
  - Required approving reviews: 1
  - Dismiss stale pull request approvals when new commits are pushed: ✅
  - Require review from Code Owners: ❌ (optional)
  - Restrict who can dismiss pull request reviews: ❌

- **Require status checks to pass before merging**
  - Require branches to be up to date before merging: ✅
  - Status checks that must pass:
    - `test (20.x)` (CI workflow)
    - `build` (CI workflow)

- **Require branches to be up to date before merging**: ✅

- **Include administrators**: ✅ (so maintainers can also follow the rules)

- **Restrict pushes**
  - Allow force pushes: ❌
  - Allow deletions: ❌

- **Require conversation resolution before merging**: ✅

## Dev Branch Protection (Optional)

For the `dev` branch, you may want lighter protection:

- **Require pull request reviews**: ✅ (1 review)
- **Require status checks**: ✅
- **Allow force pushes**: ❌
- **Allow deletions**: ❌

## Manual Configuration Steps

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule**
4. Configure the `main` branch with the settings above
5. Save the rule

## Automated Setup (Future)

In the future, this can be automated using GitHub's REST API or third-party tools like:

```bash
# Example using GitHub CLI
gh api repos/Parallax-Solutions/brio/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":["test","build"]}' \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f restrictions=null \
  -f enforce_admins=true
```

## Branch Strategy

- `main`: Production-ready code, protected, only accepts merges from release PRs
- `dev`: Development branch, accepts feature PRs, deploys to dev environment
- `feature/*`: Feature branches created from dev
- `release/*`: Release branches created automatically for version bumps