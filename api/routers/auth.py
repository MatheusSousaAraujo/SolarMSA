# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
# Seus arquivos parecem usar 'security' em vez de 'crud' para o token, então mantive assim.
import models, schemas, security 
from database import get_db

router = APIRouter(tags=["Autenticação"])

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # 1. Busca o usuário no banco de dados
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    # 2. Verifica se o usuário existe e se a senha está correta
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # --- ADICIONE ESTE BLOCO AQUI ---
    # 3. Verifica se o usuário está ativo ANTES de criar o token
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este usuário está inativo e não pode fazer login.",
        )
    # ---------------------------------

    # 4. Se tudo estiver certo, cria e retorna o token de acesso
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}