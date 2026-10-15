# Release Flow

Releases are not automated yet. Consumers install skills from the default
branch with:

```sh
npx skills@latest add tlmader/skills --skill <name>
```

or pin a git ref:

```sh
npx skills@latest add tlmader/skills#<git-ref> --skill <name>
```

## Planned release-please setup

When tagged releases are needed, add `release-please` with a single root
package (`release-type: simple`) and tags of the form `v<X.Y.Z>`:

1. Add `release-please-config.json`, `.release-please-manifest.json`, and a
   `.github/workflows/release-please.yml` workflow that runs on pushes to the
   default branch. Pin its actions to full commit SHAs.
2. Set **Settings > Actions > General > Workflow permissions** to **Read and
   write permissions**.
3. Create the `autorelease: pending` label with color `ededed` and a description
   saying that Release Please uses it.
4. Make sure no tag ruleset requires signed tags for `v*` tags; Release Please
   cannot sign tags.
5. Enable release immutability under **Settings > General > Releases**.

After that, each squash-merged `feat:` or `fix:` commit updates a standing
Release PR. Merging it tags the commit, publishes a GitHub Release, and updates
`CHANGELOG.md`. Do not edit released sections of `CHANGELOG.md` by hand.

Bot-generated release-please PRs from `release-please--*` branches are the only
PRs that may omit a GitHub issue reference in the title.
