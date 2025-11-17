# main.py (Revertido para a versão compatível com sua biblioteca)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
import os
from pathlib import Path

# Importa os routers
from routers import auth, users, usinas, consumidores, fluxos

# Caminhos
BASE_DIR = Path(__file__).resolve().parent
ANEXOS_DIR = BASE_DIR / "anexos"

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API de Gestão de Faturas de Energia",
    version="3.0.0",
    description="Sistema para gerenciamento de faturas, usinas e consumidores de energia solar."
)

# --- Middleware CORS Principal (para os endpoints da API) ---
origins = [
    "http://localhost:3000",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Montagem dos Arquivos Estáticos com seu PRÓPRIO Middleware CORS ---
# Esta é a abordagem correta para versões mais antigas do FastAPI/Starlette.

# Garante que o diretório 'anexos' existe
os.makedirs(ANEXOS_DIR, exist_ok=True)

# 1. Criamos a aplicação de arquivos estáticos
static_files_app = StaticFiles(directory=ANEXOS_DIR)

# 2. "Embrulhamos" essa aplicação com um middleware CORS dedicado
app.mount("/anexos",
    CORSMiddleware(
        app=static_files_app,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET"],  # Apenas GET é necessário para servir arquivos
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