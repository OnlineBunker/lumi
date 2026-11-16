from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str
    vector_store_dir: str = "./vector_store"
    chunk_size: int = 500
    chunk_overlap: int = 100
    top_k_chunks: int = 5
    llm_model: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"


settings = Settings()
