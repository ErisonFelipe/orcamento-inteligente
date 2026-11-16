# 💰 Orçamento Inteligente

Aplicação web completa para controle financeiro pessoal, gestão de patrimônio e insights com Inteligência Artificial.

> **Status do projeto:** ✅ Etapas 1 a 8 concluídas. Pronta para Deploy.
> **Última atualização:** 2026-11-16

---

## 📋 Índice
1. [Visão geral](#-visão-geral)
2. [Stack tecnológica](#-stack-tecnológica)
3. [Funcionalidades](#-funcionalidades)
4. [Estrutura de pastas](#-estrutura-de-pastas)
5. [Modelo de dados atual](#-modelo-de-dados-atual)
6. [API — Referência de endpoints](#-api--referência-de-endpoints)
7. [Histórico de Etapas](#-histórico-de-etapas)

---

## 🎯 Visão geral

O **Orçamento Inteligente** vai além de um simples caderno de gastos. Ele foi desenhado para ser um **Gestor de Patrimônio**, permitindo ao usuário:
- Controlar o fluxo de caixa mensal e anual.
- Registrar receitas recorrentes (ex: salário) e despesas parceladas (ex: empréstimos).
- Acompanhar a evolução do patrimônio líquido (Caixa + Investimentos).
- Distribuir aportes de investimentos e gerenciar o "caixa da corretora" (dinheiro não alocado).
- Receber categorização automática de gastos via Machine Learning.

---

## 🧱 Stack tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy 2.0, Alembic |
| **Banco de Dados** | PostgreSQL |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Estado & Dados** | TanStack Query, Axios, React Hook Form, Zod |
| **Gráficos** | Recharts |
| **Inteligência Artificial** | Scikit-learn (TF-IDF + LinearSVC) |

---

## 🚀 Funcionalidades Principais

- **Transações Avançadas:**
  - CRUD completo de receitas e despesas.
  - Cálculo matemático direto no campo de valor (ex: `1600 * 2`).
  - **Recorrência:** Criar o salário do ano inteiro em um clique.
  - **Parcelamento:** Dividir despesas mensalmente de forma automática e precisa.
- **Investimentos & Patrimônio:**
  - Gestão de ativos (Ações, Renda Fixa, etc.).
  - **Rateio de Aportes:** Distribuição do valor transferido entre ativos e cálculo automático do "Caixa da Corretora" (sobra).
  - Painel Anual de Patrimônio Líquido.
- **Dashboard e IA:**
  - Gráficos de evolução mensal e despesas por categoria.
  - Previsão de saldo para o fim do mês com base no ritmo de gastos.
  - Sugestão automática de categoria (IA) ao digitar a descrição.

---

## 🗂 Estrutura de pastas

```
orcamento-inteligente/
│
├── backend/
│   ├── alembic/              # Migrações (Alembic)
│   ├── app/
│   │   ├── main.py           # App FastAPI + Startup da IA
│   │   ├── core/config.py    # Settings via .env
│   │   ├── db/               # Conexão SQLAlchemy
│   │   ├── models/           # Transaction, Category, Investment
│   │   ├── schemas/          # Pydantic (Create, Read, Update, Bulk)
│   │   ├── crud/             # Lógica de banco de dados
│   │   ├── api/v1/           # Endpoints REST
│   │   └── services/         # categorizer.py (IA)
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/       # Layout, UI (shadcn) e Módulos (transactions, categories)
│       ├── contexts/         # Dialog Context
│       ├── hooks/            # React Query (use-transactions, use-investments, etc)
│       ├── lib/              # Utils, Formatadores, Validadores (Zod)
│       ├── pages/            # Telas (Dashboard, Investimentos, Patrimônio)
│       └── services/         # Cliente Axios
│
└── README.md
```

---

## 🗃 Modelo de dados atual

### Tabela `categories`
- `id` (PK), `name` (Unique), `color`, `created_at`, `updated_at`

### Tabela `transactions`
- `id` (PK), `description`, `amount` (Numeric 12,2), `type` (Enum: income/expense)
- `category_id` (FK, ON DELETE SET NULL), `date`, `created_at`, `updated_at`

### Tabela `investments`
- `id` (PK), `name`, `type` (String: Ações, Renda Fixa, Caixa), `amount` (Numeric 12,2)
- `date`, `created_at`, `updated_at`

---

## 🌐 API — Referência de endpoints

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/transactions` | Lista com filtros e paginação |
| `POST` | `/api/v1/transactions` | Cria transação única |
| `POST` | `/api/v1/transactions/bulk` | **Cria múltiplas transações (parcelas/recorrência)** |
| `POST` | `/api/v1/transactions/predict-category` | **Sugere categoria via IA** |
| `GET` | `/api/v1/categories` | Lista categorias |
| `GET` | `/api/v1/investments` | Lista ativos |
| `POST` | `/api/v1/investments/bulk` | **Cria múltiplos ativos (rateio de aporte)** |
| `GET` | `/api/v1/dashboard/summary` | Resumo mensal, gráficos e previsão |
| `GET` | `/api/v1/dashboard/wealth` | **Patrimônio Líquido Anual e Projeções** |

---

## 📝 Histórico de Etapas

| Etapa | Descrição | Status |
| :--- | :--- | :---: |
| 1 a 3 | Setup, Backend CRUD e Frontend Base (UI/UX) | ✅ |
| 4 | Categorias Relacionais, Alembic e Modais | ✅ |
| 5 | Dashboard e Gráficos com Recharts | ✅ |
| 6 | IA de Categorização Automática (Scikit-learn) | ✅ |
| 7 | Previsão de Saldo e Alertas | ✅ |
| 8 | Módulo de Investimentos, Patrimônio e Lote (Bulk) | ✅ |
| **9** | **Deploy em produção** | ⏳ |