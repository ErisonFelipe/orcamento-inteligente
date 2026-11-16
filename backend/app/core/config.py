"""
Configurações centrais da aplicação.

Este módulo lê o arquivo `.env` (na raiz do backend/) usando a biblioteca
`pydantic-settings`. Toda a aplicação deve importar as configurações daqui:

    from app.core.config import settings

Nunca leia `os.getenv("...")` diretamente em outros módulos — sempre use
`settings.NOME_DA_VARIAVEL`.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações tipadas, carregadas do arquivo .env."""

    # --- Aplicação ---
    APP_NAME: str = "Orçamento Inteligente"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # --- Banco de dados ---
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str

    # Configuração do Pydantic: onde procurar o .env e como se comportar
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    @property
    def database_url(self) -> str:
        """
        Monta a URL de conexão do SQLAlchemy com o PostgreSQL.

        Formato: postgresql+psycopg2://USUARIO:SENHA@HOST:PORTA/DATABASE

        O trecho "+psycopg2" diz ao SQLAlchemy qual driver usar.
        """
        return (
            f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


# Instância única (singleton) — importe sempre `settings`, não `Settings`.
settings = Settings()
