"""
Modelo ORM da tabela `investments`.
Representa um aporte ou registro de investimento.
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Investment(Base):
    """Modelo ORM da tabela `investments`."""

    __tablename__ = "investments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False) # Ex: Tesouro Direto, PETR4
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # Ex: Renda Fixa, Ações, Cripto
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Investment id={self.id} name='{self.name}' amount={self.amount}>"