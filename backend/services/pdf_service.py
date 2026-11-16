import fitz  # PyMuPDF


def extract_text(data: bytes):
    """Returns ([{page, text}] for non-blank pages, total page count)."""
    with fitz.open(stream=data, filetype="pdf") as doc:
        texts = [page.get_text() for page in doc]
    pages = [{"page": i + 1, "text": t} for i, t in enumerate(texts) if t.strip()]
    return pages, len(texts)
