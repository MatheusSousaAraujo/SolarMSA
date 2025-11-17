# database.py (VERSÃO CORRIGIDA PARA DEPLOY)

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# 1. Carrega o .env (para seus testes locais)
load_dotenv()

# 2. A MUDANÇA PRINCIPAL:
# Pega a "DATABASE_URL" do Render.
# Se não achar (estiver rodando local), usa o seu "sqlite:///./faturas.db" como padrão.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./faturas.db")


# 3. Lógica extra: O 'connect_args' SÓ pode ser usado com SQLite.
# Se usarmos com PostgreSQL (no Render), dará erro.
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}


# 4. Cria o engine com a URL dinâmica e os argumentos condicionais
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

# --- Daqui para baixo, tudo igual ---

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