#!/usr/bin/env bash
# Copy the Work plugin from patinaproject/skills into plugins/work and add the
# Cursor manifest upstream does not ship.
#
# Cursor marketplaces list only plugins stored in their own repository, so
# Cursor needs this copy. Claude Code and Grok Build install Work straight from
# upstream and never read it. Prints the upstream commit the copy came from.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dest="$root/plugins/work"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git clone --quiet --depth 1 https://github.com/patinaproject/skills.git "$tmp/upstream"
sha="$(git -C "$tmp/upstream" rev-parse HEAD)"

rm -rf "$dest"
cp -R "$tmp/upstream/plugins/work" "$dest"
cp "$tmp/upstream/LICENSE" "$dest/LICENSE"
printf 'patinaproject/skills@%s\n' "$sha" > "$dest/UPSTREAM"

mkdir -p "$dest/.cursor-plugin"
node -e '
const fs = require("node:fs");
const [src, out] = process.argv.slice(1);
const p = JSON.parse(fs.readFileSync(src, "utf8"));
const keep = ["name", "displayName", "version", "description", "author",
  "homepage", "repository", "license", "keywords"];
const m = Object.fromEntries(keep.filter((k) => k in p).map((k) => [k, p[k]]));
m.skills = "./skills/";
fs.writeFileSync(out, JSON.stringify(m, null, 2) + "\n");
' "$dest/.claude-plugin/plugin.json" "$dest/.cursor-plugin/plugin.json"

echo "$sha"
