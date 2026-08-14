#!/usr/bin/env bash

# Check if globalOverrides in pnpm-config.json are still needed
# For each override shows: the forced version and what's actually resolved in the lockfile
# If all resolved versions are >= the override target, the override can likely be removed.

set -euo pipefail

extract_versions() {
  local package_name="$1"
  awk -v pkg="$package_name" '
    $0 ~ /^[[:space:]]*packages:[[:space:]]*$/ { in_packages = 1; next }
    !in_packages { next }
    $0 !~ /^[[:space:]]{2}["\047]?.*:[[:space:]]*$/ { next }
    {
      key = $0
      sub(/^[[:space:]]{2}["\047]?/, "", key)
      sub(/["\047]?:[[:space:]]*$/, "", key)
      prefix = pkg "@"
      if (index(key, prefix) == 1) {
        print substr(key, length(prefix) + 1)
      }
    }
  ' "$LOCKFILE" | sort -u
}

version_is_at_least() {
  local resolved_version="$1"
  local target_version="$2"

  node - "$resolved_version" "$target_version" <<'EOF'
const [resolvedRaw, targetRaw] = process.argv.slice(2);

function normalize(version) {
  return version.trim().split("(")[0];
}

function parse(version) {
  const normalized = normalize(version);
  const match = normalized.match(/^(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?$/);

  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  return {
    main: match[1].split(".").map(Number),
    prerelease: match[2] ? match[2].split(".") : [],
  };
}

function compareIdentifiers(left, right) {
  const leftIsNumber = /^\d+$/.test(left);
  const rightIsNumber = /^\d+$/.test(right);

  if (leftIsNumber && rightIsNumber) {
    return Number(left) - Number(right);
  }

  if (leftIsNumber) {
    return -1;
  }

  if (rightIsNumber) {
    return 1;
  }

  return left.localeCompare(right);
}

function compareVersions(left, right) {
  const maxLength = Math.max(left.main.length, right.main.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = left.main[index] ?? 0;
    const rightPart = right.main[index] ?? 0;

    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  if (left.prerelease.length === 0 && right.prerelease.length === 0) {
    return 0;
  }

  if (left.prerelease.length === 0) {
    return 1;
  }

  if (right.prerelease.length === 0) {
    return -1;
  }

  const maxPrereleaseLength = Math.max(left.prerelease.length, right.prerelease.length);

  for (let index = 0; index < maxPrereleaseLength; index += 1) {
    const leftPart = left.prerelease[index];
    const rightPart = right.prerelease[index];

    if (leftPart === undefined) {
      return -1;
    }

    if (rightPart === undefined) {
      return 1;
    }

    const result = compareIdentifiers(leftPart, rightPart);
    if (result !== 0) {
      return result;
    }
  }

  return 0;
}

const resolved = parse(resolvedRaw);
const target = parse(targetRaw);
process.exit(compareVersions(resolved, target) >= 0 ? 0 : 1);
EOF
}

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Checking globalOverrides in common/config/rush/pnpm-config.json"
echo ""

CONFIG_FILE="common/config/rush/pnpm-config.json"
LOCKFILE_TEMP="common/temp/pnpm-lock.yaml"
LOCKFILE_COMMITTED="common/config/rush/pnpm-lock.yaml"

if [ -f "$LOCKFILE_TEMP" ]; then
  LOCKFILE="$LOCKFILE_TEMP"
elif [ -f "$LOCKFILE_COMMITTED" ]; then
  LOCKFILE="$LOCKFILE_COMMITTED"
  echo "ℹ️  Using committed lockfile ($LOCKFILE_COMMITTED)"
else
  echo "⚠️  Lockfile not found. Run 'rush update' first."
  exit 1
fi

removable=()
needed=()
not_used=()

# Extract overrides and check lockfile
while read -r line; do
  override_key=$(echo "$line" | sed -E 's/^[[:space:]]*"([^"]+)"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')
  target=$(echo "$line" | sed -E 's/^[[:space:]]*"([^"]+)"[[:space:]]*:[[:space:]]*"([^"]+)".*/\2/')
  package_name=${override_key%@*}
  override="${override_key}: ${target}"

  # Find resolved versions in lockfile packages section.
  resolved=$(extract_versions "$package_name" || true)

  echo "Override: $override"

  if [ -z "$resolved" ]; then
    echo -e "  ${YELLOW}⚠️  Package not in dependency tree → can be removed${NC}"
    not_used+=("$override")
  else
    echo "  Resolved: $(echo "$resolved" | tr '\n' ' ')"
    # Check if any resolved version is lower than target
    all_safe=true
    while read -r ver; do
      if ! version_is_at_least "$ver" "$target"; then
        all_safe=false
        break
      fi
    done <<< "$resolved"

    if $all_safe; then
      echo -e "  ${GREEN}✅ All resolved versions >= $target → can be removed${NC}"
      removable+=("$override")
    else
      echo -e "  ${RED}🔒 Override is active (some version < $target)${NC}"
      needed+=("$override")
    fi
  fi
  echo ""
done < <(grep -E '^[[:space:]]*"[^"]+@[^"]+"[[:space:]]*:[[:space:]]*"[^"]+"' "$CONFIG_FILE")

echo "========================================"
echo ""
echo -e "${GREEN}✅ Potentially removable (${#removable[@]}):${NC}"
for o in "${removable[@]:-}"; do [ -n "$o" ] && echo "   $o"; done

echo ""
echo -e "${YELLOW}⚠️  Not in dependency tree - removable (${#not_used[@]}):${NC}"
for o in "${not_used[@]:-}"; do [ -n "$o" ] && echo "   $o"; done

echo ""
echo -e "${RED}🔒 Still needed (${#needed[@]}):${NC}"
for o in "${needed[@]:-}"; do [ -n "$o" ] && echo "   $o"; done

echo ""
echo "Review candidates with: rush audit"
echo "See DEPENDENCY_OVERRIDES.md for details"
