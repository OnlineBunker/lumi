from google import genai
from google.genai import types
from config import settings

client = genai.Client(api_key=settings.gemini_api_key)


def _embed(texts, task_type):
    res = client.models.embed_content(
        model=settings.embedding_model,
        contents=texts,
        config=types.EmbedContentConfig(task_type=task_type),
    )
    return [e.values for e in res.embeddings]


def embed_documents(texts):
    # The API takes up to 100 texts per call; one call per chunk was the
    # main reason uploads timed out in production.
    vectors = []
    for i in range(0, len(texts), 100):
        vectors += _embed(texts[i:i + 100], "RETRIEVAL_DOCUMENT")
    return vectors


def embed_query(text):
    return _embed([text], "RETRIEVAL_QUERY")[0]
