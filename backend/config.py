from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # --- Gemini ---
    gemini_api_key: str

    # --- Storage paths ---
    upload_dir: str = "./uploads"
    vector_store_dir: str = "./vector_store"

    # --- Chunking ---
    chunk_size: int = 500
    chunk_overlap: int = 100

    # --- RAG retrieval ---
    top_k_chunks: int = 5

    # --- Models ---
    # 2.5-flash is the current default; gemini-2.0-flash has been shut down
    # by Google, so don't let a missing env var silently fall back to it.
    llm_model: str = "gemini-2.5-flash"
    embedding_model: str = "models/gemini-embedding-001"

    class Config:
        env_file = ".env"

settings = Settings()