# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega variáveis de .env (apenas para testes locais)
load_dotenv() 

# Importa os routers
from routers import auth, users, usinas, consumidores, fluxos

# Caminhos
BASE_DIR = Path(__file__).resolve().parent
ANEXOS_DIR = BASE_DIR / "anexos"

# Tenta criar as tabelas (funciona no SQLite local, mas use Migrações no PostgreSQL!)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API de Gestão de Faturas de Energia",
    version="3.0.0",
    description="Sistema para gerenciamento de faturas, usinas e consumidores de energia solar."
)

# --- Middleware CORS Principal ---
default_origins = "http://localhost:3000,http://localhost:5173"
origins_env = os.getenv("CORS_ORIGINS", default_origins)
origins = origins_env.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Montagem dos Arquivos Estáticos ---
os.makedirs(ANEXOS_DIR, exist_ok=True)
static_files_app = StaticFiles(directory=ANEXOS_DIR)

app.mount("/anexos",
    CORSMiddleware(
        app=static_files_app,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET"],
        allow_headers=["*"],
    ),
    name="anexos"
)

# --- Inclusão dos Routers ---
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(usinas.router)
app.include_router(consumidores.router)
app.include_router(fluxos.router)

@app.get("/", include_in_schema=False)
def root():
    return {"message": "Bem-vindo à API de Gestão de Faturas de Energia"}