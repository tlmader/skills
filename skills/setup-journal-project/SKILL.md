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
  printed instructions use for photo entries.

## 1. Resolve

Collect the project name, its canonical goal, the default author, and the
Notion destination. Prefer a supplied URL; otherwise search for the exact page
title and ask the user to resolve any ambiguity before writing. Read the page,
its `Goal`, the Journal database, its data source, schema, views, and every
entry, following pagination.

An existing People-type `Author` keeps that type: resolve the author's exact
Notion user ID. New Journals use a rich-text `Author`. Authorship comes from
who wrote an entry, never from who it mentions or shows.

## 2. Apply

When the Journal already satisfies the contract below, leave it as it is.
Structural changes need an explicit setup, upgrade, or migration request.

For a new setup:

- Add `## Goal` and the canonical goal to the project page.
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
every placeholder with values read back from Notion, and verify none remain.
Use separate page and database links. For a People-type `Author`, replace the
rich-text wording with the field type and exact Notion user ID. Print the
result inside a Markdown fence longer than any fence it contains, and state
any view or upload capability the integration lacked.

The run is complete when the Journal matches the contract on read-back and the
printed instructions contain no placeholders.
