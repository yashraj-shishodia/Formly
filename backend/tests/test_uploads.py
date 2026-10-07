import io
import json
import os
import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Form, Question, UploadedFile, User
from app.services.uploads import get_upload_dir


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


def test_upload_success_and_download(client):
    # 1. Create and publish form
    form_res = client.post("/api/forms", json={"title": "Job Application"})
    assert form_res.status_code == 201
    form_id = form_res.json()["id"]

    pub_res = client.post(f"/api/forms/{form_id}/publish")
    assert pub_res.status_code == 200
    slug = pub_res.json()["slug"]

    # 2. Upload file
    file_bytes = b"%PDF-1.4 test resume content"
    files = {"file": ("my_resume.pdf", io.BytesIO(file_bytes), "application/pdf")}
    upload_res = client.post(f"/api/public/forms/{slug}/uploads", files=files)

    assert upload_res.status_code == 201
    data = upload_res.json()
    assert "file_id" in data
    assert data["original_name"] == "my_resume.pdf"
    assert data["size_bytes"] == len(file_bytes)
    file_id = data["file_id"]

    # 3. Creator can download file
    download_res = client.get(f"/api/files/{file_id}")
    assert download_res.status_code == 200
    assert download_res.content == file_bytes


def test_upload_oversize(client, monkeypatch):
    # Create and publish form
    form_res = client.post("/api/forms", json={"title": "Size Test Form"})
    form_id = form_res.json()["id"]
    pub_res = client.post(f"/api/forms/{form_id}/publish")
    slug = pub_res.json()["slug"]

    # Set MAX_UPLOAD_MB to 0.00001 (10 bytes)
    monkeypatch.setenv("MAX_UPLOAD_MB", "0.00001")

    large_content = b"A" * 200
    files = {"file": ("document.pdf", io.BytesIO(large_content), "application/pdf")}
    res = client.post(f"/api/public/forms/{slug}/uploads", files=files)
    assert res.status_code == 413
    assert "exceeds maximum allowed size" in res.json()["detail"]


def test_upload_disallowed_type(client):
    form_res = client.post("/api/forms", json={"title": "Disallowed Type Form"})
    form_id = form_res.json()["id"]
    pub_res = client.post(f"/api/forms/{form_id}/publish")
    slug = pub_res.json()["slug"]

    files = {"file": ("malicious.exe", io.BytesIO(b"executable content"), "application/x-msdownload")}
    res = client.post(f"/api/public/forms/{slug}/uploads", files=files)
    assert res.status_code == 400
    assert "not allowed" in res.json()["detail"]


def test_upload_unpublished_form(client):
    # Create draft form without publishing
    form_res = client.post("/api/forms", json={"title": "Draft Only Form"})
    form_id = form_res.json()["id"]

    # Attempt to upload to non-existent or unpublished slug
    fake_slug = "draft-only-non-published"
    files = {"file": ("report.pdf", io.BytesIO(b"report"), "application/pdf")}
    res = client.post(f"/api/public/forms/{fake_slug}/uploads", files=files)
    assert res.status_code == 404


def test_upload_path_traversal_filename(client):
    form_res = client.post("/api/forms", json={"title": "Path Traversal Test"})
    form_id = form_res.json()["id"]
    pub_res = client.post(f"/api/forms/{form_id}/publish")
    slug = pub_res.json()["slug"]

    files = {"file": ("../../../../etc/passwd.pdf", io.BytesIO(b"safe test content"), "application/pdf")}
    res = client.post(f"/api/public/forms/{slug}/uploads", files=files)
    assert res.status_code == 201
    data = res.json()
    assert data["original_name"] == "passwd.pdf"

    # Verify stored file is within upload dir
    upload_dir = get_upload_dir()
    db = SessionLocal()
    rec = db.query(UploadedFile).filter(UploadedFile.id == data["file_id"]).first()
    db.close()
    assert rec is not None
    assert not rec.stored_name.startswith("..")
    assert os.path.exists(os.path.join(upload_dir, rec.stored_name))


def test_answer_validation_file_upload(client):
    # Form 1
    form_res = client.post("/api/forms", json={"title": "Validation Form"})
    form_id = form_res.json()["id"]
    q_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "file_upload", "title": "Upload your ID", "required": True},
    )
    assert q_res.status_code == 201
    q_id = q_res.json()["id"]
    pub_res = client.post(f"/api/forms/{form_id}/publish")
    slug = pub_res.json()["slug"]

    # Form 2 (for cross-form testing)
    form2_res = client.post("/api/forms", json={"title": "Form 2"})
    pub2_res = client.post(f"/api/forms/{form2_res.json()['id']}/publish")
    slug2 = pub2_res.json()["slug"]

    # Upload file for Form 2
    f2_upload = client.post(
        f"/api/public/forms/{slug2}/uploads",
        files={"file": ("f2_doc.pdf", io.BytesIO(b"f2"), "application/pdf")},
    )
    assert f2_upload.status_code == 201
    f2_id = f2_upload.json()["file_id"]

    # 1. Missing answer for required file_upload question -> 422
    empty_sub = client.post(f"/api/public/forms/{slug}/responses", json={"answers": []})
    assert empty_sub.status_code == 422

    # 2. Non-existent file_id -> 422
    fake_sub = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {
                    "question_id": q_id,
                    "value_json": json.dumps({"file_id": 999999, "original_name": "ghost.pdf"}),
                }
            ]
        },
    )
    assert fake_sub.status_code == 422
    assert "Uploaded file not found" in str(fake_sub.json())

    # 3. File belonging to another form -> 422
    wrong_sub = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {
                    "question_id": q_id,
                    "value_json": json.dumps({"file_id": f2_id, "original_name": "f2_doc.pdf"}),
                }
            ]
        },
    )
    assert wrong_sub.status_code == 422
    assert "does not belong to this form" in str(wrong_sub.json())

    # 4. Valid file upload for Form 1 -> 201
    f1_upload = client.post(
        f"/api/public/forms/{slug}/uploads",
        files={"file": ("valid_id.pdf", io.BytesIO(b"id content"), "application/pdf")},
    )
    assert f1_upload.status_code == 201
    f1_id = f1_upload.json()["file_id"]

    valid_sub = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {
                    "question_id": q_id,
                    "value_json": json.dumps({"file_id": f1_id, "original_name": "valid_id.pdf"}),
                }
            ]
        },
    )
    assert valid_sub.status_code == 201


def test_creator_only_download(client):
    # Non-existent file -> 404
    res = client.get("/api/files/999999")
    assert res.status_code == 404


def test_cascade_cleanup_form_delete(client):
    form_res = client.post("/api/forms", json={"title": "Cascade Form"})
    form_id = form_res.json()["id"]
    pub_res = client.post(f"/api/forms/{form_id}/publish")
    slug = pub_res.json()["slug"]

    # Upload file
    upload_res = client.post(
        f"/api/public/forms/{slug}/uploads",
        files={"file": ("to_delete.pdf", io.BytesIO(b"will be deleted"), "application/pdf")},
    )
    assert upload_res.status_code == 201
    file_id = upload_res.json()["file_id"]

    db = SessionLocal()
    rec = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    stored_name = rec.stored_name
    db.close()

    disk_path = os.path.join(get_upload_dir(), stored_name)
    assert os.path.exists(disk_path)

    # Delete form
    del_res = client.delete(f"/api/forms/{form_id}")
    assert del_res.status_code == 200

    # Verify file deleted from disk
    assert not os.path.exists(disk_path)

    # Verify record deleted from DB
    db = SessionLocal()
    assert db.query(UploadedFile).filter(UploadedFile.id == file_id).first() is None
    db.close()


def test_cascade_cleanup_response_delete(client):
    form_res = client.post("/api/forms", json={"title": "Resp Delete Cascade"})
    form_id = form_res.json()["id"]
    q_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "file_upload", "title": "Attachment", "required": False},
    )
    q_id = q_res.json()["id"]
    pub_res = client.post(f"/api/forms/{form_id}/publish")
    slug = pub_res.json()["slug"]

    # Upload file
    upload_res = client.post(
        f"/api/public/forms/{slug}/uploads",
        files={"file": ("resp_file.pdf", io.BytesIO(b"resp data"), "application/pdf")},
    )
    file_id = upload_res.json()["file_id"]

    # Submit response
    sub_res = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {
                    "question_id": q_id,
                    "value_json": json.dumps({"file_id": file_id, "original_name": "resp_file.pdf"}),
                }
            ]
        },
    )
    assert sub_res.status_code == 201
    resp_id = sub_res.json()["response_id"]

    db = SessionLocal()
    rec = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    stored_name = rec.stored_name
    db.close()

    disk_path = os.path.join(get_upload_dir(), stored_name)
    assert os.path.exists(disk_path)

    # Delete response
    del_res = client.delete(f"/api/responses/{resp_id}")
    assert del_res.status_code == 200

    # Verify file deleted from disk
    assert not os.path.exists(disk_path)

    # Verify file deleted from DB
    db = SessionLocal()
    assert db.query(UploadedFile).filter(UploadedFile.id == file_id).first() is None
    db.close()
