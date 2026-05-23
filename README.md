# FastAPI RAG

A full-stack Retrieval-Augmented Generation (RAG) application. Upload documents, store them as vector embeddings, and query them via a Gemini-powered chatbot that answers questions from your document library.

## Tech Stack

### Server
- **API**: FastAPI + Uvicorn
- **LLM & Embeddings**: Google Gemini (`gemini-flash-latest` / `gemini-embedding-001`)
- **Vector Database**: DataStax AstraDB via `langchain-astradb` and `astrapy`
- **Document Processing**: LangChain text splitters, pypdf

### Client
- **Framework**: React 19 + TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7

## Setup

### Prerequisites

- Python 3.13+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/)
- A DataStax AstraDB account with a collection created
- A Google AI API key

### Environment Variables

Copy `server/.env.sample` to `server/.env` and fill in the values:

```
GOOGLE_API_KEY=           # Google AI Studio API key
ASTRA_DB_API_ENDPOINT=    # AstraDB database API endpoint URL
ASTRA_DB_APPLICATION_TOKEN=  # AstraDB application token
ASTRA_DB_COLLECTION=      # Name of the AstraDB collection to use
```

### Run the Server

```bash
cd server
uv sync
uv run python main.py
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Run the Client

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

The client will be available at `http://localhost:5173`. The Vite dev server proxies all `/api` requests to the FastAPI server at `http://localhost:8000`, so both must be running.

### Run Tests

```bash
cd server
uv run pytest
```

---

## Client

The client is a single-page React application with three pages, accessible via the navigation bar at the top of every page.

### Upload

The Upload page (`/upload`) lets you add documents to the RAG pipeline.

- Click the dashed upload area to open a file picker. Supported formats: `.pdf`, `.txt`, `.md`.
- Once a file is selected, it is immediately submitted to the API — no separate submit step.
- While the upload is in progress, a loading spinner is shown.
- On success, the filename and chunk count are displayed with an "Upload another" button to reset the form.
- On failure, the error message from the API is shown with a "Try again" button.

### Chat

The Chat page (`/chat`) is a conversational interface for querying your uploaded documents.

- Type a question in the text box at the bottom of the screen and press **Enter** (or click **Send**) to submit it.
- Use **Shift+Enter** to insert a newline without sending.
- The answer from the LLM appears as a message in the conversation thread. Underneath each answer, the source chunks used to generate it are listed as expandable items — click a source to reveal the raw text excerpt and the filename it came from.
- A three-dot animation appears while the API is processing.

### Search

The Search page (`/search`) shows a table of all documents currently stored in the vector database.

- **Filter**: type in the search box to filter rows by filename (case-insensitive substring match).
- **Sort**: click the **Filename** or **Upload Date** column header to sort by that column. Click again to reverse the direction.
- **Delete**: click **Delete** on a row to begin deletion. A confirmation prompt appears inline — click **Confirm** to proceed or **Cancel** to dismiss.

---

## API Reference

All endpoints are prefixed with `/api/v1`.

---

### Upload Document

```
POST /api/v1/upload
```

Upload a document to be chunked, embedded, and stored in the vector database. Supported file types: `.txt`, `.md`, `.pdf`.

**Request** — `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | The document to upload |

**Response** `202 Accepted`

```json
{
  "document_id": "3f2a1b4c-...",
  "filename": "report.pdf",
  "chunk_count": 12,
  "upload_date": "2026-05-17"
}
```

**Errors**

| Status | Reason |
|--------|--------|
| `400` | Unsupported file type |
| `400` | Document is empty |

---

### Query Documents

```
POST /api/v1/query
```

Ask a question. The API retrieves the most relevant chunks from the vector database and uses Gemini to generate an answer grounded in that context.

**Request** — `application/json`

```json
{
  "question": "What are the key findings in the Q3 report?"
}
```

**Response** `200 OK`

```json
{
  "answer": "The key findings in the Q3 report are...",
  "sources": [
    {
      "content": "Revenue increased by 12% year-over-year...",
      "metadata": {
        "document_id": "3f2a1b4c-...",
        "filename": "report.pdf",
        "chunk_index": 4,
        "upload_date": "2026-05-17"
      }
    }
  ]
}
```

**Errors**

| Status | Reason |
|--------|--------|
| `422` | `question` field missing or invalid |

---

### List Documents

```
GET /api/v1/documents
```

Returns a summary of all uploaded documents, grouped by upload (each upload is one document regardless of how many chunks it was split into).

**Response** `200 OK`

```json
[
  {
    "document_id": "3f2a1b4c-...",
    "filename": "report.pdf",
    "chunk_count": 12,
    "upload_date": "2026-05-17"
  }
]
```

---

### Get Document

```
GET /api/v1/documents/{document_id}
```

Returns the full content of an uploaded document as a list of its text chunks, sorted by chunk index.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `document_id` | string | UUID returned at upload time |

**Response** `200 OK`

```json
{
  "document_id": "3f2a1b4c-...",
  "filename": "report.pdf",
  "upload_date": "2026-05-17",
  "chunks": [
    {
      "chunk_id": "a1b2c3d4-...",
      "content": "This report covers Q3 performance...",
      "metadata": {
        "document_id": "3f2a1b4c-...",
        "filename": "report.pdf",
        "chunk_index": 0,
        "upload_date": "2026-05-17"
      }
    }
  ]
}
```

**Errors**

| Status | Reason |
|--------|--------|
| `404` | Document not found |

---

### Delete Document

```
DELETE /api/v1/documents/{document_id}
```

Deletes a document and all its chunks from the vector database.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `document_id` | string | UUID returned at upload time |

**Response** `204 No Content`

**Errors**

| Status | Reason |
|--------|--------|
| `404` | Document not found |
