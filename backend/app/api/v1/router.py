"""
Agregador de routers da API v1.

Este arquivo junta todos os routers de endpoints da versão 1 da API num
único `api_router`, que é montado no `app/main.py` com o prefixo `/api/v1`.

Por que existe:

- `main.py` importa UM objeto (`api_router`) em vez de N routers.
- Adicionar uma nova entidade (ex.: `categories` na Etapa 4) exige editar
  APENAS este arquivo — `main.py` não muda.
- Versionamento: se um dia existir `/api/v2`, cria-se
  `app/api/v2/router.py` com seu próprio `api_router`, e o `main.py`
  inclui os dois. Nada mais muda.

Estrutura de composição:

    main.py
      └── api_router (este arquivo, prefix="/api/v1")
            ├── transactions.router  (prefix="/transactions")
            ├── (futuro) categories.router
            └── (futuro) budgets.router

Uso no main.py (Parte 3):

    from app.api.v1.router import api_router
    app.include_router(api_router, prefix="/api/v1")
"""

from fastapi import APIRouter

from app.api.v1.endpoints import transactions

api_router = APIRouter()

# --- Endpoints de transações ---
api_router.include_router(transactions.router)

# --- Novos routers entram aqui nas próximas etapas ---
# from app.api.v1.endpoints import categories
# api_router.include_router(categories.router)
    
