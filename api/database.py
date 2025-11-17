# database.py (VERSÃO CORRIGIDA)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./faturas.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# --- FUNÇÃO ADICIONADA ---
# Esta função é a dependência que fornece uma sessão do banco de dados para os endpoints.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()