import os
import uuid
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models import UploadedFile


def get_upload_dir() -> str:
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


def get_max_upload_bytes() -> int:
    try:
        mb = float(os.getenv("MAX_UPLOAD_MB", "10"))
    except (ValueError, TypeError):
        mb = 10.0
    return int(mb * 1024 * 1024)


def get_allowed_extensions() -> List[str]:
    exts_str = os.getenv(
        "ALLOWED_UPLOAD_EXTENSIONS",
        ".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip",
    )
    return [ext.strip().lower() for ext in exts_str.split(",") if ext.strip()]


def delete_file_from_disk(stored_name: str) -> bool:
    try:
        path = os.path.join(get_upload_dir(), stored_name)
        if os.path.exists(path):
            os.remove(path)
            return True
    except Exception:
        pass
    return False


async def process_and_save_upload(
    file: UploadFile,
    form_id: int,
    db: Session,
) -> UploadedFile:
    raw_filename = file.filename or "upload"
    # Prevent path traversal attacks by taking only the basename
    safe_original_name = os.path.basename(raw_filename).strip()
    if not safe_original_name:
        safe_original_name = "uploaded_file"

    _, ext = os.path.splitext(safe_original_name)
    ext = ext.lower()

    allowed_exts = get_allowed_extensions()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not allowed. Allowed extensions: {', '.join(allowed_exts)}",
        )

    # Read content to check size
    content = await file.read()
    size_bytes = len(content)

    max_bytes = get_max_upload_bytes()
    if size_bytes > max_bytes:
        max_mb = max_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({size_bytes / (1024 * 1024):.2f}MB) exceeds maximum allowed size of {max_mb:.0f}MB.",
        )

    if size_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload an empty file.",
        )

    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(get_upload_dir(), stored_name)

    with open(dest_path, "wb") as f:
        f.write(content)

    uploaded_record = UploadedFile(
        form_id=form_id,
        original_name=safe_original_name,
        stored_name=stored_name,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
    )
    db.add(uploaded_record)
    db.commit()
    db.refresh(uploaded_record)

    return uploaded_record
