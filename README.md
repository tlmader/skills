# skills

Personal collection of agent skills for Claude Code, Grok, and Codex.

## Install

### Claude Code

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

### Grok Build

Grok Build reads Claude Code marketplaces, so the same repository works:

```sh
grok plugin marketplace add tlmader/skills
grok plugin install household@skills
grok plugin install team@skills
```

Grok names the marketplace after the repository (`skills`), not the manifest.

### Grok Bot

Grok Bot installs plugins from a Cursor team marketplace (Cursor Teams and
Enterprise plans). An admin adds it under **Dashboard → Plugins & MCPs → Team
Marketplaces → Add Marketplace → Import from Repo** with
`https://github.com/tlmader/skills`; the `household` plugin then appears in
Grok Bot under **Connect apps**. Cursor marketplaces only list plugins stored
in the same repository, so `team` is not offered there.

Without a team marketplace, ask a Bot to save a skill from its `SKILL.md`, for
example: "Save
`https://github.com/tlmader/skills/blob/main/plugins/household/skills/find-savings/SKILL.md`
as a skill called find-savings."

### Other agents

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
| [`ynab-categorization`](plugins/household/skills/ynab-categorization/SKILL.md) | Categorize unapproved YNAB transactions without approving them, learning from your corrections in `Agents/YNAB categorization` | YNAB, cloud storage; `using-ynab` for writes |
| [`using-ynab`](plugins/household/skills/using-ynab/SKILL.md) | Update, split, or delete YNAB transactions through the official API | YNAB |
| [`find-savings`](plugins/household/skills/find-savings/SKILL.md) | Find and track ranked savings on bills, subscriptions, and spending | Transaction data, web |
| [`free-game-findings`](plugins/household/skills/free-game-findings/SKILL.md) | Find and claim free-to-keep game giveaways | Web, browser |
| [`uploading-photos-to-notion`](plugins/household/skills/uploading-photos-to-notion/SKILL.md) | Upload photos to Notion as durable images beside their text | Notion |
| [`setup-journal-project`](plugins/household/skills/setup-journal-project/SKILL.md) | Set up a Notion journal and the instructions that keep it | Notion, `uploading-photos-to-notion` |
| [`setup-wayfinder-project`](plugins/household/skills/setup-wayfinder-project/SKILL.md) | Set up a Wayfinder tracker and documents store in Notion | Notion, [mattpocock/skills](https://github.com/mattpocock/skills) |

`setup-journal-project` and `setup-wayfinder-project` run only when you invoke
them by name.

To organize Google Drive or other cloud storage, use `cloud-storage-organizer`
from the `team` plugin.

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
