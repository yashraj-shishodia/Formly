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
    ResponseSubmit,
    ThemeConfig,
    WelcomeScreenConfig,
)
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

    # Map answers submitted by question_id
    answers_by_qid = {a.question_id: a for a in payload.answers}

    # Validate each question in the form
    field_errors = {}
    for question in form.questions:
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

    # All answers valid; record response
    now = utc_now()
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

    # Save answers
    for question in form.questions:
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
