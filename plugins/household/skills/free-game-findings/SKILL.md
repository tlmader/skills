---
name: free-game-findings
description: >-
  Find free-to-keep game giveaways (IsThereAnyDeal, GamerPower, store pages,
  Twitch drops), claim eligible ones when authorized, and keep a verified ledger
  of outcomes. Use for manual or scheduled giveaway hunts.
license: MIT
---
# Free Game Findings

Discover free-to-keep games and claim them when the request or standing task
instructions authorize claims. A discovery-only request stops before claiming.

## Requirements

- **Web access** that can render `https://isthereanydeal.com/giveaways/`,
  including lazy-loaded entries. `https://www.gamerpower.com/api/giveaways?type=game`
  is a fast JSON cross-check that also covers smaller platforms.
- **A browser with signed-in store accounts** for claims. Claims run only in
  accounts the user already has; this skill creates no accounts and spends no
  money.
- **A durable ledger** (persistent memory, a database, or a journal). Scratch
  files last one run and do not count.

## Configuration

| Setting | Default |
| --- | --- |
| Mode | Discovery only, unless claims are authorized |
| Stores | Steam, Epic, GOG, itch.io, IndieGala, Fanatical, Humble Bundle, EA app, Ubisoft Connect, Alienware Arena, SteelSeries GG, Gleam/Keyhub, Twitch drops, plus any the user names |
| Store accounts | The browser's signed-in accounts |
| Ledger | Persistent memory if available, else the configured journal |

## Workflow

1. **Load history.** Read discovery and ownership history from the ledger,
   including entry bodies. Discovery history never proves ownership. If
   history can't be read, report it and label findings as not deduplicated;
   scheduled runs then skip claims.

2. **Scan sources.** Read every Live entry on IsThereAnyDeal (follow
   pagination and lazy loading) and cross-check GamerPower. Keep only offers
   on configured stores. Capture game, store, official link, and expiration
   (`Unknown` if absent). A blank list without an explicit empty state is an
   incomplete scan: reload once, then report failure.

3. **Twitch drops (when configured).** List active and upcoming campaigns on
   `https://www.twitch.tv/drops/campaigns`. Flag campaigns that give a full
   game, and campaigns for games the user owns (store library) or has
   wishlisted, including unreleased ones. Note whether account linking is
   required; linking is a user approval, not something to do silently.

4. **Queue offers.** Key discoveries by store plus normalized name. Track
   ownership per store, account, and product ID or URL. Queue every live
   eligible offer without verified ownership, including earlier blocked ones.

5. **Check eligibility** (claims only). Confirm a free-to-keep license with a
   final total of zero; trials, subscriptions, paid add-ons, free weekends,
   free-to-play titles, and spend-threshold bonuses are ineligible. Skip
   giveaways that require social follows, shares, sign-ups, birthdates,
   extra agreements, or marketing opt-ins.

6. **Claim and verify.** Check current ownership first (`already owned`).
   Mark `claimed` only after explicit success or fresh library evidence, with
   source and timestamp. A click, zero price, generated key, or timeout is not
   ownership. For an ambiguous submission, check ownership before any retry.
   Keep unredeemed keys private.

7. **Persist.** Save discovery and claim statuses independently; save
   verified ownership promptly. Keep pending and blocked offers retryable.

8. **Log the run** when the ledger is a journal: one entry per run with game,
   store, expiration, status, and evidence or blocker. Refetch before editing,
   preserve unrelated content, verify by reading back. Skip empty entries.

## Lessons that save time

- **Stale links.** Old store slugs often 404; search the store by game name
  instead of giving up.
- **Broken checkout links.** If a direct purchase/claim link errors, claim
  from the game's store page.
- **Sign-ins.** Use saved logins or the connected password manager for both
  password and TOTP fills. Prefer "Sign in with Google" when the user wants
  it; at a Google passkey prompt choose another way, then password, then the
  authenticator app. A remembered account on a login page often jumps
  straight to the 2FA step.
- **Iframe login forms** (for example GOG, Ubisoft) only autofill when the
  form is opened as the top-level page.
- **Cloud-IP blocks.** If a store keeps blocking or challenging the cloud
  browser, suggest routing browser traffic through the user's own computer,
  then retry. Solve captchas in the browser rather than handing them off.
- **New-device codes** sent by email can be read with the user's mail
  connector.

## Output

```markdown
| Game | Store | Expires | Outcome | Evidence or blocker |
| --- | --- | --- | --- | --- |
```

Outcomes: `found`, `pending`, `already owned`, `claimed`, `blocked`. State
whether the scan was complete and name any failures. Say "No new giveaways
available" only after a complete scan with no new discoveries.
