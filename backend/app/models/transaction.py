"""
Modelo ORM da tabela `transactions`.

Representa uma receita ou despesa registrada pelo usuário. Cada instância
desta classe, quando persistida, corresponde a uma linha na tabela
`transactions` do PostgreSQL.

Decisões importantes:

- `amount` usa `Numeric(12, 2)` (não FLOAT). Valores monetários exigem
  precisão exata; FLOAT introduz erros de arredondamento (ex.: 0.1 + 0.2
  pode virar 0.30000000000000004).
- `type` usa um Enum nativo do PostgreSQL (`transaction_type`), garantindo
  no nível do banco que só existam os valores 'income' ou 'expense'.
- `category` é uma string opcional por enquanto; vira chave estrangeira
  para a tabela `categories` na Etapa 4.
"""

from datetime import date, datetime
from enum import Enum
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum as SQLEnum, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TransactionType(str, Enum):
    """
    Tipo de transação financeira.

    Herda de `str` para que o valor seja serializado como string pura
    (ex.: "income") em JSON e em logs, sem precisar de conversão.
    """

    INCOME = "income"    # receita (entrada de dinheiro)
    EXPENSE = "expense"  # despesa (saída de dinheiro)


class Transaction(Base):
    """Modelo ORM da tabela `transactions`."""

    __tablename__ = "transactions"

    # --- Identificação ---
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # --- Dados da transação ---
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    type: Mapped[TransactionType] = mapped_column(
        SQLEnum(
            TransactionType,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
            name="transaction_type",
        ),
        nullable=False,
    )
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    # --- Auditoria ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        """
        Representação legível usada ao imprimir a instância no console
        ou em logs de debug. Nunca é usada em produção (é só para humanos).
        """
        return (
            f"<Transaction id={self.id} type={self.type.value} "
            f"amount={self.amount} date={self.date}>"
        )

