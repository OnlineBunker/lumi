import os
import re
from collections import OrderedDict
import numpy as np
from config import settings
from utils.embedder import embed_documents, embed_query

# Each document is a few MB of vectors: keep the most recently used ones in RAM,
# everything on disk as one .npz file per document.
# shortcut: cache is per process; fine for one uvicorn worker, add a shared store before scaling out.
MAX_IN_MEMORY = 20
_cache = OrderedDict()  # doc_id -> (unit vectors [n, d], pages [n], texts)


def _path(doc_id):
    # doc_id comes from the client and becomes a file name: allow only our own 8-hex ids
    if not re.fullmatch(r"[0-9a-f]{8}", doc_id):
        raise ValueError("bad doc_id")
    return os.path.join(settings.vector_store_dir, f"{doc_id}.npz")


def _remember(doc_id, doc):
    _cache[doc_id] = doc
    _cache.move_to_end(doc_id)
    if len(_cache) > MAX_IN_MEMORY:
        _cache.popitem(last=False)


def _load(doc_id):
    if doc_id in _cache:
        _cache.move_to_end(doc_id)
        return _cache[doc_id]
    try:
        f = np.load(_path(doc_id))
    except (ValueError, OSError):
        return None
    doc = (f["vectors"], f["pages"], f["texts"].tolist())
    _remember(doc_id, doc)
    return doc


def store_chunks(doc_id, chunks):
    texts = [c["text"] for c in chunks]
    vectors = np.asarray(embed_documents(texts), dtype=np.float32)
    vectors /= np.linalg.norm(vectors, axis=1, keepdims=True)  # unit length, so dot product = cosine
    pages = np.array([c["page"] for c in chunks], dtype=np.int32)
    os.makedirs(settings.vector_store_dir, exist_ok=True)
    np.savez(_path(doc_id), vectors=vectors, pages=pages, texts=np.array(texts))
    _remember(doc_id, (vectors, pages, texts))
    return len(chunks)


def query_chunks(doc_id, question):
    vectors, pages, texts = _load(doc_id)
    q = np.asarray(embed_query(question), dtype=np.float32)
    top = np.argsort(vectors @ q)[::-1][:settings.top_k_chunks]
    return sorted(({"text": texts[i], "page": int(pages[i])} for i in top), key=lambda c: c["page"])


def has_document(doc_id):
    return _load(doc_id) is not None


def delete_document(doc_id):
    _cache.pop(doc_id, None)
    try:
        os.remove(_path(doc_id))
    except (ValueError, OSError):
        pass
