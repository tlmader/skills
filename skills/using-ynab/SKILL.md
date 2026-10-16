---
name: using-ynab
description: Write ordinary YNAB transactions (update, split, delete) through the official YNAB API when the connected YNAB tools cannot. Use when a categorization, split, or cleanup needs a transaction write.
license: MIT
---

# Using YNAB

Many YNAB integrations read transactions but write only scheduled transactions
and payees. An ordinary transaction write (update, split, delete) then goes
through [YNAB's official API](https://api.ynab.com/) on an already-authorized
**route**.

## Choose a route

Discover the session's YNAB tools once, then take the first route available:

1. **Connector write tool**: the YNAB connector exposes an ordinary-transaction
   update or delete. Use it and skip the rest of this section.
2. **Connector proxy**: the connector can make authenticated raw requests to
   `https://api.ynab.com/v1` (for example Composio's `proxy_execute(method,
   url, 'ynab', body=...)` inside its workbench, which returns `(response,
   error)`).
3. **Personal access token**: an HTTP client with `Authorization: Bearer
   $YNAB_ACCESS_TOKEN`, where the user created the token under YNAB's
   Developer Settings and placed it in the environment or secret store.

When no route exists, stop and tell the user which of the three to set up.
Keep the token out of chat, logs, and files.

Endpoints, relative to `https://api.ynab.com/v1`:

| Purpose | Endpoint |
| --- | --- |
| Budgets (find `budget_id`) | `GET /budgets` |
| Accounts and `transfer_payee_id` | `GET /budgets/{budget_id}/accounts` |
| One account and its balances | `GET /budgets/{budget_id}/accounts/{account_id}` |
| Categories | `GET /budgets/{budget_id}/categories` |
| Unapproved or uncategorized transactions | `GET /budgets/{budget_id}/transactions?type=unapproved` (or `uncategorized`) |
| An account's transactions (counterparts) | `GET /budgets/{budget_id}/accounts/{account_id}/transactions` |
| Read, update, or delete one transaction | `GET\|PUT\|DELETE /budgets/{budget_id}/transactions/{transaction_id}` |

`budget_id` is the live budget UUID from `GET /budgets`. After the run, tell
the user in one line which route carried the writes.

## Authorization

Each write needs the user's authorization for that kind of write. A read-only
request stays read-only.

- **Update or split**: an explicit request for the change (a categorization
  request, for example) covers it, except converting a linked transfer into a
  split, which needs its own go-ahead (see Splits).
- **Delete**: list the exact transactions first (date, payee, amount, ID, and
  why each goes), and delete only that list after the user approves it.

When the session's permission check blocks a write the user already approved,
stop: name the blocked call and what it would change, and ask the user to
approve it explicitly. After they do, retry the identical call once. Keep each
write call **legible**: preflight reads in their own call, then a call holding
only the approved writes and their verification.

## Preflight, write, verify

YNAB allows 200 API requests per hour per token. Budget them before writing:
preflight and final verification each use one list read
(`?type=unapproved`, or an account's transactions) rather than a GET per
transaction, so a run costs about one request per write plus a few reads.
When the write set would not fit in the remaining budget, write only complete
dependent groups that fit and report the rest as deferred to the next run.
On a 429, stop writing and report what was applied.

- **Preflight**: re-read the targets. Proceed only when each still matches the
  snapshot (amount, date, account, approved state, payee, category, and no
  subtransactions where you plan to add them). Drifted items drop out.
- **Update**: one transaction per call, with the body wrapped as
  `{"transaction": {...}}`. Send the full field set: `account_id`,
  `date`, `amount`, `memo`, `cleared`, `flag_color`, `category_id`, the payee,
  and `approved`. Omitted fields can reset. `approved` stays as it was: false
  for the unapproved transactions categorization works on. Changing an
  approved transaction needs an explicit request naming it, and keeps it
  approved.
- **Delete**: one transaction per call, only IDs on the approved list.
- **Verify**: check each write's response body, which returns the
  transaction, straight after the write. For an update, confirm every field
  you meant to change (category, payee, memo, subtransactions) holds the new
  value and every field you meant to preserve (account, date, amount, cleared,
  flag, `import_id`, `approved`) is unchanged. For a delete, expect the
  transaction back with `deleted: true` (a later GET may return 404
  `resource_not_found`). Stop on any mismatch.
- **Balance**: after writes that change an account's total, GET the account and
  compare its `cleared_balance` with the expected figure (the institution's
  posted balance when you have one). Report both numbers.
- **Coverage**: re-list `unapproved` and `uncategorized` transactions at the
  end and reconcile against the starting set.

## Field notes

- Amounts are milliunits (1000 = 1 unit); outflows are negative.
- Some routes nest `data` inconsistently: unwrap with `x.get('data', x)` until
  you reach the object. A single transaction sits under `transaction`, an
  account under `account`.
- Payee: pass `payee_id` to reuse a payee (take it from approved precedent for
  the same descriptor), or `payee_name` to match or create one by name.
- Category: `category_id` from the live category list. Leave it null on
  transfers and split parents.
- Deleting a transaction removes its amount from its account and category; a
  deleted `Inflow: Ready to Assign` line lowers Ready to Assign by that amount.
  Tell the user that effect before deleting.

## Splits

- A transaction with no subtransactions becomes a split in one PUT: parent
  `category_id: null`, `subtransactions` summing exactly to the parent amount.
- A transfer leg uses the destination account's `transfer_payee_id` with a null
  category. YNAB creates the counterpart in that account, unapproved.
- A fee leg carries the fee category and no payee.
- Existing splits stay as they are: the API cannot update their
  subtransactions.
- Converting a linked transfer into a split retires the old counterpart and
  creates a new one with a new ID. Get the user's go-ahead first. In the PUT,
  the parent drops the transfer payee (set a plain payee or none) and the
  principal subtransaction carries the destination's `transfer_payee_id`.
  Afterwards, confirm the destination account holds exactly one counterpart.

## Estimates

When the user has no receipt and asks for a best guess, write the estimate and
record its basis in the memo, for example `Est. 200.00 + 5.00 ATM fee (no
receipt; derived from fee rebate)`, so the entry is recognizable later.
