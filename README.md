# skills

Personal collection of agent skills for Claude Code and Codex.

## Install

Install a skill from this repository with the
[skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills@latest add tlmader/skills --skill <name>
```

Run `npx skills@latest add tlmader/skills` without `--skill` to choose skills
interactively.

## Skills

Repository-owned skills live in `skills/<name>/SKILL.md`. None have been added
yet.

## Conventions

- Commits and PR titles use `type: #N short description`, with no scope. The
  `commit-msg` hook enforces this with commitlint.
- Markdown is linted with `markdownlint-cli2` on commit and in CI.
- Pull requests are squash-merged and must close at least one GitHub issue.
- Project-local third-party skills are committed under `.agents/skills/` and
  locked in `skills-lock.json`.

## Development

```sh
pnpm install
pnpm lint:md
```

See [`AGENTS.md`](./AGENTS.md) for the full workflow,
[`CONTRIBUTING.md`](./CONTRIBUTING.md) for contribution rules, and
[`docs/file-structure.md`](./docs/file-structure.md) for the repository
layout.

## License

[MIT](./LICENSE)
