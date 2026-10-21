# Memory templates

Create the `Agents/YNAB categorization/` folder in the user's cloud storage, then
each missing document below inside it. Use the storage's native editable
document format where it has one, and keep every `##` heading, which the skill
uses to find each section. Keep each item a single line or a nested bullet:
converting Markdown into a native document merges plain continuation lines
into one paragraph.

## `Rules`

The user owns every section except `## Learned`. The settings below are
starting suggestions; the user changes them.

```markdown
# YNAB categorization rules

Read on every ynab-categorization run. Edit Settings, Rules, and Accounts freely.
The skill writes only Learned. Edit, delete, or move any Learned line into
Rules. This skill never approves a transaction: approving is your review.

## Settings

- budget: (leave empty to use the only budget)
- write: on request
- fee category: Bank Fees
- ask above: 500.00

## Rules

## Accounts

## Learned
```

Settings use `key: value`. `write` is `on request`, `scheduled`, or `audit`
(see the skill's **Settings and defaults**).

A Rules line is plain language and names the payee, descriptor, or merchant
type and the category:

```markdown
- Payments to "City Water" are Utilities: Water.
- Amazon purchases are always a question; never guess.
- Venmo transfers to my landlord are Rent.
- Reimbursements from my employer go to Inflow: Ready to Assign only after I approve them.
```

An Accounts line names one account and how to treat it:

```markdown
- Wallet (EUR) holds euro cash; amounts are in the budget currency.
- Brokerage is cash-only for the balance gate.
- Cash Wallet has no institution balance.
```

A Learned line names the date, the rule, and the evidence:

```markdown
- 2026-10-21: payee "Corner Market" → Groceries (you re-categorized 1 transaction from Dining Out)
- 2026-10-21: descriptor "SQ *BLUE BOTTLE" → Coffee (you answered question 2)
```

## `Questions`

```markdown
# YNAB categorization questions

Write your answer after "Answer:". The next run turns it into a Learned rule
and applies it.

## Open

## Queued
```

A question names its transactions, its best guess, and an empty answer line:

```markdown
1. Which category for these 3 "AMZN Mktp" purchases?
   - Best guess: Household Supplies (2 of 3 recent approved Amazon purchases)
   - Transactions: 2026-10-18 24.99 (id …a1f), 2026-10-19 12.50 (id …b2c), 2026-10-20 88.00 (id …c3d)
   - Answer:
```

## `Changes`

```markdown
# YNAB categorization changes

Managed by ynab-categorization. Do not edit. Settled and reversed lines older
than 60 days are removed.

## Changes
```

Each line records one verified write. Separate fields with ` | `, and end a
line with `settled` or `reversed` once step 2 resolves it:

```markdown
- 2026-10-21T08:05Z | 3f2a… | "SQ *BLUE BOTTLE" | payee: — → Blue Bottle | category: — → Coffee | evidence: 4 approved precedents
- 2026-10-14T08:05Z | 9c1d… | "CORNER MKT 22" | payee: — → Corner Market | category: — → Dining Out | evidence: web research | reversed
- 2026-10-14T08:05Z | 7b4e… | "CITY WATER" | payee: — → City Water | category: — → Utilities: Water | evidence: Rules | settled
```
