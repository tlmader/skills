# Repository Guidelines

## Project Structure & Module Organization

This repository is a personal collection of agent skills for Claude Code and
Codex.

- `plugins/household/skills/<name>/SKILL.md`: repository-owned skills, one
  folder per skill, shipped in the `household` plugin
- `plugins/household/.claude-plugin/plugin.json` and
  `.claude-plugin/marketplace.json`: the Claude Code plugin and the
  marketplace that lists it
- `.agents/skills/<name>/`: committed project-local third-party skills, restored
  by `pnpm skills:install` from `skills-lock.json`
- `.claude/skills/<name>`: committed relative symlinks into
  `../../.agents/skills/<name>` for Claude Code
- `.claude/settings.json`: Claude Code project settings and the `SessionStart`
  hook
- `.codex/`: Codex MCP configuration and workspace setup
- `docs/`: contributor docs such as `docs/file-structure.md`,
  `docs/release-flow.md`, and the tracker adapter under `docs/agents/`
- `CLAUDE.md` imports this file and adds Claude-only guidance
- root config: `package.json`, `commitizen.config.json`, `commitlint.config.js`,
  `.lintstagedrc.js`, and `.husky/`

GitHub Issues are the canonical tracker for this public repository. Record
durable issue context on the GitHub issue, following
`docs/agents/issue-tracker.md`, rather than committing routine design or plan
files. Put context in normal docs only when it is broadly useful beyond one
issue.

## Agent skills

### Issue tracker

Tracker operations are defined in the sole adapter. The real file is
`docs/agents/issue-tracker.md`; `docs/issue-tracker.md` is a compatibility
symlink to it, so either path reaches the same adapter. Follow it for claiming,
labels, lifecycle, relationships, and closure. `docs/issue-publishing.md`
governs issue body framing.

### Triage labels

Triage roles map through the tracker adapter and the repository's configured
labels. See `docs/issue-tracker.md`.

### Domain docs

This is a single-context repository; domain docs are optional and created
lazily when useful. See `docs/agents/domain.md`.

## Build, Test, and Development Commands

- `pnpm install` (alias `pnpm env:setup`): install dev tooling and initialize
  Husky. It does not restore skills; installed skills are committed.
- `pnpm skills:install`: reinstall locked project-local skills from
  `skills-lock.json` (`pnpm dlx skills@latest experimental_install --yes`), then
  commit the refreshed `.agents/skills/**` and `.claude/skills/**` files.
- `pnpm clean`: remove generated dependency and transient install files
  (`node_modules`, `.skills-install.lock*`); never removes committed skills
- `bash scripts/worktree-setup.sh`: shared worktree bootstrap (fast-forward onto
  the remote default branch, then `pnpm env:setup`), wired into the Claude
  `SessionStart` hook and the Codex `[setup]` block
- `pnpm commit`: create a guided conventional commit with issue tagging
- `pnpm exec commitlint --edit <path>`: validate commit messages manually
- `pnpm lint:md`: lint all Markdown files with `markdownlint-cli2`
- `find plugins/household/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort`: list skill entry
  points

## Coding Style & Naming Conventions

- Use lowercase, kebab-case names for skill folders
- Keep each skill's frontmatter `name:` equal to its folder name
- Use Markdown for docs and JSON for manifests
- Issue titles use plain language, not conventional commit formatting. Example:
  `Add a skill for weekly review notes`

## Working on skills

When creating or editing a skill under `plugins/household/skills/`, review it with the
`writing-for-agents` skill for trigger descriptions, a concise `SKILL.md`, and
when to split reference material into separate files. Install it if missing:

```bash
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@writing-for-agents -y
```

Name shared repository docs by their repository-relative path in prose (for
example `docs/issue-tracker.md`) instead of linking them from a skill. A skill
may be installed at a different depth in another repository, so such links
break. Links to files bundled inside the same skill are fine.

## Testing Guidelines

- **Tests must not assert on the prose content of documentation files.** Tests
  validate code behavior and machine-read formats only: shell or JS behavior,
  valid JSON or YAML, `SKILL.md` frontmatter schema, symlink resolution, and
  required-file existence. Documentation prose must stay freely editable.
  Markdown linting (`pnpm lint:md`) is allowed; linting is not testing.
- Validate paths with `find` or `rg`.
- Run `pnpm lint:md` before committing Markdown changes.

## Commit type selection

Product files in this repository are `plugins/**`, `.agents/skills/**`,
`.claude/skills/**`, `skills-lock.json`, and `scripts/**`. Choose the commit
type from the changed paths and the behavior they change, not from file
extensions.

| Type | Use when |
| --- | --- |
| `feat` | A skill is added, or a skill or script gains new behavior |
| `fix` | A skill or script behaved incorrectly and now behaves correctly |
| `docs` | Only explanatory docs change (`README.md`, `docs/**`, `AGENTS.md`) |
| `chore` | Maintenance with no visible behavior change (tooling, deps, config) |
| `ci` | Only `.github/workflows/**` or CI configuration changes |
| `refactor` | A skill or script is restructured without changing behavior |
| `test` | Only tests change |

| Excuse | Correction |
| --- | --- |
| "It's only Markdown, so it's `docs:`." | `SKILL.md` is agent instructions. Changing what a skill does is `feat:` or `fix:`. |
| "It's a small change, so it's `chore:`." | Size does not pick the type. Behavior change does. |
| "It touches config, so it's `chore:`." | `skills-lock.json` changes which skills are installed. That is `feat:` or `fix:`. |

Stop and re-check the type when a `docs:` or `chore:` commit touches
`plugins/**`, `.agents/skills/**`, or `skills-lock.json`.

WRONG: `docs: #12 tighten the weekly-review trigger description`

RIGHT: `fix: #12 tighten the weekly-review trigger description`

## Pull request labels

Use `gh label list` to see the repository's pull-request labels. Each label's
`description` documents when to apply it. Issue labels are live tracker data
and must be resolved through `docs/issue-tracker.md`.

## Writing pull requests

This repository defines no pull request body contract; body structure is left
to the author. `.github/pull_request_template.md` only reminds authors to add
closing references. Put one `Closes #N`, `Fixes #N`, or `Resolves #N` line in
the body for each completed issue; the Pull Request workflow requires at least
one.

## GitHub Actions pinning

Pin every action reference to a full 40-character commit SHA, not a tag. Above
each `uses:` line, leave a comment naming the action and version the SHA
corresponds to.

```yaml
# actions/checkout@v4.3.1
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
```

`actionlint` runs in CI on pull requests that change workflows.

## Commit & Pull Request Guidelines

Commits must use conventional commit types, no scopes, and a GitHub issue
reference:

`type: #123 short description`

Examples:

- `chore: #1 bootstrap repository`
- `feat: #12 add weekly-review skill`

Pull requests are squash-merged, so PR titles must use the same format.
Bot-generated release-please PRs from `release-please--*` branches are the only
no-issue exception. See `docs/release-flow.md`.
