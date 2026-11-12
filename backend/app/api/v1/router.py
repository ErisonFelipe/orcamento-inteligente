from fastapi import APIRouter

from app.api.v1.endpoints import transactions, categories

api_router = APIRouter()

api_router.include_router(transactions.router)
api_router.include_router(categories.router) # Nova rota incluída