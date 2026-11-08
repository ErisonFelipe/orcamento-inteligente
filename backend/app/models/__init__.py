"""
Pacote de modelos ORM do projeto.

Importar este pacote registra TODOS os modelos no `Base.metadata`, que é o
catálogo usado pelo SQLAlchemy para emitir os `CREATE TABLE ...`.

Regra do projeto:

- Todo novo modelo criado em `app/models/*.py` DEVE ser reexportado aqui
  com `from app.models.<arquivo> import <Classe>`.
- Assim, qualquer `import app.models` (ou `from app.models import X`)
  garante que a tabela correspondente seja criada por `create_all()`
  e que o modelo esteja disponível para o resto da aplicação.

Uso típico:

    from app.models import Transaction   # recomendado
    # em vez de:
    from app.models.transaction import Transaction
"""

from app.models.transaction import Transaction, TransactionType

__all__ = ["Transaction", "TransactionType"]