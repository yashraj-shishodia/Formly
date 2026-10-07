from typing import Any, Dict, List, Optional
import json
from sqlalchemy.orm import Session

from app.models import LogicOperator, Question, QuestionLogicRule, QuestionType


LOGIC_SUPPORTED_TYPES = {
    QuestionType.MULTIPLE_CHOICE.value,
    QuestionType.DROPDOWN.value,
    QuestionType.YES_NO.value,
    QuestionType.NUMBER.value,
    QuestionType.RATING.value,
}

ALLOWED_OPERATORS_BY_TYPE = {
    QuestionType.MULTIPLE_CHOICE.value: {LogicOperator.EQUALS.value, LogicOperator.NOT_EQUALS.value},
    QuestionType.DROPDOWN.value: {LogicOperator.EQUALS.value, LogicOperator.NOT_EQUALS.value},
    QuestionType.YES_NO.value: {LogicOperator.EQUALS.value, LogicOperator.NOT_EQUALS.value},
    QuestionType.NUMBER.value: {LogicOperator.EQUALS.value, LogicOperator.GREATER_THAN.value, LogicOperator.LESS_THAN.value},
    QuestionType.RATING.value: {LogicOperator.EQUALS.value, LogicOperator.GREATER_THAN.value, LogicOperator.LESS_THAN.value},
}


def extract_answer_value(answer_obj: Any) -> Any:
    """
    Extracts the typed value from an AnswerSubmit schema, Answer model, or dict.
    """
    if answer_obj is None:
        return None

    if hasattr(answer_obj, "value_number") and answer_obj.value_number is not None:
        return answer_obj.value_number
    if hasattr(answer_obj, "value_json") and answer_obj.value_json is not None:
        try:
            return json.loads(answer_obj.value_json)
        except Exception:
            return answer_obj.value_json
    if hasattr(answer_obj, "value_text") and answer_obj.value_text is not None:
        return answer_obj.value_text

    if isinstance(answer_obj, dict):
        if answer_obj.get("value_number") is not None:
            return answer_obj["value_number"]
        if answer_obj.get("value_json") is not None:
            raw = answer_obj["value_json"]
            try:
                return json.loads(raw)
            except Exception:
                return raw
        if answer_obj.get("value_text") is not None:
            return answer_obj["value_text"]

    return answer_obj


def normalize_boolean(val: Any) -> Optional[bool]:
    if isinstance(val, bool):
        return val
    if val is None:
        return None
    s = str(val).strip().lower()
    if s in ("true", "yes", "1"):
        return True
    if s in ("false", "no", "0"):
        return False
    return None


def is_rule_satisfied(operator: str, rule_value: str, answer_value: Any, question_type: str) -> bool:
    """
    Evaluates whether an answer value satisfies a logic rule based on question type and operator.
    """
    if answer_value is None:
        return False

    # 1. Choice & Dropdown
    if question_type in (QuestionType.MULTIPLE_CHOICE.value, QuestionType.DROPDOWN.value):
        target = str(rule_value).strip().lower()
        if isinstance(answer_value, list):
            items = [str(x).strip().lower() for x in answer_value]
            if operator == LogicOperator.EQUALS.value:
                return target in items
            elif operator == LogicOperator.NOT_EQUALS.value:
                return target not in items
        else:
            ans_str = str(answer_value).strip().lower()
            if operator == LogicOperator.EQUALS.value:
                return ans_str == target
            elif operator == LogicOperator.NOT_EQUALS.value:
                return ans_str != target
        return False

    # 2. Yes / No
    if question_type == QuestionType.YES_NO.value:
        ans_bool = normalize_boolean(answer_value)
        rule_bool = normalize_boolean(rule_value)
        if ans_bool is None or rule_bool is None:
            return False
        if operator == LogicOperator.EQUALS.value:
            return ans_bool == rule_bool
        elif operator == LogicOperator.NOT_EQUALS.value:
            return ans_bool != rule_bool
        return False

    # 3. Number & Rating
    if question_type in (QuestionType.NUMBER.value, QuestionType.RATING.value):
        try:
            ans_num = float(answer_value)
            rule_num = float(rule_value)
        except (ValueError, TypeError):
            return False

        if operator == LogicOperator.EQUALS.value:
            return ans_num == rule_num
        elif operator == LogicOperator.GREATER_THAN.value:
            return ans_num > rule_num
        elif operator == LogicOperator.LESS_THAN.value:
            return ans_num < rule_num
        return False

    return False


def evaluate_logic_path(
    questions: List[Question],
    answers_by_qid: Dict[int, Any],
) -> List[int]:
    """
    Evaluates logic rules along the respondent path.
    Returns the ordered list of visited question IDs.
    Rules only jump forward or jump to end (None).
    First matching rule wins. If no rule matches, advances to next question.
    """
    if not questions:
        return []

    sorted_questions = sorted(questions, key=lambda q: q.position)
    id_to_q = {q.id: q for q in sorted_questions}
    id_to_idx = {q.id: idx for idx, q in enumerate(sorted_questions)}

    visited_ids: List[int] = []
    curr_idx = 0

    while curr_idx < len(sorted_questions):
        current_q = sorted_questions[curr_idx]
        visited_ids.append(current_q.id)

        ans_obj = answers_by_qid.get(current_q.id)
        ans_val = extract_answer_value(ans_obj)

        jumped = False
        sorted_rules = sorted(current_q.logic_rules, key=lambda r: r.position)

        for rule in sorted_rules:
            if is_rule_satisfied(rule.operator, rule.value, ans_val, current_q.type):
                jumped = True
                if rule.target_question_id is None:
                    # Jump to end of form
                    return visited_ids
                else:
                    target_idx = id_to_idx.get(rule.target_question_id)
                    if target_idx is not None and target_idx > curr_idx:
                        curr_idx = target_idx
                    else:
                        # Invalid or dangling rule fallback: advance naturally
                        curr_idx += 1
                break

        if not jumped:
            curr_idx += 1

    return visited_ids


def cleanup_invalid_form_rules(db: Session, form_id: int) -> int:
    """
    Deletes any logic rules in the form that have become backward or dangling
    after reordering or deleting questions.
    Returns the number of removed rules.
    """
    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .all()
    )
    q_map = {q.id: q for q in questions}

    rules = (
        db.query(QuestionLogicRule)
        .join(Question, QuestionLogicRule.question_id == Question.id)
        .filter(Question.form_id == form_id)
        .all()
    )

    removed_count = 0
    for rule in rules:
        source_q = q_map.get(rule.question_id)
        if not source_q:
            db.delete(rule)
            removed_count += 1
            continue

        # If source question type is no longer supported for logic rules
        if source_q.type not in LOGIC_SUPPORTED_TYPES:
            db.delete(rule)
            removed_count += 1
            continue

        # If target question is set, verify it exists and is strictly ahead
        if rule.target_question_id is not None:
            target_q = q_map.get(rule.target_question_id)
            if not target_q or target_q.position <= source_q.position:
                db.delete(rule)
                removed_count += 1
                continue

    if removed_count > 0:
        db.commit()

    return removed_count
