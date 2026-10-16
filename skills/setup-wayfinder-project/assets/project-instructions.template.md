## Wayfinder

Use the Notion `Issues` database as this project's canonical Wayfinder tracker.

- Project: [{{PROJECT_NAME}}]({{PROJECT_URL}})
- Issues: [Issues]({{ISSUES_URL}})
- Documents: [Documents]({{DOCUMENTS_URL}})

At the start of every thread in this project, invoke `wayfinder` through the active agent runtime's skill mechanism before substantive work, even when the user does not explicitly request it. Load the relevant Map and use it to ground the user's request; record resulting decisions, research, and follow-up work through the Wayfinder workflow. Keep the user's request as the scope of the thread; choose the next frontier Ticket only when asked to continue or advance the plan. This project requires `wayfinder`, `grilling`, `domain-modeling`, `research`, and `prototype`.

### Tracker vocabulary

Every Map and Ticket is an Issue named by its `Issue` title. Refer to Issues by linked name in human-facing text, never by a bare identifier.

- `Type = Map` represents `wayfinder:map`.
- Ticket Types are `Research`, `Prototype`, `Grilling`, and `Task`.
- A Ticket's `Parent` is its Map; the reciprocal relation is `Tickets`.
- `Blocked by` is the canonical dependency relation; `Blocks` is its reciprocal.
- `Assignee` records responsibility and is optional. It is independent of progress.
- For Tickets, `Status = Not started` means work has not begun; `In progress` means work is underway; `Done` means closed.

### Map body

Create a Map with `Type = Map`, `Status = In progress`, and this body:

```markdown
## Destination

<what reaching the end of this Map looks like; one or two lines>

## Notes

<domain, skills each session should consult, and standing preferences>

## Decisions so far

<!-- One linked line per closed Ticket: enough to judge relevance, with the detail living in the Ticket's resolution comment. -->

## Not yet specified

<!-- In-scope fog that cannot yet be phrased as a precise Ticket. -->

## Out of scope

<!-- Work deliberately ruled beyond this Map's Destination. -->
```

The Map is an index, not a store. Do not list open Tickets in its body; find them through the tracker.

### Ticket body

Create every Ticket as a child of its Map, choose exactly one Ticket Type, set `Status = Not started`, and use this body:

```markdown
## Question

<the decision, investigation, prototype, or prerequisite task this Ticket resolves>
```

Size one Ticket for one agent session. Create all Tickets first, then wire `Blocked by` relations in a second pass.

### Wayfinding operations

- **Load a Map:** Read the Map body for Destination, Notes, Decisions so far, fog, and scope. Load Ticket bodies and page-level comments only as needed.
- **Choose the next Ticket:** Unless the user named a Ticket, query non-Map child Tickets with `Status = Not started` in `Created` ascending order (oldest first). Prefer Tickets assigned to the responsible operator or with no assignee; leave Tickets assigned to someone else alone. Follow each Ticket's `Blocked by` relations and take the first Ticket whose blockers are all `Done`. Paginate until one qualifies or every candidate has been checked.
- **Start:** Refetch the Ticket, confirm `Status = Not started`, then set `Status = In progress` as the session's first write. Preserve `Assignee`; starting work never assigns it, and assignment never starts work.
- **Resolve:** Refetch the Ticket and Map, add the answer as a page-level resolution comment, set `Status = Done`, then append a linked one-line gist to the Map's `Decisions so far` without replacing other sections.
- **Advance the Map:** Add newly visible Tickets; graduate newly precise fog into Tickets; remove each graduated item from `Not yet specified`; wire dependencies after creation.
- **Complete a Map:** When no open Tickets or `Not yet specified` fog remain and the way to the Destination is clear, set the Map's `Status = Done`.
- **Rule out of scope:** Set the Ticket's `Status = Done` and add a linked explanation to the Map's `Out of scope`. Do not add it to `Decisions so far`.
- **Concurrency:** Treat other sessions as concurrent editors. Refetch immediately before every write, preserve unrelated changes, and leave `In progress` Tickets and Tickets assigned to someone else alone.

Use Notion page-level comments for resolutions. Keep resolution detail out of Ticket bodies and link any produced assets from the Ticket.

### Project documents

Use the Notion `Documents` database as this project's quick-reference knowledge store. Source files remain canonical; each Document preserves enough provenance to reopen and verify them.

- Search `Documents` before re-reading source files.
- When the needed information is missing, stale, or disputed, reopen the relevant sources rather than relying on memory or a copied summary.
- When project work reveals durable, goal-relevant information from a source file, create or update its Document during the same task so later sessions can retrieve it quickly.
- Store one living Document per stable topic. Update that page when new evidence belongs to the same topic.
- Set `Type` to exactly one of `Research`, `Decision`, or `Reference`; add concise `Subjects` and `Topics` values that improve retrieval.
- Set `Primary source` to the most useful direct file link, `Source date` to the source date or latest date covered, and `Reviewed` only after checking the linked sources during the current review.
- Refetch immediately before updating a Document and preserve unrelated content and source links.

Create a Document with this body:

```markdown
## Summary

<the smallest goal-relevant quick-reference synthesis>

## Facts

<dated, source-grounded facts; preserve names, measurements, units, and attribution>

## Interpretation and open questions

<clearly labeled synthesis, uncertainty, conflicts, and unanswered questions>

## Sources

- [<source title>](<direct source URL>) — <source date>; <page, section, or record locator when available>
```

Make every factual statement traceable to a listed source. Keep interpretation distinct from source contents, preserve conflicting dated facts, and store the smallest goal-relevant extract rather than a raw-file mirror.
