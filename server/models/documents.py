from typing import Any
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    upload_date: str


class DocumentChunk(BaseModel):
    chunk_id: str
    content: str
    metadata: dict[str, Any]


class DocumentDetailResponse(BaseModel):
    document_id: str
    filename: str
    chunks: list[DocumentChunk]
    upload_date: str
