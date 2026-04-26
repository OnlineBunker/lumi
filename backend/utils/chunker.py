from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List


def chunk_pages(pages: List[dict], chunk_size: int = 500, chunk_overlap: int = 100) -> List[dict]:
    """
    Split each page's text into overlapping chunks.

    RecursiveCharacterTextSplitter splits on paragraph breaks first,
    then newlines, then sentences — so chunks stay semantically coherent.
    Overlap ensures sentences at chunk boundaries aren't lost.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", "!", "?", " "],
    )

    chunks = []
    for page in pages:
        if not page["text"].strip():
            continue
        for text in splitter.split_text(page["text"]):
            if text.strip():
                chunks.append({
                    "text": text.strip(),
                    "page": page["page"],
                    "chunk_index": len(chunks),
                })

    return chunks
