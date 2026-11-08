"""
Pacote de schemas Pydantic do projeto.

Schemas definem o CONTRATO da API (JSON de entrada e saída), em oposição
aos modelos (SQLAlchemy) que definem a estrutura no banco.

Regra do projeto:

- Todo novo schema criado em `app/schemas/*.py` DEVE ser reexportado aqui
  com `from app.schemas.<arquivo> import <Classe>`.
- Isso mantém um "índice" visível de todos os schemas e permite imports
  mais curtos no resto da aplicação:

      from app.schemas import TransactionCreate, TransactionRead
      # em vez de:
      from app.schemas.transaction import TransactionCreate, TransactionRead

- Nenhum import de `app.db` ou `app.models.transaction` deve viver aqui:
  schemas importam apenas `BaseModel`/`Field` e, quando necessário, tipos
  do domínio (ex.: `TransactionType`) — nunca sessões nem engine.
"""

from app.schemas.transaction import (
    TransactionBase,
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)

__all__ = [
    "TransactionBase",
    "TransactionCreate",
    "TransactionRead",
    "TransactionUpdate",
]