---
name: categorize-ynab-transactions
description: Categorize unapproved YNAB transactions, resolve merchants, repair supported transaction structure, and verify full categorization coverage without approving anything. Use for manual, scheduled, or read-only categorization runs.
license: MIT
---

# Categorize YNAB Transactions

Finish every eligible unapproved regular transaction. A write run succeeds only
when each item is categorized, intentionally categoryless because of its
structure, or listed for removal; every cash-withdrawal event passes the
[cash withdrawal gate](references/cash-withdrawals.md); and every touched
account passes the balance gate. A blocked item makes coverage incomplete even
when the review finishes. A payee rename with the category still unresolved is
partial work.

## Requirements

- **YNAB read access** through any connector or the official API.
- **Ordinary transaction writes** for write runs: a connector write tool, or the
  `using-ynab` skill from this repository, which writes through the official
  API (`npx skills@latest add tlmader/skills --skill using-ynab`). A write run
  with neither halts before writing and says which to add.
- Optional evidence sources: a bank or brokerage connector for institution
  balances, a card-activity connector with merchant metadata (statement
  descriptors, MCCs), receipts, statements, and web search.

## Configuration

Read these from the request or the project's instructions, falling back to the
defaults:

| Setting | Default |
| --- | --- |
| Budget | The only budget, or ask when there are several |
| Write authority | Write when the request asks to categorize; audit only otherwise |
| Fee category | `Bank Fees` |
| Routing, transfer, currency, and duplicate rules | None beyond this skill |

Resolve every account, category, and payee ID live at runtime.

## Authority and invariants

An explicit categorization request authorizes evidence-supported category,
payee, and memo updates on individual transactions, plus fully evidenced
cash-withdrawal structure repairs. A read-only request authorizes none. A
scheduled run needs equivalent standing write authority in its instructions;
otherwise it audits only.

Every write keeps `approved: false`. Preserve account, date, parent amount,
cleared state, flags, import and match links, splits, and unrelated memo
content unless a fully evidenced structural repair requires a displayed change.
Approved, pending, deleted, scheduled, and reconciliation transactions stay as
they are. Deletion belongs to the user: list `remove` items for them, or for a
separately approved delete through `using-ynab`. Shared-payee renames,
recreating transactions, editing project instructions, and unsupported
structural rewrites are out of scope.

## 1. Snapshot

Discover capabilities once, then fetch in parallel:

- the budget's live accounts, categories, transfer payees, and whether ordinary
  updates are possible;
- every unapproved, non-deleted, non-pending regular transaction across the
  full available history;
- only the approved history needed for merchant and category precedent, plus
  the counterparts, splits, fees, and rebates needed to reconcile eligible cash
  withdrawals; and
- the institution's posted balance for every account holding an eligible item
  or a counterpart the write set will touch, from a connected bank or
  brokerage source or a supplied statement, with its source and as-of time.

Follow pagination and keep each eligible transaction's complete state. Finish
enumeration before defining the write set. Reuse this snapshot; read again only
for missing evidence, drift checks, and verification.

## 2. Resolve every item

Classify structure before purpose:

- Transfer principal and card payments stay categoryless. Route every cash
  withdrawal, including existing linked transfers and splits, through the
  [cash withdrawal gate](references/cash-withdrawals.md) before marking it
  `keep` or categoryless. A transfer into a cash account is not income.
- A **sweep** moves money between a brokerage account's cash and its own core
  money-market position (descriptors like "PURCHASE INTO CORE ACCOUNT",
  "REDEMPTION FROM CORE ACCOUNT", or "REINVESTMENT" of a core-fund dividend).
  The institution balance already includes the core position, so each sweep
  duplicates money another entry records. Mark every eligible sweep `remove`,
  whatever its category. An approved sweep met during reconciliation is a
  historical defect: report it separately, outside the eligible counts, and
  subtract it in the balance gate too. The dividend itself stays ordinary
  income.
- Refunds, reversals, reimbursements, fee rebates, debt payments, matches, and
  splits keep their economic structure.
- A suspected duplicate stays as it is until its identity is resolved; a
  confirmed duplicate is `remove`.
- An existing split stays as it is: the API cannot update its
  subtransactions. When one needs a change, mark it `skip` with that blocker.
- Converting a linked transfer into a split replaces its counterpart with a
  new ID. Treat it as a structural change: do it only with the go-ahead
  `using-ynab` requires, then verify the destination account holds exactly one
  counterpart.

Resolve merchant identity from this **evidence ladder**, highest first: the
user's current statement or receipt; an explicit project rule; consistent
approved, non-deleted YNAB precedent; card-activity data from a connector;
observed MCC or issuer metadata; targeted web research. Existing unapproved
values and earlier automated writes are not precedent.

For a masked, truncated, or ambiguous descriptor, query any card-activity
connector before web research. Match on account, date, amount, direction, raw
descriptor, and nearby refunds; an exact historical descriptor match beats a
fuzzy name match. Card data can identify a merchant, but it does not establish
what was bought from a merchant that sells many kinds of goods. Record an MCC
as observed evidence with its source and treat it as a hint, never a direct
category mapping. Without a card-activity connector, continue with YNAB
history and the rest of the ladder.

Reassign a verified canonical payee on the transaction itself. Research only
unresolved descriptors or mixed-purpose merchants, and keep account numbers and
other private identifiers out of search queries.

### Best-supported category

Categorization is the completion gate. For an ordinary expense or inflow:

1. Assign the category that direct evidence supports.
2. Without direct evidence, assign the category that consistent approved
   precedent and merchant research materially favor. Reasonable confidence is
   enough.
3. Skip only when evidence is tied or contradictory, the needed category is
   hidden or needs the user's choice, the item may be a duplicate, or missing
   data creates a structural risk. State the exact blocker.

`Inflow: Ready to Assign` takes only evidenced new money: pay, interest,
dividends, gifts, and similar income. Marketplace or payment-processor identity
alone does not establish purpose; keep working through precedent and research
before declaring a block. Every item resolves to a real category or a named
blocker.

Mark every eligible item `update`, `keep`, `remove`, or `skip`:

- `keep` needs a decisive finding that payee, category, and structure are
  already correct.
- `remove` needs a matched sweep or confirmed duplicate: leave the item as it
  is and list it with the entry it duplicates.
- A payee-only update whose category stays unresolved counts as `skip` for
  coverage and is reported as partial.

## 3. Preflight, write, verify

Build one audit record per intended update: budget and transaction ID, date,
account, amount, before and after fields, descriptor and currency, evidence,
memo, cleared state, structure and counterparts, and `approved: false`.

Before the first write, confirm an ordinary-transaction operation can apply the
whole write set; a scheduled-transaction operation is no substitute. Re-read
all targets and drop any item or dependent group whose state drifted. When the
complete supported set cannot be applied, write nothing.

Prefer batch reads. Write through `using-ynab`'s procedure: one transaction
per call with the full field set, verified before the next. A connector write
tool may batch only when its documentation says it preserves every unsent
field. Send `approved: false` explicitly. Stop on an inconsistent result.
Retry once only when a read proves nothing changed and preconditions still
hold.

After writing, re-read every modified transaction and affected counterpart and
verify intended fields, preserved fields, links, signs, totals, and
`approved: false`.

## 4. Coverage gate and report

Re-query eligible unapproved transactions and, separately, uncategorized
transactions, and reconcile both with the original enumeration. Recheck every
cash withdrawal against its gate, unchanged linked transfers included; an
uncategorized query alone cannot detect omitted fees.

### Balance gate

For every **touched account** (one holding an eligible item or a changed
counterpart), read the institution's **posted** balance and YNAB's **cleared**
balance together at gate time and compare them, after
subtracting cleared `remove` items and reported approved sweeps still present.
For credit cards and loans, establish the source's sign convention from its
documentation or field name, not by trying both: when it reports the amount
owed as positive, require YNAB's balance to equal its negation; when it
reports a signed balance, compare directly. For
an investment account, compare cash including the core money-market position
(the balance sweeps move within), excluding securities; when YNAB tracks the
account's market value, report it unchecked. Uncleared YNAB entries and
pending institution activity sit outside this comparison; list them separately
in the report. When the institution offers only a current balance that
includes pending activity, subtract the pending items it lists first. The
account passes when the two match to the cent. Otherwise the gap is the
finding: identify the entries that sum to it (sweeps, duplicates, missing
imports, wrong signs, wrong cleared state) before reporting. An unexplained gap
blocks completion. An account with no institution balance available (a cash
wallet, or no bank connector) is reported as unchecked; that limits the
verification but does not block completion.

### Completion

The run is complete only when:

- every ordinary eligible transaction not marked `remove` has a category;
- every categoryless item is a verified transfer or other intentionally
  categoryless structure;
- every `remove` item is listed with the entry it duplicates;
- every cash withdrawal passes its gate;
- every touched account passes the balance gate or is reported unchecked;
- no eligible item remains blocked or unverified; and
- every modified item passed final verification with `approved: false`.

Otherwise, keep resolving or report coverage as incomplete with each concrete
blocker. A payee-only cleanup, a review-only pass, or a run with unexplained
uncategorized items or balance gaps is incomplete.

### Report

- Counts for updated and verified, kept, categoryless, remove, skipped, and
  failed or unverified, reconciling to the original eligible set. Count each
  input transaction once; report event totals and counterpart effects
  separately.
- Changed items with evidence and before and after fields.
- Every skip with its blocker.
- Every `remove` item with date, payee, amount, ID, and the entry it
  duplicates, with an offer to delete them through `using-ynab`.
- Each cash withdrawal's figures and gate result, as the gate reference
  describes.
- Each touched account's YNAB balance, institution balance and source, and
  gate result.
- The reviewed scope, kept distinct from whether categorization is complete.

Propose durable learnings (new routing or payee rules) separately for the user
to adopt; the project's instructions are theirs to edit.
