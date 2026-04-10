#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
TODAY_VERSION_1=$(date "+%-Y.%-m.%-d-1")

print_usage() {
    echo "Usage: ./scripts/publish.sh [--beta] <version>"
    echo ""
    echo "Arguments:"
    echo "  <version>   Version in YYYY.M.D-N format (e.g., ${TODAY_VERSION_1})"
    echo ""
    echo "Options:"
    echo "  --beta      Append '-beta' suffix to the version, publish under the 'beta'"
    echo "              npm tag, and allow publishing from non-master/main branches"
    echo "  --help, -h  Print this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/publish.sh ${TODAY_VERSION_1}"
    echo "  ./scripts/publish.sh --beta ${TODAY_VERSION_1}"
}

# Parse arguments
BETA=false
VERSION=""

for arg in "$@"; do
    case "$arg" in
        --help|-h)
            print_usage
            exit 0
            ;;
        --beta)
            BETA=true
            ;;
        *)
            VERSION="$arg"
            ;;
    esac
done

# Check if version argument is provided
if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Version argument required${NC}"
    echo ""
    print_usage
    exit 1
fi

# Validate version format (YYYY.M.D-N)
if ! [[ "$VERSION" =~ ^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}-[0-9]+$ ]]; then
    echo -e "${RED}Error: Invalid version format '${VERSION}'${NC}"
    echo "Expected format: YYYY.M.D-N (e.g., ${TODAY_VERSION_1})"
    exit 1
fi

# Apply beta suffix if requested
if [ "$BETA" = true ]; then
    VERSION="${VERSION}-beta"
fi

if [ "$BETA" = true ]; then
    echo -e "${YELLOW}Publishing BETA version: ${VERSION}${NC}"
else
    echo -e "${GREEN}Publishing version: ${VERSION}${NC}"
fi

# Check for uncommitted changes (except package.json which we'll modify)
if ! git diff --quiet --exit-code -- ':!package.json'; then
    echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
    git status --short
    exit 1
fi

# Check if we're on master/main branch
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "master" && "$BRANCH" != "main" ]]; then
    if [ "$BETA" = true ]; then
        echo -e "${YELLOW}Warning: You're on branch '${BRANCH}', not master/main${NC}"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${RED}Error: Stable releases must be published from master/main branch (currently on '${BRANCH}')${NC}"
        echo "Use --beta to publish a beta release from a feature branch."
        exit 1
    fi
fi

# Check if gh CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo -e "${RED}Error: GitHub CLI not authenticated. Run 'gh auth login' first.${NC}"
    exit 1
fi

# Check if logged in to npm
if ! pnpm whoami &>/dev/null; then
    echo -e "${YELLOW}Not logged in to npm. Running 'pnpm login'...${NC}"
    pnpm login
fi

echo -e "${GREEN}Step 1/7: Verifying dependencies...${NC}"
pnpm install --frozen-lockfile

echo -e "${GREEN}Step 2/7: Building and testing...${NC}"
pnpm run prepublishOnly

echo -e "${GREEN}Step 3/7: Updating version in package.json...${NC}"
# Use sed (gsed on macOS if available, otherwise sed)
if command -v gsed &>/dev/null; then
    gsed -i "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" package.json
else
    sed -i '' "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" package.json
fi

echo -e "${GREEN}Step 4/7: Committing version bump...${NC}"
git add package.json
git commit -m "Version bump to ${VERSION}"

echo -e "${GREEN}Step 5/7: Pushing to remote...${NC}"
git push

echo -e "${GREEN}Step 6/7: Creating GitHub release...${NC}"
gh release create "${VERSION}" --generate-notes

echo -e "${GREEN}Step 7/7: Publishing to npm...${NC}"
echo -e "${YELLOW}You will be prompted for your npm OTP (one-time password)${NC}"
if [ "$BETA" = true ]; then
    pnpm publish --tag beta
else
    pnpm publish --tag latest
fi

echo -e "${GREEN}✓ Successfully published @digitraffic/common@${VERSION}${NC}"
echo -e "  npm: https://www.npmjs.com/package/@digitraffic/common/v/${VERSION}"
echo -e "  GitHub: https://github.com/tmfg/digitraffic-common-private/releases/tag/${VERSION}"

