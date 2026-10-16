# Notion Wayfinder tracker contract

## Topology

- The selected Notion project page owns one child database named `Issues`, beside `Documents`.
- The database belongs only to that project. It has no project relation and shares no rows with another project.
- Every Map and Ticket is a row whose page holds its body and comments.
- Setup creates no rows.

## Properties

Preserve these display names and meanings exactly.

| Property | Notion type | Contract |
|---|---|---|
| `Issue` | Title | The Map or Ticket name. |
| `Type` | Select | Exactly `Map`, `Research`, `Prototype`, `Grilling`, `Task`. |
| `Status` | Status | Notion's native default lifecycle: `Not started`, `In progress`, `Done`; default `Not started`. |
| `Parent` | Self-relation | A Ticket points to exactly one Map; a Map is empty. |
| `Tickets` | Reciprocal self-relation | The Map's child Tickets. |
| `Blocked by` | Self-relation | Tickets that must close before this Ticket is unblocked. |
| `Blocks` | Reciprocal self-relation | Tickets blocked by this Issue. |
| `Assignee` | People | The person responsible for the Issue. Optional and independent of `Status`. |
| `Created` | Created time | Stable ordering helper. Hide from normal views. |

Create self-relations only after the data source exists. Configure Notion's native sub-item and dependency presentation when the integration exposes it without changing these relation names. The relations remain the canonical data model.

## Views

Use table or list views. A new database has exactly the three canonical views below with `Maps` first. An upgrade preserves additional user-created views and existing view order unless a view conflicts with a canonical view. Hide `Created` in the canonical views.

| View | Filter | Sort |
|---|---|---|
| `Maps` | `Type` is `Map`; `Status` is not `Done` | `Created` descending |
| `Assigned` | `Type` is not `Map`; `Status` is not `Done`; `Assignee` is not empty | `Created` ascending |
| `Done` | `Status` is `Done` | `Created` descending |

For Tickets, `Not started` is open work that has not begun, `In progress` is open work underway, and `Done` is closed. Assignment records responsibility and never determines progress. An assigned Ticket can be `Not started`, `In progress`, or blocked.

## Data invariants

- An active Map has `Type = Map`, `Status = In progress`, no `Parent`, and the canonical Map body from the project instructions. A completed Map has `Status = Done`.
- An open Ticket has one of the four Ticket Types, `Status = Not started` or `In progress`, exactly one Map in `Parent`, and the canonical Ticket body.
- A Ticket may have an `Assignee` at any lifecycle state. Changing `Assignee` never changes `Status`, and changing `Status` never changes `Assignee`.
- A closed Issue has `Status = Done`.
- Every relation points to an Issue in this same database.
- The `Blocked by` graph is acyclic.
- The project-instructions template is the single source of truth for Map and Ticket bodies and lifecycle operations.
