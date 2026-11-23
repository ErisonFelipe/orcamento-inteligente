"""
Endpoints para o Dashboard (dados agregados, previsão e patrimônio).
"""

import calendar
from datetime import date, timedelta
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, case
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.models.investment import Investment
from app.schemas.dashboard import (
    CategoryExpense,
    DashboardSummary,
    MonthlySummary,
    ForecastInfo,
    AnnualWealthSummary,
    CashflowForecast,
    CashflowMonth,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Annotated[Session, Depends(get_db)],
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
):
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year
    
    # Define o primeiro e o último dia do mês selecionado
    first_day = date(target_year, target_month, 1)
    last_day = date(target_year, target_month, calendar.monthrange(target_year, target_month)[1])
    
    target_month_str = f"{target_year}-{target_month:02d}"

    # 1. Gastos por Categoria (Filtrado pelo mês)
    stmt_cat = (
        select(
            Category.id.label("category_id"),
            func.coalesce(Category.name, "Sem categoria").label("name"),
            func.coalesce(Category.color, "#94a3b8").label("color"),
            func.sum(Transaction.amount).label("total"),
        )
        .select_from(Transaction)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(Transaction.type == TransactionType.EXPENSE)
        .where(Transaction.date >= first_day)
        .where(Transaction.date <= last_day)
        .group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(Transaction.amount).desc())
    )
    expenses_result = db.execute(stmt_cat).all()
    expenses_by_category = [
        CategoryExpense(
            category_id=row.category_id,
            name=row.name,
            color=row.color,
            total=row.total
        ) for row in expenses_result
    ]

    # Total Investido (Global, não filtra por mês)
    total_invested_stmt = select(
        func.sum(
            case(
                (Investment.current_value.isnot(None), Investment.current_value),
                else_=Investment.amount
            )
        )
    )
    total_invested = db.scalar(total_invested_stmt) or Decimal(0)

    if total_invested > 0:
        expenses_by_category.append(
            CategoryExpense(
                category_id=None,
                name="Investimentos",
                color="#8b5cf6",
                total=total_invested
            )
        )

    # 2. Resumo Mensal (Apenas do mês selecionado para os cards)
    stmt_monthly = (
        select(
            func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=0)).label("income"),
            func.sum(case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=0)).label("expense")
        )
        .where(Transaction.date >= first_day)
        .where(Transaction.date <= last_day)
    )
    res_monthly = db.execute(stmt_monthly).first()
    
    month_income = Decimal(res_monthly.income or 0)
    month_expense = Decimal(res_monthly.expense or 0)

    # O monthly_summary é usado para o gráfico de barras de evolução. 
    # Vamos pegar os últimos 6 meses para manter o gráfico bonito.
    month_col = func.to_char(Transaction.date, 'YYYY-MM').label('month')
    stmt_history = (
        select(
            month_col,
            func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=0)).label("income"),
            func.sum(case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=0)).label("expense")
        )
        .group_by(month_col)
        .order_by(month_col.asc())
    )
    history_result = db.execute(stmt_history).all()
    monthly_summary = [
        MonthlySummary(month=row.month, income=row.income, expense=row.expense)
        for row in history_result
    ]

    # 3. Cálculo de Previsão (Só faz sentido se o mês selecionado for o mês atual)
    daily_average = Decimal(0)
    projected_expense = month_expense
    projected_balance = month_income - month_expense
    alert_message = None
    current_day = 1
    
    if target_month == today.month and target_year == today.year:
        current_day = today.day
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        daily_average = month_expense / current_day if current_day > 0 else Decimal(0)
        projected_expense = daily_average * days_in_month
        projected_balance = month_income - projected_expense

        if projected_balance < 0:
            alert_message = "Atenção: No ritmo atual de gastos, seu saldo ficará negativo até o fim do mês."
        elif month_income > 0 and month_expense > (month_income * Decimal('0.8')):
            alert_message = "Cuidado: Você já gastou mais de 80% da sua receita deste mês."

    forecast = ForecastInfo(
        current_day=current_day,
        days_in_month=calendar.monthrange(target_year, target_month)[1],
        daily_average=round(daily_average, 2),
        projected_expense=round(projected_expense, 2),
        projected_balance=round(projected_balance, 2),
        alert_message=alert_message
    )

    return DashboardSummary(
        expenses_by_category=expenses_by_category,
        monthly_summary=monthly_summary,
        forecast=forecast,
        total_invested=total_invested
    )


@router.get("/wealth", response_model=AnnualWealthSummary)
def get_annual_wealth(
    db: Annotated[Session, Depends(get_db)],
    year: int = date.today().year,
):
    today = date.today()
    
    # 1. Saldo Atual (Tudo até HOJE, independente do ano selecionado)
    stmt_current = select(
        func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=-Transaction.amount))
    ).where(Transaction.date <= today)
    current_cash = db.scalar(stmt_current) or Decimal(0)

    # 2. Transações Futuras no ano selecionado (Do dia de hoje até 31/12 do ano)
    first_day = date(year, 1, 1)
    last_day = date(year, 12, 31)
    
    stmt_future = select(
        func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=-Transaction.amount))
    ).where(Transaction.date > today).where(Transaction.date >= first_day).where(Transaction.date <= last_day)
    future_cash = db.scalar(stmt_future) or Decimal(0)
    
    projected_cash = current_cash + future_cash

    # 3. Totais do ano selecionado (para os cards de Receitas e Despesas)
    stmt_year = select(
        func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=0)).label("income"),
        func.sum(case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=0)).label("expense")
    ).where(Transaction.date >= first_day).where(Transaction.date <= last_day)
    res_year = db.execute(stmt_year).first()
    total_income = Decimal(res_year.income or 0)
    total_expense = Decimal(res_year.expense or 0)

    # 4. Total Investido (Global, já com current_value)
    stmt_investments = select(
        func.sum(
            case(
                (Investment.current_value.isnot(None), Investment.current_value),
                else_=Investment.amount
            )
        )
    )
    total_invested = Decimal(db.scalar(stmt_investments) or 0)

    # 5. Patrimônio Líquido HOJE
    net_worth = current_cash + total_invested

    # 6. Projeções
    projected_income = total_income
    projected_expense = total_expense
    if year == today.year and today.month > 0:
        projected_income = (total_income / today.month) * 12
        projected_expense = (total_expense / today.month) * 12

    projected_savings = projected_income - projected_expense

    return AnnualWealthSummary(
        year=year,
        total_income=total_income,
        total_expense=total_expense,
        current_cash=current_cash,
        projected_cash=projected_cash,
        total_invested=total_invested,
        net_worth=net_worth,
        projected_annual_income=round(projected_income, 2),
        projected_annual_expense=round(projected_expense, 2),
        projected_annual_savings=round(projected_savings, 2)
    )
    
@router.get("/cashflow", response_model=CashflowForecast)
def get_cashflow_forecast(
    db: Annotated[Session, Depends(get_db)],
    months: int = Query(6, ge=1, le=12),
):
    today = date.today()
    
    # 1. Saldo atual (passado)
    stmt_past = select(
        func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=-Transaction.amount))
    ).where(Transaction.date <= today)
    
    current_balance = db.scalar(stmt_past) or Decimal(0)

    # 2. Transações futuras
    future_month_col = func.to_char(Transaction.date, 'YYYY-MM').label('month')
    stmt_future = (
        select(
            future_month_col,
            func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=0)).label("income"),
            func.sum(case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=0)).label("expense")
        )
        .where(Transaction.date > today)
        .group_by(future_month_col)
        .order_by(future_month_col.asc())
        .limit(months)
    )
    future_result = db.execute(stmt_future).all()

    # 3. Monta a projeção
    forecast_list = []
    running_balance = current_balance
    future_dict = {row.month: (Decimal(row.income or 0), Decimal(row.expense or 0)) for row in future_result}

    current_y, current_m = today.year, today.month
    
    for _ in range(months):
        current_m += 1
        if current_m > 12:
            current_m = 1
            current_y += 1
            
        month_str = f"{current_y}-{current_m:02d}"
        
        if month_str in future_dict:
            inc, exp = future_dict[month_str]
            running_balance += (inc - exp)

        forecast_list.append(
            CashflowMonth(
                month=month_str,
                balance=running_balance
            )
        )

    return CashflowForecast(
        current_balance=current_balance,
        forecast=forecast_list
    )