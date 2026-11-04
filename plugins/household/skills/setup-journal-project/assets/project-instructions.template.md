## Journal

Use this Google Drive folder as the project's journal.

- Folder: [{{FOLDER_NAME}}]({{FOLDER_URL}})
- Sheet: [{{SHEET_NAME}}]({{SHEET_URL}})
- Photos: [Photos]({{PHOTOS_URL}})
- Goal: {{GOAL}}
- Default author: {{AUTHOR_NAME}}

The `Entries` tab is one row per event. `Date` is a date value and `Time` is
a time value. Columns, in order: `Date`, `Time`, `Name`, `Caption`, `Author`,
`Photos`, `Photo links`. Keep rows ordered by `Date` descending. Leave any
further column or tab as it is.

The goal above is canonical for what is worth recording.

### Log entries

Answer the user's main request first. Then preserve a meaningful event,
observation, decision, or plan when it contributes to the goal. A relevant
photo is a strong signal. Leave out a weak or intrusive entry.

Continue an event on its existing row. Add a row for an unrelated event or a
different date. Set:

- `Name`: a useful title with the date left out.
- `Date`: the best-supported event date, as a date value.
- `Time`: the event time as a time value, or blank when only a date is known.
- `Author`: the current speaker. The default is {{AUTHOR_NAME}}.
- `Caption`: the entry, in the author's natural voice.
- `Photos`: the number of photo files for the row, or `0`.

Resolve `Author` before searching. Search that author's rows near the
relevant date, then compare the event. Refetch before updating, and require
the same author. Write the speaker's name exactly: {{AUTHOR_NAME}} for the
default author, or the name another speaker gives. When authorship is empty
or different, add a new row. Editing another author's row waits for the user
to name that row.

First person refers only to the author. People mentioned or shown in photos
stay subjects. Ground details and uncertainty in the conversation or the
photos. Keep unrelated cells, and confirm with the user before deleting a
row or a file.

### Date and photos

Choose the date from, in order: an explicit author timestamp, original photo
capture metadata, reliable conversation context, then the current chat time
in its inferred timezone. Infer the timezone per entry. When the timezone
stays unclear, use the local date and leave `Time` blank. Use capture time,
and keep an exact timestamp in the caption when the clock time matters.

Write the caption from the conversation and the photos. Leave device
metadata and filenames out of the caption unless they matter to the event.

For a row with photos, save the row first, then use
`uploading-journal-photos`. That skill places the files in `Photos` and sets
`Photos` and `Photo links`. When an upload fails after the row is saved, keep
the row, report the photos as pending, and retry against the same row.

Finish the row before ending the turn. Photo uploads handed to a background
task finish on their own; report their outcome when it arrives. Mention
journal work when it is useful.
