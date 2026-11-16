FROM python:3.10-slim

WORKDIR /app

# Instala apenas as dependências essenciais, sem recomendações e limpa o cache do apt
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Instala as dependências do Python sem cache e limpa os arquivos temporários
RUN pip install --no-cache-dir -r requirements.txt \
    && find /usr/local/lib/python3.10/site-packages -name "*.pyc" -delete \
    && find /usr/local/lib/python3.10/site-packages -name "__pycache__" -type d -exec rm -rf {} +

COPY . .

CMD ["gunicorn", "app.main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]