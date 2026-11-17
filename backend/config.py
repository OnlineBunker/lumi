from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str
    vector_store_dir: str = "./vector_store"
    chunk_size: int = 1200
    chunk_overlap: int = 150
    top_k_chunks: int = 5
    # -latest alias: Google retires pinned versions (2.5-flash-lite already 404s); this one moves with them
    llm_model: str = "gemini-flash-lite-latest"
    embedding_model: str = "gemini-embedding-001"


settings = Settings()
