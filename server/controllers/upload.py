import io
import os
import uuid
import pypdf
from datetime import datetime
from fastapi import HTTPException, UploadFile
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from models.upload import UploadResponse
from services import get_vector_store


SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf"}


async def upload_handler(file: UploadFile) -> UploadResponse:
    filename = file.filename or "untitled"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    raw = await file.read()

    if ext == ".pdf":
        reader = pypdf.PdfReader(io.BytesIO(raw))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        text = raw.decode("utf-8")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Document is empty")

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_text(text)

    document_id = str(uuid.uuid4())
    upload_date = datetime.now().isoformat().split("T")[0]
    documents = [
        Document(
            page_content=chunk,
            metadata={
                "document_id": document_id,
                "filename": filename,
                "chunk_index": i,
                "upload_date": upload_date,
            },
        )
        for i, chunk in enumerate(chunks)
    ]

    vector_store = get_vector_store()
    await vector_store.aadd_documents(documents)

    return UploadResponse(
        document_id=document_id,
        filename=filename,
        chunk_count=len(chunks),
        upload_date=upload_date,
    )
