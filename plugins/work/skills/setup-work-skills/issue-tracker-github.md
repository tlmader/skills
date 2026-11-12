# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

Each `<number>`, `<n>`, `<child>`, `<original>`, and `<map>` in this file is an issue number, digits only, and each `<blocker-db-id>` and `<comment-id>` is a database id, digits only. Stop when a value is not digits only. Single-quote each other value you substitute into a shell argument, `--arg`, `-f`, and `-F` values and label, title, login, and heading values included, and write each `'` in it as `'\''`, so `Won't fix` is `'Won'\''t fix'`. A fixed literal is not a substituted value, so `"Won't fix"` and `"Wayfinder: Map"` keep their double quotes. A value that already sits inside a single-quoted word, such as `'Wayfinder: <Type>'` or `'## <title>'`, gets only the escape. Heredoc bodies and the hex `<random>` delimiter keep the heredoc rules below instead. Each `<path>` is the file the row created inside a directory from `mktemp -d`, quoted by the same rule. Every command targets the repository of the current checkout, which `gh` reads from `git remote -v`, and every `gh api` endpoint names it through the `{owner}/{repo}` placeholders. To target another repository, wrap every shell call the row makes in its own subshell that sets it first, `( export GH_REPO='<owner>/<repo>'; <commands> )`, including each call after a check or a retry. Both the `gh api` placeholders and `gh issue` honor `GH_REPO`. The exported value reaches each `gh` inside a pipeline or `$(...)`, where a one-command prefix does not, and it ends with the subshell even when a command fails.

- **Create an issue**: pass the body on stdin from a quoted heredoc, as **Comment on an issue** says:

  ```sh
  gh issue create --title '<title>' --body-file - <<'EOF_<random>'
  <body>
  EOF_<random>
  ```

- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: pass the body on stdin from a quoted heredoc, so the shell expands no backtick or `$(...)` in it:

  ```sh
  gh issue comment <number> --body-file - <<'EOF_<random>'
  <body>
  EOF_<random>
  ```

  Replace both `<random>` with a fresh token from `openssl rand -hex 8`, and check that it equals no body line, because the first body line equal to the delimiter ends the heredoc and the shell runs the lines after it.
- **Apply / remove labels**: `gh issue edit <number> --add-label '...'` / `--remove-label '...'`. A label value must not contain a comma, because `gh` splits a value on commas into several labels.
- **Close**: `gh issue close` reads no comment from a file, so post the explanation first as **Comment on an issue** shows, then close with `gh issue close <number>`. When the close fails, retry only the close, so the comment is not posted twice.
- **Close as duplicate**: post the comment that names the original first, as **Comment on an issue** shows. Then, after the live-state check with `--state '<old Triage label>'`, run `gh issue edit <number> --add-label "Won't fix" --remove-label '<old Triage label>'`, skipped when the old Triage label is already `Won't fix`. Then, after the check with `--state "Won't fix"`, close with `gh issue close <number> --duplicate-of <original>` and no `--comment`, as the last write. `gh issue close` sets no label, so a skipped or failed close leaves `Won't fix` on an open issue, and the `triage` skill reports it. When the close fails, retry only the close, so the comment is not posted twice.
- **Close as `Won't fix`**: post the rationale first as **Comment on an issue** shows. Then, after the live-state check with `--state '<old Triage label>'`, close and relabel in one write. `gh issue close` sets no label, so use the REST **Update an issue** endpoint, which takes the state and the label set in one request:

  ```sh
  patch=$(gh api 'repos/{owner}/{repo}/issues/<number>' \
    | jq -e --arg old '<old Triage label>' --arg new "Won't fix" \
        '{state: "closed", state_reason: "not_planned",
          labels: ([.labels[].name] - [$old] + [$new] | unique)}') \
    && printf '%s\n' "$patch" \
    | gh api -X PATCH 'repos/{owner}/{repo}/issues/<number>' --input -
  ```

  `jq -e` fails when the read fails or prints nothing, so no PATCH runs without the label set. `<old Triage label>` is one of the Triage label names. For a pull request, send the same PATCH without `state_reason`. `labels` replaces the whole label set with the set just read, so a label a person adds between that read and the PATCH is dropped. The window is one pipeline long, and the risk is accepted. When the close fails, retry only the check and this pipeline, so the comment is not posted twice.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## Triage closures

**Triage applies confident closures: no.** _(Set to `yes` to let unattended triage close a confident duplicate, or an already-implemented request as `Won't fix`, by the rules in patina-mode's triage playbook. A missing flag means no.)_

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Attach an artifact

An issue artifact is durable working material about one issue: `<identifier> Triage notes`, `<identifier> Agent brief`, or `<identifier> Research: <question>`, where `<identifier>` is the issue reference, such as `#123`. Each research question gets its own artifact.

- **Location**: one issue comment per artifact.
- **Line order**: the comment opens with the triage disclaimer `> *This was generated by AI during triage.*`, then the UTC time of the write as `Last updated: 2026-10-16T12:34:56Z`, then, in triage notes only, `Verdict updated: <UTC time>`, the time of the last save that wrote a triage verdict, then the artifact title as a heading, `## <identifier> Agent brief`.
- **Triage account**: `<triage-login>`, the login that writes these artifacts. A GitHub App login keeps its `[bot]` suffix, such as `<app-slug>[bot]`.
- **Lookup**: list the trusted comments whose heading equals the title exactly. A comment is trusted when the triage account wrote it, or when its `author_association` is `OWNER`, `MEMBER`, or `COLLABORATOR`. Neither a `[bot]` login nor `performed_via_github_app` makes a comment trusted. Ignore every other comment, even one with the heading: never read it as the artifact and never edit it. The artifact is every trusted match, read together in `created_at` order. A match is `mine` when the saving account, the account `gh` is signed in as, wrote it. Read that login with GraphQL `viewer`, because `gh api user` returns 403 to a GitHub App, and stop when the query fails or prints nothing. Stop when more than one match is `mine`. Read `Last updated:` from the `mine` match, or from the newest match when none is `mine`. Read `Verdict updated:` from the match with the latest `Verdict updated:` value, whoever wrote it. This command needs `jq` and prints each trusted match, oldest first. Pass the title and logins only through `--arg`, never inside the filter text:

  ```sh
  me=$(gh api graphql -f query='{viewer{login}}' --jq .data.viewer.login)
  gh api 'repos/{owner}/{repo}/issues/<number>/comments' --paginate \
    | jq --arg login '<triage-login>' --arg me "$me" --arg heading '## <title>' '.[]
      | select((.user.login // "" | ascii_downcase) == ($login | ascii_downcase) or (.author_association | IN("OWNER", "MEMBER", "COLLABORATOR")))
      | select(.body | split("\n") | any(rtrimstr("\r") == $heading))
      | {id, html_url, login: .user.login, created_at,
         mine: ((.user.login | ascii_downcase) == ($me | ascii_downcase)), body}'
  ```

- **Save**: the complete content is the saving account's own part. When a caller says to keep the existing lines, it means the lines of the `mine` match. When no match is `mine`, start from the lines this section requires, and never copy a line from another author's match. Write the content with a file tool to a new file in a directory from `mktemp -d`, never with a shell command that echoes it, because quoted issue text can hold `$(...)` or a backtick that the shell runs. When one match is `mine`, edit it in place with `gh api --method PATCH 'repos/{owner}/{repo}/issues/comments/<comment-id>' -F 'body=@<path>'`. Otherwise create a comment with `gh issue comment <number> --body-file '<path>'`, even when another author's trusted match exists. Never edit a match that is not `mine`. Write a fresh `Last updated:` line on every save, keep the `Verdict updated:` value that Lookup read, also in a new comment, unless the caller sets a new one, and return the comment URL.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `Wayfinder: Map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label "Wayfinder: Map"`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `Wayfinder: <Type>` (`Research`/`Prototype`/`Grilling`/`Task`), passed single-quoted as `--label 'Wayfinder: <Type>'`. Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST 'repos/{owner}/{repo}/issues/<child>/dependencies/blocked_by' -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api 'repos/{owner}/{repo}/issues/<n>' --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: post the answer as **Comment on an issue** shows, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
