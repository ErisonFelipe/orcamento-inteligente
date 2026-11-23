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
    
    # 1. Query Base (Aplica todos os filtros)
    base_query = select(Transaction)
    
    if type is not None:
        base_query = base_query.where(Transaction.type == type)
    if date_from is not None:
        base_query = base_query.where(Transaction.date >= date_from)
    if date_to is not None:
        base_query = base_query.where(Transaction.date <= date_to)
    if category is not None:
        base_query = base_query.join(Category).where(Category.name.ilike(f"%{category}%"))

    # 2. Contagem total
    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0

    # 3. Buscar os itens paginados
    items_query = (
        base_query
        .options(joinedload(Transaction.category))
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .offset(skip)
        .limit(limit)
    )
    items = list(db.scalars(items_query).unique().all())

    # 4. Soma de Receitas (ignora o filtro de 'type' se ele já estiver definido como 'income')
    # Se o usuário filtrou por "Despesas", a soma de receitas aqui será 0.
    income_query = base_query.where(Transaction.type == TransactionType.INCOME)
    total_income = db.scalar(
        select(func.sum(Transaction.amount)).select_from(income_query.subquery())
    ) or Decimal(0)

    # 5. Soma de Despesas
    expense_query = base_query.where(Transaction.type == TransactionType.EXPENSE)
    total_expense = db.scalar(
        select(func.sum(Transaction.amount)).select_from(expense_query.subquery())
    ) or Decimal(0)

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