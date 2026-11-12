"""
Schemas Pydantic para a entidade Category.
Define o contrato da API (JSON de entrada e saída).
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    """Campos comuns aos schemas de Category."""
    name: str = Field(min_length=2, max_length=100, description="Nome da categoria (ex.: Alimentação)")
    color: str = Field(
        default="#6366f1", 
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", 
        description="Código HEX da cor (ex.: #FF0000)"
    )


class CategoryCreate(CategoryBase):
    """Payload do POST /categories (corpo enviado pelo cliente)."""
    pass


class CategoryUpdate(BaseModel):
    """Payload do PATCH /categories/{id} (todos os campos opcionais)."""
    name: str | None = Field(None, min_length=2, max_length=100)
    color: str | None = Field(None, pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")


class CategoryRead(CategoryBase):
    """Resposta das rotas GET /categories."""
    id: int
    created_at: datetime
    updated_at: datetime

    # Permite converter o objeto ORM (SQLAlchemy) para JSON
    model_config = ConfigDict(from_attributes=True)