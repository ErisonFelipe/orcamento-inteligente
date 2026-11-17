# Estágio 1: Compilação (onde o gcc é instalado)
FROM python:3.10-slim AS builder

WORKDIR /app

# Instala dependências de sistema apenas para compilar
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Baixa e compila as dependências em formato de "wheels"
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Estágio 2: Execução (imagem final leve)
FROM python:3.10-slim

WORKDIR /app

# Copia apenas os wheels gerados no estágio 1
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

# Instala a partir dos wheels locais e limpa o cache
RUN pip install --no-cache /wheels/* \
    && rm -rf /wheels

COPY . .

CMD ["gunicorn", "app.main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]