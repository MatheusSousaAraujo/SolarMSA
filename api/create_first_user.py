# create_first_user.py
from database import SessionLocal
from models import User, RoleEnum
from security import get_password_hash

def create_first_admin():
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.role == RoleEnum.ADMIN).first()
        if not admin_exists:
            print("Criando primeiro usuário administrador...")
            hashed_password = get_password_hash("admin123") # Troque esta senha!
            admin_user = User(
                email="admin@example.com",
                hashed_password=hashed_password,
                role=RoleEnum.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Usuário administrador criado com sucesso!")
            print("Email: admin@example.com")
            print("Senha: admin123")
        else:
            print("Usuário administrador já existe.")
    finally:
        db.close()

if __name__ == "__main__":
    create_first_admin()