import csv
import io
import json
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Answer, Form, Question, Response, User
from app.schemas import (
    FormSummary,
    ResponseDetail,
    ResponseListItem,
    ResponseListResponse,
    ResponseStatus,
)
from app.services.summary import calculate_form_summary

router = APIRouter(tags=["Responses & Analytics"])


def resolve_answer_value(answer: Answer) -> Any:
    if answer.value_text is not None:
        return answer.value_text
    if answer.value_number is not None:
        return answer.value_number
    if answer.value_json is not None:
        try:
            return json.loads(answer.value_json)
        except Exception:
            return answer.value_json
    return None


@router.get("/api/forms/{form_id}/responses", response_model=ResponseListResponse)
def get_form_responses(
    form_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
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

    query = (
        db.query(Response)
        .filter(Response.form_id == form_id)
        .order_by(Response.submitted_at.desc(), Response.started_at.desc())
    )
    total = query.count()
    offset = (page - 1) * page_size
    responses = query.offset(offset).limit(page_size).all()

    items = []
    for r in responses:
        ans_map: Dict[int, Any] = {}
        for ans in r.answers:
            ans_map[ans.question_id] = resolve_answer_value(ans)

        items.append(
            ResponseListItem(
                id=r.id,
                form_id=r.form_id,
                status=ResponseStatus(r.status),
                started_at=r.started_at,
                submitted_at=r.submitted_at,
                answers=ans_map,
            )
        )

    return ResponseListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items,
    )


@router.get("/api/responses/{response_id}", response_model=ResponseDetail)
def get_single_response(
    response_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response = (
        db.query(Response)
        .join(Form)
        .filter(Response.id == response_id, Form.user_id == current_user.id)
        .first()
    )
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Response with id {response_id} not found",
        )
    return response


@router.delete("/api/responses/{response_id}", status_code=status.HTTP_200_OK)
def delete_response(
    response_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response = (
        db.query(Response)
        .join(Form)
        .filter(Response.id == response_id, Form.user_id == current_user.id)
        .first()
    )
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Response with id {response_id} not found",
        )
    db.delete(response)
    db.commit()
    return {"message": f"Response {response_id} deleted successfully"}


@router.get("/api/forms/{form_id}/summary", response_model=FormSummary)
def get_form_summary(
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
    return calculate_form_summary(db, form_id)


@router.get("/api/forms/{form_id}/responses/export.csv")
def export_responses_csv(
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

    questions = sorted(form.questions, key=lambda q: q.position)
    responses = (
        db.query(Response)
        .filter(Response.form_id == form_id)
        .order_by(Response.submitted_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    headers = ["Response ID", "Submitted At", "Status"] + [
        f"Q{q.position + 1}: {q.title}" for q in questions
    ]
    writer.writerow(headers)

    # Data rows
    for r in responses:
        ans_map = {ans.question_id: resolve_answer_value(ans) for ans in r.answers}
        row = [
            r.id,
            r.submitted_at.isoformat() if r.submitted_at else "",
            r.status,
        ]
        for q in questions:
            val = ans_map.get(q.id, "")
            if isinstance(val, list):
                val = ", ".join(str(x) for x in val)
            row.append(str(val) if val is not None else "")
        writer.writerow(row)

    output.seek(0)
    filename = f"responses_{form.slug or form.id}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
