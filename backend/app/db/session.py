"""
Configuração da conexão com o banco de dados (SQLAlchemy).

Este módulo é responsável por três coisas:

1. `engine`       — o motor de conexão com o PostgreSQL.
2. `SessionLocal` — a fábrica de sessões (cada requisição terá a sua).
3. `get_db()`     — a dependência do FastAPI que abre/fecha a sessão.

Os modelos (`app/models/*`) NÃO devem importar nada daqui, para evitar
import circular. Só as rotas e o `main.py` importam `get_db`.

Uso típico (nas rotas):

    from fastapi import Depends
    from sqlalchemy.orm import Session
    from app.db.session import get_db

    @router.get("/transactions")
    def list_transactions(db: Session = Depends(get_db)):
        ...

A URL do banco vem de `settings.database_url`, definida em
`app/core/config.py` (que lê o `.env`).
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


# ---------------------------------------------------------------------------
# 1. Engine — motor de conexão com o PostgreSQL
# ---------------------------------------------------------------------------
# `pool_pre_ping=True` faz o SQLAlchemy testar a conexão antes de cada uso
# (evita erros do tipo "server closed the connection unexpectedly" quando
# o pool fica ocioso por muito tempo). Custa uma latência mínima, mas evita
# dor de cabeça em desenvolvimento com hot reload.
#
# `echo=settings.DEBUG` imprime no console o SQL que o SQLAlchemy está
# emitindo. Em desenvolvimento, isso é OURO para aprender o que o ORM faz.
# Em produção (`DEBUG=False`), fica desligado automaticamente.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)


# ---------------------------------------------------------------------------
# 2. SessionLocal — fábrica de sessões
# ---------------------------------------------------------------------------
# Cada chamada a `SessionLocal()` cria uma sessão NOVA e independente.
# NÃO use uma sessão global: ela compartilharia estado entre requisições.
#
# `autocommit=False`     → nada é salvo automaticamente; você chama commit().
# `autoflush=False`      → não "empurra" alterações ao banco sem commit().
# `expire_on_commit=False` → objetos continuam acessíveis após commit() sem
#                            recarregar do banco (útil ao devolver a resposta).
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ---------------------------------------------------------------------------
# 3. get_db — dependência do FastAPI
# ---------------------------------------------------------------------------
# Este é o "gerente" citado na analogia do restaurante. O FastAPI chama esta
# função ao iniciar a requisição, injeta a sessão no endpoint, e chama o
# `finally` quando a requisição termina — mesmo se der erro.
def get_db() -> Generator[Session, None, None]:
    """
    Fornece uma sessão de banco de dados por requisição.

    O uso de `yield` faz do `get_db` um "generator". O FastAPI sabe lidar
    com generators em dependências: executa tudo até o `yield` (abrindo a
    sessão), injeta o valor, e depois retoma do `yield` em diante para o
    `finally` (fechando a sessão).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

