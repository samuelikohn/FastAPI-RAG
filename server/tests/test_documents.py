from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)
_DOC_ID = "abc-123-def-456"


def _mock_cursor(docs: list) -> MagicMock:
    cursor = MagicMock()
    cursor.__iter__ = MagicMock(side_effect=lambda: iter(docs))
    cursor.to_list = MagicMock(return_value=docs)
    return cursor


def _chunk(index: int, doc_id: str = _DOC_ID) -> dict:
    return {
        "_id": f"chunk-id-{index}",
        "content": f"Chunk content {index}",
        "metadata": {
            "document_id": doc_id,
            "filename": "report.pdf",
            "chunk_index": index,
            "upload_date": "2026-05-17",
        },
    }


def _mock_collection(docs: list | None = None, deleted_count: int = 1) -> MagicMock:
    col = MagicMock()
    col.find.return_value = _mock_cursor(docs if docs is not None else [])
    col.delete_many.return_value = MagicMock(deleted_count=deleted_count)
    return col


def test_list_documents_empty():
    with patch(
        "controllers.documents.get_collection", return_value=_mock_collection([])
    ):
        resp = client.get("/api/v1/documents")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_documents_groups_chunks():
    chunks = [_chunk(0), _chunk(1), _chunk(2)]
    with patch(
        "controllers.documents.get_collection", return_value=_mock_collection(chunks)
    ):
        resp = client.get("/api/v1/documents")
    assert resp.status_code == 200
    docs = resp.json()
    assert len(docs) == 1
    assert docs[0]["document_id"] == _DOC_ID
    assert docs[0]["chunk_count"] == 3
    assert docs[0]["filename"] == "report.pdf"
    assert docs[0]["upload_date"] == "2026-05-17"


def test_get_document_success():
    chunks = [_chunk(1), _chunk(0)]  # intentionally reversed to test sorting
    with patch(
        "controllers.documents.get_collection", return_value=_mock_collection(chunks)
    ):
        resp = client.get(f"/api/v1/documents/{_DOC_ID}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["document_id"] == _DOC_ID
    assert body["upload_date"] == "2026-05-17"
    assert len(body["chunks"]) == 2
    assert body["chunks"][0]["metadata"]["chunk_index"] == 0
    assert body["chunks"][1]["metadata"]["chunk_index"] == 1


def test_get_document_not_found():
    with patch(
        "controllers.documents.get_collection", return_value=_mock_collection([])
    ):
        resp = client.get("/api/v1/documents/nonexistent-id")
    assert resp.status_code == 404


def test_delete_document_success():
    with patch(
        "controllers.documents.get_collection",
        return_value=_mock_collection(deleted_count=1),
    ):
        resp = client.delete(f"/api/v1/documents/{_DOC_ID}")
    assert resp.status_code == 204
    assert resp.content == b""


def test_delete_document_not_found():
    with patch(
        "controllers.documents.get_collection",
        return_value=_mock_collection(deleted_count=0),
    ):
        resp = client.delete("/api/v1/documents/nonexistent-id")
    assert resp.status_code == 404
