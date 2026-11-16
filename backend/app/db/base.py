"""
Classe base dos modelos ORM do SQLAlchemy.

Todos os modelos do banco (Transaction, Category, Budget, etc.) devem herdar
de `Base`. Ao herdar, a classe ganha automaticamente:

- a capacidade de ser mapeada para uma tabela;
- o registro interno no `metadata` do SQLAlchemy (usado para criar as tabelas);
- suporte a colunas, relacionamentos e tipos.

Exemplo de uso (na Sub-etapa 2.5):

    from app.db.base import Base
    from sqlalchemy.orm import Mapped, mapped_column

    class Transaction(Base):
        __tablename__ = "transactions"
        id: Mapped[int] = mapped_column(primary_key=True)
        ...

Referência: https://docs.sqlalchemy.org/en/20/orm/declarative_tables.html
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Classe base declarativa para todos os modelos.

    No SQLAlchemy 2.0, o padrão recomendado é herdar de `DeclarativeBase`
    (em vez de usar a função legada `declarative_base()`).
    """

    pass

