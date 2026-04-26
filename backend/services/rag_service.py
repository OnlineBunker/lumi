import chromadb
from pathlib import Path
from config import settings
from utils.embedder import embed_documents, embed_query
from typing import List

# Singletons — initialized once on first use
_client: chromadb.PersistentClient | None = None
_collection = None


def get_collection():
    """Get or create the Chroma collection. PersistentClient saves to disk automatically."""
    global _client, _collection
    if _collection is None:
        Path(settings.vector_store_dir).mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=settings.vector_store_dir)
        _collection = _client.get_or_create_collection(
            name="pdf_chunks",
            metadata={"hnsw:space": "cosine"},  # cosine similarity works best for text
        )
    return _collection


def store_chunks(doc_id: str, chunks: List[dict]) -> int:
    """
    Embed all chunks and store them in Chroma.
    Each chunk is tagged with doc_id + page number for filtering and citations.
    """
    collection = get_collection()
    texts = [c["text"] for c in chunks]
    embeddings = embed_documents(texts)  # single batch API call

    collection.add(
        ids=[f"{doc_id}_chunk_{i}" for i in range(len(chunks))],
        documents=texts,
        embeddings=embeddings,
        metadatas=[{
            "doc_id": doc_id,
            "page": c["page"],
            "chunk_index": c["chunk_index"],
        } for c in chunks],
    )

    return len(chunks)


def query_chunks(doc_id: str, question: str, top_k: int = None) -> List[dict]:
    """
    Find the most semantically relevant chunks for a question.
    Filters to this document only via where={"doc_id": doc_id}.
    """
    collection = get_collection()
    top_k = top_k or settings.top_k_chunks
    question_vector = embed_query(question)

    results = collection.query(
        query_embeddings=[question_vector],
        n_results=top_k,
        where={"doc_id": doc_id},  # scope to this PDF only
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for i, doc in enumerate(results["documents"][0]):
        chunks.append({
            "text": doc,
            "page": results["metadatas"][0][i]["page"],
            "score": round(1 - results["distances"][0][i], 3),  # distance → similarity
        })

    # Sort by page for coherent reading order
    chunks.sort(key=lambda x: (x["page"], -x["score"]))
    return chunks


def delete_document(doc_id: str):
    """Remove all vectors for a document. Called when user closes a PDF."""
    get_collection().delete(where={"doc_id": doc_id})
