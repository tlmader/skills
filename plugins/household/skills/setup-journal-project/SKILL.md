---
name: setup-journal-project
description: Set up or upgrade a Google Drive journal (a Sheet with one dated row per entry and a flat Photos folder) and print the project instructions that keep it.
disable-model-invocation: true
license: MIT
---

# Setup Journal Project

Set up one journal in the user's personal Google Drive, then print the
[project instructions](assets/project-instructions.template.md) with verified
values substituted.

A journal is a project folder containing a Google Sheet and a flat `Photos`
folder. The Sheet's `Entries` tab holds one row per entry. Photo files live
directly in `Photos`; `uploading-journal-photos` owns their filenames.

## Contract

```text
<Project> Journal/
├── <Project> Journal    (Google Sheet)
└── Photos/              (files only)
```

The `Entries` tab has a header row and these columns, in this order. `Date`
is a date-typed cell and `Time` is a time-typed cell. A text cell that only
displays a date or time fails the contract.

| Column | Content |
| --- | --- |
| `Date` | The event date. |
| `Time` | The event time, or blank when the time is unknown. |
| `Name` | A title with the date left out. |
| `Caption` | The entry. |
| `Author` | Who wrote the entry. |
| `Photos` | How many photo files belong to the row. `0` when there are none. |
| `Photo links` | Links to those files, or blank when there are none. |

Rows stay ordered by `Date` descending. Extra columns and extra tabs stay in
place, and this skill leaves their cells as they are. A new journal has no
extra columns and no second tab.

## Requirements

- Google Drive tools that can find, create, and list folders and files, and
  Google Sheets tools that can create a spreadsheet, write a header, write
  date-typed and time-typed cells, and read a cell's type back.
- The `uploading-journal-photos` skill from this repository. The printed
  instructions use it for photo entries. Install it with `npx skills@latest
  add tlmader/skills --skill uploading-journal-photos`.

## 1. Resolve

Verify the runtime can load `uploading-journal-photos`. When it cannot, stop
and point to the install command above.

Collect the project name, its canonical goal, and the default author. The
folder and Sheet are named `<Project> Journal`, unless the project name
already ends in `Journal`, in which case use that name as given. Prefer a
supplied folder or Sheet URL. Otherwise search personal Drive for that folder
name. Use one exact match. When several match, ask the user which folder is
the journal. When none match, collect the parent folder and create the
folder there during Apply.

Read the folder, the Sheet, the `Entries` header, the type of `Date` and
`Time` cells, every data row, and the `Photos` listing, following pagination.

Resolve is complete when the skill is available and exactly one existing
journal or one parent-and-name pair is chosen.

## 2. Apply

When the journal already satisfies the contract, leave it as it is.

For a journal that does not exist yet:

- Create the project folder, a Sheet of the same name inside it, and an empty
  `Photos` folder beside the Sheet.
- Name the first tab `Entries` and write the header row from the contract.
- Format the `Date` column as a date and the `Time` column as a time.
- Leave the Sheet with zero data rows.

For a journal that exists and misses part of the contract, repair it in
place. Inventory every row and every file in `Photos` before writing. Keep
the folder, the Sheet, and every row's identity, title, date, time, caption,
author, and photo files. Add a missing `Photos` folder. Add a missing
`Photos` or `Photo links` column. For a row whose count or links are blank,
count the files named `<date> <title>.<ext>` or `<date> <title>-<n>.<ext>`,
set `Photos` to that count, and set `Photo links` to those files' Drive URLs
in filename order. Leave a row whose links already name those files. Rewrite
a text `Date` or `Time` as a date or time value for the same calendar day and
clock time. Ask the user before changing a row's author, date, or title. A
source being migrated from stays intact unless the user separately asks to
remove it.

Refetch before and after writes. Reconcile row count, file count, header
order, and the types of `Date` and `Time`. Write the Sheet and folder in
place.

Apply is complete when a read-back matches the contract.

## 3. Print the instructions

Render [the template](assets/project-instructions.template.md). Replace every
placeholder with values read back from Drive: the folder name and link, the
Sheet link, the `Photos` folder link, the goal, and the default author. When
the user gave a goal or author that Drive does not store, use what the user
gave. Verify no placeholder remains.

Print the result inside a Markdown fence longer than any fence it contains.

The run is complete when the journal matches the contract on read-back and
the printed instructions contain no placeholders.
