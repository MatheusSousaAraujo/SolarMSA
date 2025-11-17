# main.py (Modificado para usar Variáveis de Ambiente)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
import os
from pathlib import Path
from dotenv import load_dotenv # 1. Importar load_dotenv

# 2. Carregar variáveis de .env (para testes locais)
load_dotenv() 

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
# 3. Ler as origens das variáveis de ambiente
# Define um padrão para o ambiente local
default_origins = "http://localhost:3000,http://localhost:5173"

# Pega a variável 'CORS_ORIGINS' do Render, ou usa o padrão se não existir
origins_env = os.getenv("CORS_ORIGINS", default_origins)

# Converte a string (separada por vírgula) em uma lista
origins = origins_env.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Usa a lista dinâmica
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Montagem dos Arquivos Estáticos com seu PRÓPRIO Middleware CORS ---
os.makedirs(ANEXOS_DIR, exist_ok=True)
static_files_app = StaticFiles(directory=ANEXOS_DIR)

app.mount("/anexos",
    CORSMiddleware(
        app=static_files_app,
        allow_origins=origins, # Usa a mesma lista dinâmica
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