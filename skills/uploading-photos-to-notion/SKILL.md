---
name: uploading-photos-to-notion
description: Upload photos to Notion as durable native image blocks placed beside the text they illustrate. Use whenever photos go onto a Notion page or database entry, including journal entries, retries, and replacing temporary attachment links.
license: MIT
---

# Uploading Photos to Notion

Store every original as a Notion-managed file, place it beside the text it
illustrates, and verify the finished page. An upload is complete only after a
page refetch shows the expected image blocks.

## Requirements

A Notion integration that can create file uploads and append or edit page
content, plus local access to the original photo files. The supported upload
routes and their exact calls are in
[upload routes](references/upload-routes.md); read it before the first upload.

## Run in the background

Photo uploads support the conversation; they never hold it up.

- Answer the user's actual request first, before the first upload call.
- When the runtime offers a background agent or task, hand it the whole job in
  one self-contained **brief**: the originals' local paths, the destination
  page or database, the entry's title, date, and author, the text and caption
  for each photo, the instruction that authorizes the transfer, and the
  verification checklist below. Read its result when it arrives.
- Otherwise, do the work after the answer in the same turn, silently, with no
  progress messages.
- If the user sends a new message meanwhile, answer it, then resume from the
  last verified state, refetching before any write.
- Report the outcome in at most one line, or not at all when the governing
  instructions say to mention the work only when useful. Always report
  failures and photos still pending.
- Authority checks, original-byte preservation, and verification apply in the
  background too. When a step needs the user's confirmation, finish everything
  else first and ask once at the end.

## Workflow

### 1. Resolve authority and destination

- Confirm that the request or the project's standing instructions authorize
  sending these photos to this Notion destination. "Save this to Notion",
  "retry the upload", or standing instructions naming Notion and photos
  supply it. Ask only when the destination or the authority is unclear.
- Carry that authority into the upload call: name the original filenames, the
  fetched destination, and the authorizing instruction in the tool's
  justification field or a short comment beside the call, so a reviewer can
  assess the transfer. This skill grants no permission of its own.
- Fetch the exact destination page before sending any bytes, and confirm it is
  accessible, active, and the user's.
- For a database entry, search for a matching entry before creating one, and
  reuse it on retries. A failed image never justifies a duplicate page.

### 2. Preserve the originals

- Upload the original local files unchanged. Metadata may inform dates and
  orientation; the bytes stay as they are.
- Check each file's MIME type, extension, and size against the workspace's
  upload limit, and record each original's byte size for verification.
- Use one Notion file upload per photo.
- Chat attachment URLs, signed URLs, `sandbox:` paths, Drive links, and earlier
  Notion signed URLs are transport inputs for reading bytes, never the final
  image source.

### 3. Upload

Follow [upload routes](references/upload-routes.md) for the route available.
Send all of an entry's photos together. An upload is done when Notion reports
`status: "uploaded"` with a byte length equal to the original's. Keep base64
and credentials out of chat, logs, and saved files.

### 4. Place image blocks

For a new entry, upload first and create the page once with text and images in
place, so it never exists half-written. For an existing page, refetch it and
its blocks immediately before writing and pick the text block each photo
illustrates.

Each image goes **adjacent** to its text: immediately after the relevant text
block, related images consecutive, in their original order, with any useful
caption on the image itself. Nothing sits between text and image: no empty
paragraph, divider, heading, or caption paragraph. Edit only the targeted spot
and preserve unrelated content; append only when the relevant text is already
last. The route reference gives the Markdown and block-API forms.

### 5. Verify

Refetch the page after insertion and check:

- the expected number of native image blocks is on the intended page;
- their order matches the source order;
- each image immediately follows its text, with no spacer;
- captions are on the images and match the supported context;
- no image was duplicated by a retry; and
- each upload's reported byte length matched its original.

Fetched native images return temporary signed URLs; that expiry is normal and
the attachment itself is durable. Report success only after every check
passes.

## Recovery

- Classify an error before retrying: missing local file or dependency,
  transport failure, Notion error, or approval rejection, and report the layer
  that actually failed.
- After an approval rejection, stop that action and read its reason and
  permitted recovery. When it allows an authorization check, supply the
  concrete evidence (the user's instruction and the fetched destination)
  through that path and retry only when its conditions are met. Rejections are
  resolved through their stated recovery path, never by switching tools,
  hosts, or credentials.
- When review still blocks the transfer, keep completed work and state the
  rejected action and reason, distinguishing an external review requirement
  from missing user permission. Ask only for the specific confirmation or
  access still needed.
- When text was saved before an upload failed, keep it and retry the missing
  photos on the same page.
- After a partial success, refetch the page, identify the missing originals,
  and upload only those.
- When an insertion's outcome is ambiguous, refetch before retrying: append
  calls are not idempotent, and blind retries duplicate images.
- When Notion access, ownership, or transfer authority cannot be established,
  stop before sending bytes and ask for what is missing.
