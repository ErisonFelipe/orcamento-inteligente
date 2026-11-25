"""
Endpoints REST da entidade Transaction.
"""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.crud import transaction as crud_transaction
from app.db.session import get_db
from app.models.transaction import TransactionType
from app.schemas.transaction import (
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
    TransactionPredictPayload,
    TransactionPredictResult,
    TransactionBulkCreate,
    TransactionListResult,
)
from app.services.categorizer import categorizer 

router = APIRouter(prefix="/transactions", tags=["transactions"])


# ---------------------------------------------------------------------------
# POST /transactions — criar
# ---------------------------------------------------------------------------
@router.post(
    "",
    response_model=TransactionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar uma transação",
)
def create_transaction(
    payload: TransactionCreate,
    db: Annotated[Session, Depends(get_db)],
) -> TransactionRead:
    return crud_transaction.create(db, payload)

@router.post(
    "/bulk",
    response_model=list[TransactionRead],
    status_code=status.HTTP_201_CREATED,
    summary="Criar transações em lote",
)
def create_transactions_bulk(
    payload: TransactionBulkCreate,
    db: Annotated[Session, Depends(get_db)],
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="A lista de transações está vazia.")
    return crud_transaction.create_bulk(db, payload.items)


# ---------------------------------------------------------------------------
# POST /transactions/predict-category — predição de IA
# ---------------------------------------------------------------------------
@router.post(
    "/predict-category",
    response_model=TransactionPredictResult,
    summary="Sugerir categoria via IA",
)
def predict_category(payload: TransactionPredictPayload) -> TransactionPredictResult:
    category_id = categorizer.predict(payload.description)
    return TransactionPredictResult(category_id=category_id)


# ---------------------------------------------------------------------------
# GET /transactions — listar (CORRIGIDO AQUI)
# ---------------------------------------------------------------------------
@router.get(
    "",
    response_model=TransactionListResult, # Mudou para TransactionListResult
    summary="Listar transações (paginado, com filtros)",
)
def list_transactions(
    db: Annotated[Session, Depends(get_db)],
    response: Response,
    skip: Annotated[int, Query(ge=0, description="Itens a pular")] = 0,
    limit: Annotated[int, Query(ge=1, le=200, description="Tamanho da página (1..200)")] = 50,
    type: Annotated[TransactionType | None, Query(description="Filtrar por tipo: 'income' ou 'expense'")] = None,
    category: Annotated[str | None, Query(max_length=100, description="Filtrar por categoria")] = None,
    date_from: Annotated[date | None, Query(description="Data mínima (ISO, inclusive)")] = None,
    date_to: Annotated[date | None, Query(description="Data máxima (ISO, inclusive)")] = None,
) -> TransactionListResult:
    
    # Agora recebe os 4 valores do CRUD
    items, total, total_income, total_expense = crud_transaction.get_multi(
        db,
        skip=skip,
        limit=limit,
        type=type,
        category=category,
        date_from=date_from,
        date_to=date_to,
    )
    response.headers["X-Total-Count"] = str(total)
    
    return TransactionListResult(
        items=items,
        total=total,
        total_income=total_income,
        total_expense=total_expense
    )
    
@router.delete(
    "/clear-all",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Apagar TODAS as transações",
)
def clear_all_transactions(
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """
    Remove permanentemente todas as transações do banco de dados.
    Use com cuidado! Esta ação não pode ser desfeita.
    """
    crud_transaction.clear_all(db)


# ---------------------------------------------------------------------------
# GET /transactions/{id} — buscar por ID
# ---------------------------------------------------------------------------
@router.get(
    "/{transaction_id}",
    response_model=TransactionRead,
    summary="Buscar transação por ID",
)
def get_transaction(
    transaction_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> TransactionRead:
    tx = crud_transaction.get(db, transaction_id)
    if tx is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transação com id={transaction_id} não encontrada.",
        )
    return tx


# ---------------------------------------------------------------------------
# PATCH /transactions/{id} — atualizar parcialmente
# ---------------------------------------------------------------------------
@router.patch(
    "/{transaction_id}",
    response_model=TransactionRead,
    summary="Atualizar transação (parcial)",
)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> TransactionRead:
    tx = crud_transaction.get(db, transaction_id)
    if tx is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transação com id={transaction_id} não encontrada.",
        )
    return crud_transaction.update(db, tx, payload)


# ---------------------------------------------------------------------------
# DELETE /transactions/{id} — remover
# ---------------------------------------------------------------------------
@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover transação",
)
def delete_transaction(
    transaction_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    tx = crud_transaction.get(db, transaction_id)
    if tx is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transação com id={transaction_id} não encontrada.",
        )
    crud_transaction.delete(db, tx)