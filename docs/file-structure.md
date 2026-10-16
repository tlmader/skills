# Repository File Structure

This document describes the layout of `tlmader/skills`.

## Top level

| Path | Purpose |
| --- | --- |
| `skills/<name>/` | Repository-owned skills. Each folder holds a `SKILL.md` whose frontmatter `name:` matches the folder name. |
| `.agents/skills/<name>/` | Committed project-local third-party skills, restored with `pnpm skills:install`. |
| `.claude/skills/<name>` | Committed relative symlinks into `../../.agents/skills/<name>` for Claude Code. |
| `.claude/settings.json` | Claude Code project settings. Its `SessionStart` hook runs `scripts/worktree-setup.sh`. |
| `.codex/config.toml` | Codex MCP server configuration. |
| `.codex/environments/environment.toml` | Codex workspace setup; its `[setup]` block runs `scripts/worktree-setup.sh`. |
| `.mcp.json` | MCP servers for supported tools. |
| `.github/` | Workflows, CODEOWNERS, issue template configuration, and the pull request template. |
| `.husky/` | Git hooks: `commit-msg` runs commitlint; `pre-commit` runs lint-staged. |
| `docs/` | Contributor documentation. |
| `docs/agents/` | Settings files read by agent skills: the issue-tracker adapter and domain-doc guidance. |
| `docs/issue-tracker.md` | Compatibility symlink to `agents/issue-tracker.md`. |
| `scripts/clean.sh` | Removes generated dependency and transient install files. |
| `scripts/worktree-setup.sh` | Syncs the default branch and installs dependencies in a new worktree. |
| `skills-lock.json` | Lock file for project-local third-party skills. |
| `AGENTS.md` | Shared agent workflow contract. `CLAUDE.md` imports it. |
| `CHANGELOG.md` | Release history, maintained by release-please once releases are enabled. |

## Skill layout

```text
skills/
└── <name>/
    ├── SKILL.md
    ├── references/       # material only some runs need, linked from SKILL.md
    ├── assets/           # templates and icons
    └── agents/openai.yaml  # optional Codex and ChatGPT display metadata
```

Keep `SKILL.md` concise and move material that only some branches need into
`references/`, linked from the step that needs it. A skill names the
connectors it needs and the settings it reads, and holds no personal
identifiers, accounts, or amounts.

## Symlink hygiene

`docs/issue-tracker.md` and every entry under `.claude/skills/` are relative
symlinks. Never replace them with copies; two real copies drift. On Windows,
enable `core.symlinks` before cloning.
