import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Form, FormStatus, Question, QuestionType, Response, ResponseStatus
from app.seed import seed_database


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


def test_seed_idempotency_and_completeness():
    db = SessionLocal()
    try:
        # Run seed
        seed_database(db=db)
        initial_forms = db.query(Form).count()
        initial_responses = db.query(Response).count()
        initial_questions = db.query(Question).count()

        # Check published seeded forms exist
        published_forms = db.query(Form).filter(Form.status == FormStatus.PUBLISHED.value).all()
        published_slugs = {f.slug for f in published_forms}
        assert {"cust-feedback", "tech-conf-2026", "product-nps"}.issubset(published_slugs)

        draft_form = db.query(Form).filter(Form.title.like("%Draft%")).first()
        assert draft_form is not None
        assert draft_form.slug is None

        # Verify all 8 question types exist across forms
        distinct_types = {q.type for q in db.query(Question).all()}
        all_expected_types = {qt.value for qt in QuestionType}
        assert distinct_types == all_expected_types, f"Missing types: {all_expected_types - distinct_types}"

        # Run seed a SECOND time to verify idempotency
        seed_database(db=db)
        assert db.query(Form).count() == initial_forms, "Seed must not duplicate forms"
        assert db.query(Response).count() == initial_responses, "Seed must not duplicate responses"
        assert db.query(Question).count() == initial_questions, "Seed must not duplicate questions"

    finally:
        db.close()


def test_completion_rate_and_duration_metrics(client):
    db = SessionLocal()
    try:
        form = db.query(Form).filter(Form.slug == "cust-feedback").first()
        assert form is not None
        form_id = form.id
    finally:
        db.close()

    res = client.get(f"/api/forms/{form_id}/summary")
    assert res.status_code == 200
    summary = res.json()

    assert summary["total_responses"] > 0
    assert summary["completed_responses"] > 0
    assert summary["partial_responses"] > 0
    assert (
        summary["completed_responses"] + summary["partial_responses"]
        == summary["total_responses"]
    )
    expected_rate = round(
        (summary["completed_responses"] / summary["total_responses"]) * 100.0, 1
    )
    assert summary["completion_rate"] == expected_rate
    assert summary["average_duration_seconds"] is not None
    assert summary["average_duration_seconds"] > 0


def test_theme_and_welcome_screen_settings(client):
    db = SessionLocal()
    try:
        form = db.query(Form).filter(Form.slug == "tech-conf-2026").first()
        assert form is not None
        form_id = form.id
        slug = form.slug
    finally:
        db.close()

    # 1. Creator detail view contains typed theme and screens
    detail_res = client.get(f"/api/forms/{form_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["theme"] is not None
    assert detail["theme"]["font"] == "Inter"
    assert detail["theme"]["button_color"] == "#2F7D69"
    assert detail["welcome_screen"]["enabled"] is True
    assert "Tech Forward 2026" in detail["welcome_screen"]["title"]
    assert detail["ending_screen"]["title"] == "You're on the attendee list!"

    # 2. Public view contains the same typed theme and screen configs
    pub_res = client.get(f"/api/public/forms/{slug}")
    assert pub_res.status_code == 200
    pub_form = pub_res.json()
    assert pub_form["theme"]["button_color"] == "#2F7D69"
    assert pub_form["welcome_screen"]["button_text"] == "Register now"
