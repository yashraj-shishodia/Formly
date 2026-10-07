import json
import logging
import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import (
    Answer,
    Form,
    FormStatus,
    Question,
    QuestionOption,
    QuestionType,
    Response,
    ResponseStatus,
    User,
    utc_now,
)

logger = logging.getLogger("formly.seed")
logging.basicConfig(level=logging.INFO)


def seed_database(db: Optional[Session] = None, force: bool = False):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Create all tables first if not already created
        Base.metadata.create_all(bind=engine)

        has_seed = db.query(Form).filter(Form.slug == "cust-feedback").first()
        if has_seed and not force:
            logger.info("Database already contains seeded forms. Skipping seed.")
            return

        logger.info("Starting database seeding...")

        # 1. Creator User
        creator = db.query(User).filter(User.email == "creator@formly.io").first()
        if not creator:
            creator = User(
                email="creator@formly.io",
                name="Formly Creator",
                created_at=utc_now() - timedelta(days=60),
            )
            db.add(creator)
            db.commit()
            db.refresh(creator)

        # ----------------------------------------------------
        # Form 1: Customer Feedback Survey (Published)
        # ----------------------------------------------------
        form1 = Form(
            user_id=creator.id,
            title="Customer Feedback Survey",
            slug="cust-feedback",
            status=FormStatus.PUBLISHED.value,
            theme_json=json.dumps(
                {
                    "background_color": "#FFFFFF",
                    "text_color": "#2B2530",
                    "button_color": "#2B2530",
                    "button_text_color": "#FFFFFF",
                    "font": "Karla",
                }
            ),
            welcome_screen_json=json.dumps(
                {
                    "enabled": True,
                    "title": "We'd love your feedback",
                    "description": "Help us improve Formly by answering 4 quick questions. Takes ~2 minutes.",
                    "button_text": "Give feedback",
                }
            ),
            thank_you_title="Thank you for your feedback!",
            thank_you_message="Your insights help us build a better experience every day.",
            created_at=utc_now() - timedelta(days=35),
            updated_at=utc_now() - timedelta(days=5),
            published_at=utc_now() - timedelta(days=34),
        )
        db.add(form1)
        db.commit()
        db.refresh(form1)

        f1_q1 = Question(
            form_id=form1.id,
            type=QuestionType.SHORT_TEXT.value,
            title="What is your full name?",
            description="We'll address you by this name in our communications.",
            required=True,
            position=0,
            settings_json=json.dumps({"max_length": 100}),
        )
        f1_q2 = Question(
            form_id=form1.id,
            type=QuestionType.MULTIPLE_CHOICE.value,
            title="How did you hear about Formly?",
            description="Select the channel that introduced you to us.",
            required=True,
            position=1,
        )
        f1_q3 = Question(
            form_id=form1.id,
            type=QuestionType.RATING.value,
            title="How satisfied are you with our platform?",
            description="1 is very disappointed, 5 is extremely satisfied.",
            required=True,
            position=2,
            settings_json=json.dumps({"max_rating": 5}),
        )
        f1_q4 = Question(
            form_id=form1.id,
            type=QuestionType.LONG_TEXT.value,
            title="What is one thing we could do better?",
            description="Share any feature requests, improvements, or pain points.",
            required=False,
            position=3,
            settings_json=json.dumps({"max_length": 2000}),
        )
        db.add_all([f1_q1, f1_q2, f1_q3, f1_q4])
        db.commit()
        db.refresh(f1_q2)

        for idx, lbl in enumerate(
            ["Social Media", "Friend or Colleague", "Search Engine", "Blog or Article"]
        ):
            db.add(QuestionOption(question_id=f1_q2.id, label=lbl, position=idx))
        db.commit()

        # ----------------------------------------------------
        # Form 2: Tech Conference 2026 Registration (Published)
        # ----------------------------------------------------
        form2 = Form(
            user_id=creator.id,
            title="Tech Conference 2026 Registration",
            slug="tech-conf-2026",
            status=FormStatus.PUBLISHED.value,
            theme_json=json.dumps(
                {
                    "background_color": "#FAFAFA",
                    "text_color": "#1F1A24",
                    "button_color": "#2F7D69",
                    "button_text_color": "#FFFFFF",
                    "font": "Inter",
                }
            ),
            welcome_screen_json=json.dumps(
                {
                    "enabled": True,
                    "title": "Tech Forward 2026 Registration",
                    "description": "Join 1,000+ builders in San Francisco on Nov 14. Reserve your attendee pass.",
                    "button_text": "Register now",
                }
            ),
            thank_you_title="You're on the attendee list!",
            thank_you_message="We sent your registration confirmation and badge details to your email.",
            created_at=utc_now() - timedelta(days=28),
            updated_at=utc_now() - timedelta(days=3),
            published_at=utc_now() - timedelta(days=27),
        )
        db.add(form2)
        db.commit()
        db.refresh(form2)

        f2_q1 = Question(
            form_id=form2.id,
            type=QuestionType.SHORT_TEXT.value,
            title="Your full name",
            required=True,
            position=0,
        )
        f2_q2 = Question(
            form_id=form2.id,
            type=QuestionType.EMAIL.value,
            title="What is your work email address?",
            description="Your ticket QR code will be dispatched here.",
            required=True,
            position=1,
        )
        f2_q3 = Question(
            form_id=form2.id,
            type=QuestionType.DROPDOWN.value,
            title="Select your primary engineering discipline",
            description="Helps us recommend keynotes and breakout workshops.",
            required=True,
            position=2,
        )
        f2_q4 = Question(
            form_id=form2.id,
            type=QuestionType.NUMBER.value,
            title="How many team members will attend with you?",
            description="Enter 0 if attending solo.",
            required=True,
            position=3,
            settings_json=json.dumps({"min_value": 0, "max_value": 20}),
        )
        f2_q5 = Question(
            form_id=form2.id,
            type=QuestionType.YES_NO.value,
            title="Will you join the VIP evening networking dinner?",
            description="Limited capacity venue in downtown SF.",
            required=True,
            position=4,
        )
        db.add_all([f2_q1, f2_q2, f2_q3, f2_q4, f2_q5])
        db.commit()
        db.refresh(f2_q3)

        for idx, lbl in enumerate(
            ["Frontend Engineering", "Backend & Systems", "AI & Machine Learning", "Product & Design"]
        ):
            db.add(QuestionOption(question_id=f2_q3.id, label=lbl, position=idx))
        db.commit()

        # ----------------------------------------------------
        # Form 3: Product Usability & NPS Study (Published)
        # ----------------------------------------------------
        form3 = Form(
            user_id=creator.id,
            title="Product Usability & NPS Study",
            slug="product-nps",
            status=FormStatus.PUBLISHED.value,
            theme_json=json.dumps(
                {
                    "background_color": "#F8F9FA",
                    "text_color": "#2B2530",
                    "button_color": "#2B2530",
                    "button_text_color": "#FFFFFF",
                    "font": "Karla",
                }
            ),
            welcome_screen_json=json.dumps(
                {
                    "enabled": True,
                    "title": "Product Experience & NPS",
                    "description": "Tell us how Formly fits into your daily workflow. Fast & anonymous.",
                    "button_text": "Start survey",
                }
            ),
            thank_you_title="Submission Received!",
            thank_you_message="Thank you for contributing to our product roadmap.",
            created_at=utc_now() - timedelta(days=21),
            updated_at=utc_now() - timedelta(days=1),
            published_at=utc_now() - timedelta(days=20),
        )
        db.add(form3)
        db.commit()
        db.refresh(form3)

        f3_q1 = Question(
            form_id=form3.id,
            type=QuestionType.RATING.value,
            title="On a scale of 1 to 10, how likely are you to recommend Formly?",
            description="1 is not at all likely, 10 is extremely likely.",
            required=True,
            position=0,
            settings_json=json.dumps({"max_rating": 10}),
        )
        f3_q2 = Question(
            form_id=form3.id,
            type=QuestionType.MULTIPLE_CHOICE.value,
            title="Which capability do you rely on most?",
            required=True,
            position=1,
        )
        f3_q3 = Question(
            form_id=form3.id,
            type=QuestionType.NUMBER.value,
            title="Approximately how many forms do you manage per month?",
            required=True,
            position=2,
            settings_json=json.dumps({"min_value": 1, "max_value": 200}),
        )
        f3_q4 = Question(
            form_id=form3.id,
            type=QuestionType.YES_NO.value,
            title="Did you find keyboard navigation helpful?",
            required=True,
            position=3,
        )
        f3_q5 = Question(
            form_id=form3.id,
            type=QuestionType.SHORT_TEXT.value,
            title="What company or team are you with?",
            required=False,
            position=4,
        )
        f3_q6 = Question(
            form_id=form3.id,
            type=QuestionType.LONG_TEXT.value,
            title="Any final thoughts or wishlist items?",
            required=False,
            position=5,
        )
        db.add_all([f3_q1, f3_q2, f3_q3, f3_q4, f3_q5, f3_q6])
        db.commit()
        db.refresh(f3_q2)

        for idx, lbl in enumerate(
            ["Form Builder", "Live Preview Canvas", "Analytics Summary", "CSV Exports"]
        ):
            db.add(QuestionOption(question_id=f3_q2.id, label=lbl, position=idx))
        db.commit()

        # ----------------------------------------------------
        # Form 4: Quarterly Team Pulse (Draft)
        # ----------------------------------------------------
        form4 = Form(
            user_id=creator.id,
            title="Quarterly Team Pulse (Q4 Draft)",
            slug=None,
            status=FormStatus.DRAFT.value,
            theme_json=json.dumps(
                {
                    "background_color": "#FFFFFF",
                    "text_color": "#2B2530",
                    "button_color": "#2B2530",
                    "button_text_color": "#FFFFFF",
                    "font": "Inter",
                }
            ),
            welcome_screen_json=json.dumps(
                {
                    "enabled": True,
                    "title": "Quarterly Team Reflection",
                    "description": "Internal team survey to evaluate our velocity, culture, and alignment.",
                    "button_text": "Begin",
                }
            ),
            thank_you_title="Thanks for sharing!",
            thank_you_message="Your anonymous input will be reviewed during our quarterly all-hands.",
            created_at=utc_now() - timedelta(days=2),
            updated_at=utc_now() - timedelta(hours=4),
        )
        db.add(form4)
        db.commit()
        db.refresh(form4)

        f4_q1 = Question(
            form_id=form4.id,
            type=QuestionType.RATING.value,
            title="How energized do you feel about our current goals?",
            required=True,
            position=0,
            settings_json=json.dumps({"max_rating": 5}),
        )
        f4_q2 = Question(
            form_id=form4.id,
            type=QuestionType.LONG_TEXT.value,
            title="What could leadership do to better support your work?",
            required=False,
            position=1,
        )
        f4_q3 = Question(
            form_id=form4.id,
            type=QuestionType.FILE_UPLOAD.value,
            title="Upload any supporting documents or diagrams",
            required=False,
            position=2,
        )
        db.add_all([f4_q1, f4_q2, f4_q3])
        db.commit()

        # ----------------------------------------------------
        # Seed Realistic Submissions (35+ varied responses)
        # ----------------------------------------------------
        names = [
            "Sophia Martinez", "Liam Johnson", "Ava Patel", "Noah Chen", "Emma Davis",
            "Lucas Müller", "Mia Kim", "Ethan Wright", "Isabella Rossi", "Oliver Scott",
            "Charlotte Brooks", "Aiden Taylor", "Amelia Zhang", "James Wilson", "Harper Lee",
            "Benjamin Moore", "Evelyn Garcia", "Alexander White", "Chloe Anderson", "Daniel Martin"
        ]

        feedback_comments = [
            "Smooth keyboard navigation, feels just like Typeform!",
            "Love the clean aesthetics and typography.",
            "Adding webhook triggers would make it even more complete.",
            "Super fast response time on mobile screens.",
            "Builder preview was very helpful when creating questions.",
            "The inline editor made building quick and effortless.",
            "Looking forward to custom CSS support.",
            "Great overall user experience and snappy animations.",
        ]

        companies = [
            "Stripe", "Figma", "Notion", "Linear", "Vercel", "OpenAI", "Airbnb", "Datadog", "Retool"
        ]

        now = utc_now()

        # Seed Form 1 Responses (15 responses: 13 completed, 2 partial)
        for i in range(15):
            days_ago = random.uniform(1.0, 30.0)
            duration_secs = random.randint(35, 150)
            started = now - timedelta(days=days_ago, seconds=duration_secs)
            is_partial = (i >= 13)
            submitted = None if is_partial else (now - timedelta(days=days_ago))

            status_val = ResponseStatus.PARTIAL.value if is_partial else ResponseStatus.COMPLETED.value
            resp = Response(
                form_id=form1.id,
                status=status_val,
                started_at=started,
                submitted_at=submitted,
            )
            db.add(resp)
            db.commit()
            db.refresh(resp)

            name = names[i % len(names)]
            channels = ["Social Media", "Friend or Colleague", "Search Engine", "Blog or Article"]
            channel = random.choice(channels)
            rating = random.choices([4, 5, 3, 2], weights=[45, 35, 15, 5])[0]

            db.add(Answer(response_id=resp.id, question_id=f1_q1.id, value_text=name))
            db.add(Answer(response_id=resp.id, question_id=f1_q2.id, value_text=channel))

            if not is_partial:
                db.add(Answer(response_id=resp.id, question_id=f1_q3.id, value_number=float(rating)))
                if random.random() > 0.3:
                    db.add(Answer(response_id=resp.id, question_id=f1_q4.id, value_text=random.choice(feedback_comments)))

            db.commit()

        # Seed Form 2 Responses (12 responses: 11 completed, 1 partial)
        disciplines = ["Frontend Engineering", "Backend & Systems", "AI & Machine Learning", "Product & Design"]
        for i in range(12):
            days_ago = random.uniform(1.0, 24.0)
            duration_secs = random.randint(45, 180)
            started = now - timedelta(days=days_ago, seconds=duration_secs)
            is_partial = (i == 11)
            submitted = None if is_partial else (now - timedelta(days=days_ago))

            status_val = ResponseStatus.PARTIAL.value if is_partial else ResponseStatus.COMPLETED.value
            resp = Response(
                form_id=form2.id,
                status=status_val,
                started_at=started,
                submitted_at=submitted,
            )
            db.add(resp)
            db.commit()
            db.refresh(resp)

            name = names[(i + 5) % len(names)]
            email_user = name.lower().replace(" ", ".")
            email = f"{email_user}@example.com"
            disc = random.choice(disciplines)
            team_size = random.choice([0, 1, 2, 3, 5])
            dinner = random.choice(["yes", "no"])

            db.add(Answer(response_id=resp.id, question_id=f2_q1.id, value_text=name))
            db.add(Answer(response_id=resp.id, question_id=f2_q2.id, value_text=email))
            db.add(Answer(response_id=resp.id, question_id=f2_q3.id, value_text=disc))

            if not is_partial:
                db.add(Answer(response_id=resp.id, question_id=f2_q4.id, value_number=float(team_size)))
                db.add(Answer(response_id=resp.id, question_id=f2_q5.id, value_text=dinner))

            db.commit()

        # Seed Form 3 Responses (10 responses: 9 completed, 1 partial)
        features_list = ["Form Builder", "Live Preview Canvas", "Analytics Summary", "CSV Exports"]
        for i in range(10):
            days_ago = random.uniform(0.5, 18.0)
            duration_secs = random.randint(40, 160)
            started = now - timedelta(days=days_ago, seconds=duration_secs)
            is_partial = (i == 9)
            submitted = None if is_partial else (now - timedelta(days=days_ago))

            status_val = ResponseStatus.PARTIAL.value if is_partial else ResponseStatus.COMPLETED.value
            resp = Response(
                form_id=form3.id,
                status=status_val,
                started_at=started,
                submitted_at=submitted,
            )
            db.add(resp)
            db.commit()
            db.refresh(resp)

            nps = random.choices([8, 9, 10, 7, 6], weights=[30, 35, 25, 5, 5])[0]
            fav_feat = random.choice(features_list)
            vol = random.choice([2, 5, 10, 15, 25])
            nav_helpful = random.choice(["yes", "true", "yes"])
            company = random.choice(companies)

            db.add(Answer(response_id=resp.id, question_id=f3_q1.id, value_number=float(nps)))
            db.add(Answer(response_id=resp.id, question_id=f3_q2.id, value_text=fav_feat))

            if not is_partial:
                db.add(Answer(response_id=resp.id, question_id=f3_q3.id, value_number=float(vol)))
                db.add(Answer(response_id=resp.id, question_id=f3_q4.id, value_text=nav_helpful))
                db.add(Answer(response_id=resp.id, question_id=f3_q5.id, value_text=company))
                if random.random() > 0.4:
                    db.add(Answer(response_id=resp.id, question_id=f3_q6.id, value_text=random.choice(feedback_comments)))

            db.commit()

        logger.info(
            "Database seeding complete: 1 user, 4 forms (3 published, 1 draft), all 8 question types, and 37 realistic responses."
        )

    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_database()
