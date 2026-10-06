from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User


def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Returns the default logged-in creator user.
    Creates the default user if not already in the database.
    """
    user = db.query(User).filter(User.email == "creator@formly.io").first()
    if not user:
        user = User(
            email="creator@formly.io",
            name="Formly Creator",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
