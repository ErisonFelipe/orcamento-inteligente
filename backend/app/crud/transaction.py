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
    
    # 1. Query Base para os itens (com joinedload)
    items_query = select(Transaction).options(joinedload(Transaction.category))
    
    if type is not None:
        items_query = items_query.where(Transaction.type == type)
    if date_from is not None:
        items_query = items_query.where(Transaction.date >= date_from)
    if date_to is not None:
        items_query = items_query.where(Transaction.date <= date_to)
    if category is not None:
        items_query = items_query.join(Category).where(Category.name.ilike(f"%{category}%"))

    # 2. Contagem total
    total = db.scalar(select(func.count()).select_from(items_query.subquery())) or 0

    # 3. Query separada para os totais (segura contra bugs de subquery)
    income_query = select(func.sum(Transaction.amount)).where(Transaction.type == TransactionType.INCOME)
    expense_query = select(func.sum(Transaction.amount)).where(Transaction.type == TransactionType.EXPENSE)

    # Aplica os mesmos filtros de data e categoria
    if date_from is not None:
        income_query = income_query.where(Transaction.date >= date_from)
        expense_query = expense_query.where(Transaction.date >= date_from)
    if date_to is not None:
        income_query = income_query.where(Transaction.date <= date_to)
        expense_query = expense_query.where(Transaction.date <= date_to)
    if category is not None:
        income_query = income_query.join(Category).where(Category.name.ilike(f"%{category}%"))
        expense_query = expense_query.join(Category).where(Category.name.ilike(f"%{category}%"))

    # Se o usuário filtrou por tipo, a soma do outro tipo é zero
    total_income = Decimal(0)
    total_expense = Decimal(0)

    if type == TransactionType.EXPENSE:
        total_expense = db.scalar(expense_query) or Decimal(0)
    elif type == TransactionType.INCOME:
        total_income = db.scalar(income_query) or Decimal(0)
    else:
        total_income = db.scalar(income_query) or Decimal(0)
        total_expense = db.scalar(expense_query) or Decimal(0)

    # 4. Paginação e ordenação dos itens
    items_query = items_query.order_by(Transaction.date.desc(), Transaction.id.desc()).offset(skip).limit(limit)
    items = list(db.scalars(items_query).unique().all())

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

def clear_all(db: Session) -> None:
    """Deleta todas as transações do banco de dados."""
    db.query(Transaction).delete()
    db.commit()