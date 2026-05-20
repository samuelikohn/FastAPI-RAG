from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from langchain_core.documents import Document
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda
from main import app


client = TestClient(app)
_SAMPLE_DOC = Document(
    page_content="The capital of France is Paris.",
    metadata={"document_id": "doc-abc", "filename": "geography.txt", "chunk_index": 0},
)


def _mock_llm(response: str = "Test answer") -> RunnableLambda:
    async def _invoke(messages):
        return AIMessage(content=response)

    return RunnableLambda(_invoke)


def _mock_store(results: list | None = None) -> MagicMock:
    store = MagicMock()
    store.asimilarity_search = AsyncMock(
        return_value=results if results is not None else []
    )
    return store


def test_query_returns_answer():
    with patch(
        "controllers.query.get_vector_store", return_value=_mock_store([_SAMPLE_DOC])
    ):
        with patch("controllers.query.get_llm", return_value=_mock_llm("Test answer")):
            resp = client.post(
                "/api/v1/query", json={"question": "What is the capital of France?"}
            )
    assert resp.status_code == 200
    assert resp.json()["answer"] == "Test answer"


def test_query_includes_sources():
    with patch(
        "controllers.query.get_vector_store", return_value=_mock_store([_SAMPLE_DOC])
    ):
        with patch("controllers.query.get_llm", return_value=_mock_llm()):
            resp = client.post("/api/v1/query", json={"question": "Capital?"})
    sources = resp.json()["sources"]
    assert len(sources) == 1
    assert sources[0]["content"] == _SAMPLE_DOC.page_content
    assert sources[0]["metadata"]["filename"] == "geography.txt"


def test_query_no_results():
    with patch("controllers.query.get_vector_store", return_value=_mock_store([])):
        with patch(
            "controllers.query.get_llm", return_value=_mock_llm("No information found.")
        ):
            resp = client.post("/api/v1/query", json={"question": "Unknown topic?"})
    assert resp.status_code == 200
    assert resp.json()["sources"] == []


def test_query_missing_question():
    resp = client.post("/api/v1/query", json={})
    assert resp.status_code == 422
