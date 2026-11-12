"""
Camada CRUD da entidade Category.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def create(db: Session, obj_in: CategoryCreate) -> Category:
    db_obj = Category(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get(db: Session, category_id: int) -> Category | None:
    return db.get(Category, category_id)


def get_multi(db: Session) -> list[Category]:
    """Lista todas as categorias ordenadas por nome (A-Z)."""
    stmt = select(Category).order_by(Category.name.asc())
    return list(db.scalars(stmt).all())


def update(db: Session, db_obj: Category, obj_in: CategoryUpdate) -> Category:
    dados = obj_in.model_dump(exclude_unset=True)
    for campo, valor in dados.items():
        setattr(db_obj, campo, valor)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, db_obj: Category) -> None:
    db.delete(db_obj)
    db.commit()