#!/usr/bin/env node
// The household plugin version is what Claude Code, Cursor, and Codex compare
// when deciding whether to install an update. The three manifests must carry
// the same version, and any change under plugins/household must increase it.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const files = [
  "plugins/household/.claude-plugin/plugin.json",
  "plugins/household/.cursor-plugin/plugin.json",
  "plugins/household/.codex-plugin/plugin.json",
];

const root = process.env.HOUSEHOLD_VERSION_ROOT
  ? path.resolve(process.env.HOUSEHOLD_VERSION_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function readVersion(file, source) {
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    fail(`${file} is not valid JSON: ${error.message}`);
  }
  const version = parsed.version;
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
    fail(`${file} version must be a dotted triple such as 0.2.0, got ${JSON.stringify(version)}`);
  }
  return version;
}

function versionAt(ref, file) {
  try {
    return readVersion(file, git(["show", `${ref}:${file}`]));
  } catch (error) {
    if (error && error.status === 128) {
      return null;
    }
    throw error;
  }
}

function compare(left, right) {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}

function resolveBase() {
  if (process.env.HOUSEHOLD_VERSION_BASE) {
    return process.env.HOUSEHOLD_VERSION_BASE;
  }
  try {
    git(["rev-parse", "--verify", "--quiet", "origin/main"]);
    return "origin/main";
  } catch {
    return null;
  }
}

const versions = files.map((file) => ({
  file,
  version: readVersion(file, readFileSync(path.join(root, file), "utf8")),
}));
const unique = [...new Set(versions.map((entry) => entry.version))];
if (unique.length !== 1) {
  const lines = versions.map((entry) => `  ${entry.version}  ${entry.file}`).join("\n");
  fail(`Household manifests disagree. Set the same version in all three:\n${lines}`);
}
const head = unique[0];

const base = resolveBase();
if (!base) {
  console.log(`household manifests agree on ${head}`);
  process.exit(0);
}

let mergeBase;
try {
  mergeBase = git(["merge-base", base, "HEAD"]);
} catch (error) {
  fail(`Cannot find a merge base between ${base} and HEAD: ${error.message}`);
}

const changed = [
  git(["diff", "--name-only", mergeBase, "HEAD", "--", "plugins/household"]),
  git(["diff", "--name-only", "HEAD", "--", "plugins/household"]),
  git(["ls-files", "--others", "--exclude-standard", "--", "plugins/household"]),
]
  .filter(Boolean)
  .join("\n");
if (!changed) {
  console.log(`household manifests agree on ${head}`);
  process.exit(0);
}

const baseVersion = versionAt(mergeBase, files[0]);
if (baseVersion === null) {
  console.log(`household manifests agree on ${head}`);
  process.exit(0);
}
if (compare(head, baseVersion) <= 0) {
  fail(
    `plugins/household changed since ${base} but the version is still ${head}.\n` +
      `Bump it above ${baseVersion} in:\n` +
      files.map((file) => `  ${file}`).join("\n") +
      `\nChanged:\n${changed}`,
  );
}

console.log(`household manifests agree on ${head} (was ${baseVersion})`);
