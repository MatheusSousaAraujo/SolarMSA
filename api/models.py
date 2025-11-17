# models.py (VERSÃO PARA MÚLTIPLOS ANEXOS)

import datetime
import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime, Date, Enum
from sqlalchemy.orm import relationship
from database import Base
from pathlib import Path # Importar Path

# --- Enum para Níveis de Acesso ---
class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    CONSUMIDOR = "CONSUMIDOR"

# --- Modelo Base para todos os Documentos ---
# (Esta parte parece correta, mantida como está)
class Documento(Base):
    __tablename__ = "documentos"
    id = Column(Integer, primary_key=True, index=True)
    nome_arquivo_original = Column(String, index=True)
    caminho_armazenamento = Column(String, unique=True)
    data_upload = Column(DateTime, default=datetime.datetime.utcnow)
    type = Column(String(50))
    consumidor_id = Column(Integer, ForeignKey("consumidores.id"), nullable=False)
    consumidor = relationship("Consumidor", back_populates="documentos")
    __mapper_args__ = {"polymorphic_identity": "documento", "polymorphic_on": type}

class Fatura(Documento):
    # ... (Seu modelo Fatura)
    __tablename__ = "faturas"
    id = Column(Integer, ForeignKey("documentos.id"), primary_key=True)
    nome_cliente = Column(String, index=True)
    cpf_cnpj = Column(String)
    numero_unidade_consumidora = Column(String, index=True)
    data_vencimento = Column(String) # Considerar usar Date ou DateTime aqui
    valor_total = Column(Float)
    chave_acesso_nfe = Column(String, unique=True)
    mes_referencia = Column(String)
    cosip_municipal = Column(Float, nullable=True)
    itens = relationship("ItemFatura", back_populates="fatura", cascade="all, delete-orphan")
    __mapper_args__ = {"polymorphic_identity": "fatura"}


class Boleto(Documento):
    # ... (Seu modelo Boleto)
    __tablename__ = 'boletos'
    id = Column(Integer, ForeignKey('documentos.id'), primary_key=True)
    linha_digitavel = Column(String, unique=True, nullable=True)
    valor_cobrado = Column(Float)
    data_vencimento = Column(Date)
    __mapper_args__ = {'polymorphic_identity': 'boleto'}


class Relatorio(Documento):
    # ... (Seu modelo Relatorio)
    __tablename__ = 'relatorios'
    id = Column(Integer, ForeignKey('documentos.id'), primary_key=True)
    titulo = Column(String)
    __mapper_args__ = {'polymorphic_identity': 'relatorio'}


class ItemFatura(Base):
    # ... (Seu modelo ItemFatura)
    __tablename__ = "itens_fatura"
    id = Column(Integer, primary_key=True, index=True)
    fatura_id = Column(Integer, ForeignKey("faturas.id"))
    codigo = Column(String, nullable=True)
    descricao = Column(String, nullable=True)
    unidade = Column(String, nullable=True)
    quantidade = Column(Float, nullable=True)
    preco_unit_com_trib = Column(Float, nullable=True)
    valor_rs = Column(Float, nullable=True)
    cofins_pis_rs = Column(Float, nullable=True)
    base_calculo_icms_rs = Column(Float, nullable=True)
    aliquota_icms_percent = Column(Float, nullable=True)
    icms_rs = Column(Float, nullable=True)
    tarifa_unitaria_rs = Column(Float, nullable=True)
    fatura = relationship("Fatura", back_populates="itens")


class Usina(Base):
    __tablename__ = "usinas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    telefone = Column(String, nullable=True)
    cpf_cnpj = Column(String, unique=True, index=True)
    numero_contrato = Column(String, unique=True)
    email = Column(String, nullable=True)
    porcentagem_retida = Column(Float)
    # --- REMOVER a coluna caminho_anexo ---
    # caminho_anexo = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    
    consumidores = relationship("Consumidor", back_populates="usina", cascade="all, delete-orphan")
    # --- ADICIONAR a relação para múltiplos anexos ---
    # lazy="joined" faz com que os anexos sejam carregados automaticamente com a usina
    anexos = relationship("AnexoUsina", back_populates="usina", cascade="all, delete-orphan", lazy="joined")

class Consumidor(Base):
    __tablename__ = "consumidores"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    telefone = Column(String, nullable=True)
    cpf_cnpj = Column(String, unique=True, index=True)
    numero_unidade_consumidora = Column(String, unique=True, index=True)
    numero_contrato = Column(String, unique=True)
    email = Column(String, nullable=True)
    porcentagem_desconto = Column(Float)
    # --- REMOVER a coluna caminho_anexo se existir ---
    # caminho_anexo = Column(String, nullable=True) 
    is_active = Column(Boolean, default=True, index=True)
    usina_id = Column(Integer, ForeignKey("usinas.id"))
    
    # Relacionamentos
    usina = relationship("Usina", back_populates="consumidores")
    documentos = relationship("Documento", back_populates="consumidor")
    user = relationship("User", back_populates="consumidor", uselist=False)

# --- Modelo de Usuário para Autenticação ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(RoleEnum), nullable=False)
    consumidor_id = Column(Integer, ForeignKey("consumidores.id"), nullable=True)
    
    # Relacionamento
    consumidor = relationship("Consumidor", back_populates="user")


# --- NOVO MODELO PARA ANEXOS DA USINA ---
class AnexoUsina(Base):
    __tablename__ = "anexos_usina"
    
    id = Column(Integer, primary_key=True, index=True)
    nome_original = Column(String, nullable=True) # Guarda o nome original para exibição
    caminho_anexo = Column(String, nullable=False, unique=True) # Caminho relativo com nome único (UUID)
    
    usina_id = Column(Integer, ForeignKey("usinas.id"), nullable=False)
    usina = relationship("Usina", back_populates="anexos")