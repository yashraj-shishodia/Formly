import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Form, FormStatus, Question, QuestionOption, Response, ResponseStatus, User, utc_now
from app.schemas import (
    EndingScreenConfig,
    FormCreate,
    FormDetail,
    FormListItem,
    FormUpdate,
    ThemeConfig,
    WelcomeScreenConfig,
)
from app.services.slug import generate_unique_slug

router = APIRouter(prefix="/api/forms", tags=["Forms"])


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


def build_form_detail(form: Form, db: Session) -> FormDetail:
    resp_count = (
        db.query(Response)
        .filter(
            Response.form_id == form.id,
            Response.status == ResponseStatus.COMPLETED.value,
        )
        .count()
    )

    theme = parse_json_model(form.theme_json, ThemeConfig) or ThemeConfig()
    welcome = parse_json_model(form.welcome_screen_json, WelcomeScreenConfig) or WelcomeScreenConfig()
    ending = EndingScreenConfig(
        title=form.thank_you_title or "Thank you!",
        description=form.thank_you_message or "Your response has been recorded.",
    )

    return FormDetail(
        id=form.id,
        user_id=form.user_id,
        title=form.title,
        slug=form.slug,
        status=FormStatus(form.status),
        theme_json=form.theme_json,
        welcome_screen_json=form.welcome_screen_json,
        thank_you_title=form.thank_you_title,
        thank_you_message=form.thank_you_message,
        theme=theme,
        welcome_screen=welcome,
        ending_screen=ending,
        response_count=resp_count,
        questions=form.questions,
        created_at=form.created_at,
        updated_at=form.updated_at,
        published_at=form.published_at,
    )


@router.get("", response_model=List[FormListItem])
def list_forms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    forms = (
        db.query(Form)
        .filter(Form.user_id == current_user.id)
        .order_by(Form.updated_at.desc())
        .all()
    )

    result = []
    for f in forms:
        resp_count = (
            db.query(Response)
            .filter(
                Response.form_id == f.id,
                Response.status == ResponseStatus.COMPLETED.value,
            )
            .count()
        )
        result.append(
            FormListItem(
                id=f.id,
                title=f.title,
                slug=f.slug,
                status=FormStatus(f.status),
                response_count=resp_count,
                created_at=f.created_at,
                updated_at=f.updated_at,
                published_at=f.published_at,
            )
        )
    return result


@router.post("", response_model=FormDetail, status_code=status.HTTP_201_CREATED)
def create_form(
    payload: FormCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    title = (payload.title or "").strip() or "Untitled Form"
    form = Form(
        user_id=current_user.id,
        title=title,
        status=FormStatus.DRAFT.value,
    )
    db.add(form)
    db.commit()
    db.refresh(form)
    return build_form_detail(form, db)


@router.get("/{form_id}", response_model=FormDetail)
def get_form(
    form_id: int,
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
    return build_form_detail(form, db)


@router.patch("/{form_id}", response_model=FormDetail)
def update_form(
    form_id: int,
    payload: FormUpdate,
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

    if payload.title is not None:
        form.title = payload.title.strip() or "Untitled Form"
    if payload.theme_json is not None:
        form.theme_json = payload.theme_json
    if payload.welcome_screen_json is not None:
        form.welcome_screen_json = payload.welcome_screen_json
    if payload.thank_you_title is not None:
        form.thank_you_title = payload.thank_you_title
    if payload.thank_you_message is not None:
        form.thank_you_message = payload.thank_you_message

    form.updated_at = utc_now()
    db.commit()
    db.refresh(form)
    return build_form_detail(form, db)


@router.delete("/{form_id}", status_code=status.HTTP_200_OK)
def delete_form(
    form_id: int,
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
    db.delete(form)
    db.commit()
    return {"message": f"Form {form_id} deleted successfully"}


@router.post("/{form_id}/duplicate", response_model=FormDetail, status_code=status.HTTP_201_CREATED)
def duplicate_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    original = (
        db.query(Form)
        .filter(Form.id == form_id, Form.user_id == current_user.id)
        .first()
    )
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with id {form_id} not found",
        )

    new_form = Form(
        user_id=current_user.id,
        title=f"{original.title} (Copy)",
        status=FormStatus.DRAFT.value,
        theme_json=original.theme_json,
        welcome_screen_json=original.welcome_screen_json,
        thank_you_title=original.thank_you_title,
        thank_you_message=original.thank_you_message,
        slug=None,
    )
    db.add(new_form)
    db.commit()
    db.refresh(new_form)

    # Deep copy questions and options
    for q in original.questions:
        new_q = Question(
            form_id=new_form.id,
            type=q.type,
            title=q.title,
            description=q.description,
            required=q.required,
            position=q.position,
            settings_json=q.settings_json,
        )
        db.add(new_q)
        db.commit()
        db.refresh(new_q)

        for opt in q.options:
            new_opt = QuestionOption(
                question_id=new_q.id,
                label=opt.label,
                position=opt.position,
            )
            db.add(new_opt)

    db.commit()
    db.refresh(new_form)
    return build_form_detail(new_form, db)


@router.post("/{form_id}/publish", response_model=FormDetail)
def publish_form(
    form_id: int,
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

    if not form.slug:
        form.slug = generate_unique_slug(db)

    form.status = FormStatus.PUBLISHED.value
    form.published_at = utc_now()
    form.updated_at = utc_now()
    db.commit()
    db.refresh(form)
    return build_form_detail(form, db)


@router.post("/{form_id}/unpublish", response_model=FormDetail)
def unpublish_form(
    form_id: int,
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

    form.status = FormStatus.DRAFT.value
    form.updated_at = utc_now()
    db.commit()
    db.refresh(form)
    return build_form_detail(form, db)
