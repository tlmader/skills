#!/usr/bin/env bash
# Exercises scripts/open-work-sync-pr.sh against a local git repo and a fake gh.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
script="$root/scripts/open-work-sync-pr.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

repo="$tmp/repo"
remote="$tmp/remote.git"
state="$tmp/gh-state"
log="$tmp/gh.log"
summary="$tmp/summary.md"
fake="$tmp/gh"

mkdir -p "$state"
: >"$log"

cat >"$fake" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
log="${GH_LOG:?}"
state="${GH_STATE:?}"
printf '%s\n' "$*" >>"$log"

jq_prog=""
body=""
title=""
number=""
expect=""
for arg in "$@"; do
  if [ -n "$expect" ]; then
    printf -v "$expect" '%s' "$arg"
    expect=""
    continue
  fi
  case "$arg" in
    --title) expect=title ;;
    --body) expect=body ;;
    --jq) expect=jq_prog ;;
    --*) ;;
    *)
      if [[ "$arg" =~ ^[0-9]+$ ]]; then
        number="$arg"
      fi
      ;;
  esac
done

case "$1 $2" in
  "issue list")
    cat "$state/issues.json"
    ;;
  "issue create")
    next="$(cat "$state/next-issue")"
    jq -n --argjson number "$next" --arg title "$title" \
      '[{number: $number, title: $title}]' >"$state/issues.json"
    printf '%s\n' "$next" >"$state/created-issue"
    printf 'https://github.com/%s/issues/%s\n' "${GITHUB_REPOSITORY}" "$next"
    ;;
  "issue edit")
    printf '%s\n' "$body" >"$state/edited-body"
    ;;
  "pr list")
    if [ -n "$jq_prog" ]; then
      jq -r "$jq_prog" "$state/prs.json"
    else
      cat "$state/prs.json"
    fi
    ;;
  "pr create")
    printf 'create\n' >>"$state/pr-actions"
    mode="$(cat "$state/pr-mode")"
    if [ "$mode" = "denied" ]; then
      echo "pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)" >&2
      exit 1
    fi
    if [ "$mode" = "other" ]; then
      echo "pull request create failed: validation" >&2
      exit 1
    fi
    printf 'https://github.com/%s/pull/1\n' "${GITHUB_REPOSITORY}"
    ;;
  "pr edit")
    printf 'edit %s\n' "$number" >>"$state/pr-actions"
    printf '%s\n' "$title" >"$state/pr-title"
    printf '%s\n' "$body" >"$state/pr-body"
    ;;
  *)
    echo "unexpected gh invocation: $*" >&2
    exit 1
    ;;
esac
EOF
chmod +x "$fake"

git init --bare -b main "$remote" >/dev/null
git init -b main "$repo" >/dev/null
git -C "$repo" config user.name "Test"
git -C "$repo" config user.email "test@example.com"
mkdir -p "$repo/plugins/work"
printf 'one\n' >"$repo/plugins/work/UPSTREAM"
git -C "$repo" add plugins/work/UPSTREAM
git -C "$repo" commit -m "initial" >/dev/null
git -C "$repo" remote add origin "$remote"
git -C "$repo" push -u origin main >/dev/null

run_sync() {
  local mode="$1"
  shift
  printf '%s\n' "$mode" >"$state/pr-mode"
  : >"$summary"
  (
    cd "$repo"
    PATH="$tmp:$PATH" \
      GH_LOG="$log" \
      GH_STATE="$state" \
      GITHUB_STEP_SUMMARY="$summary" \
      GITHUB_REPOSITORY="tlmader/skills" \
      BRANCH="sync-work" \
      DEFAULT_BRANCH="main" \
      SHA="abc1234" \
      bash "$script"
  )
}

assert() {
  if ! eval "$2"; then
    echo "assertion failed: $1" >&2
    echo "--- log ---" >&2
    cat "$log" >&2
    echo "--- summary ---" >&2
    cat "$summary" >&2
    exit 1
  fi
}

# No open issue and Actions cannot create a pull request: create one issue,
# push the branch, record the setting, and exit 0.
printf '[]\n' >"$state/issues.json"
printf '[]\n' >"$state/prs.json"
printf '41\n' >"$state/next-issue"
: >"$state/pr-actions"
printf 'two\n' >"$repo/plugins/work/UPSTREAM"
run_sync denied
assert "branch pushed" "git -C '$repo' rev-parse --verify origin/sync-work >/dev/null"
assert "commit names the new issue" "git -C '$repo' log -1 --format=%s origin/sync-work | grep -q 'feat: #41 sync work plugin'"
assert "setting recorded" "grep -q 'Allow GitHub Actions to create and approve pull requests' '$state/edited-body'"
assert "summary names the setting" "grep -q 'Allow GitHub Actions to create and approve pull requests' '$summary'"
assert "issue created once" "test \"\$(grep -c '^issue create' '$log')\" -eq 1"

# A later run reuses that issue instead of creating another.
: >"$log"
: >"$state/pr-actions"
printf 'three\n' >"$repo/plugins/work/UPSTREAM"
run_sync denied
assert "no second issue" "test \"\$(grep -c '^issue create' '$log')\" -eq 0"
assert "reused issue in the commit" "git -C '$repo' log -1 --format=%s origin/sync-work | grep -q 'feat: #41 sync work plugin'"

# The lowest numbered open issue wins when duplicates already exist.
printf 'four\n' >"$repo/plugins/work/UPSTREAM"
jq -n '[{number:26,title:"Sync the Work plugin copy with patinaproject/skills"},{number:18,title:"Sync the Work plugin copy with patinaproject/skills"},{number:9,title:"Something else"}]' >"$state/issues.json"
: >"$log"
run_sync denied
assert "lowest issue number" "git -C '$repo' log -1 --format=%s origin/sync-work | grep -q 'feat: #18 sync work plugin'"

# An existing pull request is updated and not created.
printf 'five\n' >"$repo/plugins/work/UPSTREAM"
printf '[{"number":7}]\n' >"$state/prs.json"
: >"$state/pr-actions"
: >"$log"
run_sync ok
assert "edited the open pull request" "grep -q '^edit 7$' '$state/pr-actions'"
assert "did not create a pull request" "! grep -q '^create$' '$state/pr-actions'"
assert "pull request closes the issue" "grep -q 'Closes #18' '$state/pr-body'"

# A different pull-request failure still fails the run.
printf 'six\n' >"$repo/plugins/work/UPSTREAM"
printf '[]\n' >"$state/prs.json"
if run_sync other; then
  echo "expected a non-permission pull request failure to exit non-zero" >&2
  exit 1
fi

echo "open-work-sync-pr tests passed"
