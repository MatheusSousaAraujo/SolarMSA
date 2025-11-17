# db_cleaner.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect

# 1. Configurações do Banco de Dados
# O caminho é relativo, assumindo que o script está na mesma pasta do 'faturas.db'
DATABASE_URL = "sqlite:///./faturas.db" 

# 2. Conexão e Sessão
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def clean_test_data(db: Session):
    """
    Apaga todos os registos das tabelas Fatura e Itens_Fatura.
    Assegura que as tabelas existem antes de tentar apagar.
    """
    print("\n--- INICIANDO LIMPEZA DO BANCO DE DADOS ---")
    
    # Mapeamento dos nomes das tabelas no banco de dados
    TABLES_TO_CLEAN = [
        "itens_fatura", # Deve ser limpa primeiro, pois tem a chave estrangeira
        "faturas",
        "documentos", # É a tabela base, deve ser limpa para remover as entradas polimórficas
        "relatorios", # Opcional, mas limpa qualquer registro de relatório
        "boletos"   # Opcional, mas limpa qualquer registro de boleto
    ]
    
    # 1. Verifica quais tabelas realmente existem no banco
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    cleaned_count = 0
    
    for table_name in TABLES_TO_CLEAN:
        if table_name in existing_tables:
            try:
                # Usa TRUNCATE (ou DELETE) para apagar todos os registos
                # Se for SQLite, usa DELETE FROM
                delete_statement = text(f"DELETE FROM {table_name}")
                result = db.execute(delete_statement)
                
                # Para SQLite, 'rowcount' não é fiável com DELETE FROM sem WHERE
                # print(f"✅ Tabela '{table_name}' limpa ({result.rowcount} registos).")
                print(f"✅ Tabela '{table_name}' limpa.")
                cleaned_count += 1
            
            except Exception as e:
                db.rollback()
                print(f"❌ ERRO ao limpar a tabela '{table_name}': {e}")
                
        else:
            print(f"⚠️ Aviso: Tabela '{table_name}' não encontrada no banco. Ignorando.")


    db.commit()
    print(f"\n--- LIMPEZA CONCLUÍDA. {cleaned_count} tabelas processadas. ---")


if __name__ == "__main__":
    # Garante que o ficheiro do banco de dados existe para evitar falhas
    if not os.path.exists("./faturas.db"):
        print("🚨 ERRO: Ficheiro 'faturas.db' não encontrado. Crie um ficheiro vazio ou verifique o caminho.")
    else:
        db = SessionLocal()
        clean_test_data(db)
        db.close()