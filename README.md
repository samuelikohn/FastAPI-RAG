# FastAPI RAG

A REST API for a Retrieval-Augmented Generation (RAG) pipeline. Upload documents, store them as vector embeddings, and query them via a Gemini-powered chatbot that answers questions from your document library.

## Tech Stack

- **API**: FastAPI + Uvicorn
- **LLM & Embeddings**: Google Gemini (`gemini-flash-latest` / `text-embedding-004`)
- **Vector Database**: DataStax AstraDB via `langchain-astradb` and `astrapy`
- **Document Processing**: LangChain text splitters, pypdf

## Setup

### Prerequisites

- Python 3.13+
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

### Install & Run

```bash
cd server
uv sync
uv run python main.py
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Run Tests

```bash
cd server
uv run pytest tests/ -v
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

---

### Health Check

```
GET /
```

**Response**
```json
{ "message": "Hello World" }
```

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
