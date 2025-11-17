# schemas.py (VERSÃO CORRIGIDA PARA GARANTIR A SERIALIZAÇÃO COMPLETA)

import datetime
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional, Union # Import Union here

# Tente importar RoleEnum do models ou defina-o aqui se necessário
try:
    from models import RoleEnum
except ImportError:
    import enum
    class RoleEnum(str, enum.Enum):
        ADMIN = "ADMIN"
        CONSUMIDOR = "CONSUMIDOR"

# --- SCHEMAS PARA USUÁRIO E AUTENTICAÇÃO ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: RoleEnum
    consumidor_id: Optional[int] = None

class ConsumidorInfoForUser(BaseModel):
    id: int
    nome: str
    model_config = ConfigDict(from_attributes=True)

class UserRead(UserBase):
    id: int
    is_active: bool
    role: RoleEnum
    consumidor_id: Optional[int] = None
    consumidor: Optional[ConsumidorInfoForUser] = None
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[RoleEnum] = None
    consumidor_id: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- SCHEMAS PARA ANEXO USINA (NOVO) ---
class AnexoUsinaBase(BaseModel):
    nome_original: Optional[str] = None
    caminho_anexo: str

class AnexoUsinaCreate(AnexoUsinaBase):
    pass

class AnexoUsina(AnexoUsinaBase):
    id: int
    usina_id: int
    model_config = ConfigDict(from_attributes=True)
# ------------------------------------

# --- SCHEMAS PARA USINA (CORRIGIDOS) ---
class UsinaBase(BaseModel):
    nome: str
    telefone: Optional[str] = None
    cpf_cnpj: str
    numero_contrato: str
    email: Optional[str] = None
    porcentagem_retida: float
    is_active: bool = True

class UsinaCreate(UsinaBase):
    pass

class Usina(UsinaBase):
    id: int
    anexos: List[AnexoUsina] = []
    model_config = ConfigDict(from_attributes=True)

class UsinaUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    numero_contrato: Optional[str] = None
    email: Optional[str] = None
    porcentagem_retida: Optional[float] = None
    is_active: Optional[bool] = None

# --- SCHEMA AUXILIAR PARA USINA DENTRO DO CONSUMIDOR ---
class UsinaInfoForConsumidor(BaseModel):
    id: int
    nome: str
    cpf_cnpj: str
    model_config = ConfigDict(from_attributes=True)
# --------------------------------------------------------

# --- SCHEMAS PARA CONSUMIDOR (CORRIGIDOS) ---
class ConsumidorBase(BaseModel):
    nome: str
    numero_unidade_consumidora: str
    telefone: Optional[str] = None
    cpf_cnpj: str
    numero_contrato: str
    email: Optional[str] = None
    porcentagem_desconto: float
    is_active: bool = True
    usina_id: Optional[int] = None

class ConsumidorCreate(ConsumidorBase):
    pass

class Consumidor(ConsumidorBase):
    id: int
    usina: Optional[UsinaInfoForConsumidor] = None
    model_config = ConfigDict(from_attributes=True)

class ConsumidorUpdate(BaseModel):
    nome: Optional[str] = None
    numero_unidade_consumidora: Optional[str] = None
    telefone: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    numero_contrato: Optional[str] = None
    email: Optional[str] = None
    porcentagem_desconto: Optional[float] = None
    is_active: Optional[bool] = None
    usina_id: Optional[int] = None

# --- SCHEMAS PARA DOCUMENTOS BASE E POLIMÓRFICOS ---
class DocumentoBase(BaseModel): # This is good!
    id: int
    nome_arquivo_original: Optional[str] = None
    caminho_armazenamento: Optional[str] = None
    data_upload: Optional[datetime.datetime] = None
    consumidor_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ItemFaturaBase(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    unidade: Optional[str] = "KWH"
    quantidade: Optional[float] = None
    preco_unit_com_trib: Optional[float] = None
    valor_rs: Optional[float] = None
    cofins_pis_rs: Optional[float] = None
    base_calculo_icms_rs: Optional[float] = None
    aliquota_icms_percent: Optional[float] = None
    icms_rs: Optional[float] = None
    tarifa_unitaria_rs: Optional[float] = None

class ItemFaturaCreate(ItemFaturaBase):
    pass

class ItemFatura(ItemFaturaBase):
    id: int
    fatura_id: int
    model_config = ConfigDict(from_attributes=True)

# Corrected Fatura schema to inherit from DocumentoBase
class Fatura(DocumentoBase):
    nome_cliente: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    numero_unidade_consumidora: Optional[str] = None
    mes_referencia: Optional[str] = None
    data_vencimento: Optional[str] = None # Considerar usar date
    valor_total: Optional[float] = None
    chave_acesso_nfe: Optional[str] = None
    cosip_municipal: Optional[float] = None
    itens: List[ItemFatura] = [] # Garanta que ItemFatura também é um schema Pydantic

class FaturaCreate(BaseModel): # FaturaCreate does NOT inherit from DocumentoBase directly
    nome_cliente: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    numero_unidade_consumidora: Optional[str] = None
    mes_referencia: Optional[str] = None
    data_vencimento: Optional[str] = None
    valor_total: Optional[float] = None
    chave_acesso_nfe: Optional[str] = None
    cosip_municipal: Optional[float] = None
    itens: List[ItemFaturaCreate] = []
    consumidor_id: Optional[int] = None

# Corrected Boleto schema to inherit from DocumentoBase
class Boleto(DocumentoBase):
    linha_digitavel: str
    valor_cobrado: float
    data_vencimento: datetime.date

class BoletoCreate(BaseModel): # BoletoCreate does NOT inherit from DocumentoBase directly
    linha_digitavel: str
    valor_cobrado: float
    data_vencimento: datetime.date

# Corrected Relatorio schema to inherit from DocumentoBase
class Relatorio(DocumentoBase):
    titulo: str

class RelatorioCreate(BaseModel): # RelatorioCreate does NOT inherit from DocumentoBase directly
    titulo: str

# --- Agora, defina Documento como um ALIAS para a união ---
Documento = Union[Fatura, Boleto, Relatorio]


# --- SCHEMAS PARA CÁLCULO (sem alterações) ---
class CalculoResponse(BaseModel):
    fatura_id: int
    valor_total_fatura: float
    soma_valores_positivos: float
    resultado_intermediario: float
    percentual_desconto_aplicado: float
    valor_desconto: float
    valor_final_a_pagar: float

class CalculoComRelatorioResponse(BaseModel):
    resultados_calculo: CalculoResponse
    relatorio_gerado: Relatorio