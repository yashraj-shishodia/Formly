import json
import re
from typing import Any, Dict, Optional

from app.models import Question, QuestionType
from app.schemas import AnswerSubmit

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def parse_settings(settings_json: Optional[str]) -> Dict[str, Any]:
    if not settings_json:
        return {}
    try:
        return json.loads(settings_json)
    except Exception:
        return {}


def is_answer_empty(answer: Optional[AnswerSubmit]) -> bool:
    if answer is None:
        return True
    if answer.value_text is not None and answer.value_text.strip():
        return False
    if answer.value_number is not None:
        return False
    if answer.value_json is not None and answer.value_json.strip():
        try:
            parsed = json.loads(answer.value_json)
            if parsed is not None and parsed != [] and parsed != "":
                return False
        except Exception:
            return False
    return True


def validate_answer(
    question: Question,
    answer: Optional[AnswerSubmit],
    enforce_required: bool = True,
) -> Optional[str]:
    """
    Validates an answer against question rules and type constraints.
    Returns an error message string if invalid, or None if valid.
    """
    empty = is_answer_empty(answer)

    # 1. Check required condition
    if enforce_required and question.required and empty:
        return "This question is required."

    # If empty (and not failing required check above), it is valid
    if empty:
        return None

    settings = parse_settings(question.settings_json)
    q_type = question.type

    # 2. Type-specific validation
    if q_type == QuestionType.SHORT_TEXT.value:
        text = answer.value_text or ""
        max_len = settings.get("max_length", 255)
        if len(text) > max_len:
            return f"Answer cannot exceed {max_len} characters."
        return None

    elif q_type == QuestionType.LONG_TEXT.value:
        text = answer.value_text or ""
        max_len = settings.get("max_length", 5000)
        if len(text) > max_len:
            return f"Answer cannot exceed {max_len} characters."
        return None

    elif q_type == QuestionType.EMAIL.value:
        text = (answer.value_text or "").strip()
        if not EMAIL_REGEX.match(text):
            return "Please enter a valid email address."
        return None

    elif q_type == QuestionType.NUMBER.value:
        num = answer.value_number
        if num is None and answer.value_text is not None:
            try:
                num = float(answer.value_text.strip())
            except ValueError:
                return "Please enter a valid number."
        if num is None:
            return "Please enter a valid number."

        min_val = settings.get("min_value")
        max_val = settings.get("max_value")
        if min_val is not None and num < float(min_val):
            return f"Value must be at least {min_val}."
        if max_val is not None and num > float(max_val):
            return f"Value must be at most {max_val}."
        return None

    elif q_type == QuestionType.RATING.value:
        num = answer.value_number
        if num is None and answer.value_text is not None:
            try:
                num = float(answer.value_text.strip())
            except ValueError:
                return "Rating must be a valid number."
        if num is None:
            return "Please provide a rating."

        max_rating = int(settings.get("max_rating", 5))
        if num < 1 or num > max_rating:
            return f"Rating must be between 1 and {max_rating}."
        return None

    elif q_type == QuestionType.YES_NO.value:
        val = None
        if answer.value_text is not None:
            lower = answer.value_text.strip().lower()
            if lower in ["yes", "true", "1"]:
                val = True
            elif lower in ["no", "false", "0"]:
                val = False
        elif answer.value_json is not None:
            try:
                parsed = json.loads(answer.value_json)
                if isinstance(parsed, bool):
                    val = parsed
            except Exception:
                pass

        if val is None:
            return "Please select Yes or No."
        return None

    elif q_type in [QuestionType.MULTIPLE_CHOICE.value, QuestionType.DROPDOWN.value]:
        valid_labels = {opt.label for opt in question.options}
        if not valid_labels:
            # If no options defined yet on question, any answer is allowed
            return None

        # Check if single or multiple choices
        chosen_labels = []
        if answer.value_text:
            chosen_labels.append(answer.value_text.strip())
        elif answer.value_json:
            try:
                parsed = json.loads(answer.value_json)
                if isinstance(parsed, list):
                    chosen_labels.extend([str(x).strip() for x in parsed])
                elif isinstance(parsed, str):
                    chosen_labels.append(parsed.strip())
            except Exception:
                return "Invalid choice format."

        if not chosen_labels:
            return "Please select an option."

        for label in chosen_labels:
            if label not in valid_labels:
                return f"'{label}' is not a valid option."

        return None

    return None
