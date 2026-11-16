from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.investment import Investment
from app.schemas.investment import InvestmentCreate, InvestmentRead, InvestmentUpdate, InvestmentBulkCreate


def create(db: Session, obj_in: InvestmentCreate) -> Investment:
    db_obj = Investment(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def create_bulk(db: Session, obj_in: list[InvestmentCreate]) -> list[Investment]:
    """
    Insere várias alocações de investimento de uma vez.
    """
    db_objs = [Investment(**item.model_dump()) for item in obj_in]
    db.add_all(db_objs)
    db.commit()
    for obj in db_objs:
        db.refresh(obj)
    return db_objs

def get(db: Session, investment_id: int) -> Investment | None:
    return db.get(Investment, investment_id)

def get_multi(db: Session, *, skip: int = 0, limit: int = 50) -> tuple[list[Investment], int]:
    total = db.scalar(select(func.count()).select_from(Investment)) or 0
    stmt = select(Investment).order_by(Investment.date.desc(), Investment.id.desc()).offset(skip).limit(limit)
    items = list(db.scalars(stmt).all())
    return items, total

def update(db: Session, db_obj: Investment, obj_in: InvestmentUpdate) -> Investment:
    dados = obj_in.model_dump(exclude_unset=True)
    for campo, valor in dados.items():
        setattr(db_obj, campo, valor)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete(db: Session, db_obj: Investment) -> None:
    db.delete(db_obj)
    db.commit()