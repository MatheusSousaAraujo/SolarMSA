
# routers/consumidores.py (VERSÃO FINAL E CORRIGIDA)

from typing import List, Optional, Dict, Union
# CORREÇÃO DE SINTAXE: Renomeamos 'status' para HTTPStatus para evitar conflito
from fastapi import APIRouter, Depends, HTTPException, Response, status as HTTPStatus 
from sqlalchemy.orm import Session, joinedload # Importamos joinedload
import crud, models, schemas
from database import get_db

router = APIRouter(
    prefix="/consumidores",
    tags=["Gerenciamento de Consumidores"]
)

# --- ROTA PARA CRIAR CONSUMIDOR ---
@router.post("/", response_model=schemas.Consumidor)
def create_consumidor(
    consumidor: schemas.ConsumidorCreate, 
    db: Session = Depends(get_db),
    # Adicionar segurança aqui se necessário: admin_user: models.User = Depends(security.require_admin) 
):
    """ Cria um novo consumidor a partir de dados JSON. """
    db_consumidor_existente_cpf = crud.get_consumidor_by_cpf_cnpj(db, cpf_cnpj=consumidor.cpf_cnpj)
    if db_consumidor_existente_cpf:
        raise HTTPException(status_code=HTTPStatus.HTTP_400_BAD_REQUEST, detail="Um consumidor com este CPF/CNPJ já existe.")
    
    db_consumidor_existente_uc = crud.get_consumidor_by_uc(db, numero_uc=consumidor.numero_unidade_consumidora)
    if db_consumidor_existente_uc:
         raise HTTPException(status_code=HTTPStatus.HTTP_400_BAD_REQUEST, detail="Um consumidor com esta Unidade Consumidora já existe.")

    created_consumidor = crud.create_consumidor(db=db, consumidor=consumidor)
    if not created_consumidor:
         raise HTTPException(status_code=HTTPStatus.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao criar consumidor.")
    return created_consumidor


# --- ROTA PARA LISTAR CONSUMIDORES (FILTRO CORRIGIDO) ---
@router.get("/", response_model=List[schemas.Consumidor])
def ler_consumidores(
    db: Session = Depends(get_db),
    status: str = "ativos", # Padrão: ativos
    usina_id: Optional[int] = None, 
    skip: int = 0, 
    limit: int = 100,
    # Adicionar segurança aqui se necessário: admin_user: models.User = Depends(security.require_admin)
):
    """ Retorna uma lista de consumidores, filtrada por status e, opcionalmente, por usina_id. """
    
    # Garantimos que a query básica carrega a Usina (se necessário no frontend)
    query = db.query(models.Consumidor).options(joinedload(models.Consumidor.usina))

    # --- LÓGICA DO FILTRO DE STATUS ---
    if status == "ativos": 
        query = query.filter(models.Consumidor.is_active == True)
    elif status == "excluidos":
        query = query.filter(models.Consumidor.is_active == False)
    elif status == "todos":
        pass # Sem filtro de status
    else:
        # A API retorna este erro quando a string não é reconhecida
        raise HTTPException(
            status_code=HTTPStatus.HTTP_400_BAD_REQUEST, 
            detail="O parâmetro 'status' é inválido. Use 'ativos', 'excluidos' ou 'todos'." 
        )
    
    # Aplica o filtro usina_id se fornecido
    if usina_id is not None:
        query = query.filter(models.Consumidor.usina_id == usina_id)

    consumidores = query.order_by(models.Consumidor.id.desc()).offset(skip).limit(limit).all()
    return consumidores


# --- ROTA PARA BUSCAR UM CONSUMIDOR ---
@router.get("/{consumidor_id}", response_model=schemas.Consumidor)
def ler_consumidor(consumidor_id: int, db: Session = Depends(get_db)):
    # Garante que a Usina é carregada ao buscar um único consumidor
    db_consumidor = db.query(models.Consumidor).options(joinedload(models.Consumidor.usina)).filter(models.Consumidor.id == consumidor_id).first()
    if db_consumidor is None:
        raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Consumidor não encontrado.")
    return db_consumidor


# --- ROTA PARA ATUALIZAR UM CONSUMIDOR ---
@router.put("/{consumidor_id}", response_model=schemas.Consumidor)
def atualizar_consumidor(
    consumidor_id: int,
    consumidor_update: schemas.ConsumidorUpdate,
    db: Session = Depends(get_db),
    # Adicionar segurança aqui se necessário: admin_user: models.User = Depends(security.require_admin)
):
    """ Atualiza um consumidor a partir de dados JSON. """
    db_consumidor = crud.get_consumidor(db, consumidor_id=consumidor_id)
    if db_consumidor is None:
        raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Consumidor não encontrado.")
    
    updated_consumidor = crud.update_consumidor(db, consumidor_id=consumidor_id, consumidor_data=consumidor_update)
    if not updated_consumidor:
        raise HTTPException(status_code=HTTPStatus.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao atualizar consumidor.")
    return updated_consumidor


# --- ROTA PARA DELETAR (SOFT DELETE) CONSUMIDOR ---
@router.delete("/{consumidor_id}", status_code=HTTPStatus.HTTP_204_NO_CONTENT)
def delete_consumidor(
    consumidor_id: int, 
    db: Session = Depends(get_db),
    # Adicionar segurança aqui se necessário: admin_user: models.User = Depends(security.require_admin)
):
    """ Marca um consumidor como inativo (soft delete). """
    success = crud.inactivate_consumidor(db, consumidor_id=consumidor_id)
    if not success:
         raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Consumidor não encontrado para inativar.")
    return Response(status_code=HTTPStatus.HTTP_204_NO_CONTENT)


# --- ROTA PARA RECUPERAR CONSUMIDOR ---
@router.put("/{consumidor_id}/recover", status_code=HTTPStatus.HTTP_204_NO_CONTENT)
def recover_consumidor(
    consumidor_id: int,
    db: Session = Depends(get_db),
    # Adicionar segurança aqui se necessário: admin_user: models.User = Depends(security.require_admin)
):
    """ Reativa um consumidor que foi marcado como inativo. """
    db_consumidor = db.query(models.Consumidor).filter(models.Consumidor.id == consumidor_id).first()
    if not db_consumidor:
        raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Consumidor não encontrado")
    
    db_consumidor.is_active = True
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=HTTPStatus.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao reativar consumidor: {e}")

    return Response(status_code=HTTPStatus.HTTP_204_NO_CONTENT)

@router.get("/{consumidor_id}/documentos", response_model=Dict[str, List[schemas.Documento]]) # <--- 'schemas.Documento' agora existe
def get_documentos_consumidor(
    consumidor_id: int,
    db: Session = Depends(get_db),
    # Adicionar segurança aqui se necessário: admin_user: models.User = Depends(security.require_admin)
):
    """
    Retorna todos os documentos (faturas, boletos, relatórios) vinculados a um consumidor,
    separados por tipo.
    """
    db_consumidor = db.query(models.Consumidor).filter(models.Consumidor.id == consumidor_id).first()
    if not db_consumidor:
        raise HTTPException(status_code=HTTPStatus.HTTP_404_NOT_FOUND, detail="Consumidor não encontrado.")

    documentos_por_tipo = {
        "faturas": [],
        "boletos": [],
        "relatorios": []
    }

    for doc in db_consumidor.documentos:
        if isinstance(doc, models.Fatura):
            fatura_com_itens = db.query(models.Fatura).options(joinedload(models.Fatura.itens)).filter(models.Fatura.id == doc.id).first()
            if fatura_com_itens:
                documentos_por_tipo["faturas"].append(fatura_com_itens)
        elif isinstance(doc, models.Boleto):
            documentos_por_tipo["boletos"].append(doc)
        elif isinstance(doc, models.Relatorio):
            documentos_por_tipo["relatorios"].append(doc)
            
    return {
        "faturas": [schemas.Fatura.model_validate(fatura) for fatura in documentos_por_tipo["faturas"]],
        "boletos": [schemas.Boleto.model_validate(boleto) for boleto in documentos_por_tipo["boletos"]],
        "relatorios": [schemas.Relatorio.model_validate(relatorio) for relatorio in documentos_por_tipo["relatorios"]]
    }