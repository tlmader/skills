# skills

Personal collection of agent skills for Claude Code and Codex.

## Install

In Claude Code, add this repository as a plugin marketplace and install the
`household` plugin, which carries every skill below:

```text
/plugin marketplace add tlmader/skills
/plugin install household@tlmader-skills
```

The marketplace also re-exports the `team` plugin from
[patinaproject/skills](https://github.com/patinaproject/skills), always at
its latest default branch, so one marketplace covers both:

```text
/plugin install team@tlmader-skills
```

Or install individual skills for any agent with the
[skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills@latest add tlmader/skills --skill <name>
```

Run `npx skills@latest add tlmader/skills` without `--skill` to choose skills
interactively.

## Skills

Each skill lives in `plugins/household/skills/<name>/SKILL.md` and lists the connectors it needs
and the settings you can give it.

| Skill | What it does | Needs |
| --- | --- | --- |
| [`categorize-ynab-transactions`](plugins/household/skills/categorize-ynab-transactions/SKILL.md) | Categorize unapproved YNAB transactions and verify full coverage without approving anything | YNAB; `using-ynab` for writes |
| [`using-ynab`](plugins/household/skills/using-ynab/SKILL.md) | Update, split, or delete YNAB transactions through the official API | YNAB |
| [`find-savings`](plugins/household/skills/find-savings/SKILL.md) | Find and track ranked savings on bills, subscriptions, and spending | Transaction data, web |
| [`organize-google-drive`](plugins/household/skills/organize-google-drive/SKILL.md) | Organize Drive with a rulebook that learns from your corrections | Google Drive |
| [`free-game-findings`](plugins/household/skills/free-game-findings/SKILL.md) | Find and claim free-to-keep game giveaways | Web, browser |
| [`uploading-photos-to-notion`](plugins/household/skills/uploading-photos-to-notion/SKILL.md) | Upload photos to Notion as durable images beside their text | Notion |
| [`setup-journal-project`](plugins/household/skills/setup-journal-project/SKILL.md) | Set up a Notion journal and the instructions that keep it | Notion, `uploading-photos-to-notion` |
| [`setup-wayfinder-project`](plugins/household/skills/setup-wayfinder-project/SKILL.md) | Set up a Wayfinder tracker and documents store in Notion | Notion, [mattpocock/skills](https://github.com/mattpocock/skills) |

`setup-journal-project` and `setup-wayfinder-project` run only when you invoke
them by name.

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
