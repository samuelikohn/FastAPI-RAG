from fastapi import APIRouter
from controllers.query import query_handler
from models.query import QueryRequest, QueryResponse


query_router = APIRouter()


@query_router.post("/query", response_model=QueryResponse)
async def query_documents(query: QueryRequest) -> QueryResponse:
    return await query_handler(query)
