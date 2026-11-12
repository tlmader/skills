#!/usr/bin/env node
// Count the review follow-ups around one issue, so triage reads repetition as a fact.
//
//   node follow-up-census.mjs <issue> [--path <file>]... [--days 30] [--threshold 2]
//
// <issue> is #N, OWNER/REPO#N, or a GitHub issue URL, read with gh. Run it
// anywhere inside the issue's repository checkout. Another tracker exits 1.
//
// A follow-up is an issue whose body has a `Follow-up of: <reference>` line,
// where the reference names an issue or a pull request.
// Only references into the issue's own repository are read. A reference to
// another repository ends the ancestor walk there.
//   files      the backticked tokens in the issue body that `git ls-files`
//              lists, plus each --path, given relative to the repository root.
//   siblings   other follow-ups created in the last --days days whose body names
//              one of those files as a whole backticked token.
//   ancestors  the follow-ups above this one. A source pull request leads to
//              the one issue it closed, and a source issue is that issue.
// Repetition holds when --threshold or more siblings closed as completed, or
// --threshold or more ancestors exist.
//
// Prints one `Census:` line, then one line per sibling and ancestor. With no
// files, the siblings are not read.
// Exit 0: read, no repetition. Exit 2: read, repetition. Exit 1: a read failed
// or the arguments were bad.
import { spawnSync } from "node:child_process";
import process from "node:process";

const usage = "usage: follow-up-census.mjs <issue> [--path <file>]... [--days 30] [--threshold 2]";
const ISSUE = /^(?:https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/|([\w.-]+\/[\w.-]+)?#)(\d+)$/;
const MARKER = /^[ \t]*Follow-up of:[ \t]*(?:https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:issues|pull)\/|([\w.-]+\/[\w.-]+)?#)(\d+)[ \t]*\r?$/m;
// Issues filed before the marker existed name their source in prose. Delete this
// pattern after 2026-12-11, when the last of them has left the default window.
const LEGACY = /\b(?:review of|reviewing)\s+(?:PR\s+)?#(\d+)/i;
const MAX_ANCESTORS = 6;

function fail(message) {
  console.error(`follow-up-census: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, ...options });
  if (result.error) fail(`cannot run ${command}: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} ${args.slice(0, 3).join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout;
}

function json(command, args) {
  const output = run(command, args);
  try {
    return JSON.parse(output);
  } catch {
    fail(`${command} ${args.slice(0, 3).join(" ")} returned no JSON`);
  }
}

function count(value) {
  return /^[1-9]\d*$/.test(value ?? "") ? Number(value) : fail(usage);
}

function parseArgs(argv) {
  const args = { paths: [], days: 30, threshold: 2 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--path") args.paths.push(argv[++i] ?? fail(usage));
    else if (arg === "--days") args.days = count(argv[++i]);
    else if (arg === "--threshold") args.threshold = count(argv[++i]);
    else if (args.ref === undefined && !arg.startsWith("-")) args.ref = arg;
    else fail(`unexpected argument: ${arg}\n${usage}`);
  }
  const ref = ISSUE.exec(args.ref ?? "");
  if (!ref) fail(`${usage}\nonly a GitHub issue is read`);
  const named = ref[1] ?? ref[2];
  if (named?.split("/").some((segment) => /^\.+$/.test(segment))) fail(`${usage}\nnot a repository: ${named}`);
  return { ...args, repo: named, number: Number(ref[3]) };
}

function source(body, repo) {
  const marked = MARKER.exec(body ?? "");
  if (marked) return { repo: marked[1] ?? marked[2] ?? repo, number: Number(marked[3]) };
  const legacy = LEGACY.exec(body ?? "");
  return legacy ? { repo, number: Number(legacy[1]) } : null;
}

function tokens(body) {
  return new Set([...(body ?? "").matchAll(/`([^`\s]+)`/g)].map(([, token]) => token.replace(/:\d+(?:-\d+)?$/, "")));
}

const args = parseArgs(process.argv.slice(2));
const repo = args.repo ?? run("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).trim();
const local = (other) => other.toLowerCase() === repo.toLowerCase();

function view(number) {
  const item = json("gh", ["api", `repos/${repo}/issues/${number}`]);
  return { number, title: item.title, body: item.body ?? "", pull: Boolean(item.pull_request) };
}

const issue = view(args.number);
const top = run("git", ["rev-parse", "--show-toplevel"]).trim();
const tracked = new Set(run("git", ["ls-files", "-z"], { cwd: top }).split("\0").filter(Boolean));
const paths = [...tokens(issue.body)].filter((token) => tracked.has(token));
for (const path of args.paths) {
  if (!tracked.has(path)) fail(`${path} is not a tracked file, relative to the repository root`);
  if (!paths.includes(path)) paths.push(path);
}

const ancestors = [];
const seen = new Set([issue.number]);
let from = source(issue.body, repo);
while (from && local(from.repo) && ancestors.length < MAX_ANCESTORS && !seen.has(from.number)) {
  seen.add(from.number);
  let parent = view(from.number);
  if (parent.pull) {
    const closed = json("gh", ["pr", "view", String(from.number), "-R", repo, "--json", "closingIssuesReferences"]).closingIssuesReferences;
    if (closed.length !== 1) break;
    const [{ number, repository }] = closed;
    if (!local(`${repository.owner.login}/${repository.name}`)) break;
    if (seen.has(number)) break;
    seen.add(number);
    parent = view(number);
  }
  from = source(parent.body, repo);
  if (from) ancestors.push(parent);
}

const LIMIT = 1000;
const since = Date.now() - args.days * 86_400_000;
const listed = paths.length ? json("gh", [
  "issue", "list", "-R", repo, "--state", "all", "--limit", String(LIMIT),
  "--search", `created:>=${new Date(since).toISOString().slice(0, 10)}`,
  "--json", "number,title,body,state,stateReason,createdAt",
]) : [];
if (listed.length >= LIMIT) fail(`gh issue list returned ${LIMIT} issues, the read may be incomplete`);
const siblings = listed
  .filter((each) => each.number !== issue.number && Date.parse(each.createdAt) >= since && source(each.body, repo))
  .filter((each) => paths.some((path) => tokens(each.body).has(path)))
  .sort((a, b) => a.number - b.number);

const completed = siblings.filter((each) => each.state === "CLOSED" && each.stateReason === "COMPLETED");
const open = siblings.filter((each) => each.state === "OPEN");
const repeat = completed.length >= args.threshold || ancestors.length >= args.threshold;
const refs = (list) => (list.length ? list.map((each) => `#${each.number}`).join(", ") : "none");
const files = paths.length
  ? `${siblings.length} sibling follow-ups in ${args.days} days on ${paths.join(", ")} (completed: ${refs(completed)}; open: ${refs(open)})`
  : "no tracked file";
const state = (each) => [each.state, each.state === "CLOSED" && each.stateReason].filter(Boolean).join(" ").toLowerCase().replaceAll("_", " ");
console.log([
  `Census: #${issue.number}, ${files}, ancestors: ${refs(ancestors)}, repeat: ${repeat ? "yes" : "no"}`,
  ...siblings.map((each) => `  sibling #${each.number} ${state(each)} ${JSON.stringify(each.title)}`),
  ...ancestors.map((each) => `  ancestor #${each.number} ${JSON.stringify(each.title)}`),
].join("\n"));
process.exit(repeat ? 2 : 0);
