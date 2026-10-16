---
name: setup-wayfinder-project
description: Set up or upgrade a project's Wayfinder tracker in Notion (Issues and Documents databases) and print the project instructions that drive it.
disable-model-invocation: true
license: MIT
---

# Setup Wayfinder Project

Create or upgrade one project's Notion setup: sibling `Issues` and `Documents`
databases under a project page, then print standalone project instructions.
The workflow is written as Notion capabilities and Wayfinder concepts;
translate it to the active runtime's tools.

Before resolving or changing a target, read completely:

- [Tracker contract](references/tracker-contract.md): the `Issues` topology,
  schema, views, and invariants.
- [Documents contract](references/documents-contract.md): the `Documents`
  topology, schema, views, and provenance rules.
- [Project instructions template](assets/project-instructions.template.md): the
  exact output to render after setup.

For an explicit upgrade, also read the
[upgrade contract](references/upgrade-contract.md) completely before planning
changes.

## Requirements

- The skills the printed instructions depend on: `wayfinder`, `grilling`,
  `domain-modeling`, `research`, and `prototype`, from
  [mattpocock/skills](https://github.com/mattpocock/skills). Install just those
  five with `npx skills@latest add mattpocock/skills --skill wayfinder grilling
  domain-modeling research prototype`.
- A Notion integration with the capabilities listed in preflight below.

## 1. Resolve the target without writing

Collect the project name and an optional Notion page URL.

- With a URL, fetch it and compare its title with the given name; ask when
  they differ.
- Without a URL, search for an exact title match. Use a unique match; ask the
  user to choose among several.
- With no match, collect the Notion parent location and the exact title for a
  page to create later.

Resolve exactly one existing page or one exact parent-and-title pair, asking
the user whenever the target is ambiguous.

## 2. Preflight before every write

Verify the runtime can load or invoke `wayfinder`, `grilling`,
`domain-modeling`, `research`, and `prototype` by name, in any packaging.
Require actual availability, not a mention in prose. When any is missing,
halt, list them, and point to the install command above.

Verify authenticated Notion capabilities for:

- search and fetch;
- page creation and child-database creation;
- schema creation and update, including self-relations, people, selects,
  multi-selects, URLs, dates, Notion's native status property, created time,
  and last edited time;
- view creation and update with filters and sorts;
- data-source queries and page-property updates;
- page-content reads and writes;
- user resolution; and
- page-level comment reads and writes.

Use the runtime's Notion integration; where it lacks an operation, use an
already-authenticated official Notion API or CLI. Halt before writing unless
every capability is available. Credentials stay in the runtime's secret store.

For an existing page, inspect child databases and linked database views. An
`Issues` or Wayfinder tracker, a `Documents` or source-grounded reference
store, or a recognizable equivalent of either is an **existing setup**:
continue only when the user explicitly asked to upgrade or migrate it;
otherwise halt and explain that setup leaves existing projects as they are.

Preflight is complete when every dependency and capability passes, the target
is unambiguous, and the run is either a new setup or an explicit upgrade.

## 3. Scaffold a new setup

Take this branch only when neither database nor an equivalent exists. Create
the project page under the resolved parent if needed, refetch it, and recheck
for an existing setup immediately before creating anything else.

Create a database named `Issues` under the project page, applying every
invariant in the tracker contract. Build in passes, because self-relations need
the new data source's identity:

1. Create the database and its non-relational properties.
2. Add the self-relations and their reciprocal properties.
3. Configure the generated view as `Maps` or remove it, create the remaining
   named views, and place `Maps` first.
4. Read `Issues` back and validate it against the tracker contract.
5. Create a sibling database named `Documents` with every property and view in
   the Documents contract, and place `All` first.
6. Read `Documents` back and validate it against the Documents contract.

Translate the contracts to the current integration and keep every user-facing
term exactly. Leave both databases empty: no Map, Ticket, Document, example
row, template, or temporary validation artifact.

When a write succeeds and a later step fails, keep the partial result, stop,
and report its link plus every unmet invariant from the read-back. Cleanup and
repair wait for a separate explicit request.

## 4. Upgrade an existing setup

Take this branch only for an explicit upgrade or migration request. Follow the
upgrade contract to inventory the current setup and compute a complete diff
without writing.

Present one migration plan itemizing schema, view, and row changes, including
every status transformation and removal, and ask the user to confirm that
exact plan. Anything but an affirmative answer halts. Refetch both databases
after confirmation; if either changed materially, recompute the plan and
confirm again.

Apply the confirmed plan in dependency-safe passes, preserving Issue and
Document pages, bodies, comments, relations, assignments, properties, and
timestamps. Create no temporary Notion artifacts. Read back and validate after
each pass. When a write succeeds and a later step fails, keep the partial
migration, stop, and report the project and database links, the completed
changes, and every unmet invariant; resume only on a new explicit request and
confirmation.

When both databases already match the contracts, make no changes, report that
the setup is current, and continue to the instructions.

## 5. Verify and print instructions

Refetch the project, both databases, their data sources, and their views, and
confirm:

- `Issues` and `Documents` are siblings under the selected project;
- new databases hold zero rows, and upgraded ones retain every pre-upgrade
  Issue and Document;
- every required property has the right type, options, and relation
  direction;
- every canonical view has the required filters, sorts, and order; and
- the project and both databases have stable URLs.

Only after every check passes, render the template by replacing
`{{PROJECT_NAME}}`, `{{PROJECT_URL}}`, `{{ISSUES_URL}}`, and
`{{DOCUMENTS_URL}}`, and verify no placeholder remains. Print the instructions
inside an outer fence longer than the template's inner fences, such as four
backticks. Project-settings changes are the user's to make.

Finish with links to the project, `Issues`, and `Documents`. The run is
complete when every read-back check passes, the rendered instructions contain
no placeholders, and all three links are returned.
