---
name: uploading-journal-photos
description: Upload a journal entry's photos into its flat Google Drive Photos folder as `YYYY-MM-DD Title.jpg`, with `-1` and `-2` suffixes when one entry has several, and record the files on that entry's Sheet row. Use when saving photos to a journal, retrying a photo upload, or replacing an entry's photos.
license: MIT
---

# Uploading Journal Photos

Store each original in the journal's flat `Photos` folder under the filename
below, then record the files on the entry's `Entries` row. An upload is
complete when a folder listing and a row read-back both show those files.

## Requirements

Google Drive tools that can list a folder, upload a file's original bytes,
and read a file's size back, plus Google Sheets tools that can find a row,
write a date-typed cell, and update `Photos` and `Photo links`. The journal
is a Google Sheet with an `Entries` tab and a sibling `Photos` folder.

## Filename

`<date>` is the entry's `Date` as `YYYY-MM-DD`. `<title>` is the entry's
`Name`. Replace `/` and `\` with a space, trim surrounding space, and keep
the rest of the title, including spaces.

| Photos for the entry | Filenames |
| --- | --- |
| One | `<date> <title>.jpg` |
| Several | `<date> <title>-1.jpg`, `<date> <title>-2.jpg`, counting from 1 in source order |

The number sits immediately before the extension. A several-photo entry has
a suffix on every file. A one-photo entry has no suffix. Store a JPEG as
`.jpg`. When the original is another image type, use that type's extension
(`.png`, `.heic`, `.webp`) in place of `.jpg`.

## Run in the background

Photo uploads support the conversation.

- Answer the user's request first, before the first upload.
- When the runtime offers a background task, hand it one brief: the originals'
  local paths, the Sheet, the `Photos` folder, the entry's `Date`, `Name`,
  `Author`, and caption, and this skill's filename and verification rules.
  Read the result when it arrives.
- Otherwise finish the uploads after the answer in the same turn.
- When a new message arrives meanwhile, answer it, then resume from the last
  verified listing.
- Report a failure, and any photo still pending. Stay quiet when every photo
  landed and the governing instructions mention the work only when useful.

## Workflow

### 1. Resolve authority and destination

Confirm the request or the project's standing instructions authorize these
photos for this journal. Ask when the destination or that authority is
unclear. Fetch the Sheet and the `Photos` folder before sending bytes, and
confirm both are the ones named.

Search `Entries` for a row with the same `Date`, `Name`, and `Author`, and
reuse it on a retry.

### 2. Preserve the originals

Upload the local files unchanged. Capture metadata may inform `Date`; the
bytes stay as they are. Record each original's byte size. A chat attachment
URL or a signed URL is how the bytes are read. The Drive file is the stored
photo.

### 3. Upload

Put every file directly in `Photos`, with the filename above. Send all of
the entry's photos together.

When a file of the target name already exists and its byte size equals the
original, keep that file. When the user asked to replace that photo, write
the new bytes to the same file and keep the name. Otherwise, when the name
exists and the size differs, stop that file and report the collision. A different name waits for the user to choose it. A
retry uploads only files the listing still lacks.

### 4. Record the row

Set `Photos` to the count of files this entry owns. Set `Photo links` to
those files' Drive URLs in filename order. Leave every other column as it
is.

Create the row only when no matching `Date`, `Name`, and `Author` row
exists. Write `Date` as a date value, `Time` as a time value or blank, and
`Name`, `Caption`, and `Author` from the brief. Insert the row so `Date`
stays descending.

When the workbook already has another tab with one row per photo file,
append one row per new file and fill the columns that tab already uses.
Leave a workbook that has no such tab with the `Entries` tab alone.

### 5. Verify

List `Photos` and read the row back:

- each expected filename is present once, and its byte size equals the
  original;
- a one-photo entry uses the unsuffixed name, and a several-photo entry uses
  contiguous suffixes from 1;
- `Photos` equals that count and `Photo links` lists those files.

Report success only after every check passes.

## Recovery

Classify an error before retrying: a missing local file, a transport
failure, a Drive or Sheets error, or a refused upload. Report the layer that
failed. After a partial success, list the folder and upload only the missing
originals. When an upload's outcome is ambiguous, list the folder before
sending the file again.
