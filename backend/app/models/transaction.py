from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date, DateTime, Enum as SQLEnum, ForeignKey, Numeric, String, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Evita import circular: só importa o tipo Category na checagem do TS/Pylance
if TYPE_CHECKING:
    from app.models.category import Category


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


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
    
    # AQUI ESTÁ A GRANDE MUDANÇA: category_id em vez de category string
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    date: Mapped[date] = mapped_column(Date, nullable=False)

    # --- Auditoria ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(), nullable=False,
    )

    # --- Relacionamentos ---
    # Uma transação tem uma categoria.
    category: Mapped["Category | None"] = relationship(
        back_populates="transactions"
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction id={self.id} type={self.type.value} "
            f"amount={self.amount} date={self.date}>"
        )