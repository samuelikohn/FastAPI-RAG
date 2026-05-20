from typing import Any
from pydantic import BaseModel


class QueryRequest(BaseModel):
    question: str


class Source(BaseModel):
    content: str
    metadata: dict[str, Any]


class QueryResponse(BaseModel):
    answer: str
    sources: list[Source]
