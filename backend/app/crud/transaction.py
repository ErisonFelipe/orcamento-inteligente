"""
Camada CRUD (Create, Read, Update, Delete) da entidade Transaction.

Este módulo encapsula TODO o acesso ao banco para transações. Os endpoints
HTTP chamam estas funções, mas elas NÃO dependem de FastAPI — podem ser
testadas com um `Session` puro, o que torna o teste rápido e preciso.

Uso típico nos endpoints:

    from app.crud import transaction as crud_transaction

    @router.post("/transactions")
    def create(payload: TransactionCreate, db: Session = Depends(get_db)):
        return crud_transaction.create(db, payload)

Regras:

- Toda função recebe `db: Session` como PRIMEIRO argumento (convenção).
- `create`/`update` chamam `db.commit()` + `db.refresh()` internamente.
- `get`/`get_multi` NÃO chamam commit (são leituras).
- `delete` chama `db.delete()` + `db.commit()`.
- Em caso de erro do banco, a exceção SOBE — quem decide o que fazer
  (retornar 500, logar, etc.) é o endpoint. CRUD não engole erro.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionUpdate


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------
def create(db: Session, obj_in: TransactionCreate) -> Transaction:
    """
    Cria uma transação a partir do schema validado `TransactionCreate`.

    Fluxo:
      1. Converte o schema em dicionário (só campos do modelo).
      2. Instancia o modelo ORM.
      3. `db.add()` coloca na sessão (ainda não foi ao banco).
      4. `db.commit()` efetiva no PostgreSQL.
      5. `db.refresh()` recarrega do banco para trazer `id`, `created_at`,
         `updated_at` (os campos que o banco gerou).
    """
    dados = obj_in.model_dump()
    db_obj = Transaction(**dados)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# READ — por ID
# ---------------------------------------------------------------------------
def get(db: Session, transaction_id: int) -> Transaction | None:
    """
    Busca uma transação por ID. Retorna `None` se não existir.

    Uso no endpoint:
        tx = crud_transaction.get(db, transaction_id)
        if tx is None:
            raise HTTPException(status_code=404, detail="Transação não encontrada")
    """
    return db.get(Transaction, transaction_id)


# ---------------------------------------------------------------------------
# READ — listagem paginada e com filtros
# ---------------------------------------------------------------------------
def get_multi(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 50,
    type: TransactionType | None = None,
    category: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> tuple[list[Transaction], int]:
    """
    Lista transações com paginação e filtros opcionais.

    Retorna `(items, total)`, onde:
      - `items`: as transações da página (até `limit` itens);
      - `total`: quantas transações existem no total (para o frontend
        mostrar "X de Y" e calcular o número de páginas).

    Filtros (todos opcionais, combináveis via AND):
      - `type`: 'income' ou 'expense'
      - `category`: nome exato da categoria
      - `date_from`: data mínima (inclusive)
      - `date_to`: data máxima (inclusive)

    Ordenação: mais recentes primeiro (`date DESC`, `id DESC`).
    """
    # Query base — será reaproveitada para os dois SELECTs abaixo
    base_stmt = select(Transaction)

    if type is not None:
        base_stmt = base_stmt.where(Transaction.type == type)
    if category is not None:
        base_stmt = base_stmt.where(Transaction.category == category)
    if date_from is not None:
        base_stmt = base_stmt.where(Transaction.date >= date_from)
    if date_to is not None:
        base_stmt = base_stmt.where(Transaction.date <= date_to)

    # 1) Total (sem paginação, para calcular páginas no frontend)
    total = db.scalar(
        select(func.count()).select_from(base_stmt.subquery())
    ) or 0

    # 2) Página atual (com paginação e ordenação)
    stmt = (
        base_stmt
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .offset(skip)
        .limit(limit)
    )
    items = list(db.scalars(stmt).all())

    return items, total


# ---------------------------------------------------------------------------
# UPDATE — parcial (estilo PATCH)
# ---------------------------------------------------------------------------
def update(
    db: Session,
    db_obj: Transaction,
    obj_in: TransactionUpdate,
) -> Transaction:
    """
    Atualiza campos de uma transação existente (PATCH parcial).

    Recebe o objeto já buscado do banco (feito pelo endpoint com `get`)
    e aplica APENAS os campos enviados pelo cliente.

    `obj_in.model_dump(exclude_unset=True)` é a chave: retorna somente
    os campos que o cliente enviou de fato. Campos ausentes NÃO sobrescrevem
    os valores do banco.

    Exemplo:
        # Cliente enviou {"category": "Lazer"}
        update(db, tx, TransactionUpdate(category="Lazer"))
        # Só `category` muda; description, amount, etc. permanecem intactos.
    """
    dados = obj_in.model_dump(exclude_unset=True)
    for campo, valor in dados.items():
        setattr(db_obj, campo, valor)

    db.add(db_obj)          # garante que está na sessão (pode ser no-op)
    db.commit()
    db.refresh(db_obj)      # recarrega — garante updated_at atualizado
    return db_obj


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------
def delete(db: Session, db_obj: Transaction) -> None:
    """
    Remove uma transação do banco.

    Recebe o objeto já buscado (feito pelo endpoint com `get`).
    Idempotente para o chamador: se o objeto não existe no banco, o
    `db.delete()` não lança erro — apenas não faz nada.

    Uso no endpoint:
        tx = crud_transaction.get(db, transaction_id)
        if tx is None:
            raise HTTPException(404, "Transação não encontrada")
        crud_transaction.delete(db, tx)
        return Response(status_code=204)
    """
    db.delete(db_obj)
    db.commit()
    
