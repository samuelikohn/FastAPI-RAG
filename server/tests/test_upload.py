from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def _mock_store() -> MagicMock:
    store = MagicMock()
    store.aadd_documents = AsyncMock(return_value=["id1"])
    return store


def test_upload_txt_success():
    with patch("controllers.upload.get_vector_store", return_value=_mock_store()):
        resp = client.post(
            "/api/v1/upload",
            files={
                "file": (
                    "doc.txt",
                    b"Hello world content for testing purposes.",
                    "text/plain",
                )
            },
        )
    assert resp.status_code == 202
    body = resp.json()
    assert body["filename"] == "doc.txt"
    assert len(body["document_id"]) == 36  # UUID
    assert body["chunk_count"] >= 1
    assert "upload_date" in body


def test_upload_md_success():
    with patch("controllers.upload.get_vector_store", return_value=_mock_store()):
        resp = client.post(
            "/api/v1/upload",
            files={
                "file": (
                    "notes.md",
                    b"# Title\n\nSome markdown content here.",
                    "text/markdown",
                )
            },
        )
    assert resp.status_code == 202
    assert resp.json()["filename"] == "notes.md"


def test_upload_pdf_success():
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Extracted PDF text content for testing."
    mock_reader = MagicMock()
    mock_reader.pages = [mock_page]

    with patch("controllers.upload.get_vector_store", return_value=_mock_store()):
        with patch("controllers.upload.pypdf.PdfReader", return_value=mock_reader):
            resp = client.post(
                "/api/v1/upload",
                files={"file": ("report.pdf", b"%PDF-1.4 fake", "application/pdf")},
            )
    assert resp.status_code == 202
    assert resp.json()["filename"] == "report.pdf"


def test_upload_unsupported_type():
    resp = client.post(
        "/api/v1/upload",
        files={"file": ("program.exe", b"binary data", "application/octet-stream")},
    )
    assert resp.status_code == 400


def test_upload_empty_file():
    resp = client.post(
        "/api/v1/upload",
        files={"file": ("empty.txt", b"   \n\t  ", "text/plain")},
    )
    assert resp.status_code == 400
