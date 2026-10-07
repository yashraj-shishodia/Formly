import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class FormStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class ResponseStatus(str, enum.Enum):
    PARTIAL = "partial"
    COMPLETED = "completed"


class QuestionType(str, enum.Enum):
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    MULTIPLE_CHOICE = "multiple_choice"
    DROPDOWN = "dropdown"
    EMAIL = "email"
    NUMBER = "number"
    YES_NO = "yes_no"
    RATING = "rating"


class LogicOperator(str, enum.Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    forms = relationship("Form", back_populates="user", cascade="all, delete-orphan")


class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Untitled Form")
    slug = Column(String(64), unique=True, index=True, nullable=True)
    status = Column(String(32), default=FormStatus.DRAFT.value, nullable=False)
    theme_json = Column(Text, nullable=True)  # JSON string for colors, font, background
    welcome_screen_json = Column(Text, nullable=True)  # JSON string for welcome screen config
    thank_you_title = Column(String(255), default="Thank you!", nullable=True)
    thank_you_message = Column(Text, default="Your response has been recorded.", nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="forms")
    questions = relationship(
        "Question",
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
    )
    responses = relationship(
        "Response",
        back_populates="form",
        cascade="all, delete-orphan",
    )


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(64), nullable=False)  # QuestionType enum value
    title = Column(String(500), nullable=False, default="Untitled Question")
    description = Column(Text, nullable=True)
    required = Column(Boolean, default=False, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    settings_json = Column(Text, nullable=True)  # JSON string for rating max, number min/max, placeholder
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    form = relationship("Form", back_populates="questions")
    options = relationship(
        "QuestionOption",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionOption.position",
    )
    logic_rules = relationship(
        "QuestionLogicRule",
        foreign_keys="[QuestionLogicRule.question_id]",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionLogicRule.position",
    )
    answers = relationship(
        "Answer",
        back_populates="question",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_questions_form_pos", "form_id", "position"),
    )


class QuestionLogicRule(Base):
    __tablename__ = "question_logic_rules"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    operator = Column(String(32), nullable=False)
    value = Column(String(255), nullable=False)
    target_question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=True, index=True)
    position = Column(Integer, nullable=False, default=0)

    question = relationship("Question", foreign_keys=[question_id], back_populates="logic_rules")
    target_question = relationship("Question", foreign_keys=[target_question_id])

    __table_args__ = (
        Index("ix_question_logic_rules_q_pos", "question_id", "position"),
    )


class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(255), nullable=False)
    position = Column(Integer, nullable=False, default=0)

    question = relationship("Question", back_populates="options")

    __table_args__ = (
        Index("ix_question_options_q_pos", "question_id", "position"),
    )


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(32), default=ResponseStatus.COMPLETED.value, nullable=False)
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    form = relationship("Form", back_populates="responses")
    answers = relationship(
        "Answer",
        back_populates="response",
        cascade="all, delete-orphan",
    )


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("responses.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    value_text = Column(Text, nullable=True)
    value_number = Column(Float, nullable=True)
    value_json = Column(Text, nullable=True)  # JSON string for choices array, boolean, etc.

    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    __table_args__ = (
        UniqueConstraint("response_id", "question_id", name="uq_response_question"),
        Index("ix_answers_response_question", "response_id", "question_id"),
    )
