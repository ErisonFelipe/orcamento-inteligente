"""
Schemas Pydantic para a entidade Transaction.
"""

from datetime import date as DateType, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.models.transaction import TransactionType
# Importamos o schema de Categoria para aninhar na resposta
from app.schemas.category import CategoryRead


class TransactionBase(BaseModel):
    """Campos comuns aos schemas de Transaction."""
    description: Annotated[str, Field(min_length=1, max_length=255)]
    amount: Annotated[
        Decimal,
        Field(gt=0, max_digits=12, decimal_places=2),
    ]
    type: TransactionType
    # Mudança principal: agora é um ID de categoria opcional
    category_id: int | None = None 
    date: DateType


class TransactionCreate(TransactionBase):
    """Payload do POST /transactions."""
    pass


class TransactionUpdate(BaseModel):
    """Payload do PATCH /transactions/{id} (todos opcionais)."""
    description: Annotated[str | None, Field(min_length=1, max_length=255)] = None
    amount: Annotated[
        Decimal | None,
        Field(gt=0, max_digits=12, decimal_places=2),
    ] = None
    type: TransactionType | None = None
    category_id: int | None = None
    date: DateType | None = None


class TransactionRead(TransactionBase):
    """Resposta das rotas GET /transactions."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Aqui está a mágica: o Pydantic vai ler o relacionamento do SQLAlchemy
    # e devolver o objeto completo { id, name, color... } no JSON.
    category: CategoryRead | None = None

    model_config = ConfigDict(from_attributes=True)
    

class TransactionPredictPayload(BaseModel):
    """Payload para pedir uma sugestão de categoria."""
    description: str = Field(min_length=1, max_length=255)


class TransactionPredictResult(BaseModel):
    """Resposta da IA com o ID da categoria sugerida."""
    category_id: int | None