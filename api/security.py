# security.py (CORRIGIDO)
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

# --- IMPORTS CORRIGIDOS ---
import models
from database import get_db 

# ... (o resto do arquivo continua igual)
SECRET_KEY = "SUA_CHAVE_SECRETA_REAL_AQUI"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Em api/security.py

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # --- BLOCO DE DEPURAÇÃO ---
        print("\n--- TENTANDO VALIDAR TOKEN ---")
        print(f"Token recebido pela API: {token[:30]}...") # Mostra o início do token
        print(f"Usando SECRET_KEY: {SECRET_KEY}")
        print(f"Usando ALGORITHM: {ALGORITHM}")
        # --- FIM DO BLOCO DE DEPURAÇÃO ---

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        print(f"Token decodificado com sucesso para o email: {email}")
        print("--------------------------------\n")

        if email is None:
            raise credentials_exception
            
    except jwt.PyJWTError as e:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    # --- ADICIONE ESTE BLOCO PARA DEPURAR ---
    print("\n--- DENTRO DE GET_CURRENT_ACTIVE_USER ---")
    print(f"Verificando usuário: {current_user.email}")
    print(f"Status 'is_active': {current_user.is_active}")
    print("---------------------------------------\n")
    # --- FIM DO BLOCO DE DEPURAÇÃO ---

    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_admin(current_user: models.User = Depends(get_current_active_user)):
    # --- ADICIONE ESTE BLOCO PARA DEPURAR ---
    print("\n--- DENTRO DE REQUIRE_ADMIN ---")
    print(f"Verificando role para: {current_user.email}")
    print(f"Role do usuário: {current_user.role}")
    print("-----------------------------\n")
    # --- FIM DO BLOCO DE DEPURAÇÃO ---

    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acesso negado: Requer privilégios de Administrador."
        )
    return current_user

def require_consumidor(current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != models.RoleEnum.CONSUMIDOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acesso negado: Requer privilégios de Consumidor."
        )
    return current_user