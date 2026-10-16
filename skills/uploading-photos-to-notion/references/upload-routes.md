# Upload routes

Discover the session's Notion tools once and use the first route available.
Read the chosen tool's current contract before the first call; keep the same
authorized destination whichever route you take.

## Notion connector with `create_file_upload`

1. Create an upload for the original filename and capture the returned upload
   URL, headers, ID, and expiry without printing credentials.
2. Send exactly one multipart POST to that URL with the unchanged original in
   the `file` field and every returned header. Use an installed HTTP client or
   the language's standard library, with a finite timeout.
3. Require `status: "uploaded"` and a returned `content_length` equal to the
   original's byte size. Keep the returned `markdown_source` and
   `suggested_markdown` for placement. An upload URL alone is not a completed
   upload.

## Composio Notion toolkit

Discover the page, block, file-upload, and append tools first, keep the
returned session ID, and confirm an active Notion connection.

1. Call `NOTION_CREATE_FILE_UPLOAD` with `mode: "single_part"` (files up to
   20 MB; larger files need a multi-part route), the original
   filename, and the MIME type. Capture the upload ID and expiry.
2. Read the local file and base64-encode it inside the tool orchestration.
3. Call `NOTION_SEND_FILE_UPLOAD` with the upload ID, filename, MIME type, and
   `file_content_base64`.
4. Continue only after Notion reports `status: "uploaded"`. Retrieve the upload
   status when the send result is ambiguous; recreate an expired upload.

Pass base64 straight from the encoding step into the send call. An available
`s3key` may be tried once; a storage 404 means it cannot supply the bytes, so
switch to the local original with `file_content_base64`.

## Official Notion API

With an integration token the user placed in the environment (for example
`NOTION_TOKEN`), follow Notion's
[file upload guide](https://developers.notion.com/docs/working-with-files-and-media):
`POST /v1/file_uploads`, then `POST /v1/file_uploads/{id}/send` with the file
as multipart form data, and require `status: "uploaded"`. For files over 20
MB, create the upload with `mode: "multi_part"` and `number_of_parts`, send
each part (10 MB recommended) with its
`part_number`, then `POST /v1/file_uploads/{id}/complete`.

## Placing the uploads

### Notion Markdown interface

Place each image immediately after its text using the `suggested_markdown` or
`markdown_source` the upload returned. Without them, read the interface's
Markdown specification; its documented form at the time of writing is:

```html
<image src="file-upload://<upload-id>">Caption</image>
```

The element's text becomes the caption; leave it empty when there is none.

### Block API

- Set `parent_block_id` to the page ID and `after` to the relevant text block's
  ID.
- Append related photos together, in source order, in one call so adjacency
  holds.
- Use a native file-upload image block, with `caption` omitted when there is
  no useful caption:

```json
{
  "type": "image",
  "image": {
    "type": "file_upload",
    "file_upload": { "id": "<uploaded-file-id>" },
    "caption": [
      { "type": "text", "text": { "content": "<useful caption>" } }
    ]
  }
}
```
