---
name: free-game-findings
description: Find free-to-keep game giveaways on IsThereAnyDeal, claim eligible ones when authorized, and keep a verified ledger of outcomes. Use for manual or scheduled giveaway checks and claims on Steam, Epic Games Store, IndieGala, and itch.io.
license: MIT
---

# Free Game Findings

Discover free-to-keep games from Steam, Epic Games Store, IndieGala, and
itch.io, and claim them when the request or standing task instructions
authorize claims. A discovery-only request stops before claiming.

## Requirements

- **Web access** that can render `https://isthereanydeal.com/giveaways/`,
  including lazy-loaded entries.
- **A browser with signed-in store accounts** for claims. Claims run only in
  accounts the user already has; this skill creates no accounts and spends no
  money.
- **A durable ledger** for discovery and ownership history: persistent agent
  memory, a database, or a journal (for example one created with
  `setup-journal-project`). Scratch files last one run and do not count.

## Configuration

Read these from the request or the project's instructions:

| Setting | Default |
| --- | --- |
| Mode | Discovery only, unless claims are authorized |
| Stores | All four |
| Store accounts | The browser's signed-in accounts |
| Ledger | Persistent memory if available, else the configured journal |
| Ledger author | The configured author, when the ledger records one |

## Workflow

1. **Load history.** Read discovery and ownership history from the ledger,
   including entry bodies, not only titles. Discovery history records what was
   reported; it never proves ownership. Start with empty history only after
   confirming the ledger holds no records. When history cannot be read, or no
   ledger is configured, report the blocker with how to configure one, skip
   claims, and label any findings as not deduplicated.

2. **Scan the Live section.** Read every entry on
   `https://isthereanydeal.com/giveaways/`, following pagination and lazy
   loading. Capture game, store, official offer link or identifier, and
   expiration as displayed (`Unknown` if absent). A blank list without an
   explicit empty-state message is an incomplete scan: reload once, then
   report failure if completeness is still uncertain. An incomplete scan
   leaves discovery history untouched; verified claim outcomes are still
   saved.

3. **Queue offers.** Key discoveries by store plus name, comparing names after
   trimming, collapsing whitespace, and case-folding, so the same game on a
   new store is a new discovery; keep displayed names for the report. Track
   ownership separately per store, account, and product ID or canonical URL
   (store plus normalized name only as a fallback). Queue every live eligible
   offer without verified ownership, including ones reported or blocked before.
   Confirm a pending offer is still live before retrying it.

4. **Check eligibility** (claims only). Inspect the official store offer in an
   existing signed-in account. Confirm a free-to-keep license with a final
   total of zero; trials, subscriptions, paid add-ons, and free weekends are
   ineligible. Sign-ins, CAPTCHAs, legal agreements, and approval prompts go to
   the user; in a scheduled run, record those offers as blocked and continue
   with independent ones.

5. **Claim and verify.** Check current ownership before submitting. Pre-existing
   ownership is `already owned`. An offer is `claimed` only after an explicit
   successful acquisition or fresh library or license evidence; keep the
   verification source and timestamp. A click, a zero-price listing, a
   generated key, a timeout, or a discovery record alone is not ownership. For
   an ambiguous submission, check ownership before any retry; otherwise record
   `blocked — outcome unverified`. Keep unredeemed keys private and pending
   until redemption is verified.

6. **Persist.** Save discovery and claim statuses independently, preserving
   earlier history. Mark a scan complete only after every Live entry was read.
   Save verified ownership promptly so a later failure cannot lose it. Keep
   pending and blocked offers retryable. Report a failed ledger write and retry
   it from verified evidence, never by repeating the acquisition.

7. **Log the run** when the ledger is a journal. Report results to the user
   first, then follow the journal's own instructions and save one coherent
   entry for the run with new findings, claim changes, or meaningful blockers:
   game, store, expiration, status, and evidence or blocker. Query only the
   configured author's entries, reuse the same run entry on retries, refetch
   right before editing, preserve unrelated content, and verify writes by
   reading them back. Skip empty routine entries.

## Output

Show new discoveries and changed claim outcomes with concise totals and a
table:

```markdown
| Game | Store | Expires | Outcome | Evidence or blocker |
| --- | --- | --- | --- | --- |
```

Outcomes are `found` (claim not attempted), `already owned`, `claimed`, and
`blocked`. Include unresolved pending claims even when discovered earlier.
State whether the scan was complete and name any history, claim, persistence,
or journal failures. Say "No new giveaways available" only after a complete
scan with no new discoveries, and list pending claims or failures separately.
An incomplete scan is reported as incomplete.
