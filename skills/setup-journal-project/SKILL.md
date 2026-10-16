---
name: setup-journal-project
description: Set up or upgrade a Notion Journal for a project and print the project instructions that make agents keep it.
disable-model-invocation: true
license: MIT
---

# Setup Journal Project

Set up one Notion project page containing one `Journal` database, then print
the [project instructions](assets/project-instructions.template.md) with
verified values substituted.

## Requirements

- A Notion integration that can search, fetch, create pages and databases,
  update schemas and views, and query data sources.
- The `uploading-photos-to-notion` skill from this repository, which the
  printed instructions use for photo entries. Install it with `npx
  skills@latest add tlmader/skills --skill uploading-photos-to-notion`.

## 1. Resolve

Verify the runtime can load `uploading-photos-to-notion`; when it cannot,
halt and point to the install command above.

Collect the project name, its canonical goal, the default author, and the
Notion destination. Prefer a supplied URL; otherwise search for the exact page
title and ask the user to resolve any ambiguity before writing. With no match,
collect a parent location and create the project page there during Apply. Read the page,
its `Goal`, the Journal database, its data source, schema, views, and every
entry, following pagination.

An existing People-type `Author` keeps that type: resolve the author's exact
Notion user ID. New Journals use a rich-text `Author`. Authorship comes from
who wrote an entry, never from who it mentions or shows.

## 2. Apply

When the Journal already satisfies the contract below, leave it as it is.
Structural changes need an explicit setup, upgrade, or migration request.

For a new setup:

- Add `## Goal` and the canonical goal to the project page. When the page
  already has a Goal that differs from the one the user gave, ask which is
  canonical and keep a single `## Goal` section.
- Create one empty database named `Journal` inside it.
- Create only `Name` (title), `Date` (date), and `Author` (rich text).
- Configure an `Entries` table view showing `Name`, `Date`, and `Author`,
  sorted by `Date` descending.
- Configure a `Calendar` view by `Date`, showing `Name` and `Author`, when the
  integration supports it.

For an upgrade or migration, inventory every entry before writing. Preserve
database, data-source, and entry identities, and every entry's title, date,
body, original attachments, authorship, and extra properties. Resolve
ambiguous author or date transformations with the user before writing. A
source service being migrated from stays intact unless the user separately
authorized deleting it.

Refetch before and after writes. Reconcile entry count and identities, schema,
views, authors, and touched attachments. Create no temporary rows, templates,
or backups, and refetch rather than retrying blindly.

## 3. Print the instructions

Render [the template](assets/project-instructions.template.md), replacing
every placeholder with values read back from Notion (the author name and goal
as the user gave them, when Notion has none yet), and verify none remain.
Use separate page and database links. Set `{{AUTHOR_TYPE}}` to `rich text` or
`People`. `{{AUTHOR_VALUE}}` is the exact text written into a rich-text
`Author` (the default author's name, as the user gave it), or the author's
exact Notion user ID for People. Print the result inside a Markdown fence longer than any fence it
contains, and state any view or upload capability the integration lacked.

The run is complete when the Journal matches the contract on read-back and the
printed instructions contain no placeholders.
