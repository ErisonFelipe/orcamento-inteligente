# 💰 Orçamento Inteligente

Aplicação web para controle financeiro pessoal com categorização automática de
gastos, previsão de saldo mensal e alertas personalizados.

> **Status do projeto:** 🚧 Em desenvolvimento — Etapa 2 em andamento (Sub-etapa 2.1 concluída).
> **Última atualização:** 2026-11-05

---

## 📋 Índice

1. [Visão geral](#-visão-geral)
2. [Stack tecnológica](#-stack-tecnológica)
3. [Estrutura de pastas](#-estrutura-de-pastas)
4. [Roadmap](#-roadmap)
5. [Etapa 1 — Ambiente e Estrutura](#-etapa-1--ambiente-e-estrutura)
6. [Etapa 2 — Backend com FastAPI + PostgreSQL](#-etapa-2--backend-com-fastapi--postgresql)
7. [Como executar o projeto](#-como-executar-o-projeto)
8. [Convenções e boas práticas](#-convenções-e-boas-práticas)

---

## 🎯 Visão geral

O **Orçamento Inteligente** permite que o usuário:

- Cadastre receitas e despesas;
- Organize os gastos por categoria (ex.: Alimentação, Transporte, Lazer);
- Defina **metas de orçamento mensal** por categoria;
- Visualize dashboards com gráficos e relatórios;
- Receba **insights automáticos**, como:
  - Alertas de gastos acima da média histórica;
  - Previsão do saldo ao final do mês;
  - Sugestões de economia.

---

## 🧱 Stack tecnológica

| Camada | Tecnologia | Justificativa resumida |
| :--- | :--- | :--- |
| **Backend** | Python 3.10+ + **FastAPI** | Alto desempenho, documentação automática (Swagger), ideal para integrar ML |
| **Banco de dados** | **PostgreSQL** 14+ | Gratuito, robusto, transações ACID, multiplataforma |
| **Frontend** | **React** + **Vite** + **TypeScript** | Ecossistema maduro, build rápido, tipagem que evita erros |
| **Machine Learning** | **Scikit-learn** (categorização) + **Prophet** (previsão) | Bibliotecas amigáveis para iniciantes, boa performance |
| **Versionamento** | **Git** + GitHub | Padrão de mercado |
| **Editor** | **VS Code** | Extensões Python, TypeScript, PostgreSQL, Git integrado |

### Decisões registradas (ADRs curtos)

- ❌ **Não usamos Django** — traz complexidade (ORM, admin, autenticação) que confunde iniciantes. FastAPI é mais explícito.
- ❌ **Não usamos SQL Server** — licenciamento pago. PostgreSQL é gratuito e equivalente em capacidade.
- ❌ **Não usamos Next.js** — SSR e rotas integradas são overhead para o MVP. Vite + React é mais simples.
- ✅ **Usamos `venv`** — cada projeto Python deve ter dependências isoladas.
- ✅ **Usamos NVM** — permite instalar/trocar versões do Node sem dor.
- ✅ **`Base.metadata.create_all()` em vez de Alembic no MVP** (registrada na Etapa 2.1) — Alembic entra na Etapa 4, quando o schema começar a evoluir. Evita sobrecarga de complexidade agora.

---

## 🗂 Estrutura de pastas

```
orcamento-inteligente/
│
├── backend/              # API Python + FastAPI (em construção — Etapa 2)
│   └── ...
│
├── frontend/             # Interface React (a ser criada na Etapa 3)
│   └── ...
│
├── .gitignore            # Arquivos que o Git NÃO deve versionar
└── README.md             # Este arquivo
```

*As subpastas internas de `backend/` e `frontend/` serão detalhadas nas etapas em que forem criadas.*

---

## 🗺 Roadmap

| Etapa | Descrição | Status |
| :--- | :--- | :---: |
| 1 | Preparação do ambiente (Python, Node, PostgreSQL, Git, VS Code) e estrutura inicial | ✅ |
| 2 | Backend: API de transações (CRUD) + conexão com PostgreSQL | 🚧 |
| 3 | Frontend: tela de transações consumindo a API | ⏳ |
| 4 | Categorias e orçamentos mensais por categoria | ⏳ |
| 5 | Dashboard com gráficos e relatórios | ⏳ |
| 6 | Inteligência 1: categorização automática (Scikit-learn) | ⏳ |
| 7 | Inteligência 2: previsão e alertas (Prophet) | ⏳ |
| 8 | Deploy em servidor Linux (Docker + Nginx) | ⏳ |

**Legenda:** ✅ concluída · 🚧 em andamento · ⏳ pendente

### Sub-etapas da Etapa 2

| Sub-etapa | Descrição | Status |
| :--- | :--- | :---: |
| 2.1 | Configuração do PostgreSQL (usuário + database + teste de conexão) | ✅ |
| 2.2 | Ambiente virtual Python + estrutura de pastas do backend + `requirements.txt` | ⏳ |
| 2.3 | Configurações: `.env`, `.env.example` e `config.py` | ⏳ |
| 2.4 | Conexão com o banco: `db/session.py` + `db/base.py` | ⏳ |
| 2.5 | Modelo `Transaction` (tabela no banco) | ⏳ |
| 2.6 | Schemas de validação com Pydantic | ⏳ |
| 2.7 | Camada CRUD + endpoints REST + `main.py` | ⏳ |

---

## ✅ Etapa 1 — Ambiente e Estrutura

**Data de conclusão:** 2026-11-05

### Objetivo

Preparar a "oficina" — instalar todas as ferramentas necessárias e criar a
estrutura inicial de pastas e o primeiro arquivo versionável.

### Ferramentas instaladas / verificadas

| Ferramenta | Versão instalada | Como foi instalada |
| :--- | :--- | :--- |
| Python | 3.x | `sudo apt install python3 python3-pip python3-venv` |
| Node.js | LTS (via NVM) | `curl ... nvm ... install.sh` + `nvm install --lts` |
| PostgreSQL | 14+ | `sudo apt install postgresql postgresql-contrib` |
| Git | (versão do apt) | `sudo apt install git` |
| VS Code | (snap) | `sudo snap install code --classic` |

### Estrutura criada

```
orcamento-inteligente/
├── backend/       (vazio — será preenchido na Etapa 2)
├── frontend/      (vazio — será preenchido na Etapa 3)
├── .gitignore
└── README.md
```

### Arquivo `.gitignore`

Criado para evitar que arquivos sensíveis ou gerados automaticamente
sejam versionados. Cobre:

- **Python:** `__pycache__/`, `*.pyc`, `venv/`, `.venv/`, `dist/`, `build/`
- **Node:** `node_modules/`, `frontend/dist/`, `frontend/build/`
- **Segredos:** `.env`, `.env.*` (exceto `.env.example`)
- **IDEs:** `.vscode/`, `.idea/`
- **Sistemas operacionais:** `.DS_Store`, `Thumbs.db`
- **Logs:** `*.log`, `logs/`, `tmp/`

> 🔐 **Regra de ouro:** nenhum arquivo `.env` real deve ser commitado. O
> `.env.example` (a ser criado na Sub-etapa 2.3) será o "modelo" versionado.

### Git inicializado

```bash
git init
```

O repositório local está ativo em `orcamento-inteligente/.git/`.

### Como verificar que está tudo certo

```bash
python3 --version    # deve mostrar 3.10+
node --version       # deve mostrar v20+ (ou v22+ LTS)
git --version
psql --version
code --version

cd ~/projetos/orcamento-inteligente
ls -la              # deve listar backend/, frontend/, .gitignore, .git/, README.md

git status          # deve dizer "No commits yet" e listar .gitignore e README.md como untracked
```

### Problemas comuns e soluções

| Sintoma | Causa provável | Solução |
| :--- | :--- | :--- |
| `command not found: node` após instalar | Terminal não recarregou o NVM | Feche e reabra o terminal ou rode `source ~/.bashrc` |
| `pip3 --version` falha | `python3-pip` não instalado | `sudo apt install python3-pip` |

---

## ✅ Etapa 2 — Backend com FastAPI + PostgreSQL

**Status:** 🚧 Em andamento

**Objetivo:** criar a API que gerencia receitas e despesas, com persistência
em PostgreSQL, seguindo boas práticas de segurança (usuário dedicado no banco,
senhas fora do código, validação de dados).

### Sub-etapa 2.1 — Configuração do PostgreSQL ✅

**Data de conclusão:** 2026-11-05

#### Objetivo

Criar **usuário e database dedicados** para a aplicação, em vez de usar o
superusuário `postgres`. Isso segue o **princípio do menor privilégio**:
se a aplicação for comprometida, o dano fica limitado ao seu próprio database.

#### O que foi criado

| Item | Valor | Observação |
| :--- | :--- | :--- |
| **Usuário do banco** | `orcamento_user` | Senha forte gerada com `openssl rand -base64 24` |
| **Database** | `orcamento_db` | Owner: `orcamento_user` |
| **Permissões** | `GRANT ALL PRIVILEGES ON DATABASE orcamento_db TO orcamento_user` | — |
| **Host** | `localhost` | Autenticação por TCP (mesmo caminho que o Python usará) |
| **Porta** | `5432` | Padrão do PostgreSQL |

> 🔐 **A senha do banco NÃO está documentada aqui.** Ela está guardada em local seguro e será colocada no arquivo `.env` do backend na Sub-etapa 2.3 (que o `.gitignore` protege).

#### Comandos executados (resumo)

```bash
# 1. Verificar que o serviço está rodando
sudo systemctl status postgresql
sudo systemctl enable postgresql    # garante inicialização no boot

# 2. Gerar uma senha forte
openssl rand -base64 24

# 3. Criar usuário e database
sudo -u postgres psql
# (dentro do psql)
# CREATE USER orcamento_user WITH PASSWORD '<senha-gerada>';
# CREATE DATABASE orcamento_db OWNER orcamento_user;
# GRANT ALL PRIVILEGES ON DATABASE orcamento_db TO orcamento_user;
# \q

# 4. Testar a conexão como o usuário da aplicação
psql -h localhost -U orcamento_user -d orcamento_db
```

#### Como verificar que está tudo certo

```bash
# Verificar que o serviço está no ar
sudo systemctl is-active postgresql
# Saída esperada: active

# Testar conexão como o usuário da aplicação
psql -h localhost -U orcamento_user -d orcamento_db -c "SELECT current_user, current_database();"
# Saída esperada:
#  current_user   | current_database
# ----------------+------------------
#  orcamento_user | orcamento_db

# Confirmar que existe no banco
psql -h localhost -U orcamento_user -d orcamento_db -c "\dt"
# Saída esperada: "Did not find any relations." (ainda não há tabelas — normal)
```

#### Variáveis de conexão (para uso na Sub-etapa 2.3)

Essas variáveis serão colocadas no `.env` do backend:

```
DB_USER=orcamento_user
DB_PASSWORD=<definida na configuração do banco>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orcamento_db
```

#### Problemas comuns e soluções

| Sintoma | Causa | Solução |
| :--- | :--- | :--- |
| `connection refused` | PostgreSQL parado | `sudo systemctl start postgresql` |
| `password authentication failed` | Senha incorreta | Refazer: `ALTER USER orcamento_user WITH PASSWORD '...';` |
| `database "orcamento_db" does not exist` | `CREATE DATABASE` não rodou | Recriar via `sudo -u postgres psql` |
| `Peer authentication failed` | Tentativa sem `-h localhost` | Usar sempre `-h localhost` em testes manuais |

---

## ▶️ Como executar o projeto

> **Ainda não há aplicação para executar.** A API começa a rodar na Sub-etapa 2.7.
> Esta seção será atualizada a cada etapa com os comandos reais.

Espaço reservado:

- **Banco de dados** — ✅ rodando (ver Sub-etapa 2.1)
- **Backend** — `(a definir na Sub-etapa 2.7)`
- **Frontend** — `(a definir na Etapa 3)`

---

## 🧭 Convenções e boas práticas

- **Idioma do código:** nomes de variáveis, funções e classes em **inglês** (padrão de mercado). Comentários e documentação em **português**.
- **Commits:** mensagens no imperativo e curtas, ex.: `feat: cria endpoint de transações`, `fix: corrige cálculo de saldo`.
- **Segredos:** nunca commitar `.env`. Sempre manter um `.env.example` atualizado.
- **Princípio do menor privilégio:** aplicação nunca usa superusuário do banco.
- **Dependências:** versões travadas (`requirements.txt` no backend, `package-lock.json` no frontend).
- **Uma etapa por vez:** não pular etapas do roadmap — cada uma depende da anterior.
- **Testar antes de avançar:** ao final de cada etapa, rodar os comandos de verificação.

---

## 📝 Histórico de alterações

| Data | Etapa | Resumo |
| :--- | :--- | :--- |
| 2026-11-05 | 1 | Ambiente configurado, estrutura criada, `.gitignore` e Git inicializados |
| 2026-11-05 | 2.1 | PostgreSQL: usuário `orcamento_user` e database `orcamento_db` criados; conexão TCP testada |