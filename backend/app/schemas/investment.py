"""
Schemas Pydantic para a entidade Investment.
"""

from __future__ import annotations

import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class InvestmentBase(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=255)]
    type: Annotated[str, Field(min_length=1, max_length=50)]
    amount: Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]
    current_value: Annotated[Decimal | None, Field(max_digits=12, decimal_places=2)] = None 
    date: datetime.date  # Usando datetime.date para evitar conflito


class InvestmentCreate(InvestmentBase):
    pass


class InvestmentUpdate(BaseModel):
    name: Annotated[str | None, Field(min_length=1, max_length=255)] = None
    type: Annotated[str | None, Field(min_length=1, max_length=50)] = None
    amount: Annotated[Decimal | None, Field(gt=0, max_digits=12, decimal_places=2)] = None
    current_value: Annotated[Decimal | None, Field(max_digits=12, decimal_places=2)] = None
    date: datetime.date | None = None  # Usando datetime.date aqui também


class InvestmentRead(InvestmentBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
    
class InvestmentBulkCreate(BaseModel):
    """Payload para criar várias alocações de investimento de uma vez."""
    items: list[InvestmentCreate]