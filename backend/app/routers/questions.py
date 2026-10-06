import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Form, Question, QuestionOption, QuestionType, User, utc_now
from app.schemas import (
    QuestionCreate,
    QuestionOptionCreate,
    QuestionResponse,
    QuestionsReorderRequest,
    QuestionUpdate,
)

router = APIRouter(tags=["Questions"])

DEFAULT_TITLES = {
    QuestionType.SHORT_TEXT: "What is your name?",
    QuestionType.LONG_TEXT: "Can you provide more details?",
    QuestionType.MULTIPLE_CHOICE: "Which option best describes you?",
    QuestionType.DROPDOWN: "Select your preferred category",
    QuestionType.EMAIL: "What's your email address?",
    QuestionType.NUMBER: "What is your budget / age?",
    QuestionType.YES_NO: "Do you agree with the terms?",
    QuestionType.RATING: "How would you rate your experience?",
}


@router.post(
    "/api/forms/{form_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_question(
    form_id: int,
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = (
        db.query(Form)
        .filter(Form.id == form_id, Form.user_id == current_user.id)
        .first()
    )
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with id {form_id} not found",
        )

    # Determine position: append at end
    current_max_pos = (
        db.query(Question.position)
        .filter(Question.form_id == form_id)
        .order_by(Question.position.desc())
        .first()
    )
    next_position = (current_max_pos[0] + 1) if current_max_pos is not None else 0

    title = payload.title or DEFAULT_TITLES.get(payload.type, "Untitled Question")

    # Default settings for rating
    settings_json = payload.settings_json
    if not settings_json and payload.type == QuestionType.RATING:
        settings_json = json.dumps({"max_rating": 5})

    question = Question(
        form_id=form_id,
        type=payload.type.value,
        title=title,
        description=payload.description,
        required=payload.required,
        position=next_position,
        settings_json=settings_json,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    # Add options if provided or default 2 options for choice types
    options_to_add = payload.options
    if options_to_add is None and payload.type in [
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.DROPDOWN,
    ]:
        options_to_add = [
            QuestionOptionCreate(label="Option 1", position=0),
            QuestionOptionCreate(label="Option 2", position=1),
        ]

    if options_to_add:
        for idx, opt in enumerate(options_to_add):
            db_opt = QuestionOption(
                question_id=question.id,
                label=opt.label,
                position=opt.position if opt.position is not None else idx,
            )
            db.add(db_opt)
        db.commit()
        db.refresh(question)

    form.updated_at = utc_now()
    db.commit()

    return question


@router.patch("/api/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = (
        db.query(Question)
        .join(Form)
        .filter(Question.id == question_id, Form.user_id == current_user.id)
        .first()
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with id {question_id} not found",
        )

    if payload.title is not None:
        question.title = payload.title.strip() or "Untitled Question"
    if payload.description is not None:
        question.description = payload.description
    if payload.required is not None:
        question.required = payload.required
    if payload.settings_json is not None:
        question.settings_json = payload.settings_json

    # Replace options if provided
    if payload.options is not None:
        # Delete existing options
        db.query(QuestionOption).filter(
            QuestionOption.question_id == question_id
        ).delete()
        # Add new options
        for idx, opt in enumerate(payload.options):
            new_opt = QuestionOption(
                question_id=question.id,
                label=opt.label,
                position=opt.position if opt.position is not None else idx,
            )
            db.add(new_opt)

    question.updated_at = utc_now()
    question.form.updated_at = utc_now()
    db.commit()
    db.refresh(question)
    return question


@router.delete("/api/questions/{question_id}", status_code=status.HTTP_200_OK)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = (
        db.query(Question)
        .join(Form)
        .filter(Question.id == question_id, Form.user_id == current_user.id)
        .first()
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with id {question_id} not found",
        )

    form_id = question.form_id
    form = question.form
    db.delete(question)
    db.commit()

    # Reindex remaining questions in form so positions stay 0, 1, 2...
    remaining = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position.asc())
        .all()
    )
    for idx, q in enumerate(remaining):
        q.position = idx

    form.updated_at = utc_now()
    db.commit()
    return {"message": f"Question {question_id} deleted successfully"}


@router.put(
    "/api/forms/{form_id}/questions/order",
    response_model=List[QuestionResponse],
)
def reorder_questions(
    form_id: int,
    payload: QuestionsReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form = (
        db.query(Form)
        .filter(Form.id == form_id, Form.user_id == current_user.id)
        .first()
    )
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with id {form_id} not found",
        )

    existing_questions = (
        db.query(Question).filter(Question.form_id == form_id).all()
    )
    existing_ids = {q.id for q in existing_questions}
    requested_ids = payload.question_ids

    # Validate that requested IDs match existing questions for this form
    if set(requested_ids) != existing_ids or len(requested_ids) != len(existing_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided question IDs do not match the form's question set.",
        )

    # Update positions in transaction
    q_map = {q.id: q for q in existing_questions}
    for new_pos, q_id in enumerate(requested_ids):
        q_map[q_id].position = new_pos
        q_map[q_id].updated_at = utc_now()

    form.updated_at = utc_now()
    db.commit()

    # Return ordered list
    ordered_questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position.asc())
        .all()
    )
    return ordered_questions
