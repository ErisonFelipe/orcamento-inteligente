"""
Schemas Pydantic para a entidade Transaction.

Estes schemas definem o CONTRATO da API — como os dados entram e saem em
JSON. São diferentes dos modelos SQLAlchemy (`app/models/transaction.py`),
que definem a estrutura no BANCO.

Separação importante:

- Modelo (SQLAlchemy)  → estrutura no PostgreSQL.
- Schema (Pydantic)    → estrutura no JSON da API.

Por que separar? Um cliente da API NÃO deve ver `created_at`, `updated_at`
e `id` ao criar; NÃO deve poder mandar campos de auditoria; e a resposta
NÃO deve vazar campos internos se um dia adicionarmos. O schema é a "capa"
que filtra o que passa.

Schemas definidos:

- TransactionBase   — campos comuns (herança)
- TransactionCreate — corpo do POST (o que o cliente ENVIA)
- TransactionUpdate — corpo do PATCH (todos os campos opcionais)
- TransactionRead   — corpo das respostas GET (o que a API DEVOLVE)

O FastAPI usa esses schemas para:

1. VALIDAR o que entra — requisição inválida = 422 antes de rodar o endpoint.
2. DOCUMENTAR automaticamente o Swagger em /docs.
3. SERIALIZAR o que sai — converte o modelo ORM para JSON.
"""

from datetime import date as DateType, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    """Campos comuns aos schemas de Transaction."""

    description: Annotated[str, Field(min_length=1, max_length=255)]
    amount: Annotated[
        Decimal,
        Field(gt=0, max_digits=12, decimal_places=2),
    ]
    type: TransactionType
    category: Annotated[str | None, Field(max_length=100)] = None
    date: DateType


class TransactionCreate(TransactionBase):
    """Payload do POST /transactions (corpo enviado pelo cliente)."""

    pass


class TransactionUpdate(BaseModel):
    """Payload do PATCH /transactions/{id}.

    Todos os campos são opcionais: o cliente envia apenas o que quer
    alterar. Campos omitidos permanecem inalterados no banco.
    """

    description: Annotated[
        str | None, Field(min_length=1, max_length=255)
    ] = None
    amount: Annotated[
        Decimal | None,
        Field(gt=0, max_digits=12, decimal_places=2),
    ] = None
    type: TransactionType | None = None
    category: Annotated[str | None, Field(max_length=100)] = None
    date: DateType | None = None


class TransactionRead(TransactionBase):
    """Resposta das rotas GET /transactions (o que a API devolve)."""

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

