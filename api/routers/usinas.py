# routers/usinas.py (VERSÃO COMPLETA E CORRIGIDA PARA MÚLTIPLOS ANEXOS)

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Form, File, UploadFile, status as HTTPStatus
from sqlalchemy.orm import Session, joinedload # Importar joinedload
import crud # Garanta que crud.py está atualizado
import models
import schemas
import security # Garanta que security.py tem as dependências
from database import get_db
import shutil
import uuid # Para gerar nomes únicos
import os # Para apagar ficheiros
from pathlib import Path # Para caminhos

# Definição do diretório de anexos (pode vir do main.py se preferir)
BASE_DIR = Path(__file__).resolve().parent.parent # Vai para a raiz do projeto 'api/'
ANEXOS_DIR = BASE_DIR / "anexos"
os.makedirs(ANEXOS_DIR, exist_ok=True) # Garanta que a pasta existe

router = APIRouter(
    prefix="/usinas",
    tags=["Gerenciamento de Usinas"]
)

# --- LISTAR USINAS (com anexos) ---
@router.get("/", response_model=List[schemas.Usina])
def read_usinas(
    db: Session = Depends(get_db),
    status: str = "ativas",
    admin_user: models.User = Depends(security.require_admin) # Assumindo que require_admin existe
):
    """
    Retorna uma lista de usinas, com opção de filtro por status:
    'ativas', 'excluidas', ou 'todos'. Anexos são carregados.
    """
    # Usar options(joinedload...) garante o carregamento, mesmo se lazy="joined" falhar
    query = db.query(models.Usina).options(joinedload(models.Usina.anexos))

    if status == "ativas":
        query = query.filter(models.Usina.is_active == True)
    elif status == "excluidas":
        query = query.filter(models.Usina.is_active == False)
    elif status == "todas":
        pass
    else:
        raise HTTPException(
            status_code=HTTPStatus.HTTP_400_BAD_REQUEST,
            detail=f"O parâmetro 'status' é inválido. Use 'ativos', 'excluidos' ou 'todos'."
        )

    usinas = query.order_by(models.Usina.id.desc()).all()
    return usinas

# --- CRIAR USINA (com múltiplos anexos) ---
@router.post("/", response_model=schemas.Usina)
def criar_usina(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin),
    nome: str = Form(...),
    telefone: Optional[str] = Form(None),
    cpf_cnpj: str = Form(...),
    numero_contrato: str = Form(...),
    email: Optional[str] = Form(None),
    porcentagem_retida: float = Form(...),
    is_active: bool = Form(True),
    anexo_files: List[UploadFile] = File([], description="Anexos em PDF da usina")
):
    # Verificação de existência
    db_usina_existente = crud.get_usina_by_cpf_cnpj(db, cpf_cnpj=cpf_cnpj)
    if db_usina_existente:
        raise HTTPException(status_code=HTTPStatus.HTTP_400_BAD_REQUEST, detail="Uma usina com este CPF/CNPJ já existe.")

    # 1. Cria a Usina sem os anexos
    usina_data = schemas.UsinaCreate(
        nome=nome, telefone=telefone, cpf_cnpj=cpf_cnpj,
        numero_contrato=numero_contrato, email=email,
        porcentagem_retida=porcentagem_retida,
        is_active=is_active
    )
    # Garanta que crud.create_usina está atualizado e não espera anexo
    db_usina = crud.create_usina(db=db, usina=usina_data)
    if not db_usina:
         raise HTTPException(status_code=500, detail="Erro ao criar a usina na base de dados.")

    # 2. Processa e guarda cada anexo
    anexos_criados = []
    nomes_ficheiros_guardados = []
    for file in anexo_files:
        if file.filename:
            file_extension = Path(file.filename).suffix.lower()
            if file_extension != ".pdf": # Validação simples de tipo
                 print(f"Aviso: Ficheiro {file.filename} ignorado por não ser PDF.")
                 continue
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            caminho_anexo_salvo = ANEXOS_DIR / unique_filename
            caminho_relativo_db = f"anexos/{unique_filename}"

            try:
                with open(caminho_anexo_salvo, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                nomes_ficheiros_guardados.append(caminho_anexo_salvo)

                # 3. Cria o registo AnexoUsina
                db_anexo = models.AnexoUsina(
                    nome_original=file.filename,
                    caminho_anexo=caminho_relativo_db,
                    usina_id=db_usina.id
                )
                db.add(db_anexo)
                anexos_criados.append(db_anexo)

            except Exception as e:
                print(f"Erro ao guardar anexo {file.filename}: {e}")
                # Limpa ficheiros já guardados nesta tentativa
                for path in nomes_ficheiros_guardados:
                     if os.path.exists(path):
                          try: os.remove(path)
                          except: pass
                # Poderia lançar um erro ou retornar resposta parcial
                continue # Pula para o próximo ficheiro

    # 4. Commit final
    try:
        if anexos_criados:
            db.commit()
            for anexo in anexos_criados:
                 db.refresh(anexo)
        db.refresh(db_usina) # Recarrega a usina para incluir os anexos na resposta
    except Exception as e:
        db.rollback()
        # Tenta apagar ficheiros físicos que podem ter sido guardados
        for path in nomes_ficheiros_guardados:
             if os.path.exists(path):
                  try: os.remove(path)
                  except: pass
        raise HTTPException(status_code=500, detail=f"Erro ao guardar anexos na base de dados: {e}")

    return db_usina


# --- LER UMA USINA ESPECÍFICA (com anexos) ---
@router.get("/{usina_id}", response_model=schemas.Usina)
def read_usina_by_id(
    usina_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    """ Busca uma usina pelo ID e carrega seus anexos. """
    db_usina = db.query(models.Usina).options(
        joinedload(models.Usina.anexos) # Força o carregamento dos anexos
    ).filter(models.Usina.id == usina_id).first()

    if db_usina is None:
        raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Usina não encontrada.")
    return db_usina


# --- ATUALIZAR USINA (só adiciona novos anexos) ---
@router.put("/{usina_id}", response_model=schemas.Usina)
def atualizar_usina(
    usina_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin),
    nome: str = Form(...),
    telefone: Optional[str] = Form(None),
    cpf_cnpj: str = Form(...),
    numero_contrato: str = Form(...),
    email: Optional[str] = Form(None),
    porcentagem_retida: float = Form(...),
    is_active: bool = Form(...),
    anexo_files: List[UploadFile] = File([], description="Novos anexos a adicionar")
):
    # Usar options(joinedload...) garante que os anexos são carregados para a resposta final
    db_usina = db.query(models.Usina).options(joinedload(models.Usina.anexos)).filter(models.Usina.id == usina_id).first()
    if db_usina is None:
        raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Usina não encontrada.")

    # 1. Atualiza dados básicos da Usina
    update_data = schemas.UsinaUpdate(
        nome=nome, telefone=telefone, cpf_cnpj=cpf_cnpj,
        numero_contrato=numero_contrato, email=email,
        porcentagem_retida=porcentagem_retida, is_active=is_active
    ).model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_usina, key, value)

    # 2. Processa e adiciona os NOVOS anexos
    anexos_adicionados = []
    nomes_ficheiros_guardados = []
    for file in anexo_files:
        if file.filename:
            file_extension = Path(file.filename).suffix.lower()
            if file_extension != ".pdf":
                 print(f"Aviso: Ficheiro {file.filename} ignorado por não ser PDF.")
                 continue
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            caminho_anexo_salvo = ANEXOS_DIR / unique_filename
            caminho_relativo_db = f"anexos/{unique_filename}"

            try:
                with open(caminho_anexo_salvo, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                nomes_ficheiros_guardados.append(caminho_anexo_salvo)

                db_anexo = models.AnexoUsina(
                    nome_original=file.filename,
                    caminho_anexo=caminho_relativo_db,
                    usina_id=db_usina.id
                )
                db.add(db_anexo)
                anexos_adicionados.append(db_anexo)

            except Exception as e:
                print(f"Erro ao guardar anexo {file.filename}: {e}")
                # Limpa ficheiros já guardados nesta tentativa
                for path in nomes_ficheiros_guardados:
                     if os.path.exists(path):
                          try: os.remove(path)
                          except: pass
                continue

    # 3. Commit das alterações da usina e dos novos anexos
    try:
        db.commit()
        db.refresh(db_usina) # Recarrega usina e seus anexos
    except Exception as e:
        db.rollback()
        # Limpa ficheiros físicos dos anexos que falharam no commit
        for path in nomes_ficheiros_guardados:
             if os.path.exists(path):
                  try: os.remove(path)
                  except: pass
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar usina ou adicionar anexos: {e}")

    return db_usina

# --- REMOVER UM ANEXO ESPECÍFICO ---
@router.delete("/{usina_id}/anexos/{anexo_id}", status_code=HTTPStatus.HTTP_204_NO_CONTENT)
def delete_anexo_usina(
    usina_id: int,
    anexo_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    """ Remove um anexo específico de uma usina. """
    db_anexo = db.query(models.AnexoUsina).filter(
        models.AnexoUsina.id == anexo_id,
        models.AnexoUsina.usina_id == usina_id
    ).first()

    if not db_anexo:
        raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Anexo não encontrado ou não pertence a esta usina.")

    caminho_ficheiro_fisico = BASE_DIR / db_anexo.caminho_anexo # Constrói caminho absoluto
    ficheiro_removido = False
    try:
        if os.path.isfile(caminho_ficheiro_fisico):
            os.remove(caminho_ficheiro_fisico)
            ficheiro_removido = True
            print(f"Ficheiro físico removido: {caminho_ficheiro_fisico}")
        else:
            print(f"Aviso: Ficheiro físico não encontrado para remoção: {caminho_ficheiro_fisico}")
    except Exception as e:
        print(f"Erro ao tentar remover ficheiro físico {caminho_ficheiro_fisico}: {e}")
        # Considerar se deve impedir a remoção do DB se o ficheiro não for apagado

    try:
        db.delete(db_anexo)
        db.commit()
    except Exception as e:
        db.rollback()
        if ficheiro_removido:
             print(f"ERRO CRÍTICO: Ficheiro {caminho_ficheiro_fisico} removido mas commit falhou!")
             # Poderia tentar guardar o ficheiro de volta? Difícil.
        raise HTTPException(status_code=500, detail=f"Erro ao remover anexo da base de dados: {e}")

    return Response(status_code=HTTPStatus.HTTP_204_NO_CONTENT)


# --- SOFT DELETE DA USINA ---
@router.delete("/{usina_id}", status_code=HTTPStatus.HTTP_204_NO_CONTENT)
def delete_usina(
    usina_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    db_usina = db.query(models.Usina).filter(models.Usina.id == usina_id).first()
    if db_usina:
        db_usina.is_active = False
        db.commit()
    # Nota: Anexos associados permanecem na base de dados e no disco.
    # Se quiser removê-los (físico + DB) quando a usina é inativada, adicione a lógica aqui.
    return Response(status_code=HTTPStatus.HTTP_204_NO_CONTENT)

# --- REATIVAR USINA ---
@router.put("/{usina_id}/recover", status_code=HTTPStatus.HTTP_204_NO_CONTENT)
def recover_usina(
    usina_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    db_usina = db.query(models.Usina).filter(models.Usina.id == usina_id).first()
    if not db_usina:
        raise HTTPException(status_code=404, detail="Usina não encontrada")
    # Poderia verificar se já está ativa antes de comitar
    # if db_usina.is_active:
    #     raise HTTPException(status_code=400, detail="A usina já está ativa")
    db_usina.is_active = True
    db.commit()
    return Response(status_code=HTTPStatus.HTTP_204_NO_CONTENT)
@router.get("/{usina_id}", response_model=schemas.Usina)
def read_usina(usina_id: int, db: Session = Depends(get_db)):
    """ Retorna os dados de uma única usina. """
    db_usina = crud.get_usina(db, usina_id=usina_id)
    if db_usina is None:
        raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Usina não encontrada")
    return db_usina

@router.get("/{usina_id}/consumidores", response_model=List[schemas.Consumidor])
def read_consumidores_da_usina(
    usina_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(security.require_admin)
):
    """
    Retorna uma lista de todos os consumidores associados a uma usina específica.
    """
    # 1. Busca a usina pelo ID
    db_usina = crud.get_usina(db, usina_id=usina_id)
    if db_usina is None:
        raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Usina não encontrada.")
    
    # 2. Retorna a lista de consumidores da usina
    # Esta linha mágica funciona por causa do 'relationship' definido no seu models.py
    return db_usina.consumidores