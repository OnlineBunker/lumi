from google import genai
from google.genai import types
from config import settings
from typing import List

client = genai.Client(api_key=settings.gemini_api_key)

def embed_documents(texts: List[str]) -> List[List[float]]:
    """Batch-embed a list of texts."""
    embeddings = []
    for text in texts:
        result = client.models.embed_content(
            model="models/gemini-embedding-001",
            contents=text,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
        )
        embeddings.append(result.embeddings[0].values)
    return embeddings

def embed_query(text: str) -> List[float]:
    """Embed a single search query."""
    result = client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
    )
    return result.embeddings[0].values