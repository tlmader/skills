#!/usr/bin/env bash
# worktree-setup.sh
#
# Prepare a fresh checkout or worktree for work: sync the default branch and
# install dependencies. Shared by Claude Code (a SessionStart hook in
# .claude/settings.json) and Codex (the [setup] block in
# .codex/environments/environment.toml) so both agents run identical setup.
#
# Safe to re-run: the fast-forward merge only advances when HEAD is already an
# ancestor of the remote default branch (so feature branches with their own
# commits are left untouched), and `pnpm env:setup` is idempotent.
#
# Branch sync is best-effort: it runs as a SessionStart hook, so a network or
# remote failure (e.g. offline) must warn rather than abort, otherwise the
# essential `pnpm env:setup` step below would never run.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Resolve the remote default branch instead of assuming it is named `main`.
default_branch="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
default_branch="${default_branch#origin/}"
if [ -z "$default_branch" ]; then
  default_branch="$(git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p' || true)"
fi
default_branch="${default_branch:-main}"

if git fetch --prune origin "$default_branch"; then
  if git merge-base --is-ancestor HEAD "origin/$default_branch" 2>/dev/null; then
    git merge --ff-only "origin/$default_branch" ||
      echo "worktree-setup: warning: fast-forward failed; skipping branch sync" >&2
  fi
else
  echo "worktree-setup: warning: could not fetch origin/$default_branch; skipping branch sync" >&2
fi

pnpm env:setup
