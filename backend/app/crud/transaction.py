from datetime import date
from decimal import Decimal
from sqlalchemy import func, select, case
from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionUpdate

def create(db: Session, obj_in: TransactionCreate) -> Transaction:
    dados = obj_in.model_dump()
    db_obj = Transaction(**dados)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    # Recarrega com o relacionamento para devolver a categoria no JSON
    return get(db, db_obj.id) # type: ignore


def get(db: Session, transaction_id: int) -> Transaction | None:
    # joinedload traz a categoria junto na mesma query
    stmt = (
        select(Transaction)
        .options(joinedload(Transaction.category))
        .where(Transaction.id == transaction_id)
    )
    return db.scalars(stmt).first()


def get_multi(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 50,
    type: TransactionType | None = None,
    category: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> tuple[list[Transaction], int, Decimal, Decimal]:
    
    base_stmt = select(Transaction).options(joinedload(Transaction.category))

    if type is not None:
        base_stmt = base_stmt.where(Transaction.type == type)
    if category is not None:
        base_stmt = base_stmt.join(Transaction.category).where(Category.name.ilike(f"%{category}%"))
    if date_from is not None:
        base_stmt = base_stmt.where(Transaction.date >= date_from)
    if date_to is not None:
        base_stmt = base_stmt.where(Transaction.date <= date_to)

    total = db.scalar(select(func.count()).select_from(base_stmt.subquery())) or 0

    # NOVO: Calcula o total de receitas e despesas no banco (respeitando os filtros)
    totals_stmt = select(
        func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=0)).label("income"),
        func.sum(case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=0)).label("expense")
    ).select_from(base_stmt.subquery())
    
    totals_result = db.execute(totals_stmt).first()
    total_income = Decimal(totals_result.income or 0)
    total_expense = Decimal(totals_result.expense or 0)

    stmt = (
        base_stmt
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .offset(skip)
        .limit(limit)
    )
    items = list(db.scalars(stmt).unique().all())

    return items, total, total_income, total_expense


def update(db: Session, db_obj: Transaction, obj_in: TransactionUpdate) -> Transaction:
    dados = obj_in.model_dump(exclude_unset=True)
    for campo, valor in dados.items():
        setattr(db_obj, campo, valor)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return get(db, db_obj.id) # type: ignore


def delete(db: Session, db_obj: Transaction) -> None:
    db.delete(db_obj)
    db.commit()
    
def create_bulk(db: Session, obj_in: list[TransactionCreate]) -> list[Transaction]:
    """
    Insere várias transações de uma vez (Bulk Insert).
    Muito mais rápido que fazer N chamadas de `create`.
    """
    db_objs = [Transaction(**item.model_dump()) for item in obj_in]
    db.add_all(db_objs)
    db.commit()
    
    for obj in db_objs:
        db.refresh(obj)
        
    return db_objs