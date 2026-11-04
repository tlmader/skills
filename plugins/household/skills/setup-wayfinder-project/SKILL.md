---
name: setup-wayfinder-project
description: Point a household project at the Google Drive Markdown issue tracker in Shared Mader Family/Travel and print the instructions that drive Wayfinder from it.
disable-model-invocation: true
license: MIT
---

# Setup Wayfinder Project

Bind one household project to the existing Google Drive Markdown issue
tracker, then print the
[project instructions](assets/project-instructions.template.md). Household
projects share that one tracker file. This skill reads the file and prints
instructions. It leaves the file as it is.

## Requirements

- Google Drive tools that can find a file in a named folder and read its text.
- The skills the printed instructions invoke: `wayfinder`, `grilling`,
  `domain-modeling`, `research`, and `prototype`, from
  [mattpocock/skills](https://github.com/mattpocock/skills). Install those
  five with `npx skills@latest add mattpocock/skills --skill wayfinder
  grilling domain-modeling research prototype`.

`wayfinder`, `to-spec`, `to-tickets`, and `triage` follow the tracker the
project instructions name.

## 1. Resolve the tracker

Collect the project name.

In the user's personal Google Drive, open the folder `Shared Mader Family`,
then the folder `Travel`. Select the file in that folder whose name contains
both `Issue tracker` and `Google Drive Markdown`.

Use the single match. When several files in that folder match, ask the user
which file is the tracker. When none match, stop and report that the tracker
is missing from `Shared Mader Family/Travel`, and wait for the user to
provide the file.

Read the matched file through to the end, including its store path, map and
ticket formats, and Wayfinder operations.

Resolve is complete when one tracker file is chosen and its text has been
read.

## 2. Preflight

Verify the runtime can load `wayfinder`, `grilling`, `domain-modeling`,
`research`, and `prototype` by name. When any is missing, stop, name it, and
point to the install command above.

Preflight is complete when the tracker file is unambiguous and every named
skill loads.

## 3. Print the instructions

Render [the template](assets/project-instructions.template.md). Replace
`{{PROJECT_NAME}}`, `{{TRACKER_NAME}}`, `{{TRACKER_PATH}}`, and
`{{TRACKER_URL}}` with the project name and values read back from Drive: the
file's name, its folder path, and its link. The folder path is `Shared Mader
Family/Travel` unless the file's parents show a different path. Verify no
placeholder remains.

Print the result inside a Markdown fence longer than any fence it contains.

The run is complete when the printed instructions contain no placeholders
and include the tracker's link. The tracker file is unchanged.
