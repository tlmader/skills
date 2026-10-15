# Contributing

Thanks for contributing to `tlmader/skills`. Start here for repo rules;
everything else lives in [`AGENTS.md`](./AGENTS.md).

## Setup

```bash
pnpm install
```

This installs dev tooling and registers the Husky hooks (`commit-msg` and
`pre-commit`).

## Commit messages

Commits must follow Conventional Commits with no scope and a required GitHub
issue reference:

```text
type: #123 short description
```

Examples:

- `feat: #42 add a skill`
- `docs: #17 clarify install steps`

The `commit-msg` hook enforces this. PR titles follow the same format so the
squash commit can reuse the title verbatim. See `AGENTS.md` for how to choose
the commit type.

## Markdown

All Markdown is linted with `markdownlint-cli2`. The `pre-commit` hook runs it
on staged files. To lint the whole repo:

```bash
pnpm lint:md
```

## Pull requests

- Keep the PR title in commitlint format.
- This repository has no required body structure; write the body as you see
  fit.
- Put one `Closes #N`, `Fixes #N`, or `Resolves #N` line in the body for each
  completed issue.
- Bot-generated release-please PRs are the only no-issue exception.

## Further reading

- [`AGENTS.md`](./AGENTS.md): shared workflow contract.
- [`CLAUDE.md`](./CLAUDE.md): Claude Code-specific guidance.
- [`docs/file-structure.md`](./docs/file-structure.md): repository layout.
