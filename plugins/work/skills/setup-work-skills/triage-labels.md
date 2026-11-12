## Labels

The `triage` skill applies these labels by their exact strings. This section is
the only definition of the Type, Theme, and Repository labels; other skills and
docs point here. Every label uses Sentence case: capitalize the first word only,
keep proper nouns and acronyms, and capitalize the word after a `Prefix:`. The
Repository labels are the exception: each keeps its repository's spelling.

An issue carries at most one label from each group below.

<!-- label-vocabulary:start -->
**Type** says what kind of work the issue is. Every triaged issue carries
exactly one. Every repository uses the same Type set: `Feature`, `Bug`,
`Refactor`, `Tools`, `Task` and `Design`.

Each Type says how triage verifies the issue's claim and which commit types
the closing pull request uses.

| Label | Commit types | Verify the claim by | Definition |
| --- | --- | --- | --- |
| `Feature` | `feat`, `perf` | redundancy check | Changes what the product does, or how fast or light it does it, as users observe in Production. |
| `Bug` | `fix` | reproduction | Makes the product do what it was already supposed to do, including fixing a performance regression. |
| `Refactor` | `refactor` | redundancy check | Changes product source in a way no user can observe. |
| `Tools` | `chore`, `ci`, `test`, `docs`, `style` | reproduction when it reports something broken, otherwise redundancy check | Changes project files only: tooling, CI, scripts, tests, repository docs. Never product behavior. |
| `Task` | none | confirming the action is not already done | Needs no repository change: a one-off action on data, accounts, settings, or vendors. |
| `Design` | none | confirming no existing design covers it | Produces a product or UX design, such as flows, mockups, or a prototype, for later work to build. |

- **Reproduction:** reproduce the report from the reporter's steps and name the
  code path.
- **Redundancy check:** search the codebase for an existing implementation and
  record where you looked.
- **Confirming the action is not already done:** check the system the action
  touches.
- **Confirming no existing design covers it:** search the design files and
  earlier design issues for the same flow or screen.

Product is what a Production deploy delivers to users, including
infrastructure on a user's request path. In `patinaproject/skills`, the
product is the published skills and plugins. A change to a published skill's
or plugin's behavior is `Feature`, `Bug` or `Refactor`, and that repository's
CI, scripts, tests, and repository docs are `Tools`. In every other
repository, internal tooling, CI, skills, agent workflows, and repository
structure are never product, so broken tooling is `Tools`, not `Bug`.

A Type never says which repository an issue belongs to. The **Repository**
label marks that.

**Repository** says which repository the work belongs to. There is one label
per repository, named by the repository's slug. The **Repository group** list
after this vocabulary says which labels exist. Every triaged issue whose work
belongs to a listed repository carries exactly one, and any other issue carries
none.

In Linear, the Repository labels form one single-select Repository group. On
GitHub, the Repository label is the repository's own slug label, and Linear's
sync carries it into the Repository group.

**Theme** says why the work matters. An issue carries at most one, and a
missing Theme never blocks readiness. When two fit, take the one listed
first.

| Label | Definition |
| --- | --- |
| `Support` | Helps users get help, or reduces support load. |
| `Security` | Reduces security risk or meets a security requirement. |
| `Legal` | Meets a legal, privacy, or compliance obligation, or reduces legal risk. |
| `Performance & stability` | Reduces failures users hit in Production (crashes, errors, outages, data loss, flaky behavior), or keeps the product fast. |
| `User blockers` | Removes friction or a missing step that stops users from finishing what they came to do. A failure users hit in Production is `Performance & stability`. |
| `User enablers` | Lets users do something they could not do before. |
| `Revenue` | Acquisition, discoverability (SEO), onboarding, conversion, subscriptions, and pricing. |
| `Deliverability & reliability` | Makes building, testing, and shipping our software and agents faster, safer, or more reliable. |
<!-- label-vocabulary:end -->

**Repository group** lists this repository's Repository labels, one row per
repository whose issues this tracker holds. `setup-work-skills` keeps this list
when it refreshes the vocabulary above.

<!-- repository-group:start -->
| Label | Definition |
| --- | --- |
| `<repository-slug>` | `<one-line description of this repository>` |
<!-- repository-group:end -->

**Triage**, exactly one per triaged issue:

| Label | Meaning |
| --- | --- |
| `Needs triage` | Maintainer needs to evaluate this issue |
| `Needs info` | Waiting on the reporter or a developer to answer open questions |
| `Ready for agent` | Fully specified, ready for an AFK agent |
| `Ready for human` | Requires human implementation |
| `Won't fix` | Will not be actioned. Also covers an issue closed as a duplicate |
