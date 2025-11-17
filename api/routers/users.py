from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session ,joinedload
from typing import List, Optional
import crud, models, schemas, security
from database import get_db

router = APIRouter(
    prefix="/users",
    tags=["Gerenciamento de Usuários"]
)



@router.get("/", response_model=List[schemas.UserRead])
def read_users(
    db: Session = Depends(get_db),
    status: str = "ativos",
    admin_user: models.User = Depends(security.require_admin)
):
    """
    Retorna uma lista de usuários, com opção de filtro por status:
    'ativos', 'excluidos', ou 'todos'.
    """
    query = db.query(models.User).options(joinedload(models.User.consumidor))

    if status == "ativos":
        query = query.filter(models.User.is_active == True)
    elif status == "excluidos":
        query = query.filter(models.User.is_active == False)
    elif status == "todos":
        # Se for "todos", não aplicamos nenhum filtro. 'pass' indica que a ação é intencional.
        pass
    else:
        # Se for qualquer outro valor, retorna um erro claro.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"O parâmetro 'status' é inválido. Use 'ativos', 'excluidos' ou 'todos'."
        )

    users = query.all()
    return users


@router.get("/{user_id}", response_model=schemas.UserRead)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    db_user = db.query(models.User).options(joinedload(models.User.consumidor)).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return db_user

@router.post("/", response_model=schemas.UserRead)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    db_user_existente = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user_existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado")

    hashed_password = security.get_password_hash(user.password)
    user_data = user.model_dump(exclude={"password"})
    db_user = models.User(**user_data, hashed_password=hashed_password, is_active=True)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=schemas.UserRead)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        hashed_password = security.get_password_hash(update_data["password"])
        db_user.hashed_password = hashed_password
        del update_data["password"]

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.is_active = False
        db.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=schemas.UserRead)
async def read_users_me(current_user: models.User = Depends(security.get_current_active_user)):
    return current_user


# Em api/routers/users.py
# Adicione este endpoint, de preferência após a função delete_user

@router.put("/{user_id}/recover", status_code=status.HTTP_204_NO_CONTENT)
def recover_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    """
    Reativa um usuário que foi logicamente excluído.
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if db_user.is_active:
        raise HTTPException(status_code=400, detail="O usuário já está ativo")

    db_user.is_active = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)