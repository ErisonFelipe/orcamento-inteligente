"""
Ponto de entrada da API — Orçamento Inteligente.
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
from app.db.session import engine, get_db, SessionLocal
from app.services.categorizer import categorizer
import app.models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # === STARTUP ===
    Base.metadata.create_all(bind=engine)
    print(f"[startup] Tabelas garantidas: {list(Base.metadata.tables.keys())}")
    
    # Treina a IA com segurança
    print("[startup] Verificando modelo de IA...")
    db = SessionLocal()
    try:
        from app.models import Transaction
        count = db.query(Transaction).count()
        if count > 0:
            treinado = categorizer.train(db)
            print(f"[startup] Modelo de IA treinado: {treinado}")
        else:
            print("[startup] Banco vazio, IA aguardando dados.")
    except Exception as e:
        print(f"[startup] Aviso: IA não treinada ainda ({e})")
    finally:
        db.close()

    print(f"[startup] {settings.APP_NAME} pronto em /api/v1")
    
    # O yield PRECISA estar fora de qualquer bloco try/except
    yield
    
    # === SHUTDOWN ===
    print("[shutdown] Encerrando aplicação...")

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "*" 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/", tags=["health"], summary="Health check")
def root(db: Annotated[Session, Depends(get_db)]) -> dict:
    db.execute(text("SELECT 1"))
    return {
        "app": settings.APP_NAME,
        "status": "ok",
        "version": app.version,
        "docs": "/docs",
    }