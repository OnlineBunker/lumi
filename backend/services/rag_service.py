import chromadb
from config import settings
from utils.embedder import embed_documents, embed_query

collection = chromadb.PersistentClient(path=settings.vector_store_dir).get_or_create_collection(
    name="pdf_chunks",
    metadata={"hnsw:space": "cosine"},
)


def store_chunks(doc_id, chunks):
    texts = [c["text"] for c in chunks]
    collection.add(
        ids=[f"{doc_id}_chunk_{i}" for i in range(len(chunks))],
        documents=texts,
        embeddings=embed_documents(texts),
        metadatas=[{"doc_id": doc_id, "page": c["page"]} for c in chunks],
    )
    return len(chunks)


def query_chunks(doc_id, question):
    res = collection.query(
        query_embeddings=[embed_query(question)],
        n_results=settings.top_k_chunks,
        where={"doc_id": doc_id},
    )
    chunks = [{"text": text, "page": meta["page"]} for text, meta in zip(res["documents"][0], res["metadatas"][0])]
    return sorted(chunks, key=lambda c: c["page"])


def has_document(doc_id):
    return bool(collection.get(where={"doc_id": doc_id}, limit=1)["ids"])


def delete_document(doc_id):
    collection.delete(where={"doc_id": doc_id})
