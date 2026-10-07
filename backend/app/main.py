import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
import app.models  # noqa: F401
from app.routers import files, forms, public, questions, responses
from app.seed import seed_database

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize all database tables on application startup
    Base.metadata.create_all(bind=engine)

    # Auto-seed if database is empty or SEED_ON_START is explicitly set
    seed_on_start = os.getenv("SEED_ON_START", "false").lower() == "true"
    db = SessionLocal()
    try:
        from app.models import Form
        if seed_on_start or db.query(Form).count() == 0:
            seed_database(db=db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="Formly API",
    description="Backend API for Formly (Typeform Clone)",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
cors_origins_str = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
)
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
has_wildcard = "*" in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if has_wildcard else (origins if origins else ["http://localhost:3000", "http://127.0.0.1:3000"]),
    allow_credentials=not has_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(public.router)
app.include_router(responses.router)
app.include_router(files.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "app": "Formly Backend",
        "version": "1.0.0",
    }
