import secrets
import string
from sqlalchemy.orm import Session
from app.models import Form


def generate_random_slug(length: int = 8) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_unique_slug(db: Session, max_attempts: int = 10) -> str:
    for _ in range(max_attempts):
        slug = generate_random_slug(8)
        existing = db.query(Form).filter(Form.slug == slug).first()
        if not existing:
            return slug
    # Fallback to longer slug if collision occurs repeatedly
    return generate_random_slug(12)
