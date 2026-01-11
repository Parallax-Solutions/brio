#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🚀 Brio Release Creator          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install it with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version.replace(/-.*$/, '')")
echo -e "${BLUE}Current version:${NC} $CURRENT_VERSION"
echo ""

# Parse version parts
IFS='.' read -ra PARTS <<< "$CURRENT_VERSION"
MAJOR=${PARTS[0]}
MINOR=${PARTS[1]}
PATCH=${PARTS[2]}

# Calculate all possible versions
PATCH_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
MINOR_VERSION="$MAJOR.$((MINOR + 1)).0"
MAJOR_VERSION="$((MAJOR + 1)).0.0"

# Show options
echo -e "${YELLOW}Select release type:${NC}"
echo ""
echo -e "  ${GREEN}1)${NC} patch  → ${PATCH_VERSION}  (bug fixes)"
echo -e "  ${GREEN}2)${NC} minor  → ${MINOR_VERSION}  (new features)"
echo -e "  ${GREEN}3)${NC} major  → ${MAJOR_VERSION}  (breaking changes)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        BUMP_TYPE="patch"
        NEW_VERSION=$PATCH_VERSION
        DEFAULT_PREFIX="fix"
        ;;
    2)
        BUMP_TYPE="minor"
        NEW_VERSION=$MINOR_VERSION
        DEFAULT_PREFIX="feat"
        ;;
    3)
        BUMP_TYPE="major"
        NEW_VERSION=$MAJOR_VERSION
        DEFAULT_PREFIX="breaking"
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Selected:${NC} $BUMP_TYPE → v$NEW_VERSION"
echo ""

# Get PR title
DEFAULT_TITLE="$DEFAULT_PREFIX: Release v$NEW_VERSION"
read -p "PR Title [$DEFAULT_TITLE]: " PR_TITLE
PR_TITLE=${PR_TITLE:-$DEFAULT_TITLE}

# Get PR description
echo ""
echo -e "${YELLOW}Enter PR description (press Enter twice to finish):${NC}"
PR_BODY=""
while IFS= read -r line; do
    [[ -z "$line" ]] && break
    PR_BODY+="$line"$'\n'
done

if [[ -z "$PR_BODY" ]]; then
    PR_BODY="## 🚀 Release v$NEW_VERSION

### Changes
- See commits for details

---
*This PR will automatically bump the version to $NEW_VERSION*"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}Preview:${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Title:${NC} $PR_TITLE"
echo -e "${BLUE}Label:${NC} $BUMP_TYPE"
echo -e "${BLUE}Version:${NC} $CURRENT_VERSION → $NEW_VERSION"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

read -p "Create this PR? [Y/n]: " confirm
confirm=${confirm:-Y}

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Creating PR...${NC}"

# Ensure we're on dev and up to date
git checkout dev 2>/dev/null
git pull origin dev 2>/dev/null

# Create PR
PR_URL=$(gh pr create \
    --base main \
    --head dev \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --label "$BUMP_TYPE" 2>&1)

if [[ $? -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       ✅ PR Created Successfully!      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}PR URL:${NC} $PR_URL"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Wait for version bump workflow (~30s)"
    echo "  2. Review and merge the PR"
    echo "  3. GitHub Release will be created automatically"
    echo ""
else
    echo ""
    echo -e "${RED}Error creating PR:${NC}"
    echo "$PR_URL"
    
    # Check if PR already exists
    if echo "$PR_URL" | grep -q "already exists"; then
        echo ""
        echo -e "${YELLOW}A PR from dev to main already exists.${NC}"
        EXISTING_PR=$(gh pr list --base main --head dev --json url --jq '.[0].url')
        echo -e "View it here: $EXISTING_PR"
    fi
fi
