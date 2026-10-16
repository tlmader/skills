# Wayfinder tracker upgrade contract

## Inventory

Read the project, both child databases when present, their data sources, every view, and every Issue and Document before proposing changes. Record the row count and stable identity of every row. Compare the result with the tracker contract, Documents contract, and project-instructions template.

An existing Wayfinder `Issues` tracker is sufficient to recognize the project even when `Documents` is absent. A Documents-contract reference store is sufficient when `Issues` is absent. Add either missing empty database through the confirmable migration plan. If a child database named `Documents` exists but its purpose or property mapping is ambiguous, halt before confirmation and ask the operator how to map it.

Halt before confirmation when the target is not recognizably a Wayfinder project, a required read is incomplete, or an ambiguity would make a transformation unsafe. Ask the operator to resolve each ambiguity; never infer a destructive mapping.

## Migration plan

Produce a complete diff with:

- required property additions or type changes;
- relation changes;
- view creation, reconfiguration, renaming, ordering, and removal;
- creation or migration of the `Documents` database, including canonical properties and views;
- counts and identities for every Issue or Document transformation;
- any user-added content or configuration that would be removed or overwritten.

Preserve extra properties, additional select options and values, additional views, and all page content unless a current contract conflicts with them. The three canonical `Issues` views and two canonical `Documents` views must be exact; itemize any conflicting extra view that must be reconfigured or removed.

Ask for one explicit confirmation after presenting the complete plan and immediately before the first write. A changed database invalidates the confirmation and requires a fresh plan.

## Native status migration

The target is Notion's native `Status` property with `Not started`, `In progress`, and `Done`.

Apply these deterministic mappings:

| Existing state | Target state |
|---|---|
| Map with `Open` or `Not started` | `In progress` |
| Ticket with `Open` | `Not started` |
| Any Issue with `Closed` | `Done` |
| Ticket with `Not started` or `In progress`, Map with `In progress`, or any Issue with `Done` | unchanged |

Treat only blank or unfamiliar statuses as ambiguous. Preserve every `Assignee` independently of status; assignment never supplies evidence that work has started, and progress never supplies evidence about responsibility. Include affected linked Issue names and collect an operator decision before producing the confirmable plan.

The migration capability must preserve values while converting or reconfiguring the property. When no integration, API, or CLI can convert it (the public Notion API cannot create a native status property), include a hand step in the plan: in the Notion UI, the user converts `Status` to Notion's native status type, keeping the existing options, and adds `Not started` (To-do group), `In progress` (In progress group), and `Done` (Complete group). Verify the conversion and options, then apply the mapping above. After every value is mapped, the user may delete the old options by hand. Halt before confirmation only when neither route can guarantee the native lifecycle and mapping.

## Preservation and verification

Preserve every pre-upgrade Issue's page identity, title, body, page-level comments, relations, assignment, and `Created` value. Preserve the dependency graph and Map/Ticket parentage.

Preserve every pre-upgrade Document's page identity, title, body, comments, properties, source links, and timestamps. Add missing canonical properties without discarding values. Treat a same-named property with an incompatible type or an uncertain title/source mapping as an ambiguity requiring an operator decision. Create no duplicate, example, backup, or temporary Notion rows or databases.

After migration, validate both contracts and reconcile post-upgrade Issue and Document identities and row counts with the inventory. Report every change made and print the current project instructions only after all checks pass.
