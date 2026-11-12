#!/usr/bin/env node
// Re-read one issue's live state before a triage write.
//
//   node check-issue-state.mjs <issue> --state <label|none> [--state-labels a,b,...] [--tracker github|gitlab]
//
// <issue> is #N or OWNER/REPO#N or a GitHub issue or pull request URL (read
// with gh), a GitLab issue URL (https://HOST/GROUP/PROJECT/-/issues/N or
// /-/work_items/N, read only when HOST is gitlab.com or, under --tracker
// gitlab, the origin remote's host) or #N or GROUP/.../PROJECT#N on a GitLab
// tracker (read with glab), or a Linear identifier such as PAT-12 or a Linear
// issue URL (read with LINEAR_API_KEY), or a local Markdown issue as its
// identifier such as 03-add-login (found at .scratch/*/issues/<identifier>.md)
// or its path such as .scratch/login/issues/03-add-login.md (read from the
// file's `Status:` line above the first `## ` heading). #N and PATH#N read
// GitLab when --tracker is gitlab, or when --tracker is absent and the origin
// remote is on gitlab.com. The GitLab host and a bare #N's project come from
// the origin remote. Run the check from the repository root. Pass a local issue
// as its identifier or path, never as #N. Pass the path when an identifier
// matches more than one feature. --state names the Triage label the pass read;
// `none` means the issue had no Triage label. --state-labels lists the
// tracker's Triage label strings, defaulting to the team skills' Triage labels.
//
// Exit 0 and print `proceed: ...` when the issue is open and its only state
// label is the expected one. Exit 2 and print `skip: ...` when it closed or its
// Triage label changed. Exit 1 when the state cannot be read; make no write.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import process from "node:process";

const usage = "usage: check-issue-state.mjs <issue> --state <label|none> [--state-labels a,b,...] [--tracker github|gitlab]";
const defaultStateLabels = ["Needs triage", "Needs info", "Ready for agent", "Ready for human", "Won't fix"];

function fail(message) {
  console.error(`check-issue-state: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { stateLabels: defaultStateLabels };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--state") args.state = argv[++i];
    else if (arg === "--state-labels") args.stateLabels = (argv[++i] ?? "").split(",").map((label) => label.trim()).filter(Boolean);
    else if (arg === "--tracker") args.tracker = argv[++i] ?? "";
    else if (args.ref === undefined && !arg.startsWith("--")) args.ref = arg;
    else fail(`unexpected argument: ${arg}\n${usage}`);
  }
  if (!args.ref || !args.state) fail(usage);
  if (args.tracker !== undefined && !["github", "gitlab"].includes(args.tracker)) fail("--tracker must be github or gitlab");
  if (!args.stateLabels.length) fail("--state-labels needs at least one label");
  if (args.state !== "none" && !args.stateLabels.some((label) => label.toLowerCase() === args.state.toLowerCase())) fail(`--state ${args.state} is not one of the Triage labels: ${args.stateLabels.join(", ")}`);
  return args;
}

function cleanHost(host) {
  const name = host.replace(/:\d+$/, "").toLowerCase();
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(name) ? name : undefined;
}

function cleanPath(path) {
  return path.split("/").every((segment) => segment && segment !== "." && segment !== "..") ? path : undefined;
}

function readOrigin() {
  const result = spawnSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" });
  if (result.error || result.status !== 0) return undefined;
  const url = result.stdout.trim();
  const match =
    url.match(/^https?:\/\/(?:[^@/]+@)?([^/]+)\/(.+?)(?:\.git)?\/?$/) ??
    url.match(/^ssh:\/\/(?:[^@/]+@)?([^/:]+)(?::\d+)?\/(.+?)(?:\.git)?\/?$/) ??
    url.match(/^(?:[^@/]+@)?([^/:]+):([^/].*?)(?:\.git)?\/?$/);
  const host = match && cleanHost(match[1]);
  const path = match && cleanPath(match[2]);
  return host && path ? { host, path } : undefined;
}

function parseRef(ref, tracker) {
  let match;
  if ((match = ref.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/(?:issues|pull)\/(\d+)/))) return { provider: "github", repo: match[1], number: match[2] };
  if ((match = ref.match(/^https?:\/\/([^/]+)\/(.+?)\/-\/(?:issues|work_items)\/(\d+)\/?(?:[#?].*)?$/))) {
    const host = cleanHost(match[1]);
    if (host && cleanPath(match[2])) {
      if (host !== "gitlab.com" && (tracker !== "gitlab" || readOrigin()?.host !== host)) fail(`${host} is neither gitlab.com nor the origin host of a --tracker gitlab run, so its issue is not read`);
      return { provider: "gitlab", host, path: match[2], number: match[3] };
    }
  }
  if ((match = ref.match(/^((?:[\w.-]+\/)*[\w.-]+)?#(\d+)$/))) {
    const [, path, number] = match;
    if (path && !cleanPath(path)) fail(`cannot tell the tracker from ${ref}\n${usage}`);
    const origin = tracker === "github" ? undefined : readOrigin();
    if (tracker === "gitlab" || (tracker === undefined && origin?.host === "gitlab.com")) {
      if (!origin) fail("cannot read the GitLab project from the origin remote");
      return { provider: "gitlab", host: origin.host, path: path ?? origin.path, number };
    }
    if (!path || path.split("/").length === 2) return { provider: "github", repo: path ?? "{owner}/{repo}", number };
  }
  if ((match = ref.match(/^https:\/\/linear\.app\/[^/]+\/issue\/([A-Z][A-Z0-9]*-\d+)/))) return { provider: "linear", id: match[1] };
  if ((match = ref.match(/^[A-Z][A-Z0-9]*-\d+$/))) return { provider: "linear", id: match[0] };
  if (!ref.startsWith("https://") && ref.endsWith(".md")) {
    const path = resolve(ref);
    if (basename(dirname(path)) !== "issues" || !/^\d{2,}-\S+\.md$/.test(basename(path))) fail(`${ref} is not a local issue file, which sits in a directory named issues and is named <NN>-<slug>.md`);
    return { provider: "local", path };
  }
  if (/^\d{2,}-[A-Za-z0-9._-]+$/.test(ref)) return { provider: "local", id: ref };
  fail(`cannot tell the tracker from ${ref}\n${usage}`);
}

// The issues endpoint serves pull requests too, and a merged one reads closed.
function readGitHub({ repo, number }) {
  const result = spawnSync("gh", ["api", `repos/${repo}/issues/${number}`], { encoding: "utf8" });
  if (result.error) fail(`cannot run gh: ${result.error.message}`);
  if (result.status !== 0) fail(`gh could not read ${repo}#${number}: ${result.stderr.trim()}`);
  const issue = JSON.parse(result.stdout);
  return { open: issue.state === "open", labels: issue.labels.map((label) => label.name) };
}

function readGitLab({ host, path, number }) {
  const result = spawnSync("glab", ["api", "--hostname", host, `projects/${encodeURIComponent(path)}/issues/${number}`], { encoding: "utf8" });
  if (result.error) fail(`cannot run glab: ${result.error.message}`);
  if (result.status !== 0) fail(`glab could not read ${path}#${number}: ${result.stderr.trim()}`);
  let issue;
  try {
    issue = JSON.parse(result.stdout);
  } catch {}
  if (!["opened", "closed"].includes(issue?.state)) fail(`glab returned no usable state for ${path}#${number}`);
  return { open: issue.state === "opened", labels: issue.labels };
}

async function readLinear({ id }) {
  const key = process.env.LINEAR_API_KEY;
  if (!key) fail("LINEAR_API_KEY is not set, so the Linear issue cannot be read");
  const response = await fetch(process.env.LINEAR_API_URL ?? "https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: key.startsWith("lin_api_") ? key : `Bearer ${key}` },
    body: JSON.stringify({ query: "query($id: String!) { issue(id: $id) { state { type } labels { nodes { name } } } }", variables: { id } }),
  }).catch((error) => fail(`cannot reach Linear: ${error.message}`));
  const body = await response.json().catch(() => fail(`Linear answered ${response.status} without JSON`));
  if (!body.data?.issue) fail(`Linear could not read ${id}: ${JSON.stringify(body.errors ?? body)}`);
  const { state, labels } = body.data.issue;
  return { open: !["completed", "canceled"].includes(state.type), labels: labels.nodes.map((label) => label.name) };
}

function findLocal(id) {
  const root = ".scratch";
  const features = existsSync(root) ? readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [];
  const matches = features.map((feature) => join(root, feature, "issues", `${id}.md`)).filter((path) => existsSync(path)).sort();
  if (!matches.length) fail(`no local issue matches ${join(root, "*", "issues", `${id}.md`)}`);
  if (matches.length > 1) fail(`${id} matches more than one local issue, so pass the path instead:\n${matches.join("\n")}`);
  return matches[0];
}

function readLocal(ref, stateLabels) {
  const path = ref.path ?? findLocal(ref.id);
  let text;
  try {
    if (!statSync(path).isFile()) throw new Error("not a regular file");
    text = readFileSync(path, "utf8");
  } catch (error) {
    fail(`cannot read ${path}: ${error.message}`);
  }
  const lines = text.split("\n");
  const heading = lines.findIndex((line) => line.startsWith("## "));
  const line = lines.slice(0, heading < 0 ? lines.length : heading).find((candidate) => candidate.startsWith("Status:"));
  const value = (line ?? "").slice("Status:".length).replace(/\r$/, "").trim().replace(/^`(.*)`$/, "$1");
  if (!value) return { open: true, labels: [] };
  const known = stateLabels.some((candidate) => candidate.toLowerCase() === value.toLowerCase());
  return { open: true, labels: [value], nonTriage: !known };
}

const args = parseArgs(process.argv.slice(2));
const ref = parseRef(args.ref, args.tracker);
const readers = { github: readGitHub, gitlab: readGitLab, linear: readLinear, local: (local) => readLocal(local, args.stateLabels) };
const live = await readers[ref.provider](ref);
const stateLabels = new Set(args.stateLabels.map((label) => label.toLowerCase()));
const current = live.nonTriage ? live.labels : live.labels.filter((label) => stateLabels.has(label.toLowerCase()));
const expected = args.state === "none" ? [] : [args.state.toLowerCase()];
const describe = (labels) => (labels.length ? labels.join(", ") : "none");

if (!live.open) {
  console.log(`skip: ${args.ref} is closed`);
  process.exit(2);
}
if (live.nonTriage || current.map((label) => label.toLowerCase()).join() !== expected.join()) {
  console.log(`skip: ${args.ref} Triage label is now ${describe(current)}, not ${args.state}`);
  process.exit(2);
}
console.log(`proceed: ${args.ref} is open with ${args.state === "none" ? "no Triage label" : `Triage label ${args.state}`}`);
