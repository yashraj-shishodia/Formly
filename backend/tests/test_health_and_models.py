import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import (
    Answer,
    Form,
    FormStatus,
    Question,
    QuestionOption,
    QuestionType,
    Response,
    ResponseStatus,
    User,
)


@pytest.fixture(scope="module")
def client():
    # Setup test DB tables
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "Formly Backend"


def test_database_tables_exist():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    expected_tables = {
        "users",
        "forms",
        "questions",
        "question_options",
        "responses",
        "answers",
    }
    assert expected_tables.issubset(set(tables))


def test_models_and_cascade_delete():
    db = SessionLocal()
    try:
        # 1. Create User
        user = User(email="test-cascade@formly.io", name="Formly Cascade Tester")
        db.add(user)
        db.commit()
        db.refresh(user)
        assert user.id is not None

        # 2. Create Form
        form = Form(
            user_id=user.id,
            title="Product Satisfaction Survey",
            status=FormStatus.PUBLISHED.value,
            slug="prod-1234",
        )
        db.add(form)
        db.commit()
        db.refresh(form)
        assert form.id is not None

        # 3. Create Question with Options
        question = Question(
            form_id=form.id,
            type=QuestionType.MULTIPLE_CHOICE.value,
            title="How would you rate our platform?",
            required=True,
            position=0,
        )
        db.add(question)
        db.commit()
        db.refresh(question)

        option1 = QuestionOption(question_id=question.id, label="Great", position=0)
        option2 = QuestionOption(question_id=question.id, label="Good", position=1)
        db.add_all([option1, option2])
        db.commit()

        # 4. Create Response and Answer
        response = Response(form_id=form.id, status=ResponseStatus.COMPLETED.value)
        db.add(response)
        db.commit()
        db.refresh(response)

        answer = Answer(
            response_id=response.id,
            question_id=question.id,
            value_text="Great",
        )
        db.add(answer)
        db.commit()

        # Verify everything is saved
        assert db.query(QuestionOption).filter_by(question_id=question.id).count() == 2
        assert db.query(Answer).filter_by(response_id=response.id).count() == 1

        # 5. Delete Form -> verify cascade removes questions, options, responses, answers
        form_id = form.id
        q_id = question.id
        resp_id = response.id

        db.delete(form)
        db.commit()

        assert db.query(Question).filter_by(form_id=form_id).count() == 0
        assert db.query(QuestionOption).filter_by(question_id=q_id).count() == 0
        assert db.query(Response).filter_by(form_id=form_id).count() == 0
        assert db.query(Answer).filter_by(response_id=resp_id).count() == 0

        # Clean up test user
        db.delete(user)
        db.commit()

    finally:
        db.close()
