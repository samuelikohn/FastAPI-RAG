from fastapi import APIRouter, UploadFile, status
from controllers.upload import upload_handler
from models.upload import UploadResponse


upload_router = APIRouter()


@upload_router.post(
    "/upload", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED
)
async def upload_document(file: UploadFile) -> UploadResponse:
    return await upload_handler(file)
