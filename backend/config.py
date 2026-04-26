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
    llm_model: str = "gemini-2.0-flash"
    embedding_model: str = "models/text-embedding-004"

    class Config:
        env_file = ".env"

settings = Settings()