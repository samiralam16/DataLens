import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

# Load environment variables (if .env exists)
load_dotenv()


class Base(DeclarativeBase):
    pass


# ---------------- Database Configuration ----------------

# Ensure app.db is always stored in the same folder as this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "app.db")

# Pick DATABASE_URL from env, otherwise fallback to SQLite file
DATABASE_URL = os.environ.get("DATABASE_URL") or f"sqlite:///{DB_PATH}"

# Fix Heroku-style postgres:// URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Metadata reference (if needed for Alembic/migrations)
metadata = MetaData()


# ---------------- Helper Functions ----------------

def get_db():
    """Dependency that provides a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Ensure all tables defined in models.py are created."""
    Base.metadata.create_all(bind=engine)
