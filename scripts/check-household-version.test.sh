#!/usr/bin/env bash
# Exercises scripts/check-household-version.mjs against a temporary git repo.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
checker="$root/scripts/check-household-version.mjs"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

repo="$tmp/repo"
git init -b main "$repo" >/dev/null
git -C "$repo" config user.name "Test"
git -C "$repo" config user.email "test@example.com"

manifests=(
  plugins/household/.claude-plugin/plugin.json
  plugins/household/.cursor-plugin/plugin.json
  plugins/household/.codex-plugin/plugin.json
)

write_versions() {
  local values=("$@")
  if [ "${#values[@]}" -eq 1 ]; then
    values=("$1" "$1" "$1")
  fi
  if [ "${#values[@]}" -ne 3 ]; then
    echo "write_versions expects one version or three" >&2
    exit 1
  fi
  local index=0
  for manifest in "${manifests[@]}"; do
    mkdir -p "$repo/$(dirname "$manifest")"
    printf '{"name":"household","version":"%s"}\n' "${values[$index]}" >"$repo/$manifest"
    index=$((index + 1))
  done
}

commit_all() {
  git -C "$repo" add plugins/household
  git -C "$repo" commit -m "$1" >/dev/null
}

check() {
  (
    cd "$tmp"
    HOUSEHOLD_VERSION_ROOT="$repo" \
      HOUSEHOLD_VERSION_BASE="${1-}" \
      node "$checker"
  )
}

write_versions 0.1.0
mkdir -p "$repo/plugins/household/skills/example"
printf 'base\n' >"$repo/plugins/household/skills/example/SKILL.md"
commit_all "base"
check main >/dev/null

git -C "$repo" checkout -b change >/dev/null
printf 'edited\n' >"$repo/plugins/household/skills/example/SKILL.md"
commit_all "edit skill"
if check main >/dev/null 2>&1; then
  echo "expected a household edit without a version bump to fail" >&2
  exit 1
fi

write_versions 0.2.0 0.2.0 0.1.0
commit_all "disagree"
if check main >/dev/null 2>&1; then
  echo "expected disagreeing manifests to fail" >&2
  exit 1
fi

write_versions 0.0.9
commit_all "downgrade"
if check main >/dev/null 2>&1; then
  echo "expected a version decrease to fail" >&2
  exit 1
fi

write_versions 0.2.0
commit_all "bump"
check main >/dev/null

echo "check-household-version tests passed"
