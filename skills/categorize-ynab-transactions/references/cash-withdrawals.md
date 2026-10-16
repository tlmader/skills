# Cash withdrawal gate

Read this when an eligible item funds cash: an ATM withdrawal, a transfer into
a cash account, or a split or fee tied to one.

## Foreign cash

YNAB amounts stay in the budget currency even when an account holds foreign
cash. Use the original foreign amount, the local date, and that date's
authoritative mid-market rate; round the budget-currency value to cents and
record the rate's direction and source.

## The gate

Treat each withdrawal as one economic **event**: the funding debit, the linked
cash principal, fee splits or separate fee entries, and any rebate. Apply the
gate before and after any direction, amount, payee, or category repair, and to
unchanged events considered for `keep`.

1. **Gather evidence.** Establish the cash received, local date, conversion
   rate and source, actual bank debit, and itemized fees from receipts, issuer
   activity, statements, exports, or other direct evidence. Reuse evidence
   already in hand before asking for more. Record the fee status as evidenced
   positive, evidenced zero, or unknown. Missing fee lines, a matching transfer
   pair, a typical ATM fee, or an exchange-rate residual establish neither zero
   nor an amount. A rebate alone proves neither the original charge nor which
   withdrawal it belongs to.
2. **Resolve existing entries.** Read both transfer sides and every split,
   including approved counterparts as read-only evidence. Match references,
   dates, amounts, accounts, and descriptors; inspect nearby separately posted
   fees and rebates, duplicates, and sweeps (a same-day core redemption equal
   to the debit is a sweep, not a second inflow). Repair an existing event in
   place, keeping IDs and links wherever the API allows; an existing
   counterpart is expected. Adding an included-fee split to a linked transfer
   converts it into a split, which replaces the counterpart with a new ID:
   take that step only with the go-ahead `using-ynab` requires for converting
   a linked transfer. An existing split cannot be edited, so an event whose
   fix needs one changed is blocked. Create a missing leg only after
   confirming it is absent and how the API creates counterparts. Unresolved
   duplicates block the event.
3. **Reconcile amounts.** Let `P` be the evidenced cash principal in budget
   currency, `F` the fees included in the withdrawal debit, and `D` that
   debit's magnitude. Require `D = P + F` exactly in integer milliunits after
   cent rounding. The funding principal is `-P`; the cash counterpart is `+P`.
   Included fees are negative splits in the fee category on the funding debit.
   Separately posted fees are separate negative fee-category entries matched to
   their own bank debits and excluded from `F`. Positive fee rebates stay
   separate in the fee category; they neither raise the principal nor erase
   the original fee. An unexplained conversion residual blocks the event; it
   is never relabeled as a fee to force equality.
4. **Preflight the whole event.** Keep the authoritative bank debit and
   unrelated data. When YNAB's parent amount differs from the bank evidence,
   report the discrepancy and get the structural-change authorization the
   project requires before changing it. When a repair would touch an approved
   or reconciled entry, a protected link, or an unsupported split, report the
   event as blocked; ordinary categorization authority leaves approved history
   alone. A blocked event gets no partial direction-only or fee-only repair.
5. **Verify the result.** Re-read all affected entries and compare them with
   the source evidence, not only with the fields you proposed. Check equal and
   opposite principal, correct accounts and links (exactly one counterpart,
   under its new ID after a split conversion), every evidenced fee
   represented exactly once in the fee category, separate rebates, exact parent
   and split totals, no duplicate legs, and preserved approval states. An event
   passes only with evidenced fees (or evidenced zero) and every check
   satisfied. Unknown fees or missing evidence keep it blocked, even when the
   transfer is balanced and categoryless.

## Worked example

A bank debit of 210.00 with evidenced principal 200.00 and an included fee of
10.00 needs:

| Entry | Amount (milliunits) |
| --- | --- |
| Funding parent | -210000 |
| Principal split (transfer to cash) | -200000 |
| Fee split | -10000 |
| Cash counterpart | +200000 |

A transfer of the gross 210.00 overstates cash; a funding parent of only 200.00
understates the bank debit. A later 10.00 fee rebate stays a separate positive
fee-category entry.

## Scope and report

Review approved counterparts only as eligible events require; an ordinary run
is not an audit of every historical transfer. Report historical defects you
find separately, without changing them or counting them as eligible inputs.

For each event, report the bank debit, cash principal, included and separately
posted fees, rebates, evidence sources, and the gate result (passed or
blocked).
