#!/usr/bin/env bash
# Commit the refreshed plugins/work tree onto $BRANCH and open or update one
# pull request. Reuses a single open tracking issue. When GitHub Actions is
# not allowed to create pull requests, records the repository setting on that
# issue and exits 0 so the daily run is not a red failure.
set -euo pipefail

: "${BRANCH:?}"
: "${SHA:?}"
: "${DEFAULT_BRANCH:?}"
: "${GITHUB_REPOSITORY:?}"

issue_title="Sync the Work plugin copy with patinaproject/skills"
setting="Allow GitHub Actions to create and approve pull requests"

find_issue() {
  gh issue list --state open --limit 100 --json number,title \
    | jq -r --arg title "$issue_title" '.[] | select(.title == $title) | .number' \
    | sort -n \
    | awk 'NR == 1 { print }'
}

issue="$(find_issue)"
if [ -z "$issue" ]; then
  url="$(
    gh issue create \
      --title "$issue_title" \
      --body "$(
        cat <<'EOF'
patinaproject/skills changed its Work plugin. Refresh plugins/work so Cursor installs the latest skills.

The daily sync reuses this issue until that refresh merges.
EOF
      )"
  )"
  issue="${url##*/}"
  issue="${issue%%\?*}"
fi

title="feat: #${issue} sync work plugin to patinaproject/skills@${SHA}"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git checkout -B "$BRANCH"
git add plugins/work
git commit -m "$title"
git push --force origin "$BRANCH"

pr_body="$(
  cat <<EOF
Closes #${issue}

Refreshes plugins/work from patinaproject/skills@${SHA} with scripts/sync-work-plugin.sh.
EOF
)"

existing="$(
  gh pr list --head "$BRANCH" --base "$DEFAULT_BRANCH" --state open --json number \
    --jq '.[0].number // empty'
)"

blocked_body() {
  cat <<EOF
patinaproject/skills@${SHA} changed the Work plugin. \`plugins/work\` is on branch \`${BRANCH}\` and ready to merge.

GitHub Actions could not open the pull request. Enable this repository setting, then re-run the Sync Work plugin workflow:

**Settings → Actions → General → Workflow permissions → ${setting}**

Compare: https://github.com/${GITHUB_REPOSITORY}/compare/${DEFAULT_BRANCH}...${BRANCH}?expand=1
EOF
}

if [ -n "$existing" ]; then
  if output="$(gh pr edit "$existing" --title "$title" --body "$pr_body" 2>&1)"; then
    printf '%s\n' "$output"
    exit 0
  fi
else
  if output="$(gh pr create --head "$BRANCH" --base "$DEFAULT_BRANCH" --title "$title" --body "$pr_body" 2>&1)"; then
    printf '%s\n' "$output"
    exit 0
  fi
fi

if printf '%s\n' "$output" | grep -q 'not permitted to create or approve pull requests'; then
  gh issue edit "$issue" --body "$(blocked_body)"
  printf '%s\n' "$output" >&2
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    cat >>"$GITHUB_STEP_SUMMARY" <<EOF
### Sync branch is pushed; pull request was not opened

Enable **Settings → Actions → General → Workflow permissions → ${setting}**, then re-run this workflow.

Compare: https://github.com/${GITHUB_REPOSITORY}/compare/${DEFAULT_BRANCH}...${BRANCH}?expand=1
EOF
  fi
  echo "::warning title=Actions cannot open pull requests::Enable Settings → Actions → General → Workflow permissions → ${setting}. Branch ${BRANCH} is pushed and issue #${issue} tracks it."
  exit 0
fi

printf '%s\n' "$output" >&2
exit 1
