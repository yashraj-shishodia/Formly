import json
import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Form, Question, User


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


def test_forms_crud_and_duplicate_and_publish(client):
    # 1. Create a form
    create_res = client.post("/api/forms", json={"title": "Customer Survey"})
    assert create_res.status_code == 201
    form_data = create_res.json()
    form_id = form_data["id"]
    assert form_data["title"] == "Customer Survey"
    assert form_data["status"] == "draft"

    # 2. Add questions to the form
    q1_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "short_text", "title": "Your Full Name", "required": True},
    )
    assert q1_res.status_code == 201
    q1_id = q1_res.json()["id"]

    q2_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "type": "multiple_choice",
            "title": "Select your plan",
            "required": True,
            "options": [{"label": "Free"}, {"label": "Pro"}, {"label": "Enterprise"}],
        },
    )
    assert q2_res.status_code == 201
    q2_id = q2_res.json()["id"]

    # 3. Patch form
    patch_res = client.patch(
        f"/api/forms/{form_id}", json={"title": "Updated Customer Survey"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Updated Customer Survey"

    # 4. Reorder questions
    order_res = client.put(
        f"/api/forms/{form_id}/questions/order",
        json={"question_ids": [q2_id, q1_id]},
    )
    assert order_res.status_code == 200
    ordered = order_res.json()
    assert ordered[0]["id"] == q2_id
    assert ordered[0]["position"] == 0
    assert ordered[1]["id"] == q1_id
    assert ordered[1]["position"] == 1

    # 5. Duplicate form
    dup_res = client.post(f"/api/forms/{form_id}/duplicate")
    assert dup_res.status_code == 201
    dup_data = dup_res.json()
    assert dup_data["title"] == "Updated Customer Survey (Copy)"
    assert dup_data["status"] == "draft"
    assert len(dup_data["questions"]) == 2

    # 6. Publish original form
    pub_res = client.post(f"/api/forms/{form_id}/publish")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["status"] == "published"
    assert pub_data["slug"] is not None
    assert len(pub_data["slug"]) >= 8

    # 7. Unpublish
    unpub_res = client.post(f"/api/forms/{form_id}/unpublish")
    assert unpub_res.status_code == 200
    assert unpub_res.json()["status"] == "draft"

    # Re-publish for public respondent testing
    pub_again = client.post(f"/api/forms/{form_id}/publish")
    assert pub_again.status_code == 200


def test_public_flow_and_validation(client):
    create_res = client.post("/api/forms", json={"title": "Validation Test Form"})
    form_id = create_res.json()["id"]

    # Add Email question (required)
    q_email = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "email", "title": "Work Email", "required": True},
    ).json()

    # Add Rating question (1-5, required)
    q_rating = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "type": "rating",
            "title": "Rate us",
            "required": True,
            "settings_json": json.dumps({"max_rating": 5}),
        },
    ).json()

    # Add Number question (min 18, max 99, required)
    q_number = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "type": "number",
            "title": "Your Age",
            "required": True,
            "settings_json": json.dumps({"min_value": 18, "max_value": 99}),
        },
    ).json()

    # Publish form
    pub_data = client.post(f"/api/forms/{form_id}/publish").json()
    slug = pub_data["slug"]

    # GET public form
    get_pub = client.get(f"/api/public/forms/{slug}")
    assert get_pub.status_code == 200
    pub_form = get_pub.json()
    assert pub_form["slug"] == slug
    assert len(pub_form["questions"]) == 3

    # Test 1: Submit empty payload -> 422 with validation errors
    submit_fail1 = client.post(
        f"/api/public/forms/{slug}/responses",
        json={"answers": []},
    )
    assert submit_fail1.status_code == 422
    errors1 = submit_fail1.json()["detail"]["errors"]
    assert str(q_email["id"]) in errors1
    assert str(q_rating["id"]) in errors1
    assert str(q_number["id"]) in errors1

    # Test 2: Submit invalid email & out-of-range number
    submit_fail2 = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_email["id"], "value_text": "not-an-email"},
                {"question_id": q_rating["id"], "value_number": 9},  # exceeds 5
                {"question_id": q_number["id"], "value_number": 12},  # below 18
            ]
        },
    )
    assert submit_fail2.status_code == 422
    errors2 = submit_fail2.json()["detail"]["errors"]
    assert "valid email" in errors2[str(q_email["id"])].lower()
    assert "between 1 and 5" in errors2[str(q_rating["id"])].lower()
    assert "at least 18" in errors2[str(q_number["id"])].lower()

    # Test 3: Submit valid responses
    submit_ok = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_email["id"], "value_text": "alex@example.com"},
                {"question_id": q_rating["id"], "value_number": 5},
                {"question_id": q_number["id"], "value_number": 25},
            ]
        },
    )
    assert submit_ok.status_code == 201
    resp_data = submit_ok.json()
    assert resp_data["status"] == "ok"
    assert resp_data["response_id"] is not None

    # Test 4: Verify Responses API lists this submission
    res_list = client.get(f"/api/forms/{form_id}/responses")
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] == 1
    item = list_data["items"][0]
    assert item["answers"][str(q_email["id"])] == "alex@example.com"
    assert item["answers"][str(q_rating["id"])] == 5
    assert item["answers"][str(q_number["id"])] == 25

    # Test 5: Verify Dynamic Summary aggregates correctly
    summary_res = client.get(f"/api/forms/{form_id}/summary")
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert summary_data["total_responses"] == 1
    assert summary_data["completion_rate"] == 100.0

    # Test 6: Verify CSV export
    csv_res = client.get(f"/api/forms/{form_id}/responses/export.csv")
    assert csv_res.status_code == 200
    assert "alex@example.com" in csv_res.text


def test_all_eight_question_types_flow(client):
    # Create form testing all 8 question types end-to-end
    form_res = client.post("/api/forms", json={"title": "All 8 Types Form"})
    form_id = form_res.json()["id"]

    types_config = [
        {"type": "short_text", "title": "Short Text Q", "required": True},
        {"type": "long_text", "title": "Long Text Q", "required": False},
        {
            "type": "multiple_choice",
            "title": "Multiple Choice Q",
            "required": True,
            "options": [{"label": "Red"}, {"label": "Blue"}],
        },
        {
            "type": "dropdown",
            "title": "Dropdown Q",
            "required": True,
            "options": [{"label": "Engineering"}, {"label": "Design"}],
        },
        {"type": "email", "title": "Email Q", "required": True},
        {
            "type": "number",
            "title": "Number Q",
            "required": True,
            "settings_json": json.dumps({"min_value": 0, "max_value": 100}),
        },
        {"type": "yes_no", "title": "Yes/No Q", "required": True},
        {
            "type": "rating",
            "title": "Rating Q",
            "required": True,
            "settings_json": json.dumps({"max_rating": 5}),
        },
    ]

    created_questions = []
    for cfg in types_config:
        q_res = client.post(f"/api/forms/{form_id}/questions", json=cfg)
        assert q_res.status_code == 201
        created_questions.append(q_res.json())

    assert len(created_questions) == 8

    # Publish
    pub = client.post(f"/api/forms/{form_id}/publish").json()
    slug = pub["slug"]

    # Submit answers for all 8 questions
    answers = [
        {"question_id": created_questions[0]["id"], "value_text": "John Doe"},
        {"question_id": created_questions[1]["id"], "value_text": "Detailed feedback here."},
        {"question_id": created_questions[2]["id"], "value_text": "Blue"},
        {"question_id": created_questions[3]["id"], "value_text": "Design"},
        {"question_id": created_questions[4]["id"], "value_text": "john@design.com"},
        {"question_id": created_questions[5]["id"], "value_number": 42},
        {"question_id": created_questions[6]["id"], "value_text": "yes"},
        {"question_id": created_questions[7]["id"], "value_number": 4},
    ]

    sub_res = client.post(f"/api/public/forms/{slug}/responses", json={"answers": answers})
    assert sub_res.status_code == 201
    resp_id = sub_res.json()["response_id"]

    # Verify single response detail
    single_res = client.get(f"/api/responses/{resp_id}")
    assert single_res.status_code == 200
    assert len(single_res.json()["answers"]) == 8

    # Verify summary calculation on all 8 types
    summary_res = client.get(f"/api/forms/{form_id}/summary")
    assert summary_res.status_code == 200
    sum_data = summary_res.json()
    assert sum_data["total_responses"] == 1
    assert len(sum_data["questions"]) == 8

    # Verify choice stats
    mc_stat = next(q for q in sum_data["questions"] if q["type"] == "multiple_choice")
    blue_opt = next(o for o in mc_stat["option_stats"] if o["label"] == "Blue")
    assert blue_opt["count"] == 1
    assert blue_opt["percentage"] == 100.0

    # Verify yes/no stats
    yn_stat = next(q for q in sum_data["questions"] if q["type"] == "yes_no")
    assert yn_stat["yes_count"] == 1
    assert yn_stat["no_count"] == 0

    # Delete response
    del_resp = client.delete(f"/api/responses/{resp_id}")
    assert del_resp.status_code == 200


def test_change_question_type_persists(client):
    # 1. Create form
    f_res = client.post("/api/forms", json={"title": "Type Change Test"})
    assert f_res.status_code == 201
    form_id = f_res.json()["id"]

    # 2. Add short_text question
    q_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": "short_text", "title": "Change Me", "required": False},
    )
    assert q_res.status_code == 201
    q_data = q_res.json()
    q_id = q_data["id"]
    assert q_data["type"] == "short_text"

    # 3. PATCH type short_text -> rating
    patch_res = client.patch(
        f"/api/questions/{q_id}",
        json={"type": "rating"},
    )
    assert patch_res.status_code == 200
    patched = patch_res.json()
    assert patched["type"] == "rating"
    assert patched["settings_json"] is not None
    settings = json.loads(patched["settings_json"])
    assert "max_rating" in settings
    assert settings["max_rating"] == 5

    # 4. Fresh GET on form and verify persistence
    get_res = client.get(f"/api/forms/{form_id}")
    assert get_res.status_code == 200
    fresh_questions = get_res.json()["questions"]
    target_q = next(q for q in fresh_questions if q["id"] == q_id)
    assert target_q["type"] == "rating"
    assert target_q["settings_json"] is not None
    fresh_settings = json.loads(target_q["settings_json"])
    assert fresh_settings.get("max_rating") == 5


def test_partial_response_tracking(client):
    # 1. Setup Form A with Q1 (required) and Q2 (optional rating)
    res_a = client.post("/api/forms", json={"title": "Form A Partial Test"})
    assert res_a.status_code == 201
    form_a_id = res_a.json()["id"]

    q1_res = client.post(
        f"/api/forms/{form_a_id}/questions",
        json={"type": "short_text", "title": "Required Name", "required": True},
    )
    assert q1_res.status_code == 201
    q1_id = q1_res.json()["id"]

    q2_res = client.post(
        f"/api/forms/{form_a_id}/questions",
        json={"type": "rating", "title": "Optional Rating", "required": False},
    )
    assert q2_res.status_code == 201
    q2_id = q2_res.json()["id"]

    pub_a = client.post(f"/api/forms/{form_a_id}/publish")
    assert pub_a.status_code == 200
    slug_a = pub_a.json()["slug"]

    # Setup Form B for foreign response testing
    res_b = client.post("/api/forms", json={"title": "Form B Foreign Test"})
    assert res_b.status_code == 201
    form_b_id = res_b.json()["id"]

    q3_res = client.post(
        f"/api/forms/{form_b_id}/questions",
        json={"type": "short_text", "title": "Form B Q", "required": True},
    )
    assert q3_res.status_code == 201
    q3_id = q3_res.json()["id"]

    pub_b = client.post(f"/api/forms/{form_b_id}/publish")
    assert pub_b.status_code == 200
    slug_b = pub_b.json()["slug"]

    # 2. Create partial response (required is NOT enforced on partial)
    # Even though Q1 is required, we submit only Q2:
    prog_res1 = client.post(
        f"/api/public/forms/{slug_a}/responses/progress",
        json={"answers": [{"question_id": q2_id, "value_number": 4}]},
    )
    assert prog_res1.status_code == 200
    resp_id = prog_res1.json()["response_id"]

    # Type validation still applies to non-empty answers (e.g. rating > 5 fails)
    invalid_prog = client.post(
        f"/api/public/forms/{slug_a}/responses/progress",
        json={"response_id": resp_id, "answers": [{"question_id": q2_id, "value_number": 99}]},
    )
    assert invalid_prog.status_code == 422

    # Check that response in DB has status "partial"
    get_resp = client.get(f"/api/responses/{resp_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["status"] == "partial"
    assert get_resp.json()["submitted_at"] is None

    # 3. Update partial response
    prog_res2 = client.post(
        f"/api/public/forms/{slug_a}/responses/progress",
        json={
            "response_id": resp_id,
            "answers": [{"question_id": q1_id, "value_text": "Alice In Progress"}],
        },
    )
    assert prog_res2.status_code == 200
    assert prog_res2.json()["response_id"] == resp_id

    # 4. Reject foreign response_id (belongs to Form A, attempted on Form B)
    foreign_prog = client.post(
        f"/api/public/forms/{slug_b}/responses/progress",
        json={"response_id": resp_id, "answers": [{"question_id": q3_id, "value_text": "Test"}]},
    )
    assert foreign_prog.status_code == 404

    foreign_submit = client.post(
        f"/api/public/forms/{slug_b}/responses",
        json={"response_id": resp_id, "answers": [{"question_id": q3_id, "value_text": "Test"}]},
    )
    assert foreign_submit.status_code == 404

    # 5. Promote partial response to completed (no duplicate row)
    submit_res = client.post(
        f"/api/public/forms/{slug_a}/responses",
        json={
            "response_id": resp_id,
            "answers": [
                {"question_id": q1_id, "value_text": "Alice Final"},
                {"question_id": q2_id, "value_number": 5},
            ],
        },
    )
    assert submit_res.status_code == 201
    assert submit_res.json()["response_id"] == resp_id

    # Verify response is now completed
    get_promoted = client.get(f"/api/responses/{resp_id}")
    assert get_promoted.status_code == 200
    assert get_promoted.json()["status"] == "completed"
    assert get_promoted.json()["submitted_at"] is not None

    # Verify no duplicate row: list of responses for Form A has total 1
    resp_list = client.get(f"/api/forms/{form_a_id}/responses")
    assert resp_list.status_code == 200
    assert resp_list.json()["total"] == 1

    # 6. Reject completed response_id on both progress and submit
    completed_prog = client.post(
        f"/api/public/forms/{slug_a}/responses/progress",
        json={"response_id": resp_id, "answers": [{"question_id": q1_id, "value_text": "Again"}]},
    )
    assert completed_prog.status_code == 409

    completed_sub = client.post(
        f"/api/public/forms/{slug_a}/responses",
        json={"response_id": resp_id, "answers": [{"question_id": q1_id, "value_text": "Again"}]},
    )
    assert completed_sub.status_code == 409

    # 7. Summary counts and response_count counts completed only
    # Add a second partial response to Form A
    prog2 = client.post(
        f"/api/public/forms/{slug_a}/responses/progress",
        json={"answers": [{"question_id": q1_id, "value_text": "Bob Partial"}]},
    )
    assert prog2.status_code == 200
    bob_resp_id = prog2.json()["response_id"]
    assert bob_resp_id != resp_id

    # Total responses in Form A is 2 (1 completed, 1 partial)
    # Check dashboard/form response_count counts ONLY completed responses (1)
    forms_list = client.get("/api/forms")
    assert forms_list.status_code == 200
    form_a_item = next(f for f in forms_list.json() if f["id"] == form_a_id)
    assert form_a_item["response_count"] == 1

    form_detail = client.get(f"/api/forms/{form_a_id}")
    assert form_detail.status_code == 200
    assert form_detail.json()["response_count"] == 1

    # Results summary reports total/completed/partial/completion rate
    summary_res = client.get(f"/api/forms/{form_a_id}/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_responses"] == 2
    assert summary["completed_responses"] == 1
    assert summary["partial_responses"] == 1
    assert summary["completion_rate"] == 50.0


def test_multiselect_contract_and_summary_count(client):
    # 1. Create form
    f_res = client.post("/api/forms", json={"title": "Multi-Select Form"})
    assert f_res.status_code == 201
    form_id = f_res.json()["id"]

    # 2. Add multiple choice question with allow_multiple
    q_res = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "type": "multiple_choice",
            "title": "Select your favorite tools",
            "required": True,
            "settings_json": json.dumps({"allow_multiple": True}),
            "options": [
                {"label": "React", "position": 0},
                {"label": "FastAPI", "position": 1},
                {"label": "Next.js", "position": 2},
            ],
        },
    )
    assert q_res.status_code == 201
    q_id = q_res.json()["id"]

    # 3. Publish form
    pub_res = client.post(f"/api/forms/{form_id}/publish")
    assert pub_res.status_code == 200
    slug = pub_res.json()["slug"]

    # 4. Submit 2 choices via value_json (value_text=None)
    sub1 = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {
                    "question_id": q_id,
                    "value_text": None,
                    "value_json": json.dumps(["React", "FastAPI"]),
                }
            ]
        },
    )
    assert sub1.status_code == 201

    # 5. Check summary counts each choice separately
    sum_res = client.get(f"/api/forms/{form_id}/summary")
    assert sum_res.status_code == 200
    q_stats = sum_res.json()["questions"][0]["option_stats"]
    stats_dict = {s["label"]: s["count"] for s in q_stats}
    assert stats_dict["React"] == 1
    assert stats_dict["FastAPI"] == 1
    assert stats_dict["Next.js"] == 0

    # 6. Submit single choice response via value_text (value_json=None)
    sub2 = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {
                    "question_id": q_id,
                    "value_text": "Next.js",
                    "value_json": None,
                }
            ]
        },
    )
    assert sub2.status_code == 201

    # Check updated summary
    sum2_res = client.get(f"/api/forms/{form_id}/summary")
    assert sum2_res.status_code == 200
    q2_stats = sum2_res.json()["questions"][0]["option_stats"]
    stats2_dict = {s["label"]: s["count"] for s in q2_stats}
    assert stats2_dict["React"] == 1
    assert stats2_dict["FastAPI"] == 1
    assert stats2_dict["Next.js"] == 1


