import json
import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Form, Question, QuestionLogicRule


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


def test_logic_jump_operators_and_backward_rejection(client):
    # Create form with 4 questions
    form_res = client.post("/api/forms", json={"title": "Logic Test Form"})
    assert form_res.status_code == 201
    form_id = form_res.json()["id"]

    # Q0: multiple_choice (pos 0)
    q0_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "type": "multiple_choice",
            "title": "Role",
            "options": [{"label": "Student"}, {"label": "Teacher"}, {"label": "Other"}],
        },
    )
    q0_id = q0_res.json()["id"]

    # Q1: number (pos 1)
    q1_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "number", "title": "Years of experience", "required": True},
    )
    q1_id = q1_res.json()["id"]

    # Q2: rating (pos 2)
    q2_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "rating", "title": "Satisfaction", "required": True},
    )
    q2_id = q2_res.json()["id"]

    # Q3: yes_no (pos 3)
    q3_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "yes_no", "title": "Agree to follow up?", "required": True},
    )
    q3_id = q3_res.json()["id"]

    # Backward jump test: Q2 cannot jump to Q1 or Q0 (backward) or Q2 (self)
    bad_res1 = client.post(
        f"/api/questions/{q2_id}/logic-rules",
        json={"operator": "greater_than", "value": "3", "target_question_id": q1_id},
    )
    assert bad_res1.status_code == 422
    assert "jump forward" in bad_res1.json()["detail"]

    bad_res2 = client.post(
        f"/api/questions/{q2_id}/logic-rules",
        json={"operator": "equals", "value": "5", "target_question_id": q2_id},
    )
    assert bad_res2.status_code == 422

    # Unsupported type operator test: multiple_choice cannot use greater_than
    bad_res3 = client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "greater_than", "value": "Student", "target_question_id": q2_id},
    )
    assert bad_res3.status_code == 422

    # Operators on choices: equals & not_equals
    rule_choice_eq = client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "equals", "value": "Student", "target_question_id": q3_id, "position": 0},
    )
    assert rule_choice_eq.status_code == 201
    assert rule_choice_eq.json()["operator"] == "equals"

    rule_choice_neq = client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "not_equals", "value": "Teacher", "target_question_id": None, "position": 1},
    )
    assert rule_choice_neq.status_code == 201
    assert rule_choice_neq.json()["target_question_id"] is None

    # Operators on number: greater_than, less_than, equals
    r_gt = client.post(
        f"/api/questions/{q1_id}/logic-rules",
        json={"operator": "greater_than", "value": "5", "target_question_id": q3_id},
    )
    assert r_gt.status_code == 201

    r_lt = client.post(
        f"/api/questions/{q1_id}/logic-rules",
        json={"operator": "less_than", "value": "2", "target_question_id": None},
    )
    assert r_lt.status_code == 201

    r_num_eq = client.post(
        f"/api/questions/{q1_id}/logic-rules",
        json={"operator": "equals", "value": "3", "target_question_id": q3_id},
    )
    assert r_num_eq.status_code == 201

    # Operators on yes_no: equals, not_equals
    r_yn = client.post(
        f"/api/questions/{q3_id}/logic-rules",
        json={"operator": "equals", "value": "true", "target_question_id": None},
    )
    assert r_yn.status_code == 201

    # Fetch rules for Q1
    q1_rules_res = client.get(f"/api/questions/{q1_id}/logic-rules")
    assert q1_rules_res.status_code == 200
    assert len(q1_rules_res.json()) == 3


def test_first_match_order_and_skipping_required_question(client):
    # Form:
    # Q0: multiple_choice (Student / Pro / VIP)
    # Q1: text (required: true) - "What is your thesis title?"
    # Q2: text (required: true) - "Company registration"
    # Q3: text (required: true) - "Final feedback"
    form_res = client.post("/api/forms", json={"title": "Branching Form"})
    form_id = form_res.json()["id"]

    q0_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "type": "multiple_choice",
            "title": "Select Category",
            "required": True,
            "options": [{"label": "Student"}, {"label": "Pro"}, {"label": "VIP"}],
        },
    )
    q0_id = q0_res.json()["id"]

    q1_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "short_text", "title": "Thesis Title", "required": True},
    )
    q1_id = q1_res.json()["id"]

    q2_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "short_text", "title": "Company Name", "required": True},
    )
    q2_id = q2_res.json()["id"]

    q3_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "short_text", "title": "Final Feedback", "required": True},
    )
    q3_id = q3_res.json()["id"]

    # Add 2 rules to Q0:
    # Rule 0 (pos 0): if equals Student -> jump to Q1 (Thesis)
    # Rule 1 (pos 1): if equals Pro -> jump to Q2 (Company)
    # Rule 2 (pos 2): if equals VIP -> jump to Q3 (Final Feedback)
    client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "equals", "value": "Student", "target_question_id": q1_id, "position": 0},
    )
    client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "equals", "value": "Pro", "target_question_id": q2_id, "position": 1},
    )
    client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "equals", "value": "VIP", "target_question_id": q3_id, "position": 2},
    )

    # Publish form
    pub_res = client.post(f"/api/forms/{form_id}/publish")
    assert pub_res.status_code == 200
    slug = pub_res.json()["slug"]

    # Case A: User answers "VIP".
    # Logic evaluates: Q0 (VIP) -> jumps to Q3.
    # Q1 and Q2 are skipped! Even though Q1 and Q2 are required, submit should succeed!
    submit_vip = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q0_id, "value_text": "VIP"},
                {"question_id": q3_id, "value_text": "Awesome platform"},
            ]
        },
    )
    assert submit_vip.status_code == 201
    assert submit_vip.json()["status"] == "ok"

    # Case B: User answers "VIP", but does NOT answer visited required question Q3.
    # Submit must FAIL with 422 because Q3 is on the visited path.
    submit_missing_visited = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q0_id, "value_text": "VIP"},
            ]
        },
    )
    assert submit_missing_visited.status_code == 422
    assert str(q3_id) in submit_missing_visited.json()["detail"]["errors"]

    # Case C: First-match order.
    # Add an earlier rule that also matches. Rule order determines winner.
    # Put a rule with pos -1 or pos 0: if equals "VIP" -> jump to end (None)
    rule_first = client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "equals", "value": "VIP", "target_question_id": None, "position": -1},
    )
    assert rule_first.status_code == 201

    # Now VIP jumps to end, so only Q0 is visited. Q3 is not visited at all!
    submit_end = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q0_id, "value_text": "VIP"},
            ]
        },
    )
    assert submit_end.status_code == 201


def test_cascade_delete_and_cleanup_dangling_rules(client):
    form_res = client.post("/api/forms", json={"title": "Cascade Test Form"})
    form_id = form_res.json()["id"]

    q0_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "yes_no", "title": "Are you 18+?"},
    )
    q0_id = q0_res.json()["id"]

    q1_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "short_text", "title": "Guardian Name"},
    )
    q1_id = q1_res.json()["id"]

    q2_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "short_text", "title": "Your ID"},
    )
    q2_id = q2_res.json()["id"]

    # Rule on Q0 pointing to Q2
    r_res = client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "equals", "value": "true", "target_question_id": q2_id},
    )
    assert r_res.status_code == 201
    rule_id = r_res.json()["id"]

    # Delete target question Q2
    del_q2 = client.delete(f"/api/questions/{q2_id}")
    assert del_q2.status_code == 200

    # Rule pointing to Q2 should have been deleted (cleaned up)
    db = SessionLocal()
    try:
        found_rule = db.query(QuestionLogicRule).filter(QuestionLogicRule.id == rule_id).first()
        assert found_rule is None
    finally:
        db.close()

    # Add another rule on Q0
    r2_res = client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "equals", "value": "false", "target_question_id": q1_id},
    )
    assert r2_res.status_code == 201
    r2_id = r2_res.json()["id"]

    # Delete source question Q0 -> its own rules must cascade delete
    del_q0 = client.delete(f"/api/questions/{q0_id}")
    assert del_q0.status_code == 200

    db = SessionLocal()
    try:
        found_r2 = db.query(QuestionLogicRule).filter(QuestionLogicRule.id == r2_id).first()
        assert found_r2 is None
    finally:
        db.close()


def test_duplicate_form_remaps_logic_rules(client):
    form_res = client.post("/api/forms", json={"title": "Source Form"})
    form_id = form_res.json()["id"]

    q0_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "type": "multiple_choice",
            "title": "Pick one",
            "options": [{"label": "A"}, {"label": "B"}],
        },
    )
    q0_id = q0_res.json()["id"]

    q1_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "short_text", "title": "Why B?"},
    )
    q1_id = q1_res.json()["id"]

    q2_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "short_text", "title": "Conclusion"},
    )
    q2_id = q2_res.json()["id"]

    # Rule on Q0 -> Q2
    r_res = client.post(
        f"/api/questions/{q0_id}/logic-rules",
        json={"operator": "equals", "value": "A", "target_question_id": q2_id},
    )
    assert r_res.status_code == 201

    # Duplicate form
    dup_res = client.post(f"/api/forms/{form_id}/duplicate")
    assert dup_res.status_code == 201
    dup_form = dup_res.json()
    new_form_id = dup_form["id"]
    new_questions = dup_form["questions"]

    assert len(new_questions) == 3
    new_q0 = new_questions[0]
    new_q2 = new_questions[2]

    # Verify new Q0 has 1 rule and target_question_id is remapped to new_q2["id"]
    assert len(new_q0["logic_rules"]) == 1
    new_rule = new_q0["logic_rules"][0]
    assert new_rule["operator"] == "equals"
    assert new_rule["value"] == "A"
    assert new_rule["target_question_id"] == new_q2["id"]
    assert new_rule["question_id"] == new_q0["id"]
