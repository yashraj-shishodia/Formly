import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Form, UploadedFile, User
from app.services.uploads import get_upload_dir

router = APIRouter(prefix="/api/files", tags=["Files"])


@router.get("/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_record = (
        db.query(UploadedFile)
        .join(Form, UploadedFile.form_id == Form.id)
        .filter(UploadedFile.id == file_id, Form.user_id == current_user.id)
        .first()
    )
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with id {file_id} not found",
        )

    file_path = os.path.join(get_upload_dir(), file_record.stored_name)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File content not found on server disk",
        )

    return FileResponse(
        path=file_path,
        filename=file_record.original_name,
        media_type=file_record.content_type,
    )
