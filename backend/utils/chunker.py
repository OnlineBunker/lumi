import re
import textwrap
from config import settings


def split_text(text, size, overlap):
    """Pack paragraphs (or sentences, or words, if a paragraph is too long) into chunks of at most
    `size` chars. Each chunk starts with up to `overlap` chars from the end of the previous one."""
    pieces = []
    for para in re.split(r"\n\s*\n", text):
        for part in re.split(r"(?<=[.!?])\s+", para) if len(para) > size else [para]:
            pieces += textwrap.wrap(part, size) if len(part) > size else [part.strip()]

    chunks, current = [], []
    for piece in filter(None, pieces):
        if current and len(" ".join(current + [piece])) > size:
            chunks.append(" ".join(current))
            tail = []
            for prev in reversed(current):
                if len(" ".join([prev] + tail)) > overlap:
                    break
                tail.insert(0, prev)
            current = tail
        current.append(piece)
    if current:
        chunks.append(" ".join(current))
    return chunks


def chunk_pages(pages):
    return [
        {"text": text, "page": page["page"]}
        for page in pages
        for text in split_text(page["text"], settings.chunk_size, settings.chunk_overlap)
    ]
