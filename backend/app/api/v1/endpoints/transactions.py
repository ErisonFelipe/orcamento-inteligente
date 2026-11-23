"""
Endpoints REST da entidade Transaction.

Cada função corresponde a uma rota HTTP. Os endpoints são "finos" — apenas
orquestram: recebem a requisição, chamam a camada CRUD e devolvem a resposta.
A lógica de banco fica em `app/crud/transaction.py`.

Rotas:

- POST   /transactions        → cria uma transação
- GET    /transactions        → lista com paginação e filtros
- GET    /transactions/{id}   → busca por ID
- PATCH  /transactions/{id}   → atualiza parcialmente
- DELETE /transactions/{id}   → remove

Códigos HTTP usados:

- 201 Created             → após criar
- 200 OK                  → leitura/atualização bem-sucedida
- 204 No Content          → após deletar (sem corpo)
- 404 Not Found           → ID inexistente
- 422 Unprocessable Entity → payload inválido (gerado automaticamente
                             pelo FastAPI ao validar os schemas Pydantic)
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
    """
    Cria uma nova transação.

    - Corpo (`TransactionCreate`): descrição, valor, tipo, categoria e data.
    - Retorna `201 Created` com a transação completa (incluindo id e auditoria).
    - Payload inválido → `422` automático (validação Pydantic).
    """
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
    """
    Cria várias transações de uma vez. Usado para receitas recorrentes 
    e despesas parceladas.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="A lista de transações está vazia.")
    
    # Chama a função de bulk que criamos no CRUD
    return crud_transaction.create_bulk(db, payload.items)


# ---------------------------------------------------------------------------
# GET /transactions — listar
# ---------------------------------------------------------------------------
@router.get(
    "",
    response_model=list[TransactionRead],
    summary="Listar transações (paginado, com filtros)",
)
def list_transactions(
    db: Annotated[Session, Depends(get_db)],
    response: Response,
    skip: Annotated[int, Query(ge=0, description="Itens a pular")] = 0,
    limit: Annotated[
        int, Query(ge=1, le=200, description="Tamanho da página (1..200)")
    ] = 50,
    type: Annotated[
        TransactionType | None,
        Query(description="Filtrar por tipo: 'income' ou 'expense'"),
    ] = None,
    category: Annotated[
        str | None, Query(max_length=100, description="Filtrar por categoria")
    ] = None,
    date_from: Annotated[
        date | None, Query(description="Data mínima (ISO, inclusive)")
    ] = None,
    date_to: Annotated[
        date | None, Query(description="Data máxima (ISO, inclusive)")
    ] = None,
) -> list[TransactionRead]:
    """
    Lista transações com paginação e filtros opcionais.

    Query params:
    - `skip` (≥ 0, padrão 0) — quantos pular (paginação)
    - `limit` (1..200, padrão 50) — tamanho da página
    - `type` — `income` ou `expense`
    - `category` — nome exato
    - `date_from` / `date_to` — intervalo inclusivo

    O cabeçalho `X-Total-Count` contém o **total** de transações que
    satisfazem os filtros (útil para o frontend calcular páginas).
    """
    items, total = crud_transaction.get_multi(
        db,
        skip=skip,
        limit=limit,
        type=type,
        category=category,
        date_from=date_from,
        date_to=date_to,
    )
    response.headers["X-Total-Count"] = str(total)
    return items


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
    """
    Retorna a transação com o ID informado.

    - Encontrada → `200 OK`.
    - Não encontrada → `404 Not Found`.
    """
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
    """
    Atualiza APENAS os campos enviados no corpo (`TransactionUpdate`).

    - Campos ausentes permanecem inalterados (semântica de PATCH).
    - ID inexistente → `404 Not Found`.
    - Payload inválido → `422` automático.
    """
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
    """
    Remove a transação com o ID informado.

    - Sucesso → `204 No Content` (sem corpo).
    - ID inexistente → `404 Not Found`.
    """
    tx = crud_transaction.get(db, transaction_id)
    if tx is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transação com id={transaction_id} não encontrada.",
        )
    crud_transaction.delete(db, tx)
    
    # ---------------------------------------------------------------------------
# POST /transactions/predict-category — predição de IA
# ---------------------------------------------------------------------------
@router.post(
    "/predict-category",
    response_model=TransactionPredictResult,
    summary="Sugerir categoria via IA",
)
def predict_category(payload: TransactionPredictPayload) -> TransactionPredictResult:
    """
    Recebe uma descrição (ex: "Uber para o trabalho") e tenta prever 
    a categoria baseada no histórico de transações.
    """
    category_id = categorizer.predict(payload.description)
    return TransactionPredictResult(category_id=category_id)
    
@router.get("", response_model=TransactionListResult)
def list_transactions(
    db: Annotated[Session, Depends(get_db)],
    response: Response,
    # ... (parâmetros anteriores) ...
) -> TransactionListResult:
    
    items, total, total_income, total_expense = crud_transaction.get_multi(
        db, skip=skip, limit=limit, type=type, category=category, date_from=date_from, date_to=date_to
    )
    response.headers["X-Total-Count"] = str(total)
    
    return TransactionListResult(
        items=items,
        total=total,
        total_income=total_income,
        total_expense=total_expense
    )