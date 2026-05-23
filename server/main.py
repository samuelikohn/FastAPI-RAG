from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
from routes.documents import document_router
from routes.query import query_router
from routes.upload import upload_router


load_dotenv()


API_PREFIX = "/api/v1"
app = FastAPI(title="RAG API")
app.include_router(upload_router, prefix=API_PREFIX)
app.include_router(query_router, prefix=API_PREFIX)
app.include_router(document_router, prefix=API_PREFIX)


if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, reload=True)
