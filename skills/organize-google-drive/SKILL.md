---
name: organize-google-drive
description: Organize Google Drive by moving, renaming, and trashing files under a learned rulebook kept in ORGANIZE.md at the Drive root, learning from the user's corrections. Use when asked to organize Google Drive or to run a scheduled Drive cleanup.
license: MIT
---

# Organize Google Drive

One run of a daily **loop**. Each run turns the user's corrections since the
last run into **lessons**, clears the approved **backlog**, then organizes new
files by the **rulebook**. The rulebook is the single source of truth for the
user's preferences, and the user can edit it directly.

## Requirements

A Google Drive connector that can search, read file content and metadata,
move, rename, trash, and create files. When it cannot overwrite a file's
content in place, the save step below covers the fallback.

## State

All state lives in `ORGANIZE.md`, a plain Markdown file in the root of My
Drive, owned by the user. Find it by searching for a file titled `ORGANIZE.md`
whose parent is the My Drive root and whose owner is the user.

Sections, in order:

- `Rules`: one per line, `[confirmed|trial n/3] <when> → <action>  (evidence:
  <why>)`.
- `Shared folders`: one line per **boundary** folder, `- <name> (<folder id>) —
  top level swept: yes|no`. Other people can see a boundary folder, so moving
  a file in shares it and moving it out revokes their access.
- `Inbox folders`: one line per folder, `- <name> (<folder id>)`. Their
  contents are organized like loose root files; trash a listed folder once it
  is empty and remove its line.
- `Backlog`: specific actions the user already approved. Boundary crossings
  listed here are pre-approved.
- `Questions`: numbered, at most 5 open. While a free slot exists, each run
  asks about one `top level swept: no` folder: should its loose top-level
  files be organized? The answer sets the flag.
- `Log`: one entry per run, newest first: a `### <start date and time, with
  timezone> — <summary>` heading,
  one or two lines of prose, then a table with columns `file id | title | old
  parent | new parent | old title | new title | rule | reversed`. Trash
  actions put `TRASH` in the new parent column, and held files put `HELD`
  there. `reversed` is empty until a reversal is learned, then `yes`.

When a section is missing, add it on this run's save. Seed a new `Shared
folders` section from any folder an existing boundary rule already names.

**Reading:** read the full text of `ORGANIZE.md` by file ID. When the search
returns several, use the most recently modified one, and trash the others after
this run's save succeeds.

**Writing:** save once per run, at the end. Overwrite the content in place when
the connector can. When it can only create files, create a new `ORGANIZE.md` in
the My Drive root as plain `text/markdown` with conversion to a Google Doc
turned off, confirm it exists, then trash the previous copy by its ID.

### First run

When no `ORGANIZE.md` exists: survey My Drive (top-level folders, naming
habits, what sits loose in root, which top-level folders are shared), write
what you observe as `trial` rules, list the shared folders under `Shared
folders` with `top level swept: no`, add up to 5 questions, write a log entry
with the survey summary and no rows, create `ORGANIZE.md`, and end with the
report. The first run changes nothing else; the next run sweeps the root and
inbox folders the survey saw.

## Steps

1. **Harvest lessons.** For every action logged in the last 30 days (Drive's
   trash window), skipping `HELD` rows and rows marked `reversed`, fetch the
   file's current metadata.
   - A **reversal** is a file whose parent or title differs from the latest
     log row for that file, or a trashed file the user restored. A file
     logged as `TRASH` is reversed only when it still exists outside the
     trash; one that is gone (emptied or purged) is not a reversal. Compare
     against the latest row only: a later run's own move or rename of the
     file replaces the earlier row and is never a reversal. Each reversal
     demotes the rule that caused it to `trial 0/3`, even if it was already
     `confirmed`, and adds a corrected rule capturing where the user put the
     file instead. Mark the log row `reversed: yes` so it counts once.
   - A `trial` rule advances one step per run, not per file, when it acted in
     the previous run and none of its logged actions are reversed; at `3/3` it
     becomes `confirmed`. A rule therefore needs three runs without a
     correction to be confirmed.
   - Each answered question becomes a `confirmed` rule, plus Backlog lines for
     any specific files it names; delete the question. An answer counts whether
     the user wrote it under the question in `ORGANIZE.md` or gave it in this
     session.

   Done when every action in the window is checked and every answered
   question is converted.

2. **Clear the backlog.** Do every Backlog line (moves, renames, trashes,
   folder creation). First check each file still exists where the line expects;
   if not, skip the line and add a question about it. Remove each line once
   done.

3. **Sweep.** Candidates are all files, not folders, the user owns that
   currently sit in the My Drive root, in an `Inbox folders` folder, or in the
   top level of a `Shared folders` folder marked `top level swept: yes`.
   Location decides, not dates: moving a file in Drive leaves its timestamps
   unchanged. A folder moves only under a Backlog line or a rule that names
   it.
   `ORGANIZE.md` is never a candidate. Read a file's content whenever its title
   alone cannot place it.
   - Matches a `confirmed` rule → apply it.
   - Matches a `trial` rule → apply it to at most 3 files per rule per run.
     Files over the cap are logged `HELD` with the rule's name and retried
     next run. A `trial` rule whose action is trash holds its files and asks one
     question listing them instead; answering it confirms the rule.
   - No rule, or two rules disagree → **hold**: leave the file, log it as
     `HELD`, and add a question naming it and your best guess when a slot is
     free. Keep at most 5 open questions. A file whose latest row is already
     `HELD` stays held without a new row, and gets a question only when it
     has none yet; once a rule matches it, apply the rule.

   Done when every candidate is acted on or held.

4. **Save, log, and report.** Add this run's log entry, drop log entries
   older than 30 days (harvest never reads them), save `ORGANIZE.md`,
   then report counts moved, renamed, trashed, and held; reversals learned
   from; the open questions; and a link to `ORGANIZE.md`. In a scheduled run,
   notify the user only when something changed or a new question needs them; a
   run with no actions and no new questions stays silent.

## Guardrails

Actions are folder creation, moves, renames, and trash only. Drive trash
(recoverable for 30 days) is the only way to remove a file, and only under a `confirmed` rule, a
Backlog line, for an empty folder listed under `Inbox folders`, or for a
superseded copy of `ORGANIZE.md` as the State section describes. Files stay in the user's Drive with their sharing as found. Work
only on files the user owns.

A file crossing the edge of any `Shared folders` folder, in either direction,
is held even under a `confirmed` rule, unless a Backlog line or a confirmed
rule names that exact file or group of files.
