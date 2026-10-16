---
name: find-savings
description: Analyze household spending, research cheaper bills, subscriptions, and alternatives, and track savings opportunities through feedback and verification. Use for savings reviews, scheduled savings checks, and weekly savings reports.
license: MIT
---

# Find savings

Turn transaction evidence into concrete, ranked savings decisions. This skill
is **read-only** on financial data: it analyzes, researches, and drafts, and
the user acts.

## Requirements

- **Read access to transaction data**: a budgeting or banking connector (YNAB,
  for example) with accounts, categories, transactions, and scheduled
  transactions.
- **Web research** for current prices and alternatives.
- Optional: email and document connectors for invoices, renewal notices, and
  contracts; a card-activity connector with merchant metadata.

When no transaction source is connected, stop and say which connector to add.

## Configuration

Read these from the request or the project's instructions, falling back to the
defaults:

| Setting | Default |
| --- | --- |
| Plan or budget, and permitted accounts | The only plan; ask when ownership or scope is ambiguous |
| Reporting currency | The plan's currency |
| Priority threshold | 5/month recurring or 25 one-time, in the reporting currency |
| Analysis cadence and delivery cadence | One run, reported in chat |
| Where findings persist | The current chat for one-off runs; a durable store the user names (memory, a file, or a tracker) for scheduled runs |

Other plans and tracking or closed accounts need their own authorization. The
threshold orders the report; smaller effortless savings still appear.

## Continuity

Read the request, project rules, earlier reports, and the user's feedback
before analysis. Start with no protected categories and no assumptions about
what the user values. Prefer low-sacrifice reductions; show larger lifestyle
trade-offs separately.

Learn from explicit feedback, keeping its date, reason, scope, and any revisit
condition. One rejected offer leaves the rest of its category open. Silence is
neither acceptance nor rejection. Label each preference inferred or confirmed.

Recover earlier findings and decisions from the conversation or run context.
Scratch files last one run. A scheduled run that starts fresh each time needs
the durable store from the configuration to remember decisions. Without one,
put the setup request at the top of each report, and label proposals as
possibly repeated, since earlier dismissals cannot be recalled. When earlier findings cannot be recovered, say so
in the next report, rebuild from source data, and present re-found items
without claiming they are new. Create trackers or persistent files only when
the user asks. The skill itself never stores personal financial history.

## Read and calculate

Discover the connector's current schema, then batch independent reads. Use a
13-month baseline where history allows, enough to catch annual charges, and
the latest 90 comparable days for routine patterns. State the actual coverage.
Include approved and unapproved posted transactions and mark unresolved
identity or category evidence provisional. Approval and clearing say nothing
about whether a charge recurs or is worth keeping.

Merge deltas by stable ID, including edits and deletions, and only on top of an
intact base snapshot; a delta alone is not a ledger. Without a durable base,
re-read the scoped history. Exhaust pagination or disclose partial coverage; a
preview response is not a complete dataset.

Calculate exact amounts in code with the documented units (YNAB uses integer
milliunits: divide by 1,000). Amounts already converted from foreign currency
stay as they are. For new external comparisons, apply the project's currency
rules and report the rate, date, and source.

Count each economic event once:

- Exclude linked transfers, card payments, transfers into a tracked cash
  account, and reconciliation adjustments from consumption; keep supported
  fees net of rebates. A cash withdrawal categorized as an expense is
  spending in that category.
- Count splits at child level, without adding the parent again.
- Attribute refunds to their original spending, never as lasting savings.
- Keep cross-plan transfers and business amounts separate when purpose is
  unclear.
- Report structural problems; leave repairs to a categorization run.

Compare equal-length windows and comparable living situations. Separate changes
in purchase frequency from price or average ticket, annual bills, trips, moves,
refunds, and exchange-rate effects. An incomplete month is never a reduction
against a full one. Check unresolved and uncategorized totals, the latest
source dates, and anomalies before drawing conclusions; keep sound independent
analysis going while you name the gaps.

## Investigate opportunities

Cover monthly and annual subscriptions and bills, price increases, overlaps,
avoidable fees, eligible discounts, lower tiers, bundles and family plans,
billing cadence, alternative providers, negotiation, and repeat-purchase or
habit changes. Search every permitted category, not only one named
Subscriptions. Scheduled entries forecast obligations and observed charges
establish payments; neither proves a service is unused or cancelled.

For uncertain merchants or terms, use receipts, explicit rules, approved
precedent, and any card-activity metadata, matching account, amount, date,
direction, and descriptor. Search email and documents narrowly for invoices,
renewals, contracts, or benefit eligibility. Optional connectors stay optional:
continue with what is available and label what cannot be verified. Issuer
metadata names a merchant, not what was bought.

Research concrete candidates from current provider sources. Check country,
residency, billing platform, currency, eligibility, quality, feature
differences, commitment, promotional expiry, cancellation deadline, switching
fees, and replacement cost. Annual billing can cut annual cost while raising
the cash needed now; show both. Include direct links, and map links for
location-based alternatives.

Record for each credible opportunity:

- supporting charges, dates, and accounts;
- current cost and proposed action;
- net monthly and annual savings, or one-time savings;
- assumptions and confidence;
- effort and lost benefits;
- deadline and the next decision.

Keep alternatives mutually exclusive and never double-count overlapping
savings. Label arithmetic as estimates. Rank by achievable net savings and
effort, not by category size.

Work every actionable research branch until only user decisions, actions
needing authorization, inaccessible evidence, or future verification remain. A
report's shortlist does not cap the investigation. When the run hits a real
time or tool limit, record a precise continuation point in the run context and
report the work as incomplete.

## Feedback, action, and verification

Track each opportunity as `proposed`, `awaiting decision`, `accepted`,
`dismissed`, `implemented`, or `verified`. Prepare complete next steps,
comparison links, and message drafts. Contacting providers, cancelling,
purchasing, switching plans or providers, signing contracts, and moving money
all wait for the user's explicit authorization, and this skill never edits or
approves transactions or budgets.

Record the user's response and hold back unchanged dismissed or settled
proposals until their revisit condition or new evidence applies. Verify
implementation from confirmations and later billing; a missing charge alone is
not proof. Report projected and observed savings separately, with observation
dates, baseline, replacement costs, and fees. A general fall in spending is not
automatically this skill's doing.

## Output

Deliver on the configured delivery cadence, which can differ from the analysis
cadence. With daily checks and weekly delivery, hold routine findings for the
weekly report and recompute any intermediate findings that cannot be
recovered. Send an interim alert only for a verified actionable deadline before
the next report, once per change. Hold non-urgent access or coverage gaps for
the report; raise an error immediately only when the user must step in before
that deadline.

Lead the report with the best three to five actionable opportunities, or fewer
when evidence is thin. Include supporting numbers, trade-offs, links, decisions
needed, upcoming deadlines, follow-up on accepted actions, verified savings,
and material coverage or continuity gaps. Name the plan and covered dates.
Close with a compact opportunity and feedback recap so the next run can
recover state.

Report a quiet week briefly, and a failed or incomplete scan as incomplete.
The run is complete when every investigated candidate is accounted for as
actionable, awaiting evidence or a decision, dismissed, or verified, with a
continuation point for unfinished research.
