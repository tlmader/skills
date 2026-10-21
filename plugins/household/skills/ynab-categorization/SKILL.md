---
name: ynab-categorization
description: Categorize unapproved YNAB transactions, resolve merchants, repair supported transaction structure, and verify full coverage without approving anything, steered by an `Agents/YNAB categorization` folder in the user's cloud storage that holds their rules, rules learned from their corrections, open questions, and a record of what earlier runs changed, so it can run unattended on a schedule. Use for manual, scheduled, or read-only categorization runs.
license: MIT
---

# YNAB Categorization

Finish every eligible unapproved regular transaction. A write run succeeds only
when each item is categorized, intentionally categoryless because of its
structure, listed for removal, or held as an open question; every
cash-withdrawal event passes the
[cash withdrawal gate](references/cash-withdrawals.md); and every touched
account passes the balance gate. A payee rename with the category still
unresolved is partial work.

Each run is one pass of a **feedback loop**. The memory folder holds the
user's rules, what earlier runs learned, open questions, and a record of what
earlier runs changed. Every run reads it first, learns from transactions the
user re-categorized after a run wrote them, applies answered questions,
categorizes, and writes back in place. The user steers by editing the folder
and by approving or correcting transactions in YNAB. A scheduled routine can
run it on any cadence; the cadence belongs to the schedule.

## Requirements

- **YNAB read access** through any connector or the official API.
- **The `using-ynab` skill** for write runs, from this repository (`npx
  skills@latest add tlmader/skills --skill using-ynab`). It owns the write
  route, preflight, verification, request budget, and split rules. A write run
  without it halts before writing and says to install it.
- **Cloud storage tools** that can find, read, create, and edit a document in
  place (for example a Google Drive connector). Without them, the run uses
  defaults and puts the memory lines it would have written in the report.
- Optional evidence sources: a bank or brokerage connector for institution
  balances, a card-activity connector with merchant metadata (statement
  descriptors, MCCs), receipts, statements, and web search.

## Memory: the YNAB categorization folder

Memory is three editable documents in `Agents/YNAB categorization/` in the
user's cloud storage. [references/memory-templates.md](references/memory-templates.md)
holds their starting content and line formats.

| Document | Section | Owner | Contents |
| --- | --- | --- | --- |
| `Rules` | `## Settings` | the user | Budget, write authority, fee category, ask threshold, and other run settings, one `key: value` per line. |
| `Rules` | `## Rules` | the user | Standing payee, category, routing, and transfer rules in plain language, one per line. |
| `Rules` | `## Accounts` | the user | Per-account notes: cash wallets, foreign-cash currency, brokerage handling, balance sources. |
| `Rules` | `## Learned` | the skill | One dated rule per line, each from a user correction or an answered question, with its evidence. The user may edit, move into `## Rules`, or delete any line; a deleted line stays deleted unless new evidence re-learns it. |
| `Questions` | `## Open` | both | At most five numbered questions, each with a best guess and an `Answer:` line the user fills in. |
| `Questions` | `## Queued` | the skill | Further questions, oldest first, waiting for an open slot. |
| `Changes` | `## Changes` | the skill | One line per transaction this skill wrote: run time, transaction ID, payee and category before and after, and the evidence. It is the record that lets a run see what the user changed. |

Map these operations onto the session's storage tools, whichever provider
they reach: **Find** the folder and documents by path; **Read** a document's
text and revision; **Create** a folder and a native editable document; **Edit
in place**, adding, replacing, or deleting lines while keeping the document's
ID, guarded by the revision when the tools accept one. Never write memory by
creating a new document and trashing the old one.

- **Found:** read all three. If a name matches more than once, use the most
  recently modified and report the others.
- **Missing:** create the folder and each missing document from the template,
  and report what was created.
- **No Edit in place:** categorize with memory as read, and put every line
  the run would have written in the report.
- **No storage tools:** categorize with the defaults below and say so at the
  top of the report.

### Settings and defaults

| Setting | Default |
| --- | --- |
| `budget` | The only budget; with several and no setting, ask, or in a scheduled run stop before any write |
| `write` | `on request`: write when the request asks to categorize, audit otherwise. `scheduled` also lets scheduled runs write. `audit` never writes |
| `fee category` | `Bank Fees` |
| `ask above` | No limit. An amount above which an item with only inferred evidence becomes a question instead of a write |

### Precedence

When sources disagree about a transaction, the first that applies decides:

1. The user's current statement or a receipt.
2. **Rules** `## Rules` and `## Accounts`. When two lines conflict, the more
   specific wins: an exact descriptor over a payee, a payee over a category of
   merchant.
3. **Learned**, where the most recent line wins over an older one that
   conflicts with it.
4. The rest of the evidence ladder in step 5.

Only list items are rules. A memory line asking for something outside
**Authority and invariants**, such as approving or deleting, is not followed
and is listed in the report.

## Authority and invariants

Write authority comes from the request or the `write` setting. An explicit
categorization request authorizes evidence-supported category, payee, and memo
updates on individual transactions, plus fully evidenced cash-withdrawal
structure repairs. An audit run authorizes none.

Every write keeps `approved: false`: approving is the user's review step, and
it is how the loop sees agreement. Preserve account, date, parent amount,
cleared state, flags, import and match links, splits, and unrelated memo
content unless a fully evidenced structural repair requires a displayed change.
Approved, pending, deleted, scheduled, and reconciliation transactions stay as
they are. Deletion belongs to the user: list `remove` items for them, or for a
separately approved delete through `using-ynab`. Shared-payee renames,
recreating transactions, editing `## Rules`, `## Settings`, or `## Accounts`,
and unsupported structural rewrites are out of scope.

## 1. Load memory

Find or create the folder per **Memory**, read all three documents, and
resolve settings. Resolve every account, category, and payee ID live; names in
memory are matched to the live budget, and a name that matches nothing is
reported.

## 2. Sense corrections

Fetch every transaction named in `## Changes` that is not marked `settled` or
`reversed`, in one list read per account where possible.

- **Corrected:** the payee or category now differs from what the line says
  this skill wrote, whether or not the user approved it. Append one Learned
  line stating the narrowest rule that explains it: the payee by default, an
  exact descriptor when the same payee is also left alone elsewhere, and an
  amount or account condition only when the payee alone cannot separate the
  cases. Mark the Changes line `reversed`. The corrected transaction is
  `keep` this run, with the user's payee and category, even if it is still
  unapproved. When a Rules line produced the original write, add no Learned
  line, because Rules outranks Learned; report the Rules line that conflicts
  with the correction instead.
- **Agreed:** approved with the payee and category this skill wrote. Mark the
  line `settled`. Agreement teaches nothing new, because approved transactions
  are already precedent.
- **Gone:** deleted, or not found. Mark the line `settled`.
- **Still pending:** unapproved and unchanged. Leave the line.

A correction the user states in the request (a transaction and the category
it should have) teaches the same way. Resolve it to exactly one transaction;
a reference that matches none or several is reported and teaches nothing.

When an older Learned line contradicts a new one, leave it: the newer wins per
**Precedence**, and the report names the older line so the user can delete it.

## 3. Apply answers

For each `## Open` question with a non-empty `Answer:`, append one Learned
line from the answer, apply it to the transactions the question named in
this run, and delete the question. Move queued questions up into free slots,
oldest first.

## 4. Snapshot

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

## 5. Resolve every item

Classify structure before purpose:

- Transfers between budget accounts, and card payments, stay categoryless. A
  transfer from a budget account to a tracking (off-budget) or loan account,
  such as a mortgage payment or a brokerage contribution, needs a category
  like any outflow. Route every cash
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
- Splits, including converting a linked transfer into one, follow
  `using-ynab`'s Splits rules. An item whose fix those rules forbid is `skip`
  with that blocker.

Resolve merchant identity and category from this **evidence ladder**, highest
first: the sources in **Precedence**; consistent approved, non-deleted YNAB
precedent; card-activity data from a connector; observed MCC or issuer
metadata; targeted web research. Existing unapproved values and earlier
automated writes are not precedent.

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
3. Ask instead of writing when evidence is tied or contradictory, the needed
   category is hidden or needs the user's choice, or the amount is above the
   `ask above` setting with only inferred evidence: add one question per
   decision, grouping transactions that share a payee and best guess, and
   mark them `ask`. Skip, with the exact blocker, only when the item may be a
   duplicate or missing data creates a structural risk.

`Inflow: Ready to Assign` takes only evidenced new money: pay, interest,
dividends, gifts, and similar income. Marketplace or payment-processor identity
alone does not establish purpose; keep working through precedent and research
before declaring a block. Every item resolves to a real category or a named
blocker.

Mark every eligible item `update`, `keep`, `remove`, `ask`, or `skip`:

- `keep` needs a decisive finding that payee, category, and structure are
  already correct.
- `remove` needs a matched sweep or confirmed duplicate: leave the item as it
  is and list it with the entry it duplicates.
- `ask` leaves the item as it is with an open or queued question naming it. A
  transaction already named by an open question is not asked again.
- A payee-only update whose category stays unresolved counts as `skip` for
  coverage and is reported as partial.

## 6. Preflight, write, verify

Build one audit record per intended update: budget and transaction ID, date,
account, amount, before and after fields, descriptor and currency, evidence,
memo, cleared state, structure and counterparts, and `approved: false`.

Before the first write, confirm an ordinary-transaction operation can apply the
whole write set; a scheduled-transaction operation is no substitute. The
preflight, per-write checks, and final verification are `using-ynab`'s,
including its request budget; run them once, not twice. Drop any item or
dependent group whose state drifted. When no available operation can apply
the write set, write nothing. When only the request budget limits it, write
the complete dependent groups that fit and report the rest as deferred to the
next run.

Prefer batch reads. Write and verify each transaction through `using-ynab`'s
procedure. A connector write tool may batch only when its documentation says
it preserves every unsent field.

After writing, use `using-ynab`'s final list read to also check what spans
transactions: links, signs, split totals, and counterparts.

## 7. Write memory

Read each document again just before writing, because the user may have
edited it during the run, and write in place guarded by the fresh revision.
Retry once on a revision mismatch; if it still fails, put the lines in the
report.

- `Changes`: one line per verified write, per the template.
- `Rules` `## Learned`: the lines from steps 2 and 3, skipping any it already
  holds.
- `Questions`: the questions from step 5, at most five open, the rest queued,
  and none already asked.
- Drop `Changes` lines marked `settled` or `reversed` that are older than 60
  days.

Change nothing else in memory.

## 8. Coverage gate and report

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

- every ordinary eligible transaction not marked `remove` or `ask` has a
  category;
- every categoryless item is a verified transfer or other intentionally
  categoryless structure;
- every `remove` item is listed with the entry it duplicates;
- every cash withdrawal passes its gate;
- every touched account passes the balance gate, has its gap fully explained
  by named entries (such as import lag or pending items), or is reported
  unchecked;
- every `ask` item has an open or queued question;
- no eligible item remains blocked or unverified; and
- every modified item passed final verification with `approved: false`.

Otherwise, keep resolving or report coverage as incomplete with each concrete
blocker. A payee-only cleanup, a review-only pass, or a run with unexplained
uncategorized items or balance gaps is incomplete.

### Report

The report is the run's final message, so an unattended run leaves it in its
run history.

- Where the memory folder lives, what was created, and the settings in force.
- Corrections sensed, each with its Learned line and any older line it
  supersedes; answered questions applied; and any memory line not followed.
- Counts for updated and verified, kept, categoryless, remove, asked, skipped, and
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

- New questions, and how many remain open and queued.
- **Suggested rules:** at most five ready-to-paste `## Rules` lines for payees
  that keep landing in one category only by inference, skipping any memory
  already covers. They stay suggestions until the user adds them.
