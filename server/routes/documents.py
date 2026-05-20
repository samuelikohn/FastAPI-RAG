from fastapi import APIRouter, status
from controllers.documents import (
    delete_document_handler,
    get_document_handler,
    list_documents_handler,
)
from models.documents import DocumentDetailResponse, DocumentResponse


document_router = APIRouter()


@document_router.get("/documents", response_model=list[DocumentResponse])
async def list_documents() -> list[DocumentResponse]:
    return await list_documents_handler()


@document_router.get("/documents/{document_id}", response_model=DocumentDetailResponse)
async def get_document(document_id: str) -> DocumentDetailResponse:
    return await get_document_handler(document_id)


@document_router.delete(
    "/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_document(document_id: str) -> None:
    await delete_document_handler(document_id)
