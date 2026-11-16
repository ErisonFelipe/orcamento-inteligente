from fastapi import APIRouter

from app.api.v1.endpoints import transactions, categories, dashboard, investments

api_router = APIRouter()

api_router.include_router(transactions.router)
api_router.include_router(categories.router)
api_router.include_router(dashboard.router) # Nova rota
api_router.include_router(investments.router)