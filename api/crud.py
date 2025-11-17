# crud.py (CÓDIGO COMPLETO E CORRIGIDO)

from sqlalchemy.orm import Session, joinedload
import models
import schemas
from typing import List, Optional

# --- Funções CRUD de Fatura ---
def get_fatura_by_chave_acesso(db: Session, chave_acesso: str):
    if not chave_acesso:
        return None
    return db.query(models.Fatura).filter(models.Fatura.chave_acesso_nfe == chave_acesso).first()

def get_fatura(db: Session, fatura_id: int):
    # Garante que os itens e o consumidor são carregados
    return db.query(models.Fatura).options(joinedload(models.Fatura.itens), joinedload(models.Fatura.consumidor)).filter(models.Fatura.id == fatura_id).first()


# --- FUNÇÃO CREATE_FATURA CORRIGIDA ---
def create_fatura(
    db: Session, 
    fatura: schemas.FaturaCreate, 
    caminho_armazenamento: str,
    nome_arquivo_original: str,
    consumidor_id: int
) -> models.Fatura:
    """ Cria uma nova fatura (incluindo itens) e o registro de Documento base. """
    
    # 1. Monta os dados para o modelo Fatura. 
    # Usamos 'itens' pois é o nome do campo no Pydantic, e o 'consumidor_id' é passado separadamente.
    fatura_data = fatura.model_dump(exclude={"itens", "consumidor_id"}) 
    
    # 2. Cria a instância do modelo models.Fatura
    db_fatura = models.Fatura(
        **fatura_data,
        caminho_armazenamento=caminho_armazenamento,
        nome_arquivo_original=nome_arquivo_original,
        consumidor_id=consumidor_id 
    )

    # 3. CRIA AS INSTÂNCIAS DE models.ItemFatura E AS ASSOCIA (RESOLVE ERRO DE TIPAGEM)
    if fatura.itens:
        for item_schema in fatura.itens: # Itera sobre fatura.itens (o nome correto)
            # item_schema é um Pydantic schemas.ItemFaturaCreate
            db_item = models.ItemFatura(**item_schema.model_dump())
            db_fatura.itens.append(db_item)

    try:
        db.add(db_fatura)
        db.commit()
        db.refresh(db_fatura)
        return db_fatura
    except Exception as e:
        db.rollback()
        print(f"Erro no CRUD ao criar fatura: {e}")
        raise # Deixa o roteador capturar o erro

# --- Funções CRUD para Usinas ---
def get_usina(db: Session, usina_id: int):
    """ Busca uma única usina pelo ID, carregando seus anexos. """
    return db.query(models.Usina).options(joinedload(models.Usina.anexos)).filter(models.Usina.id == usina_id).first()

def get_usina_by_cpf_cnpj(db: Session, cpf_cnpj: str):
    """ Busca uma usina pelo CPF/CNPJ. """
    return db.query(models.Usina).filter(models.Usina.cpf_cnpj == cpf_cnpj).first()

def get_usinas(db: Session, skip: int = 0, limit: int = 100):
    """ Busca usinas ativas. """
    return db.query(models.Usina).filter(models.Usina.is_active == True).order_by(models.Usina.id.desc()).offset(skip).limit(limit).all()

def create_usina(db: Session, usina: schemas.UsinaCreate):
    """ Cria uma nova usina SÓ com os dados base (sem anexos). """
    usina_data = usina.model_dump(exclude={'caminho_anexo'}, exclude_unset=True)
    db_usina = models.Usina(**usina_data)
    try:
        db.add(db_usina)
        db.commit()
        db.refresh(db_usina)
        return db_usina
    except Exception as e:
        db.rollback()
        print(f"Erro no CRUD ao criar usina: {e}")
        return None

def update_usina(db: Session, usina_id: int, usina_data: schemas.UsinaUpdate):
    """ Atualiza os dados base de uma usina (sem anexos). """
    db_usina = get_usina(db, usina_id=usina_id)
    if not db_usina:
        return None
    update_data = usina_data.model_dump(exclude={'caminho_anexo'}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_usina, key, value)
    try:
        db.commit()
        db.refresh(db_usina)
        return db_usina
    except Exception as e:
        db.rollback()
        print(f"Erro no CRUD ao atualizar usina {usina_id}: {e}")
        return None

def inactivate_usina(db: Session, usina_id: int):
    """ Marca uma usina como inativa (soft delete). """
    db_usina = get_usina(db, usina_id=usina_id)
    if not db_usina:
        return None
    db_usina.is_active = False
    try:
        db.commit()
        db.refresh(db_usina)
        return db_usina
    except Exception as e:
        db.rollback()
        print(f"Erro no CRUD ao inativar usina {usina_id}: {e}")
        return None

# --- Funções CRUD para Consumidores ---
def get_consumidor(db: Session, consumidor_id: int):
    """ Busca um consumidor pelo ID. """
    return db.query(models.Consumidor).filter(models.Consumidor.id == consumidor_id).first()

def get_consumidor_by_uc(db: Session, numero_uc: str):
    """ Busca um consumidor pela Unidade Consumidora. """
    if not numero_uc:
        return None
    return db.query(models.Consumidor).filter(models.Consumidor.numero_unidade_consumidora == numero_uc).first()

def get_consumidor_by_cpf_cnpj(db: Session, cpf_cnpj: str):
    """ Busca um consumidor pelo CPF/CNPJ. """
    return db.query(models.Consumidor).filter(models.Consumidor.cpf_cnpj == cpf_cnpj).first()

def get_consumidores(db: Session, skip: int = 0, limit: int = 100):
    """ Busca todos os consumidores (sem filtro duplicado). """
    return db.query(models.Consumidor).order_by(models.Consumidor.id.desc()).offset(skip).limit(limit).all()

def create_consumidor(db: Session, consumidor: schemas.ConsumidorCreate):
    """ Cria um novo consumidor SÓ com os dados base (sem anexos). """
    consumidor_data = consumidor.model_dump(exclude={'caminho_anexo'}, exclude_unset=True)
    db_consumidor = models.Consumidor(**consumidor_data)
    try:
        db.add(db_consumidor)
        db.commit()
        db.refresh(db_consumidor)
        return db_consumidor
    except Exception as e:
        db.rollback()
        print(f"Erro no CRUD ao criar consumidor: {e}")
        return None

def update_consumidor(db: Session, consumidor_id: int, consumidor_data: schemas.ConsumidorUpdate):
    """ Atualiza os dados base de um consumidor (sem anexos). """
    db_consumidor = get_consumidor(db, consumidor_id=consumidor_id)
    if not db_consumidor:
        return None

    update_data = consumidor_data.model_dump(exclude={'caminho_anexo'}, exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_consumidor, key, value)

    try:
        db.commit()
        db.refresh(db_consumidor)
        return db_consumidor
    except Exception as e:
        db.rollback()
        print(f"Erro no CRUD ao atualizar consumidor {consumidor_id}: {e}")
        return None

def inactivate_consumidor(db: Session, consumidor_id: int):
    """ Marca um consumidor como inativo (soft delete). """
    db_consumidor = get_consumidor(db, consumidor_id=consumidor_id)
    if not db_consumidor:
        return None
    db_consumidor.is_active = False
    try:
        db.commit()
        db.refresh(db_consumidor)
        return db_consumidor
    except Exception as e:
        db.rollback()
        print(f"Erro no CRUD ao inativar consumidor {consumidor_id}: {e}")
        return None

# --- Funções CRUD para Documentos (Completas) ---

def get_relatorio(db: Session, relatorio_id: int):
    """ Busca um relatório pelo ID. (Função que estava faltando)"""
    return db.query(models.Relatorio).filter(models.Relatorio.id == relatorio_id).first()


def create_relatorio(db: Session, consumidor_id: int, filename: str, filepath: str, titulo: str):
    """ Cria um novo registo de Relatório (polimórfico). """
    db_relatorio = models.Relatorio(
        consumidor_id=consumidor_id,
        nome_arquivo_original=filename,
        caminho_armazenamento=filepath, 
        titulo=titulo
    )
    try:
        db.add(db_relatorio)
        db.commit()
        db.refresh(db_relatorio)
        return db_relatorio
    except Exception as e:
        db.rollback()
        print(f"Erro no CRUD ao criar relatório: {e}")
        return None


def create_boleto(db: Session, consumidor_id: int, filename: str, filepath: str, boleto_data: schemas.BoletoCreate):
    """ Cria um novo registo de Boleto (polimórfico). """
    db_boleto = models.Boleto(
        **boleto_data.model_dump(),
        consumidor_id=consumidor_id,
        nome_arquivo_original=filename,
        caminho_armazenamento=filepath
    )
    try:
        db.add(db_boleto)
        db.commit()
        db.refresh(db_boleto)
        return db_boleto
    except Exception as e:
        db.rollback()
        print(f"Erro no CRUD ao criar boleto: {e}")
        return None # Final da função corrigido