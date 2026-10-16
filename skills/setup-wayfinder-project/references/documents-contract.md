# Notion project Documents contract

## Topology

- The selected Notion project page owns one child database named `Documents`, beside `Issues`.
- Each row is one reusable, source-grounded project document. Its page holds the document body and comments.
- Source files remain canonical. A Document is a quick-reference synthesis with enough provenance to reopen and verify every source.
- Setup creates no rows.

## Properties

Preserve these display names and meanings exactly.

| Property | Notion type | Contract |
|---|---|---|
| `Document` | Title | A stable, topic-oriented name. |
| `Type` | Select | Start with exactly `Research`, `Decision`, `Reference`. Upgrades preserve additional existing options and values. |
| `Subjects` | Multi-select | People, organizations, systems, or other entities the document concerns. Start with no options. |
| `Topics` | Multi-select | Reusable retrieval terms. Start with no options. |
| `Primary source` | URL | The most useful direct source-file link when one exists. Other sources live in the page body. |
| `Source date` | Date | The date of a single source or the latest source covered by a synthesis. |
| `Reviewed` | Date | The date an agent last verified the document against its linked sources. |
| `Created` | Created time | Stable provenance. Hide from normal views. |
| `Updated` | Last edited time | Recency and stale-information signal. |

## Views

Use table or list views. Put `All` first. A new database has exactly the two canonical views below. An upgrade preserves additional user-created views unless they conflict with a canonical view.

| View | Filter | Sort |
|---|---|---|
| `All` | none | `Updated` descending |
| `Recently reviewed` | `Reviewed` is not empty | `Reviewed` descending |

Show `Document`, `Type`, `Subjects`, `Topics`, `Source date`, `Reviewed`, and `Updated`. Show `Primary source` when the view supports a compact clickable URL. Hide `Created`.

## Document body

Every Document uses the body under "Create a Document with this body" in the
project instructions template. That template is the single source of truth for
the body; validate Documents against it.

## Data invariants

- Every Document has one `Type` and at least one direct source link in `Primary source` or the body's `## Sources` section.
- `Reviewed` changes only after the linked sources have been reopened and checked.
- `Source date` represents source coverage, while `Reviewed` represents verification recency.
- Updating a synthesis preserves material historical facts and all still-used source links.
- A stable topic has one living Document; updates extend it instead of creating duplicates.
