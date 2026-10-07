import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Answer, Form, FormStatus, Question, Response, ResponseStatus, utc_now
from app.schemas import (
    EndingScreenConfig,
    PublicForm,
    PublicQuestion,
    ResponseProgressResponse,
    ResponseProgressSubmit,
    ResponseSubmit,
    ThemeConfig,
    WelcomeScreenConfig,
)
from app.services.logic import evaluate_logic_path
from app.services.validation import is_answer_empty, validate_answer

router = APIRouter(prefix="/api/public", tags=["Public Respondent Flow"])


def parse_json_model(json_str: Optional[str], model_cls):
    if not json_str:
        return None
    try:
        data = json.loads(json_str)
        if isinstance(data, dict):
            return model_cls(**data)
        return None
    except Exception:
        return None


@router.get("/forms/{slug}", response_model=PublicForm)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    form = (
        db.query(Form)
        .filter(Form.slug == slug, Form.status == FormStatus.PUBLISHED.value)
        .first()
    )
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or currently unavailable.",
        )

    # Sort questions by position
    sorted_questions = sorted(form.questions, key=lambda q: q.position)
    public_questions = []
    for q in sorted_questions:
        sorted_opts = sorted(q.options, key=lambda o: o.position)
        sorted_rules = sorted(q.logic_rules, key=lambda r: r.position)
        public_questions.append(
            PublicQuestion(
                id=q.id,
                type=q.type,
                title=q.title,
                description=q.description,
                required=q.required,
                position=q.position,
                settings_json=q.settings_json,
                options=sorted_opts,
                logic_rules=sorted_rules,
            )
        )

    theme = parse_json_model(form.theme_json, ThemeConfig) or ThemeConfig()
    welcome = parse_json_model(form.welcome_screen_json, WelcomeScreenConfig) or WelcomeScreenConfig()
    ending = EndingScreenConfig(
        title=form.thank_you_title or "Thank you!",
        description=form.thank_you_message or "Your response has been recorded.",
    )

    return PublicForm(
        id=form.id,
        title=form.title,
        slug=form.slug,
        theme_json=form.theme_json,
        welcome_screen_json=form.welcome_screen_json,
        thank_you_title=form.thank_you_title,
        thank_you_message=form.thank_you_message,
        theme=theme,
        welcome_screen=welcome,
        ending_screen=ending,
        questions=public_questions,
    )


@router.post("/forms/{slug}/responses/progress", response_model=ResponseProgressResponse)
def track_response_progress(
    slug: str,
    payload: ResponseProgressSubmit,
    db: Session = Depends(get_db),
):
    form = (
        db.query(Form)
        .filter(Form.slug == slug, Form.status == FormStatus.PUBLISHED.value)
        .first()
    )
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or currently unavailable.",
        )

    existing_response = None
    if payload.response_id is not None:
        existing_response = (
            db.query(Response)
            .filter(Response.id == payload.response_id)
            .first()
        )
        if not existing_response or existing_response.form_id != form.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Response not found.",
            )
        if existing_response.status != ResponseStatus.PARTIAL.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Response is already completed.",
            )

    questions_by_id = {q.id: q for q in form.questions}
    field_errors = {}
    for ans in payload.answers:
        q = questions_by_id.get(ans.question_id)
        if q and not is_answer_empty(ans):
            err = validate_answer(q, ans, enforce_required=False)
            if err:
                field_errors[str(q.id)] = err

    if field_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Validation failed",
                "errors": field_errors,
            },
        )

    now = utc_now()
    if not existing_response:
        started = payload.started_at or now
        response = Response(
            form_id=form.id,
            status=ResponseStatus.PARTIAL.value,
            started_at=started,
            submitted_at=None,
        )
        db.add(response)
        db.commit()
        db.refresh(response)
    else:
        response = existing_response

    # Upsert or clear answers
    for ans in payload.answers:
        if ans.question_id not in questions_by_id:
            continue
        existing_ans = (
            db.query(Answer)
            .filter(
                Answer.response_id == response.id,
                Answer.question_id == ans.question_id,
            )
            .first()
        )
        if is_answer_empty(ans):
            if existing_ans:
                db.delete(existing_ans)
        else:
            if existing_ans:
                existing_ans.value_text = ans.value_text
                existing_ans.value_number = ans.value_number
                existing_ans.value_json = ans.value_json
            else:
                db.add(
                    Answer(
                        response_id=response.id,
                        question_id=ans.question_id,
                        value_text=ans.value_text,
                        value_number=ans.value_number,
                        value_json=ans.value_json,
                    )
                )

    db.commit()
    return {"response_id": response.id}


@router.post("/forms/{slug}/responses", status_code=status.HTTP_201_CREATED)
def submit_public_response(
    slug: str,
    payload: ResponseSubmit,
    db: Session = Depends(get_db),
):
    form = (
        db.query(Form)
        .filter(Form.slug == slug, Form.status == FormStatus.PUBLISHED.value)
        .first()
    )
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or currently unavailable.",
        )

    existing_response = None
    if payload.response_id is not None:
        existing_response = (
            db.query(Response)
            .filter(Response.id == payload.response_id)
            .first()
        )
        if not existing_response or existing_response.form_id != form.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Response not found.",
            )
        if existing_response.status != ResponseStatus.PARTIAL.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Response is already completed.",
            )

    # Map answers submitted by question_id
    answers_by_qid = {a.question_id: a for a in payload.answers}

    # Evaluate logic path to determine visited questions
    visited_qids = set(evaluate_logic_path(form.questions, answers_by_qid))
    visited_questions = [q for q in form.questions if q.id in visited_qids]

    # Validate each visited question in the form
    field_errors = {}
    for question in visited_questions:
        ans = answers_by_qid.get(question.id)
        err = validate_answer(question, ans)
        if err:
            field_errors[str(question.id)] = err

    if field_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Validation failed",
                "errors": field_errors,
            },
        )

    now = utc_now()
    if existing_response:
        response = existing_response
        response.status = ResponseStatus.COMPLETED.value
        response.submitted_at = now
        # replace answers
        db.query(Answer).filter(Answer.response_id == response.id).delete()
    else:
        started = payload.started_at or now
        response = Response(
            form_id=form.id,
            status=ResponseStatus.COMPLETED.value,
            started_at=started,
            submitted_at=now,
        )
        db.add(response)
        db.commit()
        db.refresh(response)

    # Save answers (for visited questions only)
    for question in visited_questions:
        ans = answers_by_qid.get(question.id)
        if ans and not is_answer_empty(ans):
            answer_record = Answer(
                response_id=response.id,
                question_id=question.id,
                value_text=ans.value_text,
                value_number=ans.value_number,
                value_json=ans.value_json,
            )
            db.add(answer_record)

    db.commit()

    return {
        "status": "ok",
        "response_id": response.id,
        "thank_you_title": form.thank_you_title or "Thank you!",
        "thank_you_message": form.thank_you_message or "Your response has been recorded.",
    }
