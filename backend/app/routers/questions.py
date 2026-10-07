import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    Form,
    LogicOperator,
    Question,
    QuestionLogicRule,
    QuestionOption,
    QuestionType,
    User,
    utc_now,
)
from app.schemas import (
    LogicRuleCreate,
    LogicRuleResponse,
    LogicRuleUpdate,
    QuestionCreate,
    QuestionOptionCreate,
    QuestionResponse,
    QuestionsReorderRequest,
    QuestionUpdate,
)
from app.services.logic import (
    ALLOWED_OPERATORS_BY_TYPE,
    LOGIC_SUPPORTED_TYPES,
    cleanup_invalid_form_rules,
    normalize_boolean,
)

router = APIRouter(tags=["Questions"])

DEFAULT_MAX_RATING = 5

DEFAULT_TITLES = {
    QuestionType.SHORT_TEXT: "What is your name?",
    QuestionType.LONG_TEXT: "Can you provide more details?",
    QuestionType.MULTIPLE_CHOICE: "Which option best describes you?",
    QuestionType.DROPDOWN: "Select your preferred category",
    QuestionType.EMAIL: "What's your email address?",
    QuestionType.NUMBER: "What is your budget / age?",
    QuestionType.YES_NO: "Do you agree with the terms?",
    QuestionType.RATING: "How would you rate your experience?",
    QuestionType.FILE_UPLOAD: "Upload your document or file",
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
        settings_json = json.dumps({"max_rating": DEFAULT_MAX_RATING})

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


def validate_logic_rule_payload(
    db: Session,
    source_question: Question,
    operator: LogicOperator,
    value: str,
    target_question_id: Optional[int],
):
    if source_question.type not in LOGIC_SUPPORTED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Logic rules are not supported for question type '{source_question.type}'",
        )

    allowed_ops = ALLOWED_OPERATORS_BY_TYPE.get(source_question.type, set())
    if operator.value not in allowed_ops:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Operator '{operator.value}' is not valid for question type '{source_question.type}'",
        )

    # Validate value format
    if source_question.type in (QuestionType.NUMBER.value, QuestionType.RATING.value):
        try:
            float(value)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Value '{value}' must be numeric for question type '{source_question.type}'",
            )
    elif source_question.type == QuestionType.YES_NO.value:
        if normalize_boolean(value) is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Value '{value}' must be a valid boolean ('true' or 'false') for yes/no question",
            )
    else:
        if not str(value).strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Rule value cannot be empty",
            )

    # Validate target question (forward jump constraint)
    if target_question_id is not None:
        target_q = (
            db.query(Question)
            .filter(
                Question.id == target_question_id,
                Question.form_id == source_question.form_id,
            )
            .first()
        )
        if not target_q:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Target question {target_question_id} not found in this form",
            )
        if target_q.position <= source_question.position:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Logic rules may only jump forward to subsequent questions (target position must be greater than current question position).",
            )


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

    type_changed = False
    if payload.type is not None and payload.type.value != question.type:
        question.type = payload.type.value
        type_changed = True
        if (
            payload.type == QuestionType.RATING
            and (not question.settings_json or question.settings_json.strip() in ("", "{}"))
            and payload.settings_json is None
        ):
            question.settings_json = json.dumps({"max_rating": DEFAULT_MAX_RATING})

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

    if type_changed:
        cleanup_invalid_form_rules(db, question.form_id)
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

    db.commit()
    cleanup_invalid_form_rules(db, form_id)
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

    db.commit()
    cleanup_invalid_form_rules(db, form_id)
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


# ==========================================
# Logic Rules CRUD
# ==========================================
@router.get(
    "/api/questions/{question_id}/logic-rules",
    response_model=List[LogicRuleResponse],
)
def get_logic_rules(
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
    return sorted(question.logic_rules, key=lambda r: r.position)


@router.post(
    "/api/questions/{question_id}/logic-rules",
    response_model=LogicRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_logic_rule(
    question_id: int,
    payload: LogicRuleCreate,
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

    validate_logic_rule_payload(
        db=db,
        source_question=question,
        operator=payload.operator,
        value=payload.value,
        target_question_id=payload.target_question_id,
    )

    current_rules = question.logic_rules
    next_pos = (
        payload.position
        if payload.position is not None
        else len(current_rules)
    )

    rule = QuestionLogicRule(
        question_id=question.id,
        operator=payload.operator.value,
        value=payload.value,
        target_question_id=payload.target_question_id,
        position=next_pos,
    )
    db.add(rule)
    question.form.updated_at = utc_now()
    db.commit()
    db.refresh(rule)
    return rule


@router.put(
    "/api/questions/{question_id}/logic-rules/{rule_id}",
    response_model=LogicRuleResponse,
)
def update_logic_rule(
    question_id: int,
    rule_id: int,
    payload: LogicRuleUpdate,
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

    rule = (
        db.query(QuestionLogicRule)
        .filter(
            QuestionLogicRule.id == rule_id,
            QuestionLogicRule.question_id == question_id,
        )
        .first()
    )
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Logic rule with id {rule_id} not found",
        )

    new_op = payload.operator if payload.operator is not None else LogicOperator(rule.operator)
    new_val = payload.value if payload.value is not None else rule.value
    new_target = (
        payload.target_question_id
        if "target_question_id" in payload.model_fields_set
        else rule.target_question_id
    )

    validate_logic_rule_payload(
        db=db,
        source_question=question,
        operator=new_op,
        value=new_val,
        target_question_id=new_target,
    )

    rule.operator = new_op.value
    rule.value = new_val
    rule.target_question_id = new_target
    if payload.position is not None:
        rule.position = payload.position

    question.form.updated_at = utc_now()
    db.commit()
    db.refresh(rule)
    return rule


@router.delete(
    "/api/questions/{question_id}/logic-rules/{rule_id}",
    status_code=status.HTTP_200_OK,
)
def delete_logic_rule(
    question_id: int,
    rule_id: int,
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

    rule = (
        db.query(QuestionLogicRule)
        .filter(
            QuestionLogicRule.id == rule_id,
            QuestionLogicRule.question_id == question_id,
        )
        .first()
    )
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Logic rule with id {rule_id} not found",
        )

    db.delete(rule)
    question.form.updated_at = utc_now()
    db.commit()
    return {"message": f"Logic rule {rule_id} deleted successfully"}


@router.delete(
    "/api/logic-rules/{rule_id}",
    status_code=status.HTTP_200_OK,
)
def delete_logic_rule_direct(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = (
        db.query(QuestionLogicRule)
        .join(Question)
        .join(Form)
        .filter(
            QuestionLogicRule.id == rule_id,
            Form.user_id == current_user.id,
        )
        .first()
    )
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Logic rule with id {rule_id} not found",
        )

    rule.question.form.updated_at = utc_now()
    db.delete(rule)
    db.commit()
    return {"message": f"Logic rule {rule_id} deleted successfully"}
