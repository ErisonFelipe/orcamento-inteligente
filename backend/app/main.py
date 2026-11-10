"""
Ponto de entrada da API — Orçamento Inteligente.

Este arquivo:

1. Cria o app FastAPI (com título, versão e descrição que aparecem no Swagger).
2. Configura CORS para o frontend React (Etapa 3) acessar a API.
3. Cria as tabelas no banco automaticamente no startup (idempotente).
4. Monta o agregador de routers (`api_router`) sob o prefixo `/api/v1`.
5. Expõe um health check em `/`.

Como rodar (do diretório `backend/`, com o venv ativo):

    uvicorn app.main:app --reload

Endereços:

- API:      http://localhost:8000
- Swagger:  http://localhost:8000/docs
- ReDoc:    http://localhost:8000/redoc
"""

from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, get_db

# Importa os modelos para garantir que TODOS estejam registrados no
# `Base.metadata` antes do `create_all` no startup. Sem isso, o
# `create_all` poderia rodar sem conhecer as tabelas que deve criar.
import app.models  # noqa: F401  (importado só pelo efeito colateral)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ciclo de vida da aplicação.

    Este bloco roda:

    - ANTES do app começar a aceitar requisições (código antes do `yield`).
    - DEPOIS que o app é encerrado (código depois do `yield`).

    Aqui usamos apenas o startup — não precisamos de lógica de shutdown.
    """
    # === STARTUP ===
    # Cria as tabelas no banco se ainda não existirem (idempotente).
    Base.metadata.create_all(bind=engine)
    print(f"[startup] Tabelas garantidas no banco: {list(Base.metadata.tables.keys())}")
    print(f"[startup] {settings.APP_NAME} pronto em /api/v1")
    yield
    # === SHUTDOWN === (nada a fazer por ora)


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description=(
        "API do Orçamento Inteligente — controle de receitas, despesas "
        "e orçamentos com insights automáticos."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------------
# CORS — permite que o frontend React (Etapa 3) consuma a API.
# ---------------------------------------------------------------------------
# Em desenvolvimento, o Vite roda em http://localhost:5173. Em produção,
# troque por domínio real via variável de ambiente (a fazer na Etapa 8).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",   # alias do localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Rotas da API v1
# ---------------------------------------------------------------------------
app.include_router(api_router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# Health check na raiz
# ---------------------------------------------------------------------------
@app.get("/", tags=["health"], summary="Health check")
def root(db: Annotated[Session, Depends(get_db)]) -> dict:
    """
    Retorna o status da API e confirma que o banco responde.
    Útil para monitoramento e para checagens rápidas de conectividade.
    """
    db.execute(text("SELECT 1"))  # falha se o banco estiver fora
    return {
        "app": settings.APP_NAME,
        "status": "ok",
        "version": app.version,
        "docs": "/docs",
    }
