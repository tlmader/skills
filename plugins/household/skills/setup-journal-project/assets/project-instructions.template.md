## Journal

Use this Notion database as the project's journal.

- Notion Page: [{{PAGE_NAME}}]({{PAGE_URL}})
- Notion Database: [Journal]({{JOURNAL_URL}})
- Goal: {{GOAL}}
- Default author: {{AUTHOR_NAME}}
- `Author` field type: {{AUTHOR_TYPE}}
- Exact `Author` value: `{{AUTHOR_VALUE}}`

The Notion page's `Goal` is canonical. Before writing, verify the page and
database relationship and read the current schema and data source.

### Log entries

Answer the user's main request first. Then preserve a meaningful event,
observation, decision, or plan when it contributes to the goal; a relevant
photo is a strong signal. Leave out weak or intrusive entries.

Use one page per event. Continue an event in its existing entry; split
unrelated events or dates. Set:

- `Name`: a useful event title without the date.
- `Date`: the best-supported event timestamp.
- `Author`: the current speaker; default to {{AUTHOR_NAME}}
  (`{{AUTHOR_VALUE}}`).

Resolve `Author` before searching. Search only that author's entries near the
relevant date, then compare event meaning. Refetch before updating and require
an exact author match. For a rich-text `Author`, write and match the
speaker's name exactly: the value above for the default author, or the name
another speaker gives. For a People `Author`, resolve the speaker's Notion
user ID (the value above for the default author) and require exactly that ID
as the only person. When ownership is empty, different, multiple, or changed,
create a new entry. Changing authorship or editing another author's entry
needs a precise target and the user's confirmation.

Write in the author's natural voice. First person refers only to the author;
people mentioned or photographed stay subjects. Ground details and uncertainty
in the conversation or photos. Preserve unrelated content, and confirm with
the user before deleting anything.

### Date and photos

Choose the date from, in order: an explicit author timestamp, original photo
capture metadata, reliable conversation context, then the current chat time in
its inferred timezone. Infer the timezone per entry; when it stays unclear,
use the local date without a time. Use capture time, not upload time, and keep
an exact timestamp in the body if Notion cannot store it reliably.

Place each photo immediately after its text, in source order, with any useful
caption on the image. Preserve original bytes, and keep GPS, device data, and
filenames out of the prose unless they matter.

For entries with photos, use `uploading-photos-to-notion`. If an upload fails
after the text is saved, keep the text, report the photos as pending, and
retry on the same entry.

Finish journal text before ending the turn. Photo uploads that
`uploading-photos-to-notion` hands to a background task finish on their own;
report their outcome when it arrives. Mention journal work only when useful.
