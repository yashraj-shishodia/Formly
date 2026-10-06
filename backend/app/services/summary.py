import json
from collections import Counter
from typing import List

from sqlalchemy.orm import Session

from app.models import Answer, Form, Question, QuestionType, Response, ResponseStatus
from app.schemas import FormSummary, QuestionOptionStat, QuestionSummary


def calculate_form_summary(db: Session, form_id: int) -> FormSummary:
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        return FormSummary(
            form_id=form_id,
            total_responses=0,
            completed_responses=0,
            partial_responses=0,
            completion_rate=0.0,
            average_duration_seconds=None,
            questions=[],
        )

    responses: List[Response] = (
        db.query(Response).filter(Response.form_id == form_id).all()
    )
    total_responses = len(responses)
    completed_responses = sum(
        1 for r in responses if r.status == ResponseStatus.COMPLETED.value
    )
    partial_responses = sum(
        1 for r in responses if r.status == ResponseStatus.PARTIAL.value
    )
    completion_rate = (
        round((completed_responses / total_responses) * 100.0, 1)
        if total_responses > 0
        else 0.0
    )

    # Calculate average completion duration for completed responses
    durations = []
    for r in responses:
        if (
            r.status == ResponseStatus.COMPLETED.value
            and r.started_at is not None
            and r.submitted_at is not None
        ):
            delta = (r.submitted_at - r.started_at).total_seconds()
            if delta >= 0:
                durations.append(delta)

    average_duration = (
        round(sum(durations) / len(durations), 1) if durations else None
    )

    question_summaries: List[QuestionSummary] = []

    for question in form.questions:
        # Fetch all answers for this question
        answers: List[Answer] = (
            db.query(Answer).filter(Answer.question_id == question.id).all()
        )
        total_answers = len(answers)
        q_type = question.type

        summary = QuestionSummary(
            question_id=question.id,
            type=QuestionType(q_type),
            title=question.title,
            total_answers=total_answers,
        )

        if q_type in [QuestionType.MULTIPLE_CHOICE.value, QuestionType.DROPDOWN.value]:
            option_labels = [opt.label for opt in question.options]
            counter: Counter = Counter()

            for a in answers:
                if a.value_text:
                    counter[a.value_text] += 1
                elif a.value_json:
                    try:
                        parsed = json.loads(a.value_json)
                        if isinstance(parsed, list):
                            for item in parsed:
                                counter[str(item)] += 1
                        elif isinstance(parsed, str):
                            counter[parsed] += 1
                    except Exception:
                        pass

            option_stats: List[QuestionOptionStat] = []
            for label in option_labels:
                cnt = counter.get(label, 0)
                pct = (
                    round((cnt / total_answers) * 100.0, 1)
                    if total_answers > 0
                    else 0.0
                )
                option_stats.append(
                    QuestionOptionStat(label=label, count=cnt, percentage=pct)
                )

            # Also include any answers not in currently defined options (historical data)
            for label, cnt in counter.items():
                if label not in option_labels:
                    pct = (
                        round((cnt / total_answers) * 100.0, 1)
                        if total_answers > 0
                        else 0.0
                    )
                    option_stats.append(
                        QuestionOptionStat(label=label, count=cnt, percentage=pct)
                    )

            summary.option_stats = option_stats

        elif q_type == QuestionType.RATING.value:
            ratings = []
            distribution: Counter = Counter()
            for a in answers:
                val = a.value_number
                if val is not None:
                    int_val = int(round(val))
                    ratings.append(val)
                    distribution[str(int_val)] += 1

            if ratings:
                summary.average = round(sum(ratings) / len(ratings), 2)
                summary.min_value = min(ratings)
                summary.max_value = max(ratings)
            summary.distribution = dict(distribution)

        elif q_type == QuestionType.NUMBER.value:
            nums = [a.value_number for a in answers if a.value_number is not None]
            if nums:
                summary.average = round(sum(nums) / len(nums), 2)
                summary.min_value = min(nums)
                summary.max_value = max(nums)

        elif q_type == QuestionType.YES_NO.value:
            yes_count = 0
            no_count = 0
            for a in answers:
                if a.value_text:
                    lower = a.value_text.lower()
                    if lower in ["yes", "true", "1"]:
                        yes_count += 1
                    elif lower in ["no", "false", "0"]:
                        no_count += 1
                elif a.value_json:
                    try:
                        parsed = json.loads(a.value_json)
                        if parsed is True:
                            yes_count += 1
                        elif parsed is False:
                            no_count += 1
                    except Exception:
                        pass

            valid_total = yes_count + no_count
            summary.yes_count = yes_count
            summary.no_count = no_count
            summary.yes_percentage = (
                round((yes_count / valid_total) * 100.0, 1) if valid_total > 0 else 0.0
            )
            summary.no_percentage = (
                round((no_count / valid_total) * 100.0, 1) if valid_total > 0 else 0.0
            )

        elif q_type in [
            QuestionType.SHORT_TEXT.value,
            QuestionType.LONG_TEXT.value,
            QuestionType.EMAIL.value,
        ]:
            recent = [
                a.value_text for a in reversed(answers) if a.value_text and a.value_text.strip()
            ][:15]
            summary.recent_answers = recent

        question_summaries.append(summary)

    return FormSummary(
        form_id=form_id,
        total_responses=total_responses,
        completed_responses=completed_responses,
        partial_responses=partial_responses,
        completion_rate=completion_rate,
        average_duration_seconds=average_duration,
        questions=question_summaries,
    )
