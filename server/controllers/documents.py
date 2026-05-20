import asyncio
from datetime import datetime
from fastapi import HTTPException
from models.documents import DocumentChunk, DocumentDetailResponse, DocumentResponse
from services import get_collection


async def list_documents_handler() -> list[DocumentResponse]:
    collection = get_collection()

    def _list() -> dict[str, dict]:
        docs_map: dict[str, dict] = {}
        for doc in collection.find(filter={}, projection={"metadata": True}):
            metadata = doc.get("metadata", {})
            doc_id = metadata.get("document_id")
            if not doc_id:
                continue
            if doc_id not in docs_map:
                docs_map[doc_id] = {
                    "filename": metadata.get("filename", "unknown"),
                    "chunk_count": 0,
                    "upload_date": metadata.get(
                        "upload_date", datetime.now().isoformat().split("T")[0]
                    ),
                }
            docs_map[doc_id]["chunk_count"] += 1
        return docs_map

    docs_map = await asyncio.to_thread(_list)

    return [
        DocumentResponse(
            document_id=doc_id,
            filename=info["filename"],
            chunk_count=info["chunk_count"],
            upload_date=info["upload_date"],
        )
        for doc_id, info in docs_map.items()
    ]


async def get_document_handler(document_id: str) -> DocumentDetailResponse:
    collection = get_collection()

    def _get() -> list[dict]:
        return collection.find(filter={"metadata.document_id": document_id}).to_list()

    docs = await asyncio.to_thread(_get)

    if not docs:
        raise HTTPException(status_code=404, detail="Document not found")

    filename = docs[0].get("metadata", {}).get("filename", "unknown")
    upload_date = (
        docs[0]
        .get("metadata", {})
        .get("upload_date", datetime.now().isoformat().split("T")[0])
    )
    chunks = sorted(
        [
            DocumentChunk(
                chunk_id=str(doc["_id"]),
                content=doc.get("content", ""),
                metadata=doc.get("metadata", {}),
            )
            for doc in docs
        ],
        key=lambda c: c.metadata.get("chunk_index", 0),
    )

    return DocumentDetailResponse(
        document_id=document_id,
        filename=filename,
        chunks=chunks,
        upload_date=upload_date,
    )


async def delete_document_handler(document_id: str) -> None:
    collection = get_collection()

    result = await asyncio.to_thread(
        collection.delete_many, filter={"metadata.document_id": document_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
