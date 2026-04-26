import fitz  # PyMuPDF — pip install pymupdf
import os
import uuid
from pathlib import Path
from config import settings
from typing import List


def save_upload(file_content: bytes, filename: str) -> tuple[str, str]:
    """Save the uploaded PDF to disk. Returns (doc_id, file_path)."""
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

    # Short unique ID so users can reference this document
    doc_id = str(uuid.uuid4())[:8]
    safe_name = f"{doc_id}_{filename.replace(' ', '_')}"
    file_path = os.path.join(settings.upload_dir, safe_name)

    with open(file_path, "wb") as f:
        f.write(file_content)

    return doc_id, file_path


def extract_text(file_path: str) -> List[dict]:
    """Extract text from every page. Returns [{page, text}] — skips blank pages."""
    doc = fitz.open(file_path)
    pages = []

    for page_num in range(len(doc)):
        text = doc[page_num].get_text("text")
        if text.strip():
            pages.append({"page": page_num + 1, "text": text})

    doc.close()
    return pages


def get_page_count(file_path: str) -> int:
    """Return total page count of a PDF."""
    doc = fitz.open(file_path)
    count = len(doc)
    doc.close()
    return count
