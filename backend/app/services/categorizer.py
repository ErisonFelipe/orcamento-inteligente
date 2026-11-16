"""
Serviço de Inteligência Artificial para categorização automática de transações.

Usa TF-IDF (para transformar texto em vetores numéricos) e LinearSVC (para
classificação). Treina o modelo usando o histórico de transações do usuário.
"""

import os
import logging
from typing import Optional

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.category import Category

logger = logging.getLogger(__name__)

# Caminho onde o modelo treinado será salvo
MODEL_PATH = os.path.join(os.path.dirname(__file__), "categorizer_model.joblib")


class TransactionCategorizer:
    def __init__(self):
        self.model: Optional[Pipeline] = None
        self.is_trained = False

    def train(self, db: Session) -> bool:
        """
        Treina o modelo usando todas as transações que JÁ TÊM categoria.
        Retorna True se o treino foi bem-sucedido, False se não há dados suficientes.
        """
        # Busca descrições e IDs de categoria no banco
        stmt = (
            select(Transaction.description, Transaction.category_id)
            .where(Transaction.category_id.isnot(None))
        )
        results = db.execute(stmt).all()

        # Precisa de pelo menos 2 exemplos e 2 categorias diferentes para aprender
        if len(results) < 2 or len({row.category_id for row in results}) < 2:
            logger.info("Dados insuficientes para treinar a IA.")
            self.is_trained = False
            return False

        texts = [row.description for row in results]
        labels = [row.category_id for row in results]

        # Cria o pipeline de Machine Learning
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(lowercase=True, ngram_range=(1, 2))),
            ('clf', LinearSVC(random_state=42))
        ])

        # Treina o modelo
        self.model.fit(texts, labels)
        self.is_trained = True
        
        # Salva o modelo treinado em disco
        joblib.dump(self.model, MODEL_PATH)
        logger.info(f"Modelo de IA treinado com {len(texts)} exemplos.")
        return True

    def predict(self, text: str) -> Optional[int]:
        """
        Recebe uma descrição (ex: "Uber para o centro") e retorna o `category_id`
        previsto pelo modelo. Retorna None se não conseguir prever.
        """
        # Tenta carregar o modelo se ele não estiver na memória
        if not self.is_trained:
            if os.path.exists(MODEL_PATH):
                try:
                    self.model = joblib.load(MODEL_PATH)
                    self.is_trained = True
                except Exception as e:
                    logger.error(f"Erro ao carregar modelo salvo: {e}")
                    return None
            else:
                return None

        try:
            # O predict espera uma lista de strings, mesmo que seja só uma
            prediction = self.model.predict([text])
            return int(prediction[0])
        except Exception as e:
            logger.error(f"Erro na predição: {e}")
            return None


# Instância global (singleton)
categorizer = TransactionCategorizer()