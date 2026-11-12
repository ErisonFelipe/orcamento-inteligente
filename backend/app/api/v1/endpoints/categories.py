"""
Endpoints REST para Categorias.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.crud import category as crud_category
from app.db.session import get_db
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return crud_category.create(db, payload)
    except Exception as e:
        # Tratamento simples para nome duplicado (UniqueConstraint no Postgres)
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Já existe uma categoria com este nome.")
        raise


@router.get("", response_model=list[CategoryRead])
def list_categories(
    db: Annotated[Session, Depends(get_db)],
):
    return crud_category.get_multi(db)


@router.get("/{category_id}", response_model=CategoryRead)
def get_category(
    category_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    cat = crud_category.get(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    return cat


@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Annotated[Session, Depends(get_db)],
):
    cat = crud_category.get(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    try:
        return crud_category.update(db, cat, payload)
    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Já existe uma categoria com este nome.")
        raise


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    cat = crud_category.get(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    crud_category.delete(db, cat)