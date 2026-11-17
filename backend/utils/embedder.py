import time
from google import genai
from google.genai import errors, types
from config import settings

client = genai.Client(api_key=settings.gemini_api_key)

# 768 instead of the 3072 default: 4x less memory per chunk, near-identical retrieval quality
DIMS = 768


def _retry_after(err):
    """Seconds Google asks us to wait on a 429, if it says."""
    for d in (err.details or {}).get("error", {}).get("details", []):
        if d.get("@type", "").endswith("RetryInfo"):
            return float(d["retryDelay"].rstrip("s"))
    return None


def _embed(texts, task_type):
    for attempt in range(4):
        try:
            res = client.models.embed_content(
                model=settings.embedding_model,
                contents=texts,
                config=types.EmbedContentConfig(task_type=task_type, output_dimensionality=DIMS),
            )
            return [e.values for e in res.embeddings]
        except errors.ClientError as e:
            # Free tier allows 100 texts a minute: wait out that limit, but not a daily one
            wait = _retry_after(e) if e.code == 429 else None
            if wait is None or wait > 65 or attempt == 3:
                raise
            time.sleep(wait + 1)


def embed_documents(texts):
    # Each text counts as one request, so a batch of 100 uses a full minute of free quota
    vectors = []
    for i in range(0, len(texts), 100):
        vectors += _embed(texts[i:i + 100], "RETRIEVAL_DOCUMENT")
    return vectors


def embed_query(text):
    return _embed([text], "RETRIEVAL_QUERY")[0]
