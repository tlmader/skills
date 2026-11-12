# Issue tracker: GitLab

Issues and specs for this repo live as GitLab issues. Use the [`glab`](https://gitlab.com/gitlab-org/cli) CLI for all operations.

## Conventions

- **Create an issue**: read the description from a quoted heredoc, as **Comment on an issue** says, then pass it as a variable:

  ```sh
  IFS= read -r -d '' body <<'EOF_<random>' || true
  <description>
  EOF_<random>
  if printf '%s' "$body" | grep -n '^[[:space:]]*/'; then
    echo 'escape the lines above first' >&2
  else
    glab issue create --title '<title>' --description "$body"
  fi
  ```

  Write each `'` in the title as `'\''`. GitLab runs a description line that starts with `/` as a quick action, so only an intended quick action may start a line. The check refuses every such line, so escape it as **Note text** says, and post an intended quick action as its own note.
- **Read an issue**: `glab issue view <number> --comments`. Use `-F json` for machine-readable output.
- **List issues**: `glab issue list -F json` with appropriate `--label` filters.
- **Comment on an issue**: GitLab calls comments "notes". Post a note with this command, which reads the body from a quoted heredoc:

  ```sh
  IFS= read -r -d '' body <<'EOF_<random>' || true
  <body>
  EOF_<random>
  if printf '%s' "$body" | grep -n '^[[:space:]]*/'; then
    echo 'escape the lines above first' >&2
  else
    glab issue note <number> --message "$body"
  fi
  ```

  Replace both `<random>` with a fresh token from `openssl rand -hex 8` before you run it. `read` exits 1 when it reaches the end of the heredoc, so `|| true` keeps a `set -e` shell going. GitLab runs a note line that starts with `/` as a quick action, so only an intended quick action may start a line. The check refuses every such line, so escape it as **Note text** says, and post an intended quick action as its own note.
- **Apply / remove labels**: `glab issue update <number> --label '<label>'` / `--unlabel '<label>'`, with each `'` in a label value written as `'\''`. Pass one label per `--label` or `--unlabel` flag, and repeat the flag for several labels. A label value must never contain a comma. When a label you must apply or remove contains one, stop and report it.
- **Close**: `glab issue close <number>`. `glab issue close` does not accept a closing comment, so post the explanation first as **Comment on an issue** shows, then close.
- **Close as duplicate**: post the comment that names the original first, as **Comment on an issue** shows. Then, as the last write, post one note made only of quick-action lines:

  ```sh
  IFS= read -r -d '' body <<'EOF_<random>' || true
  /label ~"Won't fix"
  /unlabel ~"<old Triage label>"
  /duplicate #<original>
  EOF_<random>
  if printf '%s' "$body" | grep -nvE '^/(label|unlabel|duplicate) '; then
    echo 'this note holds only its quick-action lines' >&2
  else
    glab issue note <number> --message "$body"
  fi
  ```

  Replace both `<random>` as **Comment on an issue** says, and resolve `<original>` to an issue number yourself. When the old Triage label is already `Won't fix`, drop the `/label` and `/unlabel` lines. GitLab applies every quick action in one note together, so the label change, the close, and the duplicate mark land in one write. The check refuses every line that is not one of the three quick actions.
- **Close as `Won't fix`**: post the rationale first as **Comment on an issue** shows, with `glab mr note` in place of `glab issue note` for a merge request. Then close and relabel in one request with the **Edit an issue** API: `glab api -X PUT projects/:id/issues/<number> -f state_event=close -f "add_labels=Won't fix" -f 'remove_labels=<old Triage label>'`, where `<old Triage label>` is one of the Triage label names, with each `'` written as `'\''`. When the old Triage label is already `Won't fix`, drop the `remove_labels` field. It changes labels by addition and removal, so it keeps every other label. For a merge request, send the same request to `projects/:id/merge_requests/<number>`. When the close fails, retry only this request, so the rationale is not posted twice.
- **Note text**: read each note body and issue description from a quoted heredoc, as **Comment on an issue** shows, so the shell expands nothing in it. Never put the heredoc inside `$(...)`, because macOS `/bin/bash` 3.2 scans the command substitution for its closing `)` through the heredoc, so an apostrophe in the body breaks the command. The `<random>` token must equal no body line, because the first body line equal to the delimiter ends the heredoc and the shell runs the lines after it. GitLab runs a note line that starts with `/`, such as `/close`, as a quick action under the posting account. So put a backslash before the `/` of every body line whose first non-space character is `/`. The `grep` in **Comment on an issue** prints each line that still starts with `/` and stops the post. Only an intended quick action, such as the lines of the **Close as duplicate** note, may start a line with `/`. Post intended quick actions as their own note, made only of quick-action lines and checked with a `grep -nvE` allowlist of the actions it means to run, as **Close as duplicate** shows.
- **Merge requests**: GitLab calls PRs "merge requests". Use `glab mr create`, `glab mr view`, `glab mr note`, etc., the same shape as `gh pr ...` with `mr` in place of `pr` and `note`/`--message` in place of `comment`/`--body`.
- **Triage live-state check**: run the `triage` skill's `check-issue-state.mjs` with `--tracker gitlab`. It reads the issue through `glab`, so `glab` must be signed in to the host.

Each `<number>`, `<original>`, `<note-id>`, `<map>`, `<child>`, `<blocker>`, `<n>`, and `<author.id>` in this file is an issue, merge-request, note, or user number, digits only. Check that each value matches `^[0-9]+$` before you substitute it, and stop when one does not. Single-quote each other value you substitute for a placeholder in a shell argument, `-f` fields included, and write each `'` in it as `'\''`. A label literal stays double-quoted only when it contains an apostrophe, such as `"Won't fix"`.

Infer the repo from `git remote -v`; `glab` does this automatically when run inside a clone.

## Merge requests as a triage surface

**MRs as a request surface: no.** _(Set to `yes` if this repo treats external merge requests as feature requests; `/triage` reads this flag.)_

When set to `yes`, MRs run through the same labels and states as issues, using the `glab mr` equivalents:

- **Read an MR**: `glab mr view <number> --comments` and `glab mr diff <number>` for the diff.
- **List external MRs for triage**: `glab mr list -F json`, then keep only MRs whose author is not a project member/owner (a contributor's MR, not a maintainer's in-flight work).
- **Comment / label / close**: `glab mr note`, `glab mr update <number> --label '<label>'` / `--unlabel '<label>'`, `glab mr close`. Quote each label value, pass one label per flag, and never put a comma in a label value, as **Apply / remove labels** says.

Unlike GitHub, GitLab numbers issues and MRs separately, so `#42` is unambiguous once you know which surface the maintainer means.

## Triage closures

**Triage applies confident closures: no.** _(Set to `yes` to let unattended triage close a confident duplicate, or an already-implemented request as `Won't fix`, by the rules in patina-mode's triage playbook. A missing flag means no.)_

## When a skill says "publish to the issue tracker"

Create a GitLab issue.

## When a skill says "fetch the relevant ticket"

Run `glab issue view <number> --comments`.

## Attach an artifact

An issue artifact is durable working material about one issue: `<identifier> Triage notes`, `<identifier> Agent brief`, or `<identifier> Research: <question>`, where `<identifier>` is the issue reference, such as `#123`. Each research question gets its own artifact.

- **Location**: one issue note per artifact.
- **Line order**: the note opens with the triage disclaimer `> *This was generated by AI during triage.*`, then the UTC time of the write as `Last updated: 2026-10-16T12:34:56Z`, then, in triage notes only, `Verdict updated: <UTC time>`, the time of the last save that wrote a triage verdict, then the artifact title as a heading, `## <identifier> Agent brief`.
- **Triage account**: `<triage-username>`, the username that writes these artifacts. A GitHub App login keeps its `[bot]` suffix, such as `<app-slug>[bot]`, and a GitLab bot user keeps its full username.
- **Lookup**: list the issue's notes oldest first with `glab api --paginate "projects/:id/issues/<number>/notes?sort=asc&order_by=created_at"`. Skip system notes (`system: true`). Keep only trusted notes, then find those whose heading equals the title exactly. A note is trusted when its `author.username` equals the triage account, compared case-insensitively, or when `glab api projects/:id/members/all/<author.id>` returns a `state` of `active` and an `access_level` of 30 (Developer) or higher. A 404 from that call means the author is untrusted. Ignore every other note, even one with the heading: never read it as the artifact and never edit it. Keep each match's `id`, `author.username`, `created_at`, and `body`. The artifact is every trusted match, read together in `created_at` order. A match is `mine` when its `author.username` equals the `username` from `glab api user`, the account `glab` is signed in as, compared case-insensitively. Stop when that call fails or returns no `username`. Stop when more than one match is `mine`. Read `Last updated:` from the `mine` match, or from the newest match when none is `mine`. Read `Verdict updated:` from the match with the latest `Verdict updated:` value, whoever wrote it.
- **Save**: the complete content is the saving account's own part. When a caller says to keep the existing lines, it means the lines of the `mine` match. When no match is `mine`, start from the lines this section requires, and never copy a line from another author's match. Write the content with a file tool to a new file in a directory from `mktemp -d`, never with a shell command that echoes it, because quoted issue text can hold `$(...)` or a backtick that the shell runs. GitLab runs a line that starts with `/`, such as `/close`, as a quick action under the saving account. So before the save, put a backslash before the `/` of every line whose first non-space character is `/`, also inside code blocks, because GitLab decides what is code with its own Markdown parser. A line that already starts with `\/` stays as it is, so a re-save does not escape it twice. This command does it:

  ```sh
  sed 's#^\([[:space:]]*\)/#\1\\/#' '<path>' > '<path>.escaped'
  ```

  When one match is `mine`, edit it in place with `glab api --method PUT projects/:id/issues/<number>/notes/<note-id> -F 'body=@<path>.escaped'`. Otherwise create a note with `glab api --method POST projects/:id/issues/<number>/notes -F 'body=@<path>.escaped'`, even when another author's trusted match exists. Never edit a match that is not `mine`. Write a fresh `Last updated:` line on every save, and keep the `Verdict updated:` value that Lookup read, also in a new note, unless the caller sets a new one. The Notes API returns no web URL, so return the issue's `web_url` from `glab api projects/:id/issues/<number>` plus `#note_<id>`, with the `id` from the save response.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `Wayfinder: Map`, holding the Notes / Decisions-so-far / Fog body. `glab issue create --label 'Wayfinder: Map'`. (On GitLab tiers with native epics, an epic may hold the map instead; a labelled issue works everywhere.)
- **Child ticket**: an issue carrying `Part of #<map>` at the top of its description and labels `Wayfinder: <Type>` (`Research`/`Prototype`/`Grilling`/`Task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitLab's **native blocking link**, the canonical, UI-visible representation. Add it with the `/blocked_by #<n>` quick action, posted as a note (`glab issue note <child> --message "/blocked_by #<blocker>"`). Native blocking links are a Premium/Ultimate feature; on the free tier (or where unavailable) fall back to a `Blocked by: #<n>, #<n>` line at the top of the description. A ticket is unblocked when every blocker is closed.
- **Frontier query**: `glab issue list -F json` scoped to the map's children, drop any with an open blocker: a native `blocked_by` link to an open issue (`glab api projects/:id/issues/:iid/links`), or an open issue in the `Blocked by` line, or an assignee; first in map order wins.
- **Claim**: `glab issue update <n> --assignee @me`, the session's first write.
- **Resolve**: post the answer as **Comment on an issue** shows, then `glab issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
