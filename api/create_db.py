# create_db.py

from database import engine, Base
import models # Importa os modelos para que o SQLAlchemy saiba sobre eles

print("Criando tabelas no banco de dados...")

# Esta linha mágica pega todos os modelos que herdam de Base e os cria no banco
Base.metadata.create_all(bind=engine)

print("Tabelas criadas com sucesso!")