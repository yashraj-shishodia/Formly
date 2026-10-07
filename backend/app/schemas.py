from datetime import datetime
import json
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import FormStatus, LogicOperator, QuestionType, ResponseStatus


# Base configuration for Pydantic v2
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Theme & Screen Configs
# ==========================================
class ThemeConfig(BaseSchema):
    background_color: str = "#FFFFFF"
    text_color: str = "#2B2530"
    button_color: str = "#2B2530"
    button_text_color: str = "#FFFFFF"
    font: str = "Karla"


class WelcomeScreenConfig(BaseSchema):
    enabled: bool = False
    title: str = "Welcome"
    description: Optional[str] = None
    button_text: str = "Start"


class EndingScreenConfig(BaseSchema):
    title: str = "Thank you!"
    description: Optional[str] = "Your response has been recorded."
    button_text: Optional[str] = None
    button_url: Optional[str] = None


# ==========================================
# User Schemas
# ==========================================
class UserBase(BaseSchema):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime


# ==========================================
# Question Option Schemas
# ==========================================
class QuestionOptionBase(BaseSchema):
    label: str
    position: int = 0


class QuestionOptionCreate(BaseSchema):
    label: str
    position: Optional[int] = 0


class QuestionOptionResponse(QuestionOptionBase):
    id: int
    question_id: int


# ==========================================
# Logic Rule Schemas
# ==========================================
class LogicRuleBase(BaseSchema):
    operator: LogicOperator
    value: str
    target_question_id: Optional[int] = None
    position: int = 0


class LogicRuleCreate(BaseSchema):
    operator: LogicOperator
    value: str
    target_question_id: Optional[int] = None
    position: Optional[int] = 0


class LogicRuleUpdate(BaseSchema):
    operator: Optional[LogicOperator] = None
    value: Optional[str] = None
    target_question_id: Optional[int] = None
    position: Optional[int] = None


class LogicRuleResponse(LogicRuleBase):
    id: int
    question_id: int


# ==========================================
# Question Schemas
# ==========================================
class QuestionBase(BaseSchema):
    type: QuestionType
    title: str = "Untitled Question"
    description: Optional[str] = None
    required: bool = False
    position: int = 0
    settings_json: Optional[str] = None


class QuestionCreate(BaseSchema):
    type: QuestionType
    title: Optional[str] = None
    description: Optional[str] = None
    required: bool = False
    position: Optional[int] = None
    settings_json: Optional[str] = None
    options: Optional[List[QuestionOptionCreate]] = None


class QuestionUpdate(BaseSchema):
    type: Optional[QuestionType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    settings_json: Optional[str] = None
    options: Optional[List[QuestionOptionCreate]] = None


class QuestionResponse(QuestionBase):
    id: int
    form_id: int
    options: List[QuestionOptionResponse] = []
    logic_rules: List[LogicRuleResponse] = []
    created_at: datetime
    updated_at: datetime


class QuestionsReorderRequest(BaseSchema):
    question_ids: List[int]


# ==========================================
# Form Schemas
# ==========================================
class FormBase(BaseSchema):
    title: str = "Untitled Form"
    theme_json: Optional[str] = None
    welcome_screen_json: Optional[str] = None
    thank_you_title: Optional[str] = "Thank you!"
    thank_you_message: Optional[str] = "Your response has been recorded."


class FormCreate(BaseSchema):
    title: Optional[str] = "Untitled Form"


class FormUpdate(BaseSchema):
    title: Optional[str] = None
    theme_json: Optional[str] = None
    welcome_screen_json: Optional[str] = None
    thank_you_title: Optional[str] = None
    thank_you_message: Optional[str] = None


class FormListItem(BaseSchema):
    id: int
    title: str
    slug: Optional[str] = None
    status: FormStatus
    response_count: int = 0
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None


class FormDetail(FormBase):
    id: int
    user_id: int
    slug: Optional[str] = None
    status: FormStatus
    response_count: int = 0
    questions: List[QuestionResponse] = []
    theme: Optional[ThemeConfig] = None
    welcome_screen: Optional[WelcomeScreenConfig] = None
    ending_screen: Optional[EndingScreenConfig] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None


# ==========================================
# Public Form Schemas (No Creator Credentials)
# ==========================================
class PublicQuestion(BaseSchema):
    id: int
    type: QuestionType
    title: str
    description: Optional[str] = None
    required: bool
    position: int
    settings_json: Optional[str] = None
    options: List[QuestionOptionResponse] = []
    logic_rules: List[LogicRuleResponse] = []


class PublicForm(BaseSchema):
    id: int
    title: str
    slug: str
    theme_json: Optional[str] = None
    welcome_screen_json: Optional[str] = None
    thank_you_title: Optional[str] = "Thank you!"
    thank_you_message: Optional[str] = "Your response has been recorded."
    theme: Optional[ThemeConfig] = None
    welcome_screen: Optional[WelcomeScreenConfig] = None
    ending_screen: Optional[EndingScreenConfig] = None
    questions: List[PublicQuestion] = []


# ==========================================
# Answer & Response Schemas
# ==========================================
class AnswerSubmit(BaseSchema):
    question_id: int
    value_text: Optional[str] = None
    value_number: Optional[float] = None
    value_json: Optional[str] = None


class ResponseSubmit(BaseSchema):
    response_id: Optional[int] = None
    answers: List[AnswerSubmit] = []
    started_at: Optional[datetime] = None


class ResponseProgressSubmit(BaseSchema):
    response_id: Optional[int] = None
    started_at: Optional[datetime] = None
    answers: List[AnswerSubmit] = []


class ResponseProgressResponse(BaseSchema):
    response_id: int


class AnswerResponse(BaseSchema):
    id: int
    question_id: int
    value_text: Optional[str] = None
    value_number: Optional[float] = None
    value_json: Optional[str] = None


class ResponseDetail(BaseSchema):
    id: int
    form_id: int
    status: ResponseStatus
    started_at: datetime
    submitted_at: Optional[datetime] = None
    answers: List[AnswerResponse] = []


class ResponseListItem(BaseSchema):
    id: int
    form_id: int
    status: ResponseStatus
    started_at: datetime
    submitted_at: Optional[datetime] = None
    answers: Dict[int, Any] = {}  # Map of question_id -> resolved answer value


class ResponseListResponse(BaseSchema):
    total: int
    page: int
    page_size: int
    items: List[ResponseListItem]


# ==========================================
# Summary / Analytics Schemas
# ==========================================
class QuestionOptionStat(BaseSchema):
    label: str
    count: int
    percentage: float


class QuestionSummary(BaseSchema):
    question_id: int
    type: QuestionType
    title: str
    total_answers: int
    # For multiple choice & dropdown
    option_stats: Optional[List[QuestionOptionStat]] = None
    # For rating & number
    average: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    distribution: Optional[Dict[str, int]] = None  # e.g., "1": 5, "2": 10
    # For text & email: recent sample answers
    recent_answers: Optional[List[str]] = None
    # For yes/no
    yes_count: Optional[int] = None
    no_count: Optional[int] = None
    yes_percentage: Optional[float] = None
    no_percentage: Optional[float] = None


class FormSummary(BaseSchema):
    form_id: int
    total_responses: int
    completed_responses: int = 0
    partial_responses: int = 0
    completion_rate: float
    average_duration_seconds: Optional[float] = None
    questions: List[QuestionSummary]
