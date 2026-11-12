"""
Modelo ORM da tabela `categories`.

Representa uma categoria financeira (ex.: Alimentação, Transporte).
Cada transação aponta para uma categoria via Foreign Key (opcional).

Decisões:
- `name` é `unique=True` — não pode haver duas categorias com o mesmo nome.
- `color` armazena um código HEX (ex.: "#FF0000") para exibir no frontend.
- Relacionamento 1:N com `Transaction` — uma categoria tem várias transações.
"""

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Category(Base):
    """Modelo ORM da tabela `categories`."""

    __tablename__ = "categories"

    # --- Identificação ---
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="#6366f1") # Indigo padrão

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

    # --- Relacionamentos ---
    # Uma categoria tem várias transações. O `back_populates` liga os dois lados.
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="category",
        passive_deletes=True, # Respeita o ON DELETE SET NULL do banco
    )

    def __repr__(self) -> str:
        return f"<Category id={self.id} name='{self.name}'>"