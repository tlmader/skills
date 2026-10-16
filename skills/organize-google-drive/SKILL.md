---
name: organize-google-drive
description: Organize Google Drive by moving, renaming, and trashing files under a learned rulebook kept in ORGANIZE.md at the Drive root, learning from the user's corrections. Use when asked to organize Google Drive or to run a scheduled Drive cleanup.
license: MIT
---

# Organize Google Drive

One run of a daily **loop**. Each run turns the user's corrections into
**lessons**, clears the approved **backlog**, then organizes loose files by
the **rulebook**. The rulebook is the single source of truth for the user's
preferences, and the user can edit it directly.

## Requirements

A Google Drive connector that can search, list folders, read file content and
metadata (including sharing), create folders, move, rename, trash, and create
files. When it cannot overwrite a file's content in place, the save fallback
below covers it.

## State

All state lives in `ORGANIZE.md`, a plain Markdown file in the root of My
Drive, owned by the user. Find it by searching for a file titled `ORGANIZE.md`
whose parent is the My Drive root and whose owner is the user.

Sections, in order:

- `Rules`: one per line, `[confirmed|trial n/3] <when> → <action>  (evidence:
  <why>)`.
- `Shared folders`: one line per **boundary**, `- <name> (<folder id>) — top
  level swept: yes|no`. A boundary is a folder the user owns whose sharing
  differs from its parent's: the point where other people's access starts or
  changes. Its subfolders that inherit that sharing sit inside the same
  boundary. Moving a file across a boundary changes who can see it.
- `Inbox folders`: one line per folder, `- <name> (<folder id>)`. Their
  contents are organized like loose root files; trash a listed folder once it
  is empty and remove its line.
- `Backlog`: specific actions the user already approved. Boundary crossings
  listed here are pre-approved.
- `Questions`: numbered, at most 5 open. Further questions wait in a `Queued`
  list below them and move up, oldest first, as slots free. Group files that
  share a best guess into one question, and never queue a second question
  about the same file or folder.
- `Log`: one entry per run, newest first: a `### <start date and time, with
  timezone> — <summary>` heading, one or two lines of prose, then a table with
  columns `file id | title | old parent | new parent | old title | new title |
  rule | reversed`. Trash actions put `TRASH` in the new parent column, and
  held files put `HELD` there. `reversed` is empty until a reversal is
  learned, then `yes`.
- `Placed`: file IDs this skill moved out of a swept location whose log rows
  were pruned, one per line with the rule that moved them.

A file's **latest row** is its newest row across all entries. When a section
is missing, add it on this run's save.

**Reading:** read the full text of `ORGANIZE.md` by file ID. When the search
returns several, use the most recently modified one, and trash the others after
this run's first save succeeds.

**Writing:** save at the end of each step (in create-only mode, once at the end
of the run, so the file the user may have open is replaced only once), with that step's rows added under
this run's log entry, so a run that fails midway still records what it did.
Refetch `ORGANIZE.md` before each save and merge any edits the user made since
the last read (answers, Backlog lines, rule changes). Overwrite the content in
place when the connector can. When it can only create files, create a new
`ORGANIZE.md` in the My Drive root as plain `text/markdown` with conversion to
a Google Doc turned off, confirm it exists, then trash the previous copy by its
ID.

### First run

When no `ORGANIZE.md` exists, survey My Drive: top-level folders, naming
habits, what sits loose in root, and every boundary at any depth. Write what
you observe as `trial` rules, list the boundaries under `Shared folders` with
`top level swept: no`, add up to 5 questions, write a log entry with the survey
summary and no rows, create `ORGANIZE.md`, and end with the report. The first
run changes nothing else.

## Steps

1. **Harvest lessons.** For every row in the log except `HELD` rows and rows
   already marked `reversed`, compare the file's current parent, title, and
   trash state with its latest row. Fetch metadata in bulk (one listing per
   folder the rows name, plus the trash), then fetch any file missing from
   those listings by its ID: it may have moved elsewhere.
   - A **reversal** is a file whose parent or title differs from its latest
     row, or a file logged as `TRASH` that now exists outside the trash. A
     file that is gone (trash emptied or purged) is not a reversal, and a later
     row written by this skill replaces the earlier one, so the skill's own
     moves never count.
   - Each reversal demotes the rule that caused it to `trial 0/3`, even if it
     was `confirmed`, and adds a corrected rule capturing where the user put
     the file. Mark the row `reversed: yes` and update its new parent and new
     title to where the user put it.
   - A `trial` rule advances one step per run, not per file, when it acted in
     the previous run and none of its rows are reversed; at `3/3` it becomes
     `confirmed`. A rule needs three runs without a correction to be
     confirmed.
   - Each answered question becomes a `confirmed` rule, plus Backlog lines for
     any specific files it names; delete the question. An answer to a
     top-level question about a boundary sets its `top level swept` flag. An
     answer counts whether the user wrote it under the question in
     `ORGANIZE.md` or gave it in this session.

   Done when every row is checked and every answered question is converted.

2. **Clear the backlog.** Do every Backlog line (folder creation, moves,
   renames, trashes). First check each file still exists where the line
   expects; if not, skip the line and add a question about it. Remove each
   line once done.

3. **Sweep.** First refresh `Shared folders`: add any new boundary, at any
   depth, as `top level swept: no`, and queue one question asking whether its
   loose top-level files should be organized.

   Candidates are files, not folders, that the user owns and that sit in the
   My Drive root, in an `Inbox folders` folder, or in the top level of a
   boundary marked `top level swept: yes`. Location decides, not dates: moving
   a file in Drive leaves its timestamps unchanged. A file is **settled**, and
   not a candidate, while it sits where and as its latest row places it, by
   this skill or (for a reversed row) by the user. `ORGANIZE.md` is never a
   candidate. A candidate listed under `Placed` is one the user brought back:
   count it as a reversal of that rule, settle it where it is with a new
   row, and remove its `Placed` line. Read a file's content whenever its title
   alone cannot place it.
   - Matches a `confirmed` rule → apply it.
   - Matches a `trial` rule → apply it to at most 3 files per rule per run.
     Files over the cap are logged `HELD` with the rule's name and retried next
     run. A `trial` rule whose action is trash holds its files and queues one
     question listing them instead; answering it confirms the rule.
   - No rule, or two rules disagree → **hold**: leave the file, log it as
     `HELD`, and queue a question naming it and your best guess. A file whose
     latest row is already `HELD` stays held without a new row; once a rule
     matches it, apply the rule.

   A folder moves only under a Backlog line or a rule that names it. Done when
   every candidate is acted on or held.

4. **Prune and report.** Drop log rows older than 30 days unless they are the
   latest row of a file that still sits in the root, an inbox folder, or a
   swept boundary's top level (those rows keep it settled or held). For each
   dropped row of a file this skill moved out of a swept location, add `-
   <file id> (<rule>)` to a `Placed` section. Save, then
   report counts moved, renamed, trashed, and held; reversals learned from;
   the open questions; and a link to `ORGANIZE.md`. In a scheduled run, notify
   the user only when something changed or a new question needs them; a run
   with no actions and no new questions stays silent.

## Guardrails

Actions are folder creation, moves, renames, and trash only. Work only on files
the user owns, and leave their sharing as found. Drive trash (recoverable for
30 days) is the only way to remove a file, and only under a `confirmed` rule, a
Backlog line, for an empty folder listed under `Inbox folders`, or for a
superseded copy of `ORGANIZE.md`.

A move that crosses a boundary, in either direction, is held even under a
`confirmed` rule, unless a Backlog line or a confirmed rule names that exact
file or group of files. Moves within one boundary, including into its
inheriting subfolders, are not crossings. Each crossing hold queues one
question proposing the move (grouping files that share a destination); a yes
becomes a Backlog line.
