from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.crud import investment as crud_investment
from app.db.session import get_db
from app.schemas.investment import InvestmentCreate, InvestmentRead, InvestmentUpdate, InvestmentBulkCreate

router = APIRouter(prefix="/investments", tags=["investments"])

@router.post("", response_model=InvestmentRead, status_code=status.HTTP_201_CREATED)
def create(payload: InvestmentCreate, db: Annotated[Session, Depends(get_db)]):
    return crud_investment.create(db, payload)

@router.post("/bulk", response_model=list[InvestmentRead], status_code=status.HTTP_201_CREATED)
def create_bulk(payload: InvestmentBulkCreate, db: Annotated[Session, Depends(get_db)]):
    """
    Cria várias alocações de um único aporte.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="A lista de alocações está vazia.")
    return crud_investment.create_bulk(db, payload.items)

@router.get("", response_model=list[InvestmentRead])
def list_all(response: Response, db: Annotated[Session, Depends(get_db)], skip: int = 0, limit: int = 50):
    items, total = crud_investment.get_multi(db, skip=skip, limit=limit)
    response.headers["X-Total-Count"] = str(total)
    return items

@router.get("/{investment_id}", response_model=InvestmentRead)
def get_one(investment_id: int, db: Annotated[Session, Depends(get_db)]):
    obj = crud_investment.get(db, investment_id)
    if not obj: raise HTTPException(404, "Investimento não encontrado.")
    return obj

@router.patch("/{investment_id}", response_model=InvestmentRead)
def update_investment(investment_id: int, payload: InvestmentUpdate, db: Annotated[Session, Depends(get_db)]):
    obj = crud_investment.get(db, investment_id)
    if not obj: raise HTTPException(404, "Investimento não encontrado.")
    return crud_investment.update(db, obj, payload)

@router.delete("/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment(investment_id: int, db: Annotated[Session, Depends(get_db)]):
    obj = crud_investment.get(db, investment_id)
    if not obj: raise HTTPException(404, "Investimento não encontrado.")
    crud_investment.delete(db, obj)